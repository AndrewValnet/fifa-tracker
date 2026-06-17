"use client";

import { Flag } from "@/components/Flag";
import type { Match } from "@/lib/types";

const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE:    "Group Stage",
  LAST_32:        "Round of 32",
  LAST_16:        "Round of 16",
  QUARTER_FINALS: "Quarter-finals",
  SEMI_FINALS:    "Semi-finals",
  THIRD_PLACE:    "Third place",
  FINAL:          "Final",
};

interface RoadToGloryProps {
  teamCode: string;
  teamName: string;
  matches: Match[];
}

type Result = "W" | "D" | "L" | "upcoming";

function getResult(match: Match, teamCode: string): Result {
  if (match.status !== "FINISHED") return "upcoming";
  const { score, homeTeam } = match;
  if (!score || score.home === null || score.away === null) return "upcoming";

  const isHome = homeTeam?.code === teamCode;
  const teamScore  = isHome ? score.home  : score.away;
  const oppScore   = isHome ? score.away  : score.home;

  if (teamScore > oppScore)  return "W";
  if (teamScore === oppScore) return "D";
  return "L";
}

function resultBadge(result: Result) {
  if (result === "upcoming")
    return <span className="text-[10px] font-bold text-text-dim bg-white/5 rounded px-1.5 py-0.5">TBD</span>;
  const cls = {
    W: "bg-pitch/20 text-pitch",
    D: "bg-white/10 text-white/60",
    L: "bg-live/20 text-live",
  }[result];
  return (
    <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${cls}`}>
      {result}
    </span>
  );
}

function summarize(matches: Match[], teamCode: string) {
  const finished = matches.filter((m) => m.status === "FINISHED");
  let w = 0, d = 0, l = 0;
  for (const m of finished) {
    const r = getResult(m, teamCode);
    if (r === "W") w++;
    else if (r === "D") d++;
    else if (r === "L") l++;
  }
  // Highest stage reached
  const stageOrder: string[] = [
    "GROUP_STAGE","LAST_32","LAST_16","QUARTER_FINALS","SEMI_FINALS","THIRD_PLACE","FINAL",
  ];
  let highestStage = "GROUP_STAGE";
  for (const m of matches) {
    if (stageOrder.indexOf(m.stage) > stageOrder.indexOf(highestStage)) {
      highestStage = m.stage;
    }
  }
  return { w, d, l, highestStage };
}

export function RoadToGlory({ teamCode, teamName, matches }: RoadToGloryProps) {
  // Filter to this team's matches and sort chronologically
  const teamMatches = matches
    .filter(
      (m) =>
        m.homeTeam?.code === teamCode || m.awayTeam?.code === teamCode
    )
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

  const { w, d, l, highestStage } = summarize(teamMatches, teamCode);

  return (
    <div className="font-body">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Flag code={teamCode} name={teamName} width={32} />
        <div>
          <h2 className="font-display text-lg font-bold text-white leading-tight">
            {teamName}
          </h2>
          <p className="text-xs text-text-dim">
            {STAGE_LABELS[highestStage] ?? highestStage}
          </p>
        </div>

        {/* Record summary */}
        <div className="ml-auto flex gap-3 text-center">
          <div>
            <p className="text-xs text-text-dim">W</p>
            <p className="font-display text-base font-bold text-pitch">{w}</p>
          </div>
          <div>
            <p className="text-xs text-text-dim">D</p>
            <p className="font-display text-base font-bold text-white/60">{d}</p>
          </div>
          <div>
            <p className="text-xs text-text-dim">L</p>
            <p className="font-display text-base font-bold text-live">{l}</p>
          </div>
        </div>
      </div>

      {/* Horizontal scroll of match cards */}
      {teamMatches.length === 0 ? (
        <p className="text-sm text-text-dim italic">No matches found for {teamName}.</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin scrollbar-thumb-edge">
          {teamMatches.map((match) => {
            const isHome = match.homeTeam?.code === teamCode;
            const opponent = isHome ? match.awayTeam : match.homeTeam;
            const oppLabel = isHome ? match.awayLabel : match.homeLabel;
            const result   = getResult(match, teamCode);

            const homeScore = match.score?.home;
            const awayScore = match.score?.away;
            const teamScore = isHome ? homeScore : awayScore;
            const oppScore  = isHome ? awayScore  : homeScore;

            const hasScore =
              match.status === "FINISHED" &&
              teamScore !== null &&
              teamScore !== undefined &&
              oppScore  !== null &&
              oppScore  !== undefined;

            const stageLabel = STAGE_LABELS[match.stage] ?? match.stage;

            // Date display
            const dateStr = new Date(match.utcDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });

            return (
              <div
                key={match.id}
                className="shrink-0 w-36 bg-panel border border-edge rounded-lg p-3 flex flex-col gap-2"
              >
                {/* Stage + date */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-pitch font-bold uppercase tracking-wide truncate">
                    {stageLabel}
                  </span>
                  <span className="text-[10px] text-text-dim">{dateStr}</span>
                </div>

                {/* Opponent */}
                <div className="flex items-center gap-1.5">
                  {opponent?.code ? (
                    <Flag
                      code={opponent.code}
                      name={opponent.name ?? oppLabel ?? "TBD"}
                      width={16}
                    />
                  ) : null}
                  <span className="text-xs text-white/80 truncate">
                    {opponent?.name ?? oppLabel ?? "TBD"}
                  </span>
                </div>

                {/* Score */}
                <div className="text-center">
                  {hasScore ? (
                    <span className="font-display text-base font-bold text-white">
                      {teamScore} – {oppScore}
                    </span>
                  ) : (
                    <span className="text-xs text-text-dim italic">Upcoming</span>
                  )}
                </div>

                {/* Result badge */}
                <div className="flex justify-center">{resultBadge(result)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
