"use client";

import { getTeamColors } from "@/lib/team-meta";

interface ShotQualityChartProps {
  homeCode: string | null;
  awayCode: string | null;
  homeStats: { shots: number | null; shotsOnTarget: number | null; blockedShots: number | null } | null;
  awayStats: { shots: number | null; shotsOnTarget: number | null; blockedShots: number | null } | null;
}

interface BarRowProps {
  label: string;
  homeValue: number | null;
  awayValue: number | null;
  homePrimary: string;
  awayPrimary: string;
}

function BarRow({ label, homeValue, awayValue, homePrimary, awayPrimary }: BarRowProps) {
  const home = homeValue ?? 0;
  const away = awayValue ?? 0;
  const total = home + away;
  const homePct = total === 0 ? 50 : Math.round((home / total) * 100);
  const awayPct = total === 0 ? 50 : 100 - homePct;

  return (
    <div className="mb-4">
      <p className="text-center text-xs font-body text-gray-400 uppercase tracking-widest mb-1">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <span className="w-8 text-right text-sm font-mono font-semibold text-white tabular-nums">
          {homeValue ?? "—"}
        </span>
        <div className="flex flex-1 h-3 rounded-full overflow-hidden bg-[#1a2035]">
          <div
            className="h-full rounded-l-full transition-all duration-500"
            style={{ width: `${homePct}%`, backgroundColor: homePrimary }}
          />
          <div
            className="h-full rounded-r-full transition-all duration-500"
            style={{ width: `${awayPct}%`, backgroundColor: awayPrimary }}
          />
        </div>
        <span className="w-8 text-left text-sm font-mono font-semibold text-white tabular-nums">
          {awayValue ?? "—"}
        </span>
      </div>
    </div>
  );
}

export function ShotQualityChart({
  homeCode,
  awayCode,
  homeStats,
  awayStats,
}: ShotQualityChartProps) {
  const homeColors = getTeamColors(homeCode);
  const awayColors = getTeamColors(awayCode);

  const hasData =
    homeStats !== null &&
    awayStats !== null &&
    (homeStats.shots !== null ||
      awayStats.shots !== null ||
      homeStats.shotsOnTarget !== null ||
      awayStats.shotsOnTarget !== null);

  if (!hasData) {
    return (
      <div className="bg-[#0f1523] rounded-xl p-5 border border-[#1e2a3a] flex flex-col items-center justify-center min-h-[160px]">
        <p className="text-gray-500 text-sm font-body">Shot data not available</p>
      </div>
    );
  }

  const homeAccuracy =
    homeStats?.shots && homeStats.shotsOnTarget !== null
      ? Math.round(((homeStats.shotsOnTarget ?? 0) / homeStats.shots) * 100)
      : null;

  const awayAccuracy =
    awayStats?.shots && awayStats.shotsOnTarget !== null
      ? Math.round(((awayStats.shotsOnTarget ?? 0) / awayStats.shots) * 100)
      : null;

  return (
    <div className="bg-[#0f1523] rounded-xl p-5 border border-[#1e2a3a]">
      <h3 className="text-center text-sm font-display uppercase tracking-widest text-gray-300 mb-4">
        Shot Quality
      </h3>

      {/* Team labels */}
      <div className="flex justify-between mb-3 px-10">
        <span
          className="text-xs font-display font-semibold uppercase tracking-wide"
          style={{ color: homeColors.primary }}
        >
          {homeCode ?? "HOME"}
        </span>
        <span
          className="text-xs font-display font-semibold uppercase tracking-wide"
          style={{ color: awayColors.primary }}
        >
          {awayCode ?? "AWAY"}
        </span>
      </div>

      <BarRow
        label="Total Shots"
        homeValue={homeStats?.shots ?? null}
        awayValue={awayStats?.shots ?? null}
        homePrimary={homeColors.primary}
        awayPrimary={awayColors.primary}
      />
      <BarRow
        label="On Target"
        homeValue={homeStats?.shotsOnTarget ?? null}
        awayValue={awayStats?.shotsOnTarget ?? null}
        homePrimary={homeColors.primary}
        awayPrimary={awayColors.primary}
      />
      <BarRow
        label="Blocked"
        homeValue={homeStats?.blockedShots ?? null}
        awayValue={awayStats?.blockedShots ?? null}
        homePrimary={homeColors.primary}
        awayPrimary={awayColors.primary}
      />

      {/* Shot accuracy footer */}
      <div className="flex justify-between mt-3 pt-3 border-t border-[#1e2a3a] px-10">
        <div className="text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-body">Accuracy</p>
          <p
            className="text-base font-mono font-bold"
            style={{ color: homeColors.primary }}
          >
            {homeAccuracy !== null ? `${homeAccuracy}%` : "—"}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-body">Accuracy</p>
          <p
            className="text-base font-mono font-bold"
            style={{ color: awayColors.primary }}
          >
            {awayAccuracy !== null ? `${awayAccuracy}%` : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
