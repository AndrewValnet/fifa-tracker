// Dominance dashboard for a finished/live match — pure display, server component.

import type { TeamMatchStats } from "@/lib/types";
import { getTeamColors } from "@/lib/team-meta";
import { Flag } from "@/components/Flag";
import { SectionHeader } from "@/components/SectionHeader";

export interface MatchDominanceChartProps {
  homeCode: string | null;
  awayCode: string | null;
  homeStats: TeamMatchStats | null;
  awayStats: TeamMatchStats | null;
  homeScore: number | null;
  awayScore: number | null;
}

// ---------------------------------------------------------------------------
// Possession split bar (full width, percentage labels)
// ---------------------------------------------------------------------------

function PossessionSplit({
  home,
  away,
  homeColor,
  awayColor,
}: {
  home: number;
  away: number;
  homeColor: string;
  awayColor: string;
}) {
  const total = home + away || 100;
  const homePct = (home / total) * 100;
  const awayPct = 100 - homePct;

  return (
    <div className="mb-5">
      {/* Labels row */}
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-mono text-base font-bold" style={{ color: homeColor }}>
          {home.toFixed(0)}%
        </span>
        <span className="font-display text-[10px] uppercase tracking-[0.15em] text-dim">
          Possession
        </span>
        <span className="font-mono text-base font-bold" style={{ color: awayColor }}>
          {away.toFixed(0)}%
        </span>
      </div>
      {/* Wide split bar */}
      <div
        className="flex h-4 w-full overflow-hidden rounded-full"
        role="img"
        aria-label={`Possession: home ${home.toFixed(0)}%, away ${away.toFixed(0)}%`}
      >
        <div style={{ width: `${homePct}%`, background: homeColor }} />
        <div style={{ width: `${awayPct}%`, background: awayColor }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generic vs-bar row
// ---------------------------------------------------------------------------

interface MetricRowProps {
  label: string;
  homeVal: number | null;
  awayVal: number | null;
  homeColor: string;
  awayColor: string;
  /** Lower value is better (fouls) */
  invert?: boolean;
}

function MetricRow({
  label,
  homeVal,
  awayVal,
  homeColor,
  awayColor,
  invert = false,
}: MetricRowProps) {
  const homeBetter =
    homeVal !== null && awayVal !== null && (invert ? homeVal < awayVal : homeVal > awayVal);
  const awayBetter =
    homeVal !== null && awayVal !== null && (invert ? awayVal < homeVal : awayVal > homeVal);

  // Bar widths: proportional to each side's value, clamp to avoid 0-width
  const total = (homeVal ?? 0) + (awayVal ?? 0);
  const homeBarPct = total > 0 ? Math.max(2, ((homeVal ?? 0) / total) * 100) : 50;
  const awayBarPct = total > 0 ? Math.max(2, ((awayVal ?? 0) / total) * 100) : 50;

  return (
    <div className="border-t border-edge/40 py-2">
      {/* Metric label */}
      <div className="mb-1 text-center font-display text-[10px] uppercase tracking-[0.12em] text-dim">
        {label}
      </div>
      {/* Values + split bar */}
      <div className="flex items-center gap-2">
        {/* Home value */}
        <span
          className={`w-7 text-right font-mono text-sm tabular-nums ${
            homeBetter ? "font-bold" : ""
          }`}
          style={{ color: homeBetter ? homeColor : "#6b7a99" }}
        >
          {homeVal ?? "—"}
        </span>

        {/* Split bar */}
        <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-panel2">
          {total > 0 ? (
            <>
              <div
                style={{ width: `${homeBarPct}%`, background: homeColor, opacity: homeBetter ? 1 : 0.7 }}
              />
              <div
                style={{ width: `${awayBarPct}%`, background: awayColor, opacity: awayBetter ? 1 : 0.7 }}
              />
            </>
          ) : (
            <div className="w-full bg-edge/30" />
          )}
        </div>

        {/* Away value */}
        <span
          className={`w-7 font-mono text-sm tabular-nums ${awayBetter ? "font-bold" : ""}`}
          style={{ color: awayBetter ? awayColor : "#6b7a99" }}
        >
          {awayVal ?? "—"}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Team header row (flags + score)
// ---------------------------------------------------------------------------

function TeamHeader({
  homeCode,
  awayCode,
  homeScore,
  awayScore,
  homeColor,
  awayColor,
}: {
  homeCode: string | null;
  awayCode: string | null;
  homeScore: number | null;
  awayScore: number | null;
  homeColor: string;
  awayColor: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      {/* Home */}
      <div className="flex items-center gap-2">
        <Flag code={homeCode} width={28} />
        <span
          className="font-display text-sm font-bold uppercase tracking-wider"
          style={{ color: homeColor }}
        >
          {homeCode ?? "HOM"}
        </span>
      </div>

      {/* Score pill */}
      <div className="flex items-center gap-1 rounded-md bg-panel2 px-3 py-0.5 font-mono text-lg font-bold tabular-nums">
        <span style={{ color: homeColor }}>{homeScore ?? "—"}</span>
        <span className="text-dim">:</span>
        <span style={{ color: awayColor }}>{awayScore ?? "—"}</span>
      </div>

      {/* Away */}
      <div className="flex items-center gap-2">
        <span
          className="font-display text-sm font-bold uppercase tracking-wider"
          style={{ color: awayColor }}
        >
          {awayCode ?? "AWY"}
        </span>
        <Flag code={awayCode} width={28} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function MatchDominanceChart({
  homeCode,
  awayCode,
  homeStats,
  awayStats,
  homeScore,
  awayScore,
}: MatchDominanceChartProps) {
  const { primary: homeColor } = getTeamColors(homeCode);
  const { primary: awayColor } = getTeamColors(awayCode);

  const hasStats = homeStats !== null && awayStats !== null;

  return (
    <div className="rounded-xl border border-edge bg-panel p-4">
      <SectionHeader title="Dominance" />

      <TeamHeader
        homeCode={homeCode}
        awayCode={awayCode}
        homeScore={homeScore}
        awayScore={awayScore}
        homeColor={homeColor}
        awayColor={awayColor}
      />

      {!hasStats ? (
        <div className="flex h-28 items-center justify-center rounded-lg bg-panel2 text-sm text-dim">
          Stats available at kickoff
        </div>
      ) : (
        <>
          {/* Possession — wider bar at the top */}
          {homeStats.possession !== null && awayStats.possession !== null && (
            <PossessionSplit
              home={homeStats.possession}
              away={awayStats.possession}
              homeColor={homeColor}
              awayColor={awayColor}
            />
          )}

          {/* Metric rows */}
          <div>
            <MetricRow
              label="Shots"
              homeVal={homeStats.shots}
              awayVal={awayStats.shots}
              homeColor={homeColor}
              awayColor={awayColor}
            />
            <MetricRow
              label="Shots on Target"
              homeVal={homeStats.shotsOnTarget}
              awayVal={awayStats.shotsOnTarget}
              homeColor={homeColor}
              awayColor={awayColor}
            />
            <MetricRow
              label="Passes"
              homeVal={homeStats.passes}
              awayVal={awayStats.passes}
              homeColor={homeColor}
              awayColor={awayColor}
            />
            <MetricRow
              label="Fouls"
              homeVal={homeStats.fouls}
              awayVal={awayStats.fouls}
              homeColor={homeColor}
              awayColor={awayColor}
              invert
            />
          </div>

          <p className="mt-3 text-[10px] text-dim">Statistics via ESPN</p>
        </>
      )}
    </div>
  );
}
