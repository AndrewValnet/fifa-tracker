// A team's potential knockout route, derived from the fixed bracket structure
// in the schedule (Winner/Runner-up group slots feed specific R32 ties).

import { SCHEDULE, entryUtcIso, getStadium } from "@/lib/schedule";

export interface RouteSlot {
  opponent: string;
  utcDate: string;
  venue: string | null;
  city: string | null;
}

export interface TeamRoute {
  asWinner: RouteSlot | null;
  asRunnerUp: RouteSlot | null;
}

function findR32(slotLabel: string): RouteSlot | null {
  for (const e of SCHEDULE) {
    if (e.type !== "r32") continue;
    if (e.homeLabel === slotLabel || e.awayLabel === slotLabel) {
      const opponent = (e.homeLabel === slotLabel ? e.awayLabel : e.homeLabel) ?? "TBD";
      const st = getStadium(e.stadiumId);
      return { opponent, utcDate: entryUtcIso(e), venue: st?.name ?? null, city: st?.city ?? null };
    }
  }
  return null;
}

export function routeToFinal(group: string | null | undefined): TeamRoute {
  if (!group) return { asWinner: null, asRunnerUp: null };
  return {
    asWinner: findR32(`Winner Group ${group}`),
    asRunnerUp: findR32(`Runner-up Group ${group}`),
  };
}
