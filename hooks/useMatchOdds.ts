"use client";

// Polymarket odds poller (PRD §9): 60s refresh.

import useSWR from "swr";
import { jsonFetcher } from "@/hooks/fetcher";
import type { OddsData } from "@/lib/types";

export function useMatchOdds(matchId: string | null | undefined, enabled = true) {
  const { data, error, isLoading } = useSWR<{ odds: OddsData | null }>(
    enabled && matchId ? `/api/odds/${matchId}` : null,
    jsonFetcher,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );
  return { odds: data?.odds ?? null, error, isLoading };
}
