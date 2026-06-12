// GNews API client (PRD §5.4). Free tier: 100 req/day — every query result is
// cached for 10 minutes and callers fall back to the offline digest when the
// key is missing or the quota is exhausted.

import { cacheGet, cacheSet, cached, fetchWithTimeout } from "@/lib/cache";
import type { NewsArticle } from "@/lib/types";

const BASE = "https://gnews.io/api/v4";

export class GNewsDisabled extends Error {
  constructor() {
    super("GNEWS_API_KEY is not configured");
  }
}

interface GNewsArticle {
  title: string;
  description?: string | null;
  url: string;
  image?: string | null;
  publishedAt: string;
  source?: { name?: string; url?: string };
}

// GNews free tier dislikes bursts: space requests ~1.1s apart and remember
// failures briefly so SWR polling can't hammer the quota.
const g = globalThis as Record<string, unknown>;

async function paceGNews(): Promise<void> {
  const last = (g.__gnewsLast as number) ?? 0;
  const wait = last + 1100 - Date.now();
  g.__gnewsLast = Math.max(Date.now(), last + 1100);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}

export async function gnewsSearch(q: string, max = 10): Promise<NewsArticle[]> {
  const key = process.env.GNEWS_API_KEY?.trim();
  if (!key) throw new GNewsDisabled();

  const failKey = `gnews:fail:${q}:${max}`;
  if (cacheGet(failKey)) throw new Error("GNews recently failed for this query (cooling down)");

  return cached(`gnews:${q}:${max}`, 600_000, async () => {
    await paceGNews();
    const url = `${BASE}/search?q=${encodeURIComponent(q)}&lang=en&max=${max}&sortby=publishedAt&apikey=${key}`;
    const res = await fetchWithTimeout(url, undefined, 9000);
    if (!res.ok) {
      cacheSet(failKey, true, 60_000);
      throw new Error(`GNews -> HTTP ${res.status}`);
    }
    const data = (await res.json()) as { articles?: GNewsArticle[] };
    return (data.articles ?? [])
      .filter((a) => a?.title && a?.url)
      .map<NewsArticle>((a) => ({
        title: a.title,
        description: a.description ?? null,
        url: a.url,
        image: a.image ?? null,
        source: a.source?.name ?? "GNews",
        publishedAt: a.publishedAt,
      }));
  });
}
