// Real first-party presence counts via Upstash Redis. Counts actual visitors to
// THIS dashboard, NOT TV viewership. No-ops (returns null) without UPSTASH_* env.
//   concurrent "watching now" : sorted set keyed by sessionId, scored by ts;
//                               count members seen in the last 45s.
//   cumulative "total viewers": HyperLogLog of unique sessionIds (approximate).

import { redisEnabled, redisPipe, sanitizeKey } from "@/lib/redis";

const WINDOW_MS = 45_000;
const SET_TTL = 120;

export function presenceEnabled(): boolean {
  return redisEnabled();
}

export interface PresenceCounts {
  watching: number;
  total: number;
}

export async function heartbeat(matchId: string, sessionId: string, now: number): Promise<PresenceCounts | null> {
  const live = `presence:${sanitizeKey(matchId)}`;
  const uniq = `viewers:${sanitizeKey(matchId)}`;
  const sid = sanitizeKey(sessionId);
  if (!sid) return null;
  const results = await redisPipe([
    ["ZREMRANGEBYSCORE", live, "-inf", now - WINDOW_MS],
    ["ZADD", live, now, sid],
    ["EXPIRE", live, SET_TTL],
    ["ZCARD", live],
    ["PFADD", uniq, sid],
    ["PFCOUNT", uniq],
  ]);
  if (!results) return null;
  return { watching: Number(results[3]) || 0, total: Number(results[5]) || 0 };
}

export async function readCounts(matchId: string, now: number): Promise<PresenceCounts | null> {
  const live = `presence:${sanitizeKey(matchId)}`;
  const uniq = `viewers:${sanitizeKey(matchId)}`;
  const results = await redisPipe([
    ["ZCOUNT", live, now - WINDOW_MS, "+inf"],
    ["PFCOUNT", uniq],
  ]);
  if (!results) return null;
  return { watching: Number(results[0]) || 0, total: Number(results[1]) || 0 };
}
