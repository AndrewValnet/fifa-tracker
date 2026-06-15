// Two-tier TTL cache with stale-on-error semantics.
// Stored on globalThis so it survives Next.js dev HMR module reloads.
// Optional Upstash Redis keeps quota-sensitive responses warm across serverless
// cold starts and multiple instances without a full application database.

interface Entry {
  value: unknown;
  expires: number; // epoch ms
}

const store: Map<string, Entry> = ((globalThis as Record<string, unknown>).__wc26Cache as Map<string, Entry>) ?? new Map<string, Entry>();
(globalThis as Record<string, unknown>).__wc26Cache = store;

const REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL?.trim();
const REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
const REMOTE_CACHE_PREFIX = "wc26:cache:";
const MAX_REMOTE_STALE_MS = 24 * 3600_000;
const MAX_REMOTE_PAYLOAD_BYTES = 750_000;

export function cacheGet<T>(key: string): T | undefined {
  const e = store.get(key);
  if (!e) return undefined;
  if (Date.now() > e.expires) return undefined;
  return e.value as T;
}

/** Returns the entry even if expired (used as a fallback when refresh fails). */
export function cacheGetStale<T>(key: string): T | undefined {
  return store.get(key)?.value as T | undefined;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expires: Date.now() + ttlMs });
  // Opportunistic pruning to keep the map small.
  if (store.size > 500) {
    const now = Date.now();
    for (const [k, v] of store) if (now > v.expires) store.delete(k);
  }
}

/**
 * Cache wrapper: serve fresh cache, otherwise fetch.
 * If the fetch fails and a stale value exists, serve stale instead of throwing.
 * In-flight de-duplication prevents thundering herds of identical requests.
 */
const inFlight = new Map<string, Promise<unknown>>();

export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== undefined) return hit;

  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;

  const p = (async () => {
    const remote = await remoteCacheGet<T>(key);
    if (remote?.fresh) {
      cacheSet(key, remote.value, Math.max(1000, remote.expires - Date.now()));
      return remote.value;
    }

    try {
      const value = await fn();
      cacheSet(key, value, ttlMs);
      await remoteCacheSet(key, value, ttlMs);
      return value;
    } catch (err) {
      const stale = cacheGetStale<T>(key);
      if (stale !== undefined) return stale;
      if (remote) {
        cacheSet(key, remote.value, 30_000);
        return remote.value;
      }
      throw err;
    } finally {
      inFlight.delete(key);
    }
  })();
  inFlight.set(key, p);
  return p;
}

interface RemoteEntry {
  value: unknown;
  expires: number;
}

interface RemoteHit<T> {
  value: T;
  expires: number;
  fresh: boolean;
}

function remoteCacheEnabled(): boolean {
  return Boolean(REDIS_REST_URL && REDIS_REST_TOKEN);
}

function hashKey(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function remoteCacheKey(key: string): string {
  const safe = key.replace(/[^a-zA-Z0-9:_-]/g, "_").slice(0, 120);
  return `${REMOTE_CACHE_PREFIX}${safe}:${hashKey(key)}`;
}

function remoteTtlMs(ttlMs: number): number {
  const staleWindow = Math.min(Math.max(ttlMs * 6, 5 * 60_000), MAX_REMOTE_STALE_MS);
  return ttlMs + staleWindow;
}

async function redisPipeline(commands: (string | number)[][]): Promise<unknown[] | null> {
  if (!remoteCacheEnabled() || !commands.length) return null;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3000);
  try {
    const res = await fetch(`${REDIS_REST_URL}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${REDIS_REST_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(commands),
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ({ result?: unknown; error?: string } | unknown)[];
    return data.map((d) => (d && typeof d === "object" && "result" in d ? (d as { result: unknown }).result : d));
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function remoteCacheGet<T>(key: string): Promise<RemoteHit<T> | null> {
  const out = await redisPipeline([["GET", remoteCacheKey(key)]]);
  const raw = out?.[0];
  if (typeof raw !== "string") return null;

  try {
    const entry = JSON.parse(raw) as RemoteEntry;
    if (!entry || typeof entry.expires !== "number" || !("value" in entry)) return null;
    return {
      value: entry.value as T,
      expires: entry.expires,
      fresh: Date.now() <= entry.expires,
    };
  } catch {
    return null;
  }
}

async function remoteCacheSet<T>(key: string, value: T, ttlMs: number): Promise<void> {
  if (!remoteCacheEnabled()) return;

  const entry: RemoteEntry = { value, expires: Date.now() + ttlMs };
  const payload = JSON.stringify(entry);
  if (new TextEncoder().encode(payload).length > MAX_REMOTE_PAYLOAD_BYTES) return;
  await redisPipeline([["SET", remoteCacheKey(key), payload, "PX", remoteTtlMs(ttlMs)]]);
}

/** fetch() with a hard timeout. */
export async function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs = 9000): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal, cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Rolling-window rate limiter (football-data.org free tier: 10 req/min; we
 * spend at most 9 to leave headroom). If the window is full, waits briefly
 * for a slot — cold-start page loads burst several requests at once — and
 * only throws when the wait would be unreasonable; callers then fall back to
 * stale cache / secondary sources.
 */
const fdCalls: number[] = ((globalThis as Record<string, unknown>).__fdCalls as number[]) ?? [];
(globalThis as Record<string, unknown>).__fdCalls = fdCalls;

export async function takeFootballDataToken(maxPerMinute = 9, maxWaitMs = 5000): Promise<void> {
  for (;;) {
    const now = Date.now();
    while (fdCalls.length && now - fdCalls[0] > 60_000) fdCalls.shift();
    if (fdCalls.length < maxPerMinute) {
      fdCalls.push(now);
      return;
    }
    const waitMs = fdCalls[0] + 60_000 - now + 60;
    if (waitMs > maxWaitMs) {
      throw new Error("football-data.org rate budget exhausted (client-side guard)");
    }
    await new Promise((r) => setTimeout(r, waitMs));
  }
}
