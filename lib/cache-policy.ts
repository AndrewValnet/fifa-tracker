import type { Match, Sourced } from "@/lib/types";

export const CACHE_CONTROL = {
  liveList: "public, s-maxage=4, stale-while-revalidate=8",
  todayList: "public, s-maxage=30, stale-while-revalidate=120",
  upcomingList: "public, s-maxage=120, stale-while-revalidate=900",
  matchList: "public, s-maxage=120, stale-while-revalidate=900",
  liveMatch: "public, s-maxage=6, stale-while-revalidate=15",
  upcomingMatch: "public, s-maxage=120, stale-while-revalidate=900",
  finishedMatch: "public, s-maxage=3600, stale-while-revalidate=86400",
  matchExtrasHot: "public, s-maxage=20, stale-while-revalidate=90",
  matchExtrasStatic: "public, s-maxage=900, stale-while-revalidate=43200",
  standings: "public, s-maxage=300, stale-while-revalidate=1800",
  roster: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
  news: "public, s-maxage=300, stale-while-revalidate=900",
  odds: "public, s-maxage=45, stale-while-revalidate=120",
  playerImageHit: "public, max-age=86400, s-maxage=2592000",
  playerImageMiss: "public, max-age=3600, s-maxage=43200",
} as const;

export function slimMatch(match: Match, options: { keepEvents?: boolean } = {}): Match {
  return {
    ...match,
    events: options.keepEvents ? match.events : [],
    referees: [],
  };
}

export function slimSourcedMatches(
  result: Sourced<Match[]>,
  options: { keepEvents?: boolean } = {},
): Sourced<Match[]> {
  return { ...result, data: result.data.map((match) => slimMatch(match, options)) };
}
