// In-memory TTL cache with stale-on-error semantics.
// Stored on globalThis so it survives Next.js dev HMR module reloads.
// Best-effort by design (resets on serverless cold starts) — acceptable for
// a single-user dashboard, per PRD.

interface Entry {
  value: unknown;
  expires: number; // epoch ms
}

const store: Map<string, Entry> = ((globalThis as Record<string, unknown>).__wc26Cache as Map<string, Entry>) ?? new Map<string, Entry>();
(globalThis as Record<string, unknown>).__wc26Cache = store;

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
    try {
      const value = await fn();
      cacheSet(key, value, ttlMs);
      return value;
    } catch (err) {
      const stale = cacheGetStale<T>(key);
      if (stale !== undefined) return stale;
      throw err;
    } finally {
      inFlight.delete(key);
    }
  })();
  inFlight.set(key, p);
  return p;
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
