// Wikidata lookup for a player's preferred foot (property P741) — the one
// bio fact none of our sports sources expose. Best-effort and heavily cached;
// returns null whenever anything is uncertain.

import { cached, fetchWithTimeout } from "@/lib/cache";

const UA = { "User-Agent": "wc26-dashboard/1.0 (personal World Cup dashboard)" };

const FOOT_ENTITIES: Record<string, "right" | "left" | "both"> = {
  Q1310443: "right",
  Q3029952: "left",
  Q3039938: "both",
  Q21672817: "both",
};

export async function playingFoot(playerName: string): Promise<"right" | "left" | "both" | null> {
  return cached(`wikidata:foot:${playerName.toLowerCase()}`, 7 * 24 * 3600_000, async () => {
    try {
      const searchUrl =
        `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json` +
        `&language=en&type=item&limit=3&search=${encodeURIComponent(playerName)}`;
      const sres = await fetchWithTimeout(searchUrl, { headers: UA }, 8000);
      if (!sres.ok) return null;
      const sjson = (await sres.json()) as { search?: { id: string; description?: string }[] };
      // Prefer entities described as footballers to dodge namesakes.
      const candidates = sjson.search ?? [];
      const entity =
        candidates.find((c) => /football|soccer/i.test(c.description ?? "")) ?? candidates[0];
      if (!entity) return null;

      const claimsUrl =
        `https://www.wikidata.org/w/api.php?action=wbgetclaims&format=json` +
        `&entity=${entity.id}&property=P741`;
      const cres = await fetchWithTimeout(claimsUrl, { headers: UA }, 8000);
      if (!cres.ok) return null;
      const cjson = (await cres.json()) as {
        claims?: { P741?: { mainsnak?: { datavalue?: { value?: { id?: string } } } }[] };
      };
      const footId = cjson.claims?.P741?.[0]?.mainsnak?.datavalue?.value?.id;
      return footId ? FOOT_ENTITIES[footId] ?? null : null;
    } catch {
      return null;
    }
  });
}
