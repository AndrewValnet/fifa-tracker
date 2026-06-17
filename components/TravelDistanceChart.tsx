import type { Match, Stadium } from "@/lib/types";
import { Flag } from "@/components/Flag";
import { SectionHeader } from "@/components/SectionHeader";
import { getTeamColors } from "@/lib/team-meta";
import { getStadium, findStadiumByName } from "@/lib/schedule";

export interface TravelDistanceChartProps {
  matches: Match[];
  stadiums: Stadium[];
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function resolveStadium(match: Match): Stadium | null {
  if (match.stadiumId) {
    const s = getStadium(match.stadiumId);
    if (s) return s;
  }
  if (match.venue) {
    return findStadiumByName(match.venue);
  }
  return null;
}

interface TeamTravel {
  code: string;
  totalKm: number;
  matchCount: number;
}

function computeTeamTravel(matches: Match[]): TeamTravel[] {
  // Build per-team match list sorted by date
  const teamMatches = new Map<string, Match[]>();

  for (const match of matches) {
    const codes: (string | null | undefined)[] = [
      match.homeTeam?.code,
      match.awayTeam?.code,
    ];
    for (const code of codes) {
      if (!code) continue;
      const list = teamMatches.get(code) ?? [];
      list.push(match);
      teamMatches.set(code, list);
    }
  }

  const results: TeamTravel[] = [];

  for (const [code, teamMatchList] of teamMatches) {
    // Sort by date
    const sorted = [...teamMatchList].sort(
      (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime(),
    );

    // Resolve stadiums
    const stadiumSequence: Stadium[] = [];
    for (const match of sorted) {
      const stadium = resolveStadium(match);
      if (stadium) stadiumSequence.push(stadium);
    }

    // Need at least 2 distinct venues to calculate travel
    if (stadiumSequence.length < 2) continue;

    let totalKm = 0;
    for (let i = 1; i < stadiumSequence.length; i++) {
      const prev = stadiumSequence[i - 1];
      const curr = stadiumSequence[i];
      // Only add distance if venues are different
      if (prev.id !== curr.id) {
        totalKm += haversineKm(prev.lat, prev.lng, curr.lat, curr.lng);
      }
    }

    results.push({ code, totalKm: Math.round(totalKm), matchCount: sorted.length });
  }

  // Sort by total distance descending
  results.sort((a, b) => b.totalKm - a.totalKm);

  return results;
}

export function TravelDistanceChart({
  matches,
}: TravelDistanceChartProps) {
  const teamTravel = computeTeamTravel(matches);

  if (teamTravel.length === 0) {
    return (
      <div className="rounded-lg border border-edge bg-panel p-4">
        <SectionHeader title="Team Travel Distance" />
        <p className="text-sm text-dim">
          Not enough match data to calculate travel distances.
        </p>
      </div>
    );
  }

  const maxKm = teamTravel[0].totalKm;
  const mostTraveledCode = teamTravel[0].code;
  const leastTraveledCode = teamTravel[teamTravel.length - 1].code;

  return (
    <div className="rounded-lg border border-edge bg-panel p-4">
      <SectionHeader
        title="Team Travel Distance"
        right={`${teamTravel.length} teams`}
      />

      <div className="space-y-2">
        {teamTravel.map(({ code, totalKm }) => {
          const { primary } = getTeamColors(code);
          const barWidth = maxKm > 0 ? (totalKm / maxKm) * 100 : 0;
          const isMax = code === mostTraveledCode;
          const isMin = code === leastTraveledCode;

          return (
            <div key={code} className="group flex items-center gap-3">
              {/* Team identity: flag + name */}
              <div className="flex w-36 shrink-0 items-center gap-2">
                <Flag code={code} width={20} className="shrink-0" />
                <span className="truncate font-mono text-xs font-medium uppercase tracking-wide text-white">
                  {code}
                </span>
                {isMax && (
                  <span
                    title="Frequent flyer"
                    className="shrink-0 text-xs"
                    aria-label="Frequent flyer"
                  >
                    ✈️
                  </span>
                )}
                {isMin && (
                  <span
                    title="Home advantage"
                    className="shrink-0 text-xs"
                    aria-label="Home advantage"
                  >
                    🏠
                  </span>
                )}
              </div>

              {/* Bar track */}
              <div className="relative flex h-6 flex-1 items-center rounded bg-panel2">
                <div
                  className="h-full rounded transition-all duration-500"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: primary,
                    minWidth: totalKm > 0 ? "4px" : "0",
                  }}
                />
              </div>

              {/* Distance label */}
              <span className="w-20 shrink-0 text-right font-mono text-xs text-dim">
                {totalKm.toLocaleString()} km
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 border-t border-edge pt-3">
        <div className="flex items-center gap-1.5 text-xs text-dim">
          <span>✈️</span>
          <span>Frequent flyer — most total travel</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-dim">
          <span>🏠</span>
          <span>Home advantage — least total travel</span>
        </div>
      </div>
    </div>
  );
}
