import { Suspense } from "react";
import type { Metadata } from "next";
import { AssistsLeaderboard } from "@/components/AssistsLeaderboard";
import { GroupScenarios } from "@/components/GroupScenarios";
import { GroupStandingsTable } from "@/components/GroupStandingsTable";
import { KnockoutBracket } from "@/components/KnockoutBracket";
import { SectionHeader } from "@/components/SectionHeader";
import { SourceTag } from "@/components/SourceTag";
import { SuspensionTracker } from "@/components/SuspensionTracker";
import { TopScorers } from "@/components/TopScorers";
import { getAllMatches, getScorers, getStandings } from "@/lib/data";
import { getQualificationScenarios } from "@/lib/qualification";

export const metadata: Metadata = {
  title: "Standings & Bracket",
  description: "World Cup 2026 group tables, qualification picture, top scorers and the knockout bracket.",
};

async function GroupTables() {
  const standings = await getStandings();
  return (
    <>
      <div className="mb-2 flex justify-end">
        <SourceTag source={standings.source} />
      </div>
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
    </>
  );
}

async function Scenarios() {
  const all = await getAllMatches();
  return <GroupScenarios groups={await getQualificationScenarios(all.data)} />;
}

async function Bracket() {
  const all = await getAllMatches();
  return <KnockoutBracket matches={all.data} />;
}

async function Scorers() {
  const scorers = await getScorers(20);
  return (
    <div className="rounded-xl border border-edge bg-panel px-4 py-2">
      <TopScorers scorers={scorers.data} />
    </div>
  );
}

export default function StandingsPage() {
  return (
    <div className="mx-auto max-w-shell px-4 py-8">
      <h1 className="mb-6 font-display text-2xl font-bold uppercase tracking-wide md:text-3xl">
        Standings <span className="text-pitch">&amp; Bracket</span>
      </h1>

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

      <Suspense fallback={<div className="grid gap-5 md:grid-cols-2">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-48" aria-hidden />)}</div>}>
        <GroupTables />
      </Suspense>

      <section className="mt-12" aria-label="Qualification scenarios">
        <SectionHeader title="Who's Going Through?" right="points-based projection · GD can still decide ties" />
        <Suspense fallback={<div className="skeleton h-64 w-full" aria-hidden />}>
          <Scenarios />
        </Suspense>
      </section>

      <section className="mt-12" aria-label="Knockout bracket">
        <SectionHeader title="Road to the Final" right="Round of 32 → Final · MetLife Stadium, Jul 19" />
        <Suspense fallback={<div className="skeleton h-96 w-full" aria-hidden />}>
          <Bracket />
        </Suspense>
      </section>

      <section className="mt-12 max-w-xl" aria-label="Top scorers">
        <SectionHeader title="Golden Boot Race" />
        <Suspense fallback={<div className="skeleton h-64 w-full" aria-hidden />}>
          <Scorers />
        </Suspense>
      </section>

      <section className="mt-12 max-w-xl" aria-label="Top assists">
        <SectionHeader title="Top Assists" right="most assists this tournament" />
        <div className="rounded-xl border border-edge bg-panel px-4 py-2">
          <AssistsLeaderboard />
        </div>
      </section>

      <section className="mt-12 max-w-xl" aria-label="Suspension tracker">
        <SectionHeader title="Card Watch" right="yellow card accumulation · FIFA rules" />
        <div className="rounded-xl border border-edge bg-panel px-4 py-4">
          <SuspensionTracker />
        </div>
      </section>
    </div>
  );
}
