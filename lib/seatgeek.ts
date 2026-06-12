// SeatGeek resale ticket prices (optional). Free client_id from
// https://seatgeek.com/account/develop — set SEATGEEK_CLIENT_ID in .env.local
// to light up "avg ticket price" on match pages. Without the key the feature
// hides itself; there is no free keyless source for FIFA ticket pricing.

import { cached, fetchWithTimeout } from "@/lib/cache";
import type { Match } from "@/lib/types";

export interface TicketInfo {
  averagePrice: number | null;
  lowestPrice: number | null;
  highestPrice: number | null;
  listingCount: number | null;
  url: string | null;
}

export async function ticketInfoForMatch(match: Match): Promise<TicketInfo | null> {
  const clientId = process.env.SEATGEEK_CLIENT_ID?.trim();
  if (!clientId) return null;
  const home = match.homeTeam?.name;
  const away = match.awayTeam?.name;
  if (!home || !away) return null;

  return cached(`seatgeek:${match.id}`, 3600_000, async () => {
    const kickoff = new Date(match.utcDate);
    const gte = new Date(kickoff.getTime() - 36 * 3600_000).toISOString().slice(0, 19);
    const lte = new Date(kickoff.getTime() + 36 * 3600_000).toISOString().slice(0, 19);
    const url =
      `https://api.seatgeek.com/2/events?client_id=${encodeURIComponent(clientId)}` +
      `&q=${encodeURIComponent(`${home} ${away}`)}` +
      `&datetime_utc.gte=${gte}&datetime_utc.lte=${lte}&per_page=5`;
    const res = await fetchWithTimeout(url, undefined, 9000);
    if (!res.ok) throw new Error(`SeatGeek -> HTTP ${res.status}`);
    const data = (await res.json()) as {
      events?: {
        title?: string;
        url?: string;
        stats?: {
          average_price?: number | null;
          lowest_price?: number | null;
          highest_price?: number | null;
          listing_count?: number | null;
        };
      }[];
    };
    const ev = (data.events ?? [])[0];
    if (!ev?.stats) return null;
    return {
      averagePrice: ev.stats.average_price ?? null,
      lowestPrice: ev.stats.lowest_price ?? null,
      highestPrice: ev.stats.highest_price ?? null,
      listingCount: ev.stats.listing_count ?? null,
      url: ev.url ?? null,
    };
  });
}
