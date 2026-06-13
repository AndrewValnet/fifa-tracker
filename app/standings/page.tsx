import type { Metadata } from "next";
import { GroupScenarios } from "@/components/GroupScenarios";
import { GroupStandingsTable } from "@/components/GroupStandingsTable";
import { KnockoutBracket } from "@/components/KnockoutBracket";
import { SectionHeader } from "@/components/SectionHeader";
import { SourceTag } from "@/components/SourceTag";
import { TopScorers } from "@/components/TopScorers";
import { getAllMatches, getScorers, getStandings } from "@/lib/data";
import { qualificationScenarios } from "@/lib/qualification";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Standings & Bracket",
  description: "World Cup 2026 group tables, qualification picture, top scorers and the knockout bracket.",
};

export default async function StandingsPage() {
  const [standings, scorers, all] = await Promise.all([getStandings(), getScorers(20), getAllMatches()]);

  return (
    <div className="mx-auto max-w-shell px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide md:text-3xl">
          Standings <span className="text-pitch">&amp; Bracket</span>
        </h1>
        <SourceTag source={standings.source} />
      </div>

      <ul className="mb-6 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-dim" aria-label="Qualification legend">
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-sm bg-pitch" /> Advance (top 2)
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-sm bg-gold" /> Best-thirds contention
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-sm bg-live" /> Eliminated
        </li>
      </ul>

      <div className="grid gap-5 md:grid-cols-2">
        {standings.data.map((g) => (
          <section key={g.group} className="rounded-xl border border-edge bg-panel p-4" aria-label={`Group ${g.group}`}>
            <h2 className="mb-2 font-display text-lg font-semibold tracking-wide">
              GROUP <span className="text-gold">{g.group}</span>
            </h2>
            <div className="overflow-x-auto">
              <GroupStandingsTable standing={g} />
            </div>
          </section>
        ))}
      </div>

      <section className="mt-12" aria-label="Qualification scenarios">
        <SectionHeader title="Who's Going Through?" right="points-based projection · GD can still decide ties" />
        <GroupScenarios groups={qualificationScenarios(all.data)} />
      </section>

      <section className="mt-12" aria-label="Knockout bracket">
        <SectionHeader title="Road to the Final" right="Round of 32 → Final · MetLife Stadium, Jul 19" />
        <KnockoutBracket matches={all.data} />
      </section>

      <section className="mt-12 max-w-xl" aria-label="Top scorers">
        <SectionHeader title="Golden Boot Race" right={<SourceTag source={scorers.source} />} />
        <div className="rounded-xl border border-edge bg-panel px-4 py-2">
          <TopScorers scorers={scorers.data} />
        </div>
      </section>
    </div>
  );
}
