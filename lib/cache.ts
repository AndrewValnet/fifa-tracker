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
const REMOTE_USAGE_PREFIX = "wc26:usage:";
const MAX_REMOTE_STALE_MS = 24 * 3600_000;
const MAX_REMOTE_PAYLOAD_BYTES = 750_000;
const REMOTE_COMPRESSION_MIN_BYTES = 32_000;
const encoder = new TextEncoder();

export interface CacheNamespaceStats {
  memoryHits: number;
  memoryMisses: number;
  inFlightHits: number;
  localWrites: number;
  remoteHits: number;
  remoteStaleHits: number;
  remoteMisses: number;
  remoteWrites: number;
  remoteWriteSkips: number;
  staleFallbacks: number;
  refreshErrors: number;
}

export interface UpstreamStats {
  attempts: number;
  ok: number;
  httpErrors: number;
  networkErrors: number;
}

export interface UsageStats {
  day: string;
  startedAt: string;
  cache: Record<string, CacheNamespaceStats>;
  upstream: Record<string, UpstreamStats>;
}

const usageStore: UsageStats =
  ((globalThis as Record<string, unknown>).__wc26UsageStats as UsageStats | undefined) ?? freshUsageStats();
(globalThis as Record<string, unknown>).__wc26UsageStats = usageStore;

function dayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function freshUsageStats(): UsageStats {
  return {
    day: dayKey(),
    startedAt: new Date().toISOString(),
    cache: {},
    upstream: {},
  };
}

function currentUsageStats(): UsageStats {
  const today = dayKey();
  if (usageStore.day !== today) {
    usageStore.day = today;
    usageStore.startedAt = new Date().toISOString();
    usageStore.cache = {};
    usageStore.upstream = {};
  }
  return usageStore;
}

function emptyCacheStats(): CacheNamespaceStats {
  return {
    memoryHits: 0,
    memoryMisses: 0,
    inFlightHits: 0,
    localWrites: 0,
    remoteHits: 0,
    remoteStaleHits: 0,
    remoteMisses: 0,
    remoteWrites: 0,
    remoteWriteSkips: 0,
    staleFallbacks: 0,
    refreshErrors: 0,
  };
}

function emptyUpstreamStats(): UpstreamStats {
  return { attempts: 0, ok: 0, httpErrors: 0, networkErrors: 0 };
}

function cacheNamespace(key: string): string {
  if (key.startsWith("fd:")) return "football-data";
  if (key.startsWith("espn:")) return "espn";
  if (key.startsWith("wc26:")) return "worldcup26";
  if (key.startsWith("pm:")) return "polymarket";
  if (key.startsWith("gnews:")) return "gnews";
  if (key.startsWith("wikidata:")) return "wikidata";
  if (key.startsWith("seatgeek:")) return "seatgeek";
  if (key.startsWith("weather:")) return "weather";
  if (key.startsWith("compute:")) return "computed";
  if (key.startsWith("qual:")) return "computed";
  if (key.startsWith("insights:")) return "computed";
  return key.split(":")[0] || "other";
}

function bumpCache(key: string, field: keyof CacheNamespaceStats): void {
  const stats = currentUsageStats();
  const ns = cacheNamespace(key);
  const bucket = (stats.cache[ns] ??= emptyCacheStats());
  bucket[field] += 1;
  if (
    field === "remoteHits" ||
    field === "remoteStaleHits" ||
    field === "remoteMisses" ||
    field === "remoteWrites" ||
    field === "remoteWriteSkips" ||
    field === "staleFallbacks" ||
    field === "refreshErrors"
  ) {
    remoteUsageIncr(`cache:${ns}:${field}`);
  }
}

export interface UsageSnapshot extends UsageStats {
  remoteDaily: Record<string, number> | null;
  cacheStoreSize: number;
  inFlight: number;
  remoteCacheEnabled: boolean;
  footballDataTokensLastMinute: number;
  footballDataTokenBudgetPerMinute: number;
  maxRemotePayloadBytes: number;
}

