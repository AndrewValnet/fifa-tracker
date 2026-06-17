"use client";

import { useState, useMemo } from "react";
import { Flag } from "@/components/Flag";
import { GroupStandingsTable } from "@/components/GroupStandingsTable";
import type { Match, GroupStanding, StandingRow } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GroupStageSimulatorProps {
  groups: GroupStanding[];
  matches: Match[];
}

interface HypotheticalScore {
  home: number;
  away: number;
}

// ---------------------------------------------------------------------------
// Simulation engine
// ---------------------------------------------------------------------------

function simulateGroup(
  teams: StandingRow[],
  matches: Match[],
  hypothetical: Record<string, HypotheticalScore>,
): StandingRow[] {
  // Build a mutable record keyed by team id
  type MutableRow = {
    teamId: string;
    name: string;
    code: string | null;
    crest: string | null;
    played: number;
    won: number;
    draw: number;
    lost: number;
    gf: number;
    ga: number;
    form: ("W" | "D" | "L")[];
  };

  const teamMap = new Map<string, MutableRow>();
  for (const row of teams) {
    teamMap.set(row.team.id, {
      teamId: row.team.id,
      name: row.team.name,
      code: row.team.code,
      crest: row.team.crest,
      played: 0,
      won: 0,
      draw: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      form: [],
    });
  }

  // We collect match results in chronological order to reconstruct form
  type MatchResult = {
    matchId: string;
    utcDate: string;
    homeId: string;
    awayId: string;
    homeGoals: number;
    awayGoals: number;
  };

  const results: MatchResult[] = [];

  for (const match of matches) {
    if (!match.homeTeam || !match.awayTeam) continue;
    if (!teamMap.has(match.homeTeam.id) || !teamMap.has(match.awayTeam.id)) continue;

    const override = hypothetical[match.id];
    const isFinished = match.status === "FINISHED";

    let homeGoals: number | null = null;
    let awayGoals: number | null = null;

    if (override !== undefined) {
      homeGoals = override.home;
      awayGoals = override.away;
    } else if (isFinished && match.score.home !== null && match.score.away !== null) {
      homeGoals = match.score.home;
      awayGoals = match.score.away;
    }

    if (homeGoals === null || awayGoals === null) continue;

    results.push({
      matchId: match.id,
      utcDate: match.utcDate,
      homeId: match.homeTeam.id,
      awayId: match.awayTeam.id,
      homeGoals,
      awayGoals,
    });
  }

  // Sort by utcDate so form is chronological
  results.sort((a, b) => a.utcDate.localeCompare(b.utcDate));

  for (const r of results) {
    const home = teamMap.get(r.homeId);
    const away = teamMap.get(r.awayId);
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;
    home.gf += r.homeGoals;
    home.ga += r.awayGoals;
    away.gf += r.awayGoals;
    away.ga += r.homeGoals;

    if (r.homeGoals > r.awayGoals) {
      home.won += 1;
      home.form.push("W");
      away.lost += 1;
      away.form.push("L");
    } else if (r.homeGoals < r.awayGoals) {
      away.won += 1;
      away.form.push("W");
      home.lost += 1;
      home.form.push("L");
    } else {
      home.draw += 1;
      home.form.push("D");
      away.draw += 1;
      away.form.push("D");
    }
  }

  const sorted = Array.from(teamMap.values()).sort((a, b) => {
    const aGd = a.gf - a.ga;
    const bGd = b.gf - b.ga;
    const aPts = a.won * 3 + a.draw;
    const bPts = b.won * 3 + b.draw;
    if (bPts !== aPts) return bPts - aPts;
    if (bGd !== aGd) return bGd - aGd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.name.localeCompare(b.name);
  });

  return sorted.map((t, i): StandingRow => ({
    position: i + 1,
    team: { id: t.teamId, name: t.name, code: t.code, crest: t.crest },
    played: t.played,
    won: t.won,
    draw: t.draw,
    lost: t.lost,
    gf: t.gf,
    ga: t.ga,
    gd: t.gf - t.ga,
    points: t.won * 3 + t.draw,
    form: t.form,
  }));
}

// ---------------------------------------------------------------------------
// ScoreStepper (inline)
// ---------------------------------------------------------------------------

