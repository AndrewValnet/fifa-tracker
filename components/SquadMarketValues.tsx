"use client";

import { useState } from "react";
import { SQUAD_VALUES } from "@/data/squad-market-values";
import { getTeamColors } from "@/lib/team-meta";
import { Flag } from "@/components/Flag";
import { SectionHeader } from "@/components/SectionHeader";

type Metric = "total" | "avg";

// Historical WC winners (codes that have lifted the trophy)
const WC_WINNERS = new Set(["BRA", "GER", "ITA", "ARG", "FRA", "URU", "ENG", "ESP"]);

const MEDAL_STYLES: Record<number, string> = {
  0: "from-gold/20 to-gold/5 ring-1 ring-gold/40",
  1: "from-[#C0C0C0]/20 to-[#C0C0C0]/5 ring-1 ring-[#C0C0C0]/30",
  2: "from-[#CD7F32]/20 to-[#CD7F32]/5 ring-1 ring-[#CD7F32]/30",
};

function TrophyIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-label="WC winner"
      role="img"
    >
      <path d="M3 1h10v1H3zM4 2h8v4a4 4 0 01-8 0V2zm-1 1H2a2 2 0 000 4h.07A5.01 5.01 0 004 8.9V3zM12 3v5.9A5.01 5.01 0 0013.93 7H14a2 2 0 000-4h-2zM7 10.9A5.01 5.01 0 015.1 10H4v1a1 1 0 001 1h6a1 1 0 001-1v-1h-1.1A5.01 5.01 0 019 10.9V13H7v-2.1zM6 13h4v1H6z" />
    </svg>
  );
}

export function SquadMarketValues() {
  const [metric, setMetric] = useState<Metric>("total");

  const sorted = [...SQUAD_VALUES].sort((a, b) =>
    metric === "total"
      ? b.totalValueM - a.totalValueM
      : b.avgPlayerValueM - a.avgPlayerValueM
  );

  const maxValue =
    metric === "total"
      ? sorted[0]?.totalValueM ?? 1
      : sorted[0]?.avgPlayerValueM ?? 1;

  const totalTournamentValue = SQUAD_VALUES.reduce(
    (sum, s) => sum + s.totalValueM,
    0
  );

  function getValue(s: (typeof SQUAD_VALUES)[number]): number {
    return metric === "total" ? s.totalValueM : s.avgPlayerValueM;
  }

  function formatValue(val: number): string {
    if (val >= 1000) return `€${(val / 1000).toFixed(2)}B`;
    return `€${val}M`;
  }

  return (
    <section className="rounded-xl border border-edge bg-panel p-4">
      <SectionHeader
        title="Squad Market Values"
        right={
          <div className="flex items-center gap-1 rounded-lg border border-edge bg-panel2 p-0.5">
            <button
              onClick={() => setMetric("total")}
              className={`rounded-md px-3 py-1 text-xs font-mono font-medium transition-colors ${
                metric === "total"
                  ? "bg-pitch/20 text-pitch"
                  : "text-dim hover:text-ink"
              }`}
            >
              Total Value
            </button>
            <button
              onClick={() => setMetric("avg")}
              className={`rounded-md px-3 py-1 text-xs font-mono font-medium transition-colors ${
                metric === "avg"
                  ? "bg-pitch/20 text-pitch"
                  : "text-dim hover:text-ink"
              }`}
            >
              Avg per Player
            </button>
          </div>
        }
      />

      {/* Total tournament value summary */}
      <div className="mb-4 flex items-center gap-3 rounded-lg border border-edge bg-panel2/60 px-4 py-3">
        <span className="text-xs uppercase tracking-wider text-dim">
          Total tournament squad value
        </span>
        <span className="font-display text-xl font-bold text-gold tabular-nums">
          {formatValue(totalTournamentValue)}
        </span>
        <span className="text-xs text-dim">across all 48 squads</span>
      </div>

      {/* Legend */}
      <div className="mb-3 flex items-center gap-4 text-[10px] uppercase tracking-wider text-dim">
        <span className="flex items-center gap-1">
          <TrophyIcon className="h-3 w-3 text-gold" />
          Past WC winner
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-gold/30 ring-1 ring-gold/50" />
          1st
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#C0C0C0]/30 ring-1 ring-[#C0C0C0]/40" />
          2nd
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#CD7F32]/30 ring-1 ring-[#CD7F32]/40" />
          3rd
        </span>
      </div>

      {/* Chart rows */}
      <ol className="flex flex-col gap-1.5">
        {sorted.map((squad, idx) => {
          const { primary } = getTeamColors(squad.code);
          const value = getValue(squad);
          const barPct = (value / maxValue) * 100;
          const isWinner = WC_WINNERS.has(squad.code);
          const medalClass = MEDAL_STYLES[idx] ?? "";
          const isMedal = idx < 3;

          return (
            <li
              key={squad.code}
              className={`group relative flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-panel2/80 ${
                isMedal ? `bg-gradient-to-r ${medalClass}` : ""
              }`}
              title={`Most Valuable Player: ${squad.mostValuablePlayer} (€${squad.mostValuableValueM}M)`}
            >
              {/* Rank */}
              <span className="w-6 shrink-0 text-center font-display text-xs font-bold text-dim">
                {idx + 1}
              </span>

              {/* Flag */}
              <Flag
                code={squad.code}
                width={28}
                className="shrink-0"
              />

              {/* Team code + trophy if WC winner */}
              <div className="flex w-14 shrink-0 items-center gap-1 sm:w-16">
                <span className="font-display text-xs font-bold uppercase tracking-wide text-ink">
                  {squad.code}
                </span>
                {isWinner && (
                  <TrophyIcon className="h-3 w-3 shrink-0 text-gold" />
                )}
              </div>

              {/* Bar track */}
              <div className="relative h-5 flex-1 overflow-hidden rounded-sm bg-panel2">
                <div
                  className="absolute inset-y-0 left-0 rounded-sm transition-[width] duration-500 ease-out"
                  style={{
                    width: `${barPct}%`,
                    background: `linear-gradient(90deg, ${primary}dd 0%, ${primary}55 100%)`,
                  }}
                />
                {/* Shimmer overlay for top 3 */}
                {isMedal && (
                  <div
                    className="pointer-events-none absolute inset-0 animate-pulse opacity-20"
                    style={{
                      background: `linear-gradient(90deg, transparent 0%, ${
                        idx === 0
                          ? "#ffd700"
                          : idx === 1
                          ? "#C0C0C0"
                          : "#CD7F32"
                      }80 50%, transparent 100%)`,
                    }}
                  />
                )}
              </div>

              {/* Value label */}
              <span className="w-20 shrink-0 text-right font-mono text-xs font-semibold tabular-nums text-ink">
                {formatValue(value)}
              </span>

              {/* Hover tooltip — MVP */}
              <div className="pointer-events-none absolute right-2 top-full z-10 mt-1 hidden rounded-md border border-edge bg-navy px-2.5 py-1.5 text-xs text-ink shadow-xl group-hover:block">
                <span className="text-dim">MVP:</span>{" "}
                <span className="font-medium">{squad.mostValuablePlayer}</span>{" "}
                <span className="text-gold">€{squad.mostValuableValueM}M</span>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-4 text-[10px] leading-relaxed text-dim">
        Source: Transfermarkt estimates, early 2026. Values in millions EUR. Hover any row to see most valuable player.
      </p>
    </section>
  );
}
