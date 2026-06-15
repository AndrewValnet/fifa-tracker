"use client";

// Fixture-list pollers (PRD §9): live 30s, schedule 5m, today 60s.

import useSWR from "swr";
import { jsonFetcher } from "@/hooks/fetcher";
import type { GroupStanding, Match, Scorer, Sourced } from "@/lib/types";

function unwrap<T>(data: Sourced<T> | undefined) {
  return {
    data: data?.data,
    source: data?.source,
    demo: data?.demo ?? false,
  };
}

export function useLiveMatches(initial?: Sourced<Match[]>) {
  const { data, error, isLoading } = useSWR<Sourced<Match[]>>("/api/live-matches", jsonFetcher, {
    fallbackData: initial,
    revalidateOnMount: initial ? false : undefined,
    // Poll fast (7s) only while a match is actually live; idle otherwise.
    refreshInterval: (latest) => ((latest?.data?.length ?? 0) > 0 ? 7_000 : 30_000),
    revalidateOnFocus: true,
  });
  return { ...unwrap(data), matches: data?.data ?? [], error, isLoading };
}

export function useTodayMatches(initial?: Sourced<Match[]>) {
  const { data, error, isLoading } = useSWR<Sourced<Match[]>>("/api/today", jsonFetcher, {
    fallbackData: initial,
    revalidateOnMount: initial ? false : undefined,
    refreshInterval: 60_000,
    revalidateOnFocus: true,
  });
  return { ...unwrap(data), matches: data?.data ?? [], error, isLoading };
}

export function useUpcomingMatches(initial?: Sourced<Match[]>) {
  const { data, error, isLoading } = useSWR<Sourced<Match[]>>("/api/upcoming", jsonFetcher, {
    fallbackData: initial,
    revalidateOnMount: initial ? false : undefined,
    refreshInterval: 5 * 60_000,
    revalidateOnFocus: false,
  });
  return { ...unwrap(data), matches: data?.data ?? [], error, isLoading };
}

export function useAllMatches(initial?: Sourced<Match[]>) {
  const { data, error, isLoading } = useSWR<Sourced<Match[]>>("/api/matches", jsonFetcher, {
    fallbackData: initial,
    revalidateOnMount: initial ? false : undefined,
    refreshInterval: 5 * 60_000,
    revalidateOnFocus: false,
  });
  return { ...unwrap(data), matches: data?.data ?? [], error, isLoading };
}

export function useStandings(initial?: Sourced<GroupStanding[]>) {
  const { data, error, isLoading } = useSWR<Sourced<GroupStanding[]>>("/api/standings", jsonFetcher, {
    fallbackData: initial,
    revalidateOnMount: initial ? false : undefined,
    refreshInterval: 5 * 60_000,
    revalidateOnFocus: false,
  });
  return { ...unwrap(data), standings: data?.data ?? [], error, isLoading };
}

export function useScorers(initial?: Sourced<Scorer[]>, limit = 12) {
  const { data, error, isLoading } = useSWR<Sourced<Scorer[]>>(`/api/scorers?limit=${limit}`, jsonFetcher, {
    fallbackData: initial,
    revalidateOnMount: initial ? false : undefined,
    refreshInterval: 5 * 60_000,
    revalidateOnFocus: false,
  });
  return { ...unwrap(data), scorers: data?.data ?? [], error, isLoading };
}
