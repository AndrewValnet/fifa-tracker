"use client";

import { Flag } from "@/components/Flag";

interface StandingTeam {
  name: string;
  code: string;
  pts: number;
  played: number;
  qualified?: boolean;
  eliminated?: boolean;
}

interface GroupStanding {
  group: string;
  teams: StandingTeam[];
}

interface GroupStageHeatMapProps {
  standings: GroupStanding[];
}

export function GroupStageHeatMap({ standings }: GroupStageHeatMapProps) {
  return (
    <div className="font-body">
      <h2 className="font-display text-lg font-bold text-white mb-4 uppercase tracking-widest">
        Group Stage Heat Map
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {standings.map((group) => {
          // Sort by pts descending so top 2 are always indices 0 and 1
          const sorted = [...group.teams].sort((a, b) => b.pts - a.pts);

          return (
            <div
              key={group.group}
              className="bg-panel border border-edge rounded-lg overflow-hidden"
            >
              {/* Group header */}
              <div className="px-3 py-2 border-b border-edge">
                <span className="font-display text-xs font-bold text-text-dim uppercase tracking-widest">
                  Group {group.group}
                </span>
              </div>

              {/* Team rows */}
              <div className="divide-y divide-edge/40">
                {sorted.map((team, idx) => {
                  const isTop2 = idx < 2;
                  const isEliminated =
                    !isTop2 && team.played >= 2 && team.pts === 0;

                  let rowCls =
                    "flex items-center gap-2 px-3 py-2 transition-colors";
                  if (isTop2) {
                    rowCls +=
                      " bg-pitch/10 border-l-2 border-pitch/30";
                  } else if (isEliminated) {
                    rowCls += " bg-live/5";
                  }

                  return (
                    <div key={team.code} className={rowCls}>
                      {/* Rank */}
                      <span
                        className={`text-xs w-4 text-center font-bold shrink-0 ${
                          isTop2 ? "text-pitch" : "text-text-dim"
                        }`}
                      >
                        {idx + 1}
                      </span>

                      {/* Flag */}
                      <Flag code={team.code} name={team.name} width={16} />

                      {/* Name */}
                      <span
                        className={`flex-1 text-xs font-medium truncate ${
                          isTop2
                            ? "text-white"
                            : isEliminated
                            ? "text-text-dim line-through"
                            : "text-white/80"
                        }`}
                      >
                        {team.name}
                      </span>

                      {/* Played */}
                      <span className="text-xs text-text-dim w-5 text-center shrink-0">
                        {team.played}
                      </span>

                      {/* Points */}
                      <span
                        className={`text-xs font-bold w-6 text-right shrink-0 ${
                          isTop2
                            ? "text-pitch"
                            : isEliminated
                            ? "text-live/70"
                            : "text-white/60"
                        }`}
                      >
                        {team.pts}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Legend strip */}
              <div className="px-3 py-1.5 flex gap-3 border-t border-edge">
                <span className="text-[10px] text-text-dim">P = played</span>
                <span className="text-[10px] text-text-dim">Pts = points</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
