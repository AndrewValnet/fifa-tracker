"use client";

import { WC_YEARS, getTeamHistory, missedYears, type WcTeamHistory } from "@/lib/wc-history";

function StatPill({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg border px-3 py-2 text-center ${highlight ? "border-gold/50 bg-gold/10" : "border-edge bg-panel"}`}>
      <div className="text-[10px] uppercase tracking-wider text-dim">{label}</div>
      <div className={`font-display text-xl font-bold ${highlight ? "text-gold" : ""}`}>{value}</div>
    </div>
  );
}

function AllTimeRecord({ h }: { h: WcTeamHistory }) {
  if (!h.allTime) return null;
  const { p, w, d, l, gf, ga } = h.allTime;
  const gd = gf - ga;
  const ratio = ga > 0 ? (gf / ga).toFixed(2) : "∞";
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-dim">
        All-time record (1930–2022)
      </p>
      <div className="grid grid-cols-4 gap-1 sm:grid-cols-8">
        {([["P", p], ["W", w], ["D", d], ["L", l], ["GF", gf], ["GA", ga], ["GD", gd >= 0 ? `+${gd}` : gd], ["Ratio", ratio]] as [string, string | number][]).map(([k, v]) => (
          <div key={k} className="rounded border border-edge bg-panel/60 py-1.5 text-center">
            <div className="text-[9px] uppercase tracking-wider text-dim">{k}</div>
            <div className="text-sm font-bold tabular-nums">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QualificationTimeline({ h }: { h: WcTeamHistory }) {
  const missed = missedYears(h);
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-dim">
        World Cup appearances (1930–2022 · +2026)
      </p>
      <div className="flex flex-wrap gap-1">
        {WC_YEARS.map((year) => {
          const qualified = h.qualifiedYears.includes(year);
          return (
            <span
              key={year}
              title={qualified ? `${year} — qualified` : `${year} — did not qualify`}
              className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                qualified
                  ? "bg-pitch/20 text-pitch ring-1 ring-pitch/40"
                  : "bg-edge/10 text-dim/50 line-through"
              }`}
            >
              {year}
            </span>
          );
        })}
        {/* Always show 2026 as qualified (they're in this tournament) */}
        <span className="rounded bg-gold/20 px-1.5 py-0.5 font-mono text-[10px] text-gold ring-1 ring-gold/40">
          2026 ★
        </span>
      </div>
      {missed.length > 0 && (
        <p className="mt-1.5 text-[10px] text-dim">
          Missed {missed.length} tournament{missed.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

export function WcHistoryPanel({ code }: { code: string }) {
  const h = getTeamHistory(code);
  if (!h) return null;

  const totalApps = h.appearances + 1; // include 2026

  return (
    <div className="flex flex-col gap-5">
      {/* key stats row */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        <StatPill label="WC Appearances" value={totalApps} />
        <StatPill label="Titles" value={h.titles} highlight={h.titles > 0} />
        <StatPill label="Runner-up" value={h.runnerUp} />
        <StatPill label="3rd Place" value={h.thirdPlace} />
        <StatPill label="Knockout Apps" value={h.knockoutApps} />
        <StatPill label="Confederation" value={h.confederation} />
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-dim">Best finish</p>
        <p className="text-base font-semibold">{h.bestFinish}</p>
        {h.historicalNote && (
          <p className="mt-1 text-xs text-dim">{h.historicalNote}</p>
        )}
      </div>

      <QualificationTimeline h={h} />

      <AllTimeRecord h={h} />
    </div>
  );
}
