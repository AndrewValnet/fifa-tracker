"use client";

// "Today's matches" horizontal strip (PRD §7.1) with Polymarket bars.

import { MatchCard } from "@/components/MatchCard";
import { DataFreshness } from "@/components/DataFreshness";
import { SectionHeader } from "@/components/SectionHeader";
import { SourceTag } from "@/components/SourceTag";
import { useTodayMatches } from "@/hooks/useFixtures";
import type { Match, Sourced } from "@/lib/types";

export function TodayStrip({ initial }: { initial?: Sourced<Match[]> }) {
  const { matches, source, fetchedAt } = useTodayMatches(initial);

  return (
    <section aria-label="Today's matches" className="mx-auto max-w-shell px-4 pt-8">
      <SectionHeader
        title="Today &amp; Next Up"
        right={
          <span className="flex flex-wrap items-center justify-end gap-2">
            <SourceTag source={source} />
            <DataFreshness source={source} fetchedAt={fetchedAt} prefix="Source" />
          </span>
        }
      />
      {matches.length === 0 ? (
        <p className="rounded-lg border border-dashed border-edge px-4 py-6 text-center text-sm text-dim">
          No matches in the next 24 hours.
        </p>
      ) : (
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} withOdds className="w-[300px] shrink-0 snap-start" />
          ))}
        </div>
      )}
    </section>
  );
}
