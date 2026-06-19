import type { Match, MatchEvent } from "@/lib/types";

function scoreFromGoals(events: MatchEvent[]): { home: number; away: number } {
  let home = 0;
  let away = 0;
  for (const event of events) {
    if (event.type !== "GOAL") continue;
    if (event.side === "HOME") home++;
    else if (event.side === "AWAY") away++;
  }
  return { home, away };
}

export function reconcileMatchScoreFromEvents(match: Match, events: MatchEvent[]): Match {
  if (!events.length) return match;
  const goals = scoreFromGoals(events);
  const currentHome = match.score.home ?? 0;
  const currentAway = match.score.away ?? 0;
  const nextHome = Math.max(currentHome, goals.home);
  const nextAway = Math.max(currentAway, goals.away);

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
