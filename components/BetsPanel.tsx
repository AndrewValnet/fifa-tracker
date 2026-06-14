"use client";

// Per-match "biggest + weirdest bets" card (client-fetched, CDN-cached route).
// Hides itself when this match has no Polymarket markets.

import useSWR from "swr";
import { BetsLists } from "@/components/BetsLists";
import { SectionHeader } from "@/components/SectionHeader";
import { jsonFetcher } from "@/hooks/fetcher";
import type { BetBuckets } from "@/lib/types";

export function BetsPanel({ matchId }: { matchId: string }) {
  const { data, isLoading } = useSWR<{ bets: BetBuckets | null }>(`/api/match-bets/${matchId}`, jsonFetcher);
  const bets = data?.bets;

  // Loaded and genuinely empty → render nothing (no empty card).
  if (!isLoading && (!bets || (!bets.top.length && !bets.weird.length))) return null;

  return (
    <section className="rounded-xl border border-edge bg-panel/80 p-4 md:p-5">
      <SectionHeader title="Bets on This Match" right="Polymarket" />
      {bets ? (
        <BetsLists top={bets.top} weird={bets.weird} />
      ) : (
        <div className="skeleton h-24 w-full" aria-hidden />
      )}
    </section>
  );
}
