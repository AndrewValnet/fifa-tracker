// Generic Upstash Redis REST client (serverless HTTP, no npm dep — just fetch).
// Shared by presence, pick'em, reactions and push-subscription storage. Fully
// optional: with no UPSTASH_* env vars set every call returns null, so each
// feature degrades to a read-only / disabled state (like SeatGeek without a key).

import { fetchWithTimeout } from "@/lib/cache";

const REST_URL = process.env.UPSTASH_REDIS_REST_URL?.trim();
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

export function redisEnabled(): boolean {
  return Boolean(REST_URL && REST_TOKEN);
}

/** Run a pipeline of commands; returns the result array (one per command) or null. */
export async function redisPipe(commands: (string | number)[][]): Promise<unknown[] | null> {
  if (!REST_URL || !REST_TOKEN || !commands.length) return null;
  try {
    const res = await fetchWithTimeout(
      `${REST_URL}/pipeline`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${REST_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(commands),
      },
      5000,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as ({ result?: unknown; error?: string } | unknown)[];
    return data.map((d) => (d && typeof d === "object" && "result" in d ? (d as { result: unknown }).result : d));
  } catch {
    return null;
  }
}

/** Run a single command; returns its result or null. */
export async function redis(...command: (string | number)[]): Promise<unknown | null> {
  const out = await redisPipe([command]);
  return out ? out[0] : null;
}

/** Keep ids safe for use in Redis key names. */
export function sanitizeKey(id: string): string {
  return id.replace(/[^a-zA-Z0-9:_-]/g, "").slice(0, 80);
}