function upstreamProvider(url: string): string {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("football-data.org")) return "football-data";
    if (host.includes("espn.com")) return "espn";
    if (host.includes("worldcup26.ir")) return "worldcup26";
    if (host.includes("polymarket")) return "polymarket";
    if (host.includes("gnews.io")) return "gnews";
    if (host.includes("wikidata.org")) return "wikidata";
    if (host.includes("seatgeek.com")) return "seatgeek";
    if (host.includes("open-meteo.com")) return "weather";
    if (host.includes("upstash")) return "upstash-redis";
    return host.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

function bumpUpstream(provider: string, field: keyof UpstreamStats): void {
  const stats = currentUsageStats();
  const bucket = (stats.upstream[provider] ??= emptyUpstreamStats());
  bucket[field] += 1;
  if (provider !== "upstash-redis") {
    remoteUsageIncr(`upstream:${provider}:${field}`);
  }
}

function remoteUsageKey(date = dayKey()): string {
  return `${REMOTE_USAGE_PREFIX}${date}`;
}

function remoteUsageIncr(field: string): void {
  if (!remoteCacheEnabled()) return;
  const key = remoteUsageKey();
  void redisPipeline([
    ["HINCRBY", key, field, 1],
    ["EXPIRE", key, 3 * 24 * 3600],
  ]).catch(() => undefined);
}

function normalizeRedisHash(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (Array.isArray(raw)) {
    for (let i = 0; i < raw.length; i += 2) {
      const field = raw[i];
      if (typeof field !== "string") continue;
      const value = Number(raw[i + 1]);
      out[field] = Number.isFinite(value) ? value : 0;
    }
    return out;
  }
  if (raw && typeof raw === "object") {
    for (const [field, value] of Object.entries(raw as Record<string, unknown>)) {
      const n = Number(value);
      out[field] = Number.isFinite(n) ? n : 0;
    }
  }
  return out;
}

async function remoteUsageSnapshot(): Promise<Record<string, number> | null> {
  if (!remoteCacheEnabled()) return null;
  const out = await redisPipeline([["HGETALL", remoteUsageKey()]]);
  return normalizeRedisHash(out?.[0]);
}

export async function usageSnapshot(): Promise<UsageSnapshot> {
  const now = Date.now();
  while (fdCalls.length && now - fdCalls[0] > 60_000) fdCalls.shift();
  const stats = JSON.parse(JSON.stringify(currentUsageStats())) as UsageStats;
  return {
    ...stats,
    remoteDaily: await remoteUsageSnapshot(),
    cacheStoreSize: store.size,
    inFlight: inFlight.size,
    remoteCacheEnabled: remoteCacheEnabled(),
    footballDataTokensLastMinute: fdCalls.length,
    footballDataTokenBudgetPerMinute: 9,
    maxRemotePayloadBytes: MAX_REMOTE_PAYLOAD_BYTES,
  };
}

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
  bumpCache(key, "localWrites");
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
  return cachedWithTtl(key, async () => ({ value: await fn(), ttlMs }));
}