function ScoreStepper({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1" aria-label={label}>
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={() => onChange(Math.max(0, value - 1))}
        className="flex h-7 w-7 items-center justify-center rounded border border-edge bg-panel2 font-mono text-sm text-dim hover:border-pitch/60 hover:text-pitch active:scale-95 transition-all"
      >
        −
      </button>
      <span className="w-6 text-center font-mono text-sm font-bold text-white">
        {value}
      </span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={() => onChange(Math.min(20, value + 1))}
        className="flex h-7 w-7 items-center justify-center rounded border border-edge bg-panel2 font-mono text-sm text-dim hover:border-pitch/60 hover:text-pitch active:scale-95 transition-all"
      >
        +
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function GroupStageSimulator({ groups, matches }: GroupStageSimulatorProps) {
  const [groupIndex, setGroupIndex] = useState(0);
  const [hypotheticalResults, setHypotheticalResults] = useState<
    Record<string, HypotheticalScore>
  >({});

  const selectedGroup = groups[groupIndex];

  // Unplayed matches for the selected group
  const groupMatches = useMemo(
    () =>
      matches.filter(
        (m) =>
          m.stage === "GROUP_STAGE" &&
          m.group === selectedGroup?.group &&
          m.homeTeam &&
          m.awayTeam,
      ),
    [matches, selectedGroup],
  );

  const unplayedMatches = useMemo(
    () =>
      groupMatches.filter(
        (m) => m.status !== "FINISHED" && m.status !== "AWARDED" && m.status !== "CANCELLED",
      ),
    [groupMatches],
  );

  // Simulated standings
  const simulatedRows = useMemo(() => {
    if (!selectedGroup) return [];
    return simulateGroup(selectedGroup.rows, groupMatches, hypotheticalResults);
  }, [selectedGroup, groupMatches, hypotheticalResults]);

  const simulatedGroupStanding: GroupStanding = useMemo(
    () => ({
      group: selectedGroup?.group ?? "",
      rows: simulatedRows,
    }),
    [selectedGroup, simulatedRows],
  );

  const hasHypothetical = Object.keys(hypotheticalResults).length > 0;

  // Determine which hypothetical edits belong to the current group
  const groupMatchIds = useMemo(
    () => new Set(groupMatches.map((m) => m.id)),
    [groupMatches],
  );

  const currentGroupHasHypothetical = useMemo(
    () => Object.keys(hypotheticalResults).some((id) => groupMatchIds.has(id)),
    [hypotheticalResults, groupMatchIds],
  );

  function setScore(matchId: string, side: "home" | "away", value: number) {
    setHypotheticalResults((prev) => {
      const current = prev[matchId] ?? { home: 0, away: 0 };
      return { ...prev, [matchId]: { ...current, [side]: value } };
    });
  }

  function clearMatchOverride(matchId: string) {
    setHypotheticalResults((prev) => {
      const next = { ...prev };
      delete next[matchId];
      return next;
    });
  }

  function resetAll() {
    setHypotheticalResults({});
  }

  if (!selectedGroup) {
    return (
      <div className="rounded-xl border border-edge bg-panel p-6 text-center text-dim text-sm">
        No group data available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info note */}
      <div className="flex items-center gap-2 rounded-lg border border-gold/20 bg-gold/5 px-3 py-2 text-xs text-gold/80">
        <span className="shrink-0">ℹ</span>
        <span>This is a what-if simulator — results are not real.</span>
      </div>

      {/* Group selector tabs */}
      <div className="flex flex-wrap gap-1.5">
        {groups.map((g, idx) => (
          <button
            key={g.group}
            type="button"
            onClick={() => setGroupIndex(idx)}
            className={
              idx === groupIndex
                ? "rounded-md px-3 py-1 text-xs font-display font-semibold uppercase tracking-wider bg-pitch text-navy transition-colors"
                : "rounded-md px-3 py-1 text-xs font-display font-semibold uppercase tracking-wider border border-edge bg-panel2 text-dim hover:border-pitch/50 hover:text-white transition-colors"
            }
          >
            Group {g.group}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left: match score editors */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-white">
              Remaining Matches
            </h3>
            {hasHypothetical && (
              <button
                type="button"
                onClick={resetAll}
                className="rounded border border-live/40 bg-live/10 px-2.5 py-1 text-xs font-medium text-live hover:bg-live/20 transition-colors"
              >
                Reset All
              </button>
            )}
          </div>

          {unplayedMatches.length === 0 ? (
            <p className="rounded-lg border border-edge bg-panel2 px-4 py-3 text-center text-xs text-dim">
              All matches in Group {selectedGroup.group} have been played.
            </p>
          ) : (
            <div className="space-y-2">
              {unplayedMatches.map((match) => {
                const isEdited = match.id in hypotheticalResults;
                const score = hypotheticalResults[match.id] ?? { home: 0, away: 0 };
                const home = match.homeTeam!;
                const away = match.awayTeam!;

                return (
                  <div
                    key={match.id}
                    className={`rounded-lg border px-3 py-2.5 transition-colors ${
                      isEdited
                        ? "border-pitch/40 bg-pitch/5"
                        : "border-edge bg-panel2"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      {/* Home team */}
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <Flag code={home.code} name={home.name} width={20} />
                        <span className="truncate text-xs font-medium text-white">
                          {home.name}
                        </span>
                      </div>

                      {/* Score steppers */}
                      <div className="flex shrink-0 items-center gap-2">
                        <ScoreStepper
                          value={score.home}
                          onChange={(v) => setScore(match.id, "home", v)}
                          label={`${home.name} goals`}
                        />
                        <span className="font-mono text-xs text-dim">vs</span>
                        <ScoreStepper
                          value={score.away}
                          onChange={(v) => setScore(match.id, "away", v)}
                          label={`${away.name} goals`}
                        />
                      </div>

                      {/* Away team */}
                      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                        <span className="truncate text-right text-xs font-medium text-white">
                          {away.name}
                        </span>
                        <Flag code={away.code} name={away.name} width={20} />
                      </div>
                    </div>

                    {/* What-if badge + clear button */}
                    {isEdited && (
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 rounded-full bg-pitch/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-pitch">
                          What-if
                        </span>
                        <button
                          type="button"
                          onClick={() => clearMatchOverride(match.id)}
                          className="text-[10px] text-dim hover:text-live transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Played matches (read-only, shown as context) */}
          {groupMatches.filter(
            (m) => m.status === "FINISHED" || m.status === "AWARDED",
          ).length > 0 && (
            <div className="space-y-1 pt-1">
              <p className="text-[10px] uppercase tracking-wider text-dim">
                Played matches (fixed)
              </p>
              {groupMatches
                .filter((m) => m.status === "FINISHED" || m.status === "AWARDED")
                .map((match) => {
                  const home = match.homeTeam!;
                  const away = match.awayTeam!;
                  return (
                    <div
                      key={match.id}
                      className="flex items-center justify-between gap-2 rounded border border-edge/50 bg-panel px-3 py-1.5 opacity-60"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-1.5">
                        <Flag code={home.code} name={home.name} width={16} />
                        <span className="truncate text-xs text-dim">{home.name}</span>
                      </div>
                      <span className="shrink-0 font-mono text-xs font-bold text-white">
                        {match.score.home ?? "—"} – {match.score.away ?? "—"}
                      </span>
                      <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
                        <span className="truncate text-right text-xs text-dim">{away.name}</span>
                        <Flag code={away.code} name={away.name} width={16} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Right: simulated standings */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-white">
              Projected Standings
            </h3>
            {currentGroupHasHypothetical && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold">
                Simulated
              </span>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-edge bg-panel">
            {/* Crown indicator row */}
            {simulatedRows.length > 0 && (
              <div className="border-b border-edge px-3 py-1.5 text-[10px] text-dim flex items-center gap-3">
                <span>
                  <span className="text-pitch font-semibold">■</span> Qualified (Top 2)
                </span>
                <span>
                  <span className="text-gold font-semibold">■</span> Possible best 3rd
                </span>
                <span>
                  👑 Group winner
                </span>
              </div>
            )}

            {/* Standings table */}
            <GroupStandingsTable standing={simulatedGroupStanding} />

            {/* Qualified highlight overlay labels */}
            {simulatedRows.length >= 1 && (
              <div className="border-t border-edge/40 px-3 py-2 space-y-1">
                {simulatedRows.slice(0, 2).map((row, i) => (
                  <div
                    key={row.team.id}
                    className="flex items-center gap-2 text-xs"
                  >
                    {i === 0 && <span className="text-gold text-sm">👑</span>}
                    {i === 1 && (
                      <span className="inline-block h-2 w-2 rounded-full bg-pitch/80" />
                    )}
                    <Flag code={row.team.code} name={row.team.name} width={16} />
                    <span className="font-medium text-white">{row.team.name}</span>
                    <span
                      className={`ml-auto font-mono font-bold ${i === 0 ? "text-gold" : "text-pitch"}`}
                    >
                      {row.points} pts
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        i === 0
                          ? "bg-gold/20 text-gold"
                          : "bg-pitch/20 text-pitch"
                      }`}
                    >
                      {i === 0 ? "Winner" : "Runner-up"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {currentGroupHasHypothetical && (
            <p className="text-[10px] text-dim italic">
              Standings reflect your hypothetical scorelines. Reset to restore real data.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
