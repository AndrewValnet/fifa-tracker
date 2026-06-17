import { Flag } from "@/components/Flag";
import { SectionHeader } from "@/components/SectionHeader";
import { resolveTeamCode } from "@/lib/team-meta";
import type { Match, Referee } from "@/lib/types";

export interface RefereeTrackerProps {
  matches: Match[];
}

interface RefereeStats {
  name: string;
  nationality: string | null;
  nationalityCode: string | null;
  matchesOfficiated: number;
  totalYellows: number;
  totalReds: number;
  avgYellowsPerGame: number;
}

type StrictnessLevel = "strict" | "average" | "lenient";

function getStrictness(avgYellows: number): StrictnessLevel {
  if (avgYellows >= 3) return "strict";
  if (avgYellows >= 1.5) return "average";
  return "lenient";
}

const STRICTNESS_CONFIG: Record<StrictnessLevel, { label: string; color: string; dot: string }> = {
  strict: { label: "Strict", color: "text-live", dot: "bg-live" },
  average: { label: "Average", color: "text-gold", dot: "bg-gold" },
  lenient: { label: "Lenient", color: "text-pitch", dot: "bg-pitch" },
};

function aggregateRefereeStats(matches: Match[]): RefereeStats[] {
  const statsMap = new Map<
    string,
    {
      referee: Referee;
      matchCount: number;
      yellows: number;
      reds: number;
    }
  >();

  for (const match of matches) {
    const mainRefs = match.referees.filter(
      (r) => r.role.toUpperCase() === "REFEREE",
    );

    const matchYellows = match.events.filter((e) => e.type === "YELLOW").length;
    const matchReds = match.events.filter((e) => e.type === "RED").length;

    for (const ref of mainRefs) {
      const key = ref.name;
      const existing = statsMap.get(key);
      if (existing) {
        existing.matchCount += 1;
        existing.yellows += matchYellows;
        existing.reds += matchReds;
      } else {
        statsMap.set(key, {
          referee: ref,
          matchCount: 1,
          yellows: matchYellows,
          reds: matchReds,
        });
      }
    }
  }

  const result: RefereeStats[] = [];
  for (const [, entry] of statsMap) {
    const avgYellowsPerGame =
      entry.matchCount > 0
        ? Math.round((entry.yellows / entry.matchCount) * 10) / 10
        : 0;

    const nationalityCode = resolveTeamCode(null, entry.referee.nationality);

    result.push({
      name: entry.referee.name,
      nationality: entry.referee.nationality,
      nationalityCode,
      matchesOfficiated: entry.matchCount,
      totalYellows: entry.yellows,
      totalReds: entry.reds,
      avgYellowsPerGame,
    });
  }

  result.sort((a, b) => b.matchesOfficiated - a.matchesOfficiated);
  return result;
}

function StrictnessBadge({ avg }: { avg: number }) {
  const level = getStrictness(avg);
  const cfg = STRICTNESS_CONFIG[level];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
      <span
        aria-hidden
        className={`inline-block h-2 w-2 rounded-full ${cfg.dot}`}
      />
      {cfg.label}
    </span>
  );
}

function RefereeRow({ ref: stats, rank }: { ref: RefereeStats; rank: number }) {
  return (
    <tr className="border-t border-edge/50 transition-colors hover:bg-panel2/60">
      <td className="py-2.5 pr-3 pl-4 text-xs text-dim font-mono">{rank}</td>
      <td className="py-2.5 pr-3">
        <div className="flex items-center gap-2.5">
          {stats.nationalityCode ? (
            <Flag
              code={stats.nationalityCode}
              name={stats.nationality ?? undefined}
              width={20}
            />
          ) : null}
          <span className="font-sans text-sm font-medium text-ink leading-tight">
            {stats.name}
          </span>
        </div>
      </td>
      <td className="py-2.5 pr-3 text-xs text-dim">
        {stats.nationality ?? (
          <span className="text-dim/50 italic">Unknown</span>
        )}
      </td>
      <td className="py-2.5 pr-3 text-center">
        <span className="font-mono text-sm tabular-nums text-ink">
          {stats.matchesOfficiated}
        </span>
      </td>
      <td className="py-2.5 pr-3 text-center">
        <span className="font-mono text-sm tabular-nums text-gold">
          {stats.totalYellows}
        </span>
      </td>
      <td className="py-2.5 pr-3 text-center">
        <span className="font-mono text-sm tabular-nums text-live">
          {stats.totalReds}
        </span>
      </td>
      <td className="py-2.5 pr-3 text-center">
        <span className="font-mono text-sm tabular-nums text-ink/70">
          {stats.avgYellowsPerGame.toFixed(1)}
        </span>
      </td>
      <td className="py-2.5 pr-4 text-right">
        <StrictnessBadge avg={stats.avgYellowsPerGame} />
      </td>
    </tr>
  );
}

export function RefereeTracker({ matches }: RefereeTrackerProps) {
  const referees = aggregateRefereeStats(matches);

  const totalAssigned = referees.length;
  const totalMatches = matches.filter(
    (m) => m.referees.some((r) => r.role.toUpperCase() === "REFEREE"),
  ).length;

  return (
    <section className="rounded-xl border border-edge bg-panel p-4">
      <SectionHeader
        title="Referee Tracker"
        right={
          totalAssigned > 0
            ? `${totalAssigned} officials · ${totalMatches} matches`
            : undefined
        }
      />

      {referees.length === 0 ? (
        <p className="py-8 text-center text-sm text-dim">
          No referee assignments recorded yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-edge">
                <th className="pb-2 pr-3 pl-4 text-[10px] font-semibold uppercase tracking-widest text-dim">
                  #
                </th>
                <th className="pb-2 pr-3 text-[10px] font-semibold uppercase tracking-widest text-dim">
                  Referee
                </th>
                <th className="pb-2 pr-3 text-[10px] font-semibold uppercase tracking-widest text-dim">
                  Nationality
                </th>
                <th className="pb-2 pr-3 text-center text-[10px] font-semibold uppercase tracking-widest text-dim">
                  Matches
                </th>
                <th className="pb-2 pr-3 text-center text-[10px] font-semibold uppercase tracking-widest text-gold">
                  Yellows
                </th>
                <th className="pb-2 pr-3 text-center text-[10px] font-semibold uppercase tracking-widest text-live">
                  Reds
                </th>
                <th className="pb-2 pr-3 text-center text-[10px] font-semibold uppercase tracking-widest text-dim">
                  Y/Game
                </th>
                <th className="pb-2 pr-4 text-right text-[10px] font-semibold uppercase tracking-widest text-dim">
                  Strictness
                </th>
              </tr>
            </thead>
            <tbody>
              {referees.map((ref, i) => (
                <RefereeRow key={ref.name} ref={ref} rank={i + 1} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 flex items-center gap-4 border-t border-edge/40 pt-3">
        {(["lenient", "average", "strict"] as StrictnessLevel[]).map((level) => {
          const cfg = STRICTNESS_CONFIG[level];
          return (
            <span
              key={level}
              className="inline-flex items-center gap-1.5 text-[10px] text-dim"
            >
              <span
                aria-hidden
                className={`inline-block h-2 w-2 rounded-full ${cfg.dot}`}
              />
              {cfg.label}
              {level === "lenient" && " (<1.5 Y/game)"}
              {level === "average" && " (1.5–3 Y/game)"}
              {level === "strict" && " (≥3 Y/game)"}
            </span>
          );
        })}
      </div>
    </section>
  );
}
