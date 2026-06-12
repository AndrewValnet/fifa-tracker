"use client";

// News poller (PRD §9): 10-minute refresh, cached server-side as well.

import useSWR from "swr";
import { jsonFetcher } from "@/hooks/fetcher";
import type { NewsArticle, Sourced } from "@/lib/types";

export function useNews(params?: { q?: string; home?: string | null; away?: string | null; max?: number }) {
  const sp = new URLSearchParams();
  if (params?.q) sp.set("q", params.q);
  if (params?.home) sp.set("home", params.home);
  if (params?.away) sp.set("away", params.away);
  if (params?.max) sp.set("max", String(params.max));
  const qs = sp.toString();

  const { data, error, isLoading } = useSWR<Sourced<NewsArticle[]>>(
    `/api/news${qs ? `?${qs}` : ""}`,
    jsonFetcher,
    {
      refreshInterval: 600_000,
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );
  return { articles: data?.data ?? [], demo: data?.demo ?? false, source: data?.source, error, isLoading };
}
