// Keyless player-photo fallback for players ESPN has no headshot for.
// Resolution order (best-effort, name-based so it also rescues players that
// never matched an ESPN id at all):
//   1. Wikidata image (P18) -> Wikimedia Commons Special:FilePath thumbnail
//   2. Wikipedia REST page summary thumbnail
//   3. null  -> caller keeps the initials avatar
// Heavily cached on the existing in-memory store (no new deps): long TTL on a
// hit, short TTL on a miss so newly-uploaded Commons photos appear within a day.

import { cachedWithTtl, fetchWithTimeout } from "@/lib/cache";

// Wikimedia's User-Agent policy requires contact info; without it requests fall
// to the lowest, heavily-throttled tier. (Caching keeps real volume to a trickle.)
const UA = {
  "User-Agent": "wc26-dashboard/1.0 (https://github.com/AndrewValnet/fifa-tracker; andrew.marks@valnetinc.com)",
};

const HIT_TTL = 30 * 24 * 3600_000; // 30 days
const MISS_TTL = 12 * 3600_000; // 12 hours

export interface PlayerImage {
  url: string;
  source: "wikidata" | "wikipedia";
}

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fromWikidata(name: string): Promise<PlayerImage | null> {
  const searchUrl =
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json` +
    `&language=en&type=item&limit=5&search=${encodeURIComponent(name)}`;
  const sres = await fetchWithTimeout(searchUrl, { headers: UA }, 8000);
  if (!sres.ok) return null;
  const sjson = (await sres.json()) as { search?: { id: string; description?: string }[] };
  const candidates = sjson.search ?? [];
  // Prefer entities described as footballers to dodge namesakes.
  const entity = candidates.find((c) => /football|soccer/i.test(c.description ?? "")) ?? candidates[0];
  if (!entity) return null;

  const claimsUrl =
    `https://www.wikidata.org/w/api.php?action=wbgetclaims&format=json` +
    `&entity=${entity.id}&property=P18`;
  const cres = await fetchWithTimeout(claimsUrl, { headers: UA }, 8000);
  if (!cres.ok) return null;
  const cjson = (await cres.json()) as {
    claims?: { P18?: { rank?: string; mainsnak?: { datavalue?: { value?: string } } }[] };
  };
  const claims = cjson.claims?.P18 ?? [];
  // A player can have several P18 values with ranks; take the preferred one.
  const pick = claims.find((c) => c.rank === "preferred") ?? claims[0];
  const file = pick?.mainsnak?.datavalue?.value;
  if (!file) return null;

  // Special:FilePath 301-redirects to a server-thumbnailed image on upload.wikimedia.org.
  return {
    url: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=240`,
    source: "wikidata",
  };
}

async function fromWikipedia(name: string): Promise<PlayerImage | null> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name.replace(/ /g, "_"))}`;
  const res = await fetchWithTimeout(url, { headers: UA }, 8000);
  if (!res.ok) return null;
  const json = (await res.json()) as { thumbnail?: { source?: string } };
  const src = json.thumbnail?.source; // already a sized upload.wikimedia.org URL
  return src ? { url: src, source: "wikipedia" } : null;
}

/** Best free photo for a player by name, or null. Cached (hit 30d / miss 12h). */
export async function resolvePlayerImage(name: string): Promise<PlayerImage | null> {
  const key = `playerimg:${normalize(name)}`;
  return cachedWithTtl<PlayerImage | null>(key, async () => {
    let result: PlayerImage | null = null;
    try {
      result = (await fromWikidata(name)) ?? (await fromWikipedia(name));
    } catch {
      result = null;
    }
    return { value: result, ttlMs: result ? HIT_TTL : MISS_TTL };
  });
}
