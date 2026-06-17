"use client";

import { useEffect, useState } from "react";
import type { Scorer } from "@/lib/types";
import { Flag } from "@/components/Flag";
import { SectionHeader } from "@/components/SectionHeader";
import { getTeamColors } from "@/lib/team-meta";

export interface GoldenBootRaceChartProps {
  scorers: Scorer[];
  limit?: number;
}

type Mode = "goals" | "combined";

export function GoldenBootRaceChart({ scorers, limit = 10 }: GoldenBootRaceChartProps) {
  const [mode, setMode] = useState<Mode>("goals");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Defer to next frame so the CSS transition fires after initial render
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const rows = scorers.slice(0, limit);

  const maxGoals = rows.reduce((acc, s) => Math.max(acc, s.goals), 0);
  const maxCombined = rows.reduce((acc, s) => Math.max(acc, s.goals + (s.assists ?? 0)), 0);

  function barWidth(scorer: Scorer): string {
    if (!mounted) return "0%";
    if (mode === "goals") {
      const max = maxGoals || 1;
      return `${(scorer.goals / max) * 100}%`;
    }
    const max = maxCombined || 1;
    const val = scorer.goals + (scorer.assists ?? 0);
    return `${(val / max) * 100}%`;
  }

  return (
    <section className="rounded-xl border border-edge bg-panel p-4">
      <SectionHeader
        title="Golden Boot Race"
        right={
          <div className="flex items-center gap-1 rounded-lg border border-edge bg-panel2 p-0.5">
            <button
              onClick={() => setMode("goals")}
              className={`rounded-md px-3 py-1 text-xs font-mono font-medium transition-colors ${
                mode === "goals"
                  ? "bg-gold/20 text-gold"
                  : "text-dim hover:text-ink"
              }`}
            >
              Goals
            </button>
            <button
              onClick={() => setMode("combined")}
              className={`rounded-md px-3 py-1 text-xs font-mono font-medium transition-colors ${
                mode === "combined"
                  ? "bg-gold/20 text-gold"
                  : "text-dim hover:text-ink"
              }`}
            >
              Goals + Assists
            </button>
          </div>
        }
      />

      <ol className="flex flex-col gap-2">
        {rows.map((scorer, idx) => {
          const rank = idx + 1;
          const code = scorer.team.code ?? undefined;
          const { primary } = getTeamColors(code);
          return (
            <li key={`${scorer.player}-${scorer.team.id}`} className="group flex items-center gap-3">
              {/* Rank */}
              <span className="w-6 shrink-0 text-center font-display text-sm font-bold uppercase tracking-wide text-dim">
                {rank === 1 ? (
                  <span role="img" aria-label="rank 1 trophy" className="text-base">
                    🏆
                  </span>
                ) : (
                  rank
                )}
              </span>

              {/* Flag */}
              <Flag
                code={code}
                name={scorer.team.name}
                width={24}
                className="shrink-0"
              />

              {/* Player name */}
              <span className="w-32 shrink-0 truncate text-sm font-medium text-ink sm:w-40">
                {scorer.player}
              </span>

              {/* Bar track */}
              <div className="relative h-6 flex-1 overflow-hidden rounded-sm bg-panel2">
                {/* Animated fill bar */}
                <div
                  className="absolute inset-y-0 left-0 rounded-sm"
                  style={{
                    width: barWidth(scorer),
                    background: `linear-gradient(90deg, ${primary}cc 0%, ${primary}22 100%)`,
                    transition: "width 0.6s ease-out",
                  }}
                />
                {/* Combined segment overlay (shows assist portion) */}
                {mode === "combined" && scorer.assists != null && scorer.assists > 0 && mounted && (
                  <div
                    className="absolute inset-y-0 left-0 rounded-sm opacity-30"
                    style={{
                      width: `${(scorer.goals / (maxCombined || 1)) * 100}%`,
                      background: primary,
                      transition: "width 0.6s ease-out",
                    }}
                  />
                )}
              </div>

              {/* Stats */}
              <div className="flex w-20 shrink-0 items-center justify-end gap-1.5 font-mono text-sm">
                <span className="font-bold text-gold">{scorer.goals}G</span>
                {scorer.assists != null && (
                  <span className="text-dim text-xs">{scorer.assists}A</span>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {rows.length === 0 && (
        <p className="py-6 text-center text-sm text-dim">No scorer data available.</p>
      )}
    </section>
  );
}
