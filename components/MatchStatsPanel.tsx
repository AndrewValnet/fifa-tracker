// Full match statistics (ESPN data): possession, shots, passes, set pieces.

import type { TeamMatchStats } from "@/lib/types";

function PossessionBar({ home, away }: { home: number; away: number }) {
  const total = home + away || 100;
  const h = (home / total) * 100;
  return (
    <div className="mb-4">
      <div className="mb-1 flex items-center justify-between font-mono text-sm font-bold">
        <span style={{ color: "var(--home-color)" }}>{home.toFixed(1)}%</span>
        <span className="text-[10px] uppercase tracking-widest text-dim">Possession</span>
        <span style={{ color: "var(--away-color)" }}>{away.toFixed(1)}%</span>
      </div>
      <div
        className="flex h-3 w-full overflow-hidden rounded-full"
        role="img"
        aria-label={`Possession: home ${home.toFixed(1)}%, away ${away.toFixed(1)}%`}
      >
        <div style={{ width: `${h}%`, background: "var(--home-color)" }} />
        <div style={{ width: `${100 - h}%`, background: "var(--away-color)" }} />
      </div>
    </div>
  );
}

interface RowDef {
  label: string;
  home: string | number | null;
  away: string | number | null;
  homeRaw?: number | null;
  awayRaw?: number | null;
  /** lower is better (fouls, cards) */
  invert?: boolean;
}

function StatRow({ row }: { row: RowDef }) {
  const h = row.homeRaw ?? (typeof row.home === "number" ? row.home : null);
  const a = row.awayRaw ?? (typeof row.away === "number" ? row.away : null);
  const homeBetter = h !== null && a !== null && (row.invert ? h < a : h > a);
  const awayBetter = h !== null && a !== null && (row.invert ? a < h : a > h);
  return (
    <div className="grid grid-cols-[1fr_minmax(8.5rem,auto)_1fr] items-center gap-2 border-t border-edge/40 py-1.5 text-sm">
      <span className={`text-right font-mono ${homeBetter ? "font-bold text-ink" : "text-dim"}`}>
        {row.home ?? "—"}
      </span>
      <span className="text-center text-[11px] uppercase tracking-wide text-dim">{row.label}</span>
      <span className={`font-mono ${awayBetter ? "font-bold text-ink" : "text-dim"}`}>
        {row.away ?? "—"}
      </span>
    </div>
  );
}

function pct(part: number | null, total: number | null): string | null {
  if (part === null || total === null || total === 0) return null;
  return `${Math.round((part / total) * 100)}%`;
}

export function MatchStatsPanel({
  home,
  away,
  homeName,
  awayName,
}: {
  home: TeamMatchStats;
  away: TeamMatchStats;
  homeName: string;
  awayName: string;
}) {
  const rows: RowDef[] = [
    { label: "Shots", home: home.shots, away: away.shots },
    { label: "On target", home: home.shotsOnTarget, away: away.shotsOnTarget },
    {
      label: "Shot accuracy",
      home: pct(home.shotsOnTarget, home.shots),
      away: pct(away.shotsOnTarget, away.shots),
      homeRaw: home.shots ? (home.shotsOnTarget ?? 0) / home.shots : null,
      awayRaw: away.shots ? (away.shotsOnTarget ?? 0) / away.shots : null,
    },
    {
      label: "Passes (completed)",
      home: home.passes !== null ? `${home.accuratePasses ?? "?"}/${home.passes}` : null,
      away: away.passes !== null ? `${away.accuratePasses ?? "?"}/${away.passes}` : null,
      homeRaw: home.accuratePasses,
      awayRaw: away.accuratePasses,
    },
    {
      label: "Pass accuracy",
      home: pct(home.accuratePasses, home.passes),
      away: pct(away.accuratePasses, away.passes),
      homeRaw: home.passes ? (home.accuratePasses ?? 0) / home.passes : null,
      awayRaw: away.passes ? (away.accuratePasses ?? 0) / away.passes : null,
    },
    { label: "Assists", home: home.assists, away: away.assists },
    { label: "Corner kicks", home: home.corners, away: away.corners },
    // a foul by one side is a free kick for the other
    { label: "Free kicks won", home: away.fouls, away: home.fouls },
    { label: "Fouls committed", home: home.fouls, away: away.fouls, invert: true },
    { label: "Offsides", home: home.offsides, away: away.offsides, invert: true },
    { label: "Saves", home: home.saves, away: away.saves },
    {
      label: "Penalties (scored/taken)",
      home: home.pkShots !== null ? `${home.pkGoals ?? 0}/${home.pkShots}` : null,
      away: away.pkShots !== null ? `${away.pkGoals ?? 0}/${away.pkShots}` : null,
    },
    { label: "Yellow cards", home: home.yellow, away: away.yellow, invert: true },
    { label: "Red cards", home: home.red, away: away.red, invert: true },
  ].filter((r) => r.home !== null || r.away !== null);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs font-semibold">
        <span style={{ color: "var(--home-color)" }}>{homeName}</span>
        <span style={{ color: "var(--away-color)" }}>{awayName}</span>
      </div>
      {home.possession !== null && away.possession !== null ? (
        <PossessionBar home={home.possession} away={away.possession} />
      ) : null}
      <div>
        {rows.map((r) => (
          <StatRow key={r.label} row={r} />
        ))}
      </div>
      <p className="mt-3 text-[10px] text-dim">Statistics via ESPN</p>
    </div>
  );
}
