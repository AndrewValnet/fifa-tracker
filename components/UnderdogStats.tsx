// UnderdogStats — server component showing two fun tournament stats panels:
//   A) Goals per million fans (top 10 teams, normalised by home population)
//   B) Underdog index (outperformance vs expected points from FIFA ranking)

import { Flag } from "@/components/Flag";
import { SectionHeader } from "@/components/SectionHeader";
import { TEAM_POPULATION } from "@/data/team-population";
import { FIFA_RANKINGS } from "@/data/fifa-rankings";
import type { Scorer, GroupStanding } from "@/lib/types";

export interface UnderdogStatsProps {
  scorers: Scorer[];
  standings: GroupStanding[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Aggregate goals per team code from the scorer list. */
function buildTeamGoals(scorers: Scorer[]): Map<string, { goals: number; name: string }> {
  const map = new Map<string, { goals: number; name: string }>();
  for (const s of scorers) {
    const code = s.team.code?.toUpperCase();
    if (!code) continue;
    const existing = map.get(code);
    if (existing) {
      existing.goals += s.goals;
    } else {
      map.set(code, { goals: s.goals, name: s.team.name });
    }
  }
  return map;
}

/** Aggregate total tournament points per team code from all group standings. */
function buildTeamPoints(standings: GroupStanding[]): Map<string, { points: number; name: string }> {
  const map = new Map<string, { points: number; name: string }>();
  for (const group of standings) {
    for (const row of group.rows) {
      const code = row.team.code?.toUpperCase();
      if (!code) continue;
      const existing = map.get(code);
      if (existing) {
        // A team appears in multiple groups only in data errors; sum defensively.
        existing.points += row.points;
      } else {
        map.set(code, { points: row.points, name: row.team.name });
      }
    }
  }
  return map;
}

// Linear scale: rank 1 → 10 pts expected, rank 48 → 0 pts expected.
function expectedPoints(rank: number, maxRank = 48): number {
  return Math.max(0, 10 * (1 - (rank - 1) / (maxRank - 1)));
}

// ---------------------------------------------------------------------------
// Section A — Goals per million
// ---------------------------------------------------------------------------

interface GoalsPerMillionRow {
  rank: number;
  code: string;
  name: string;
  goals: number;
  population: number;
  ratio: number;
}

function GoalsPerMillionSection({ scorers }: { scorers: Scorer[] }) {
  const teamGoals = buildTeamGoals(scorers);

  const rows: GoalsPerMillionRow[] = [];
  for (const [code, { goals, name }] of teamGoals) {
    const population = TEAM_POPULATION[code];
    if (!population || goals === 0) continue;
    rows.push({ rank: 0, code, name, goals, population, ratio: goals / population });
  }

  rows.sort((a, b) => b.ratio - a.ratio);
  const top10 = rows.slice(0, 10).map((r, i) => ({ ...r, rank: i + 1 }));

  if (top10.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-dim">
        No goals recorded yet — check back after the first matchday.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-0">
      {top10.map((row) => {
        const isFirst = row.rank === 1;
        return (
          <li
            key={row.code}
            className={[
              "flex items-center gap-3 border-b border-edge/40 px-3 py-2.5 last:border-b-0",
              isFirst ? "rounded-lg bg-gold/10 ring-1 ring-gold/30" : "",
            ].join(" ")}
          >
            {/* Rank */}
            <span
              className={[
                "w-6 shrink-0 text-right font-mono text-xs",
                isFirst ? "font-bold text-gold" : "text-dim",
              ].join(" ")}
            >
              {row.rank}
            </span>

            {/* Flag */}
            <Flag code={row.code} name={row.name} width={isFirst ? 32 : 24} />

            {/* Team name */}
            <span className={["min-w-0 flex-1 truncate font-sans text-sm", isFirst ? "font-semibold text-gold" : ""].join(" ")}>
              {row.name}
            </span>

            {/* Goals */}
            <span className="shrink-0 text-right font-mono text-xs text-dim">
              {row.goals}g
            </span>

            {/* Population */}
            <span className="w-16 shrink-0 text-right font-mono text-xs text-dim">
              {row.population.toFixed(1)}M
            </span>

            {/* Goals per million — primary stat */}
            <span
              className={[
                "w-16 shrink-0 text-right font-display text-sm font-bold uppercase",
                isFirst ? "text-gold" : "text-pitch",
              ].join(" ")}
            >
              {row.ratio.toFixed(3)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Section B — Underdog index
// ---------------------------------------------------------------------------

interface UnderdogRow {
  code: string;
  name: string;
  rank: number;
  points: number;
  expectedPts: number;
  score: number; // actual - expected (positive = overperforming)
}

function UnderdogIndexSection({ standings }: { standings: GroupStanding[] }) {
  const teamPoints = buildTeamPoints(standings);
  const rankMap = new Map(FIFA_RANKINGS.map((r) => [r.code.toUpperCase(), r]));

  const rows: UnderdogRow[] = [];
  for (const [code, { points, name }] of teamPoints) {
    const ranking = rankMap.get(code);
    if (!ranking) continue;
    const exp = expectedPoints(ranking.rank);
    rows.push({
      code,
      name,
      rank: ranking.rank,
      points,
      expectedPts: exp,
      score: points - exp,
    });
  }

  rows.sort((a, b) => b.score - a.score);
  const top8 = rows.slice(0, 8);

  if (top8.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-dim">
        Standings data not available yet.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-0">
      {top8.map((row, i) => {
        const isOver = row.score >= 0;
        return (
          <li
            key={row.code}
            className="flex items-center gap-3 border-b border-edge/40 px-3 py-2.5 last:border-b-0"
          >
            {/* Position */}
            <span className="w-5 shrink-0 text-right font-mono text-xs text-dim">{i + 1}</span>

            {/* Flag */}
            <Flag code={row.code} name={row.name} width={24} />

            {/* Team name + ranking */}
            <span className={["min-w-0 flex-1", isOver ? "" : "text-dim"].join(" ")}>
              <span className="block truncate font-sans text-sm">{row.name}</span>
              <span className="font-mono text-[11px] text-dim">FIFA #{row.rank}</span>
            </span>

            {/* Tournament points */}
            <span className="shrink-0 font-mono text-xs text-dim">{row.points} pts</span>

            {/* Overperformance badge */}
            <span
              className={[
                "shrink-0 rounded px-2 py-0.5 font-mono text-xs font-semibold",
                isOver
                  ? "bg-pitch/15 text-pitch ring-1 ring-pitch/30"
                  : "bg-live/10 text-live ring-1 ring-live/30",
              ].join(" ")}
            >
              {isOver ? "+" : ""}
              {row.score.toFixed(1)} pts
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Root export
// ---------------------------------------------------------------------------

export function UnderdogStats({ scorers, standings }: UnderdogStatsProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Section A */}
      <section className="rounded-xl border border-edge bg-panel p-4">
        <SectionHeader
          title="Goals per million fans"
          right="Normalised by home country population"
        />
        <GoalsPerMillionSection scorers={scorers} />
      </section>

      {/* Section B */}
      <section className="rounded-xl border border-edge bg-panel p-4">
        <SectionHeader
          title="Underdog index"
          right="Expected pts from FIFA ranking vs actual"
        />
        <UnderdogIndexSection standings={standings} />
      </section>
    </div>
  );
}
