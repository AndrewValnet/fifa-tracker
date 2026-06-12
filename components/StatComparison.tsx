// Two-column tournament stats comparison (PRD §7.2). Free tiers don't expose
// possession/xG, so we compare what is reliably derivable from results.

import type { TeamSeasonStats } from "@/lib/types";

interface Row {
  label: string;
  home: number;
  away: number;
  /** lower value is better (e.g. goals conceded) */
  invert?: boolean;
}

function StatRow({ row }: { row: Row }) {
  const max = Math.max(row.home, row.away, 1);
  const homeBetter = row.invert ? row.home < row.away : row.home > row.away;
  const awayBetter = row.invert ? row.away < row.home : row.away > row.home;
  return (
    <div className="grid grid-cols-[3rem_1fr_minmax(7rem,auto)_1fr_3rem] items-center gap-2 py-1.5">
      <span className={`text-right font-mono text-sm ${homeBetter ? "font-bold text-ink" : "text-dim"}`}>
        {row.home}
      </span>
      <div className="flex justify-end">
        <div
          className="h-1.5 rounded-full"
          style={{ width: `${(row.home / max) * 100}%`, background: "var(--home-color)", minWidth: row.home > 0 ? 6 : 0 }}
        />
      </div>
      <span className="text-center text-[11px] uppercase tracking-wide text-dim">{row.label}</span>
      <div className="flex justify-start">
        <div
          className="h-1.5 rounded-full"
          style={{ width: `${(row.away / max) * 100}%`, background: "var(--away-color)", minWidth: row.away > 0 ? 6 : 0 }}
        />
      </div>
      <span className={`font-mono text-sm ${awayBetter ? "font-bold text-ink" : "text-dim"}`}>{row.away}</span>
    </div>
  );
}

export function StatComparison({
  home,
  away,
  homeName,
  awayName,
}: {
  home: TeamSeasonStats;
  away: TeamSeasonStats;
  homeName: string;
  awayName: string;
}) {
  const rows: Row[] = [
    { label: "Played", home: home.played, away: away.played },
    { label: "Wins", home: home.won, away: away.won },
    { label: "Goals scored", home: home.gf, away: away.gf },
    { label: "Goals conceded", home: home.ga, away: away.ga, invert: true },
    { label: "Clean sheets", home: home.cleanSheets, away: away.cleanSheets },
  ];
  if (home.yellows !== null && away.yellows !== null) {
    rows.push({ label: "Yellow cards", home: home.yellows, away: away.yellows, invert: true });
  }
  if (home.reds !== null && away.reds !== null) {
    rows.push({ label: "Red cards", home: home.reds, away: away.reds, invert: true });
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-semibold">
        <span style={{ color: "var(--home-color)" }}>{homeName}</span>
        <span className="text-[10px] uppercase tracking-widest text-dim">tournament so far</span>
        <span style={{ color: "var(--away-color)" }}>{awayName}</span>
      </div>
      <div className="divide-y divide-edge/40">
        {rows.map((r) => (
          <StatRow key={r.label} row={r} />
        ))}
      </div>
    </div>
  );
}
