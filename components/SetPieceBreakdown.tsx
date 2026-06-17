"use client";

import { SET_PIECE_STATS } from "@/data/set-piece-stats";
import { Flag } from "@/components/Flag";

export function SetPieceBreakdown() {
  // Sort by total descending, take top 8
  const top8 = [...SET_PIECE_STATS]
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const maxTotal = top8[0]?.total ?? 1;

  return (
    <div className="font-body">
      <h2 className="font-display text-lg font-bold text-white mb-1 uppercase tracking-widest">
        Goal Sources Breakdown
      </h2>
      <p className="text-xs text-text-dim mb-4">Top 8 goal-scoring teams</p>

      {/* Legend */}
      <div className="flex gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-pitch inline-block" />
          <span className="text-xs text-text-dim">Open Play</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-gold inline-block" />
          <span className="text-xs text-text-dim">Set Pieces</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-live inline-block" />
          <span className="text-xs text-text-dim">Penalties</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {top8.map((stat) => {
          const opPct   = (stat.openPlay  / maxTotal) * 100;
          const spPct   = (stat.setpieces / maxTotal) * 100;
          const penPct  = (stat.penalties / maxTotal) * 100;

          return (
            <div key={stat.teamCode} className="flex items-center gap-3">
              {/* Team identity */}
              <div className="flex items-center gap-2 w-32 shrink-0">
                <Flag code={stat.teamCode} name={stat.teamName} width={20} />
                <span className="text-xs font-medium text-white/80 truncate">
                  {stat.teamName}
                </span>
              </div>

              {/* Stacked bar */}
              <div className="flex-1 flex h-5 rounded overflow-hidden bg-white/5 gap-px">
                {stat.openPlay > 0 && (
                  <div
                    className="bg-pitch flex items-center justify-center transition-all duration-500"
                    style={{ width: `${opPct}%` }}
                    title={`Open Play: ${stat.openPlay}`}
                  >
                    <span className="text-[10px] font-bold text-navy px-0.5 hidden sm:block">
                      {stat.openPlay}
                    </span>
                  </div>
                )}
                {stat.setpieces > 0 && (
                  <div
                    className="bg-gold flex items-center justify-center transition-all duration-500"
                    style={{ width: `${spPct}%` }}
                    title={`Set Pieces: ${stat.setpieces}`}
                  >
                    <span className="text-[10px] font-bold text-navy px-0.5 hidden sm:block">
                      {stat.setpieces}
                    </span>
                  </div>
                )}
                {stat.penalties > 0 && (
                  <div
                    className="bg-live flex items-center justify-center transition-all duration-500"
                    style={{ width: `${penPct}%` }}
                    title={`Penalties: ${stat.penalties}`}
                  >
                    <span className="text-[10px] font-bold text-white px-0.5 hidden sm:block">
                      {stat.penalties}
                    </span>
                  </div>
                )}
              </div>

              {/* Total */}
              <span className="w-8 text-right text-xs font-bold text-white shrink-0">
                {stat.total}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
