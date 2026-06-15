// Persistent TTL cache layered on top of the existing in-memory cache.
//
// Runtime behavior:
//   1) in-memory cache hit -> fastest path
//   2) optional Upstash Redis hit -> survives serverless cold starts / instances
//   3) producer function -> write memory + Redis
//
// Redis is intentionally optional. Without UPSTASH_REDIS_REST_URL and
// UPSTASH_REDIS_REST_TOKEN this behaves like the existing memory cache, so the
// app keeps working locally and in zero-config deployments.

import { cacheGet, cacheGetStale, cacheSet } from "@/lib/cache";

type RedisLike = {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown, opts?: { ex?: number }): Promise<unknown>;
};

let redisClientPromise: Promise<RedisLike | null> | null = null;

async function getRedis(): Promise<RedisLike | null> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  if (!redisClientPromise) {
    redisClientPromise = import("@upstash/redis")
      .then(({ Redis }) =>
        new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL!,
          token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        }) as RedisLike,
      )
      .catch(() => null);
  }

  return redisClientPromise;
}

const inFlight = new Map<string, Promise<unknown>>();

export async function cachedPersistent<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const memoryHit = cacheGet<T>(key);
  if (memoryHit !== undefined) return memoryHit;

  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;

  const p = (async () => {
    const ttlSeconds = Math.max(1, Math.floor(ttlMs / 1000));
    const redis = await getRedis();

    if (redis) {
      try {
        const redisHit = await redis.get<T>(key);
        if (redisHit !== null && redisHit !== undefined) {
          cacheSet(key, redisHit, ttlMs);
          return redisHit;
        }
      } catch {
        // Redis should never block a page render.
      }
    }

    try {
      const value = await fn();
      cacheSet(key, value, ttlMs);

      if (redis) {
        try {
          await redis.set(key, value, { ex: ttlSeconds });
        } catch {
          // Best effort only.
        }
      }

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
  return p as Promise<T>;
}
