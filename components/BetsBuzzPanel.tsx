"use client";

// Client-loaded Betting Buzz so the (heavy) Polymarket paging never blocks the
// home render — it streams in after the page is interactive.

import useSWR from "swr";
import { BetsLists } from "@/components/BetsLists";
import { jsonFetcher } from "@/hooks/fetcher";
import type { BetBuckets } from "@/lib/types";

export function BetsBuzzPanel() {
  const { data } = useSWR<{ bets: BetBuckets }>("/api/bets", jsonFetcher, { revalidateOnFocus: false });
  if (!data) return <div className="skeleton h-40 w-full" aria-hidden />;
  return <BetsLists top={data.bets.top} weird={data.bets.weird} />;
}
