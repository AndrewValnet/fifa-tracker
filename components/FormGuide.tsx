// FormGuide — last-5-results W/D/L badge row for a given team.
// Can be used as a server or client component (no hooks, pure rendering).

import type { Match } from "@/lib/types";
import { statusKind } from "@/lib/format";

interface Props {
  code: string;
  matches: Match[];
}

type Result = "W" | "D" | "L";

interface FormEntry {
  result: Result;
  opponentCode: string | null;
  opponentName: string | null;
  homeScore: number | null;
  awayScore: number | null;
}

function getResult(code: string, match: Match): FormEntry | null {
  if (statusKind(match.status) !== "finished") return null;

  const isHome = match.homeTeam?.code === code;
  const isAway = match.awayTeam?.code === code;
  if (!isHome && !isAway) return null;

  const homeScore = match.score.home;
  const awayScore = match.score.away;
  if (homeScore === null || awayScore === null) return null;

  const opponent = isHome ? match.awayTeam : match.homeTeam;
  let result: Result;

  if (homeScore === awayScore) {
    result = "D";
  } else if ((isHome && homeScore > awayScore) || (isAway && awayScore > homeScore)) {
    result = "W";
  } else {
    result = "L";
  }

  return {
    result,
    opponentCode: opponent?.code ?? null,
    opponentName: opponent?.name ?? null,
    homeScore,
    awayScore,
  };
}

const BADGE_STYLES: Record<Result, string> = {
  W: "bg-pitch text-navy",
  D: "bg-gold text-navy",
  L: "bg-live text-white",
};

export function FormGuide({ code, matches }: Props) {
  const form: FormEntry[] = matches
    .filter((m) => statusKind(m.status) === "finished")
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
    .reduce<FormEntry[]>((acc, m) => {
      if (acc.length >= 5) return acc;
      const entry = getResult(code, m);
      if (entry) acc.push(entry);
      return acc;
    }, [])
    .reverse(); // most recent on the right

  if (form.length === 0) return null;

  return (
    <div className="flex items-center gap-1" aria-label="Form guide">
      {form.map((entry, i) => {
        const tooltip = entry.opponentCode
          ? `vs ${entry.opponentCode} ${entry.homeScore}-${entry.awayScore}`
          : `${entry.homeScore}-${entry.awayScore}`;

        return (
          <span
            key={i}
            title={tooltip}
            className={`inline-flex items-center justify-center rounded-full font-display font-bold text-[10px] leading-none ${BADGE_STYLES[entry.result]}`}
            style={{ width: 20, height: 20 }}
            aria-label={`${entry.result}: ${tooltip}`}
          >
            {entry.result}
          </span>
        );
      })}
    </div>
  );
}
