"use client";

// Single-match poller (PRD §9): 30s while live or pre-kickoff, stops once finished.

import useSWR from "swr";
import { jsonFetcher } from "@/hooks/fetcher";
import { statusKind } from "@/lib/format";
import type { Match, Sourced } from "@/lib/types";

export function useLiveMatch(id: string, initial?: Sourced<Match>) {
  const { data, error, isLoading } = useSWR<Sourced<Match>>(`/api/match/${id}`, jsonFetcher, {
    fallbackData: initial,
    revalidateOnFocus: true,
    refreshInterval: (latest) => {
      const status = latest?.data?.status;
      if (!status) return 30_000;
      const kind = statusKind(status);
      if (kind === "live") return 7_000; // near-real-time goal updates
      if (kind === "upcoming") {
        // tighten polling as kickoff approaches
        const ms = new Date(latest!.data.utcDate).getTime() - Date.now();
        return ms < 30 * 60_000 ? 30_000 : 5 * 60_000;
      }
      return 0; // finished — stop polling
    },
  });
  return { match: data?.data, source: data?.source, demo: data?.demo ?? false, error, isLoading };
}
