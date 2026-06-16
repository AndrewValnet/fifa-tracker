"use client";

// ESPN match enrichment poller: 45s while live (stats tick along with the
// match), 5 minutes around kickoff (waiting for confirmed lineups), then off.

import useSWR from "swr";
import { jsonFetcher } from "@/hooks/fetcher";
import type { MatchExtras } from "@/lib/types";
import type { TicketInfo } from "@/lib/seatgeek";

interface Payload {
  extras: MatchExtras | null;
  ticket: TicketInfo | null;
}

export function useMatchExtras(matchId: string, live: boolean, finished: boolean, enabled = true) {
  const { data, error, isLoading } = useSWR<Payload>(enabled ? `/api/match-extras/${matchId}` : null, jsonFetcher, {
    refreshInterval: live ? 20_000 : finished ? 0 : 5 * 60_000,
    revalidateOnFocus: live,
    keepPreviousData: true,
  });
  return {
    extras: data?.extras ?? null,
    ticket: data?.ticket ?? null,
    error,
    isLoading,
  };
}
