"use client";

import useSWR from "swr";
import { jsonFetcher } from "@/hooks/fetcher";
import type { WcTotals } from "@/lib/types";

export function useWcTotals() {
  const { data, error, isLoading } = useSWR<{ totals: WcTotals | null }>("/api/wc-totals", jsonFetcher, {
    refreshInterval: 10 * 60_000,
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
  return { totals: data?.totals ?? null, error, isLoading };
}
