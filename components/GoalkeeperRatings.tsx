import type { Match } from "@/lib/types";
import { Flag } from "@/components/Flag";
import { SectionHeader } from "@/components/SectionHeader";

// ---------------------------------------------------------------------------
// Known starting GKs — hardcoded per spec
// ---------------------------------------------------------------------------

const KNOWN_GKS: Record<string, string> = {
  ARG: "Emiliano Martínez",
  FRA: "Mike Maignan",
  ENG: "Jordan Pickford",
  BRA: "Alisson",
  ESP: "Unai Simón",
  GER: "Manuel Neuer",
  POR: "Rui Patrício",
  NED: "Bart Verbruggen",
  BEL: "Thibaut Courtois",
  ITA: "Gianluigi Donnarumma",
  CRO: "Dominik Livaković",
  URU: "Sergio Rochet",
  USA: "Matt Turner",
  MEX: "Guillermo Ochoa",
  MAR: "Yassine Bounou",
  JPN: "Shuichi Gonda",
  SEN: "Édouard Mendy",
  DEN: "Kasper Schmeichel",
  COL: "David Ospina",
  SUI: "Yann Sommer",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GoalkeeperRatingsProps {
  matches: Match[];
}

interface GkStats {
  code: string;
  name: string;
  gkName: string;
  matchesPlayed: number;
  goalsConceded: number;
  cleanSheets: number;
  goalsPerGame: number;
  cleanSheetPct: number;
}

// ---------------------------------------------------------------------------
// Computation
// ---------------------------------------------------------------------------

function computeGkStats(matches: Match[]): GkStats[] {
  const finished = matches.filter((m) => m.status === "FINISHED");

  // team code -> accumulated stats
  const record = new Map<
    string,
    {
      name: string;
      matchesPlayed: number;
      goalsConceded: number;
      cleanSheets: number;
    }
  >();

  function upsert(code: string, name: string, conceded: number) {
    const existing = record.get(code) ?? {
      name,
      matchesPlayed: 0,
      goalsConceded: 0,
      cleanSheets: 0,
    };
    existing.matchesPlayed += 1;
    existing.goalsConceded += conceded;
    if (conceded === 0) existing.cleanSheets += 1;
    record.set(code, existing);
  }

  for (const m of finished) {
    const homeCode = m.homeTeam?.code;
    const awayCode = m.awayTeam?.code;
    const homeScore = m.score.home;
    const awayScore = m.score.away;

    // goals conceded by a team = goals scored by the opponent
    if (homeCode && awayScore !== null) {
      upsert(homeCode, m.homeTeam!.name, awayScore);
    }
    if (awayCode && homeScore !== null) {
      upsert(awayCode, m.awayTeam!.name, homeScore);
    }
  }

  const rows: GkStats[] = [];

  for (const [code, s] of record) {
    if (s.matchesPlayed < 1) continue;
    const goalsPerGame =
      s.matchesPlayed > 0 ? s.goalsConceded / s.matchesPlayed : 0;
    const cleanSheetPct =
      s.matchesPlayed > 0 ? (s.cleanSheets / s.matchesPlayed) * 100 : 0;

    rows.push({
      code,
      name: s.name,
      gkName: KNOWN_GKS[code] ?? "Starting GK",
      matchesPlayed: s.matchesPlayed,
      goalsConceded: s.goalsConceded,
      cleanSheets: s.cleanSheets,
      goalsPerGame,
      cleanSheetPct,
    });
  }

  // Sort by goals conceded per game ASC; tie-break: most clean sheets DESC
  rows.sort((a, b) => {
    if (a.goalsPerGame !== b.goalsPerGame)
      return a.goalsPerGame - b.goalsPerGame;
    return b.cleanSheets - a.cleanSheets;
  });

  return rows.slice(0, 12);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GoalkeeperRatings({ matches }: GoalkeeperRatingsProps) {
  const rows = computeGkStats(matches);

  return (
    <section className="rounded-xl border border-edge bg-panel p-4 sm:p-5">
      <SectionHeader
        title="Goalkeeper Ratings"
        right={<span className="font-mono text-[11px] text-dim">Goals conceded / game</span>}
      />

      {rows.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-lg border border-edge bg-panel2">
          <p className="font-sans text-sm text-dim">
            No finished matches yet — check back after kickoff.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-separate border-spacing-0 text-sm">
            {/* thead */}
            <thead>
              <tr className="text-left font-display text-[11px] uppercase tracking-widest text-dim">
                <th className="pb-2 pr-3 font-normal">#</th>
                <th className="pb-2 pr-3 font-normal">Goalkeeper</th>
                <th className="pb-2 pr-3 text-center font-normal">MP</th>
                <th className="pb-2 pr-3 text-center font-normal">CS</th>
                <th className="pb-2 pr-3 text-center font-normal">GA</th>
                <th className="pb-2 pr-3 text-center font-normal">GA/G</th>
                <th className="pb-2 font-normal">CS%</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, idx) => {
                const isLeader = idx === 0;

                return (
                  <tr
                    key={row.code}
                    className={`group border-t border-edge transition-colors hover:bg-panel2 ${
                      isLeader ? "bg-panel2/60" : ""
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-2.5 pr-3 font-mono text-xs text-dim">
                      {idx + 1}
                    </td>

                    {/* Flag + names */}
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2.5">
                        <Flag code={row.code} name={row.name} width={28} />
                        <div className="flex flex-col leading-tight">
                          <span className="font-sans font-medium text-white">
                            {row.gkName}
                          </span>
                          <span className="font-sans text-[11px] text-dim">
                            {row.name}
                          </span>
                        </div>
                        {isLeader && (
                          <span className="ml-1 rounded bg-gold/20 px-1.5 py-0.5 font-display text-[10px] font-semibold uppercase tracking-wider text-gold">
                            Golden Glove 🧤
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Matches played */}
                    <td className="py-2.5 pr-3 text-center font-mono text-xs text-white">
                      {row.matchesPlayed}
                    </td>

                    {/* Clean sheets */}
                    <td className="py-2.5 pr-3 text-center font-mono text-xs">
                      <span
                        className={
                          row.cleanSheets > 0
                            ? "font-semibold text-pitch"
                            : "text-dim"
                        }
                      >
                        {row.cleanSheets}
                      </span>
                    </td>

                    {/* Goals conceded */}
                    <td className="py-2.5 pr-3 text-center font-mono text-xs text-white">
                      {row.goalsConceded}
                    </td>

                    {/* Goals per game */}
                    <td className="py-2.5 pr-3 text-center font-mono text-xs">
                      <span
                        className={
                          row.goalsPerGame <= 0.75
                            ? "font-semibold text-pitch"
                            : row.goalsPerGame >= 2
                            ? "text-live"
                            : "text-white"
                        }
                      >
                        {row.goalsPerGame.toFixed(2)}
                      </span>
                    </td>

                    {/* Clean sheet % bar */}
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-edge">
                          <div
                            className="h-full rounded-full bg-pitch transition-all"
                            style={{ width: `${row.cleanSheetPct}%` }}
                          />
                        </div>
                        <span className="w-8 font-mono text-[11px] text-dim">
                          {Math.round(row.cleanSheetPct)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