export async function cachedWithTtl<T>(
  key: string,
  fn: () => Promise<{ value: T; ttlMs: number }>,
): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== undefined) {
    bumpCache(key, "memoryHits");
    return hit;
  }
  bumpCache(key, "memoryMisses");

  const existing = inFlight.get(key);
  if (existing) {
    bumpCache(key, "inFlightHits");
    return existing as Promise<T>;
  }

  const p = (async () => {
    const remote = await remoteCacheGet<T>(key);
    if (remote?.fresh) {
      bumpCache(key, "remoteHits");
      cacheSet(key, remote.value, Math.max(1000, remote.expires - Date.now()));
      return remote.value;
    }
    if (remote) bumpCache(key, "remoteStaleHits");
    else bumpCache(key, "remoteMisses");

    try {
      const { value, ttlMs } = await fn();
      cacheSet(key, value, ttlMs);
      await remoteCacheSet(key, value, ttlMs);
      return value;
    } catch (err) {
      bumpCache(key, "refreshErrors");
      const stale = cacheGetStale<T>(key);
      if (stale !== undefined) {
        bumpCache(key, "staleFallbacks");
        return stale;
      }
      if (remote) {
        bumpCache(key, "staleFallbacks");
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
  value?: unknown;
  expires: number;
  encoding?: "gzip-base64";
  payload?: string;
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

function byteLength(payload: string): number {
  return encoder.encode(payload).length;
}

function nodeZlib():
  | {
      gzipSync(input: Uint8Array): Uint8Array;
      gunzipSync(input: Uint8Array): Uint8Array;
    }
  | null {
  try {
    if (process.env.NEXT_RUNTIME === "edge") return null;
    const req = (0, eval)("require") as (id: string) => {
      gzipSync(input: Uint8Array): Uint8Array;
      gunzipSync(input: Uint8Array): Uint8Array;
    };
    return req("node:zlib");
  } catch {
    return null;
  }
}

function nodeBuffer():
  | {
      from(input: string, encoding: "base64"): Uint8Array;
      from(input: string | Uint8Array, encoding?: BufferEncoding): { toString(encoding: "base64" | "utf8"): string };
    }
  | null {
  try {
    if (process.env.NEXT_RUNTIME === "edge") return null;
    return (0, eval)("Buffer") as ReturnType<typeof nodeBuffer>;
  } catch {
    return null;
  }
}

function compressPayload(payload: string): string | null {
  const zlib = nodeZlib();
  const BufferCtor = nodeBuffer();
  if (!zlib || !BufferCtor) return null;
  const compressed = zlib.gzipSync(encoder.encode(payload));
  return BufferCtor.from(compressed).toString("base64");
}

function decompressPayload(payload: string): string | null {
  const zlib = nodeZlib();
  const BufferCtor = nodeBuffer();
  if (!zlib || !BufferCtor) return null;
  const compressed = BufferCtor.from(payload, "base64");
  return BufferCtor.from(zlib.gunzipSync(compressed)).toString("utf8");
}

function remoteTtlMs(ttlMs: number): number {
  const staleWindow = Math.min(Math.max(ttlMs * 6, 5 * 60_000), MAX_REMOTE_STALE_MS);
  return ttlMs + staleWindow;
}

async function redisPipeline(commands: (string | number)[][]): Promise<unknown[] | null> {
  if (!remoteCacheEnabled() || !commands.length) return null;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3000);
  bumpUpstream("upstash-redis", "attempts");
  try {
    const res = await fetch(`${REDIS_REST_URL}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${REDIS_REST_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(commands),
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      bumpUpstream("upstash-redis", "httpErrors");
      return null;
    }
    bumpUpstream("upstash-redis", "ok");
    const data = (await res.json()) as ({ result?: unknown; error?: string } | unknown)[];
    return data.map((d) => (d && typeof d === "object" && "result" in d ? (d as { result: unknown }).result : d));
  } catch {
    bumpUpstream("upstash-redis", "networkErrors");
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
    let entry = JSON.parse(raw) as RemoteEntry;
    if (entry?.encoding === "gzip-base64") {
      if (typeof entry.payload !== "string") return null;
      const decompressed = decompressPayload(entry.payload);
      if (!decompressed) return null;
      entry = JSON.parse(decompressed) as RemoteEntry;
    }
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
  let payload = JSON.stringify(entry);
  const rawBytes = byteLength(payload);
  if (rawBytes >= REMOTE_COMPRESSION_MIN_BYTES) {
    const compressed = compressPayload(payload);
    if (compressed && byteLength(compressed) < rawBytes) {
      payload = JSON.stringify({
        encoding: "gzip-base64",
        expires: entry.expires,
        payload: compressed,
      } satisfies RemoteEntry);
    }
  }
  if (byteLength(payload) > MAX_REMOTE_PAYLOAD_BYTES) {
    bumpCache(key, "remoteWriteSkips");
    return;
  }
  await redisPipeline([["SET", remoteCacheKey(key), payload, "PX", remoteTtlMs(ttlMs)]]);
  bumpCache(key, "remoteWrites");
}

/** fetch() with a hard timeout. */
export async function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs = 9000): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const provider = upstreamProvider(url);
  bumpUpstream(provider, "attempts");
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal, cache: "no-store" });
    bumpUpstream(provider, res.ok ? "ok" : "httpErrors");
    return res;
  } catch (err) {
    bumpUpstream(provider, "networkErrors");
    throw err;
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
