"use client";

const KEY = "wc26-player-image-misses";
const MISS_TTL_MS = 6 * 3600_000;
const MAX_KEYS = 400;

function now() {
  return Date.now();
}

function cacheKey(kind: "name" | "src", value: string): string {
  return `${kind}:${value.toLowerCase().trim()}`;
}

function read(): Record<string, number> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function write(map: Record<string, number>) {
  try {
    const fresh = Object.entries(map)
      .filter(([, expires]) => expires > now())
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_KEYS);
    localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(fresh)));
  } catch {
    /* ignore private-mode/quota failures */
  }
}

export function knownPlayerImageMiss(kind: "name" | "src", value: string | null | undefined): boolean {
  if (!value || typeof window === "undefined") return false;
  const key = cacheKey(kind, value);
  const map = read();
  const expires = map[key] ?? 0;
  if (expires > now()) return true;
  if (expires) {
    delete map[key];
    write(map);
  }
  return false;
}

export function rememberPlayerImageMiss(kind: "name" | "src", value: string | null | undefined) {
  if (!value || typeof window === "undefined") return;
  const map = read();
  map[cacheKey(kind, value)] = now() + MISS_TTL_MS;
  write(map);
}

export async function fetchFallbackPlayerImage(name: string): Promise<string | null> {
  if (!name || knownPlayerImageMiss("name", name)) return null;
  try {
    const res = await fetch(`/api/player-image?name=${encodeURIComponent(name)}`);
    const json = (await res.json()) as { url?: string | null };
    if (json?.url) return json.url;
  } catch {
    /* fall through to cached miss */
  }
  rememberPlayerImageMiss("name", name);
  return null;
}
