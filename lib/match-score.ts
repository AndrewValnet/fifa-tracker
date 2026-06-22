import type { Match, MatchEvent } from "@/lib/types";

function scoreFromGoals(events: MatchEvent[]): { home: number; away: number; goalsSeen: number } {
  let home = 0;
  let away = 0;
  let goalsSeen = 0;
  for (const event of events) {
    if (event.type !== "GOAL") continue;
    goalsSeen++;
    if (event.side === "HOME") home++;
    else if (event.side === "AWAY") away++;
  }
  return { home, away, goalsSeen };
}

export function reconcileMatchScoreFromEvents(match: Match, events: MatchEvent[]): Match {
  if (!events.length) return match;
  const goals = scoreFromGoals(events);
  if (!goals.goalsSeen) return match;
  const nextHome = goals.home;
  const nextAway = goals.away;

  if (nextHome === match.score.home && nextAway === match.score.away && events === match.events) {
    return match;
  }

  return {
    ...match,
    events,
    score: {
      ...match.score,
      home: nextHome,
      away: nextAway,
    },
  };
}
