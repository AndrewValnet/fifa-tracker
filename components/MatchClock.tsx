"use client";

// Live match clock (PRD 7.2). Ticks every second while in play; clearly an
// estimate when the provider does not report an official minute.

import { useEffect, useState } from "react";
import { effectiveStatusKind, liveClock } from "@/lib/format";
import type { Match } from "@/lib/types";

function clockMinuteValue(minute: string | null | undefined): number {
  if (!minute) return 0;
  const m = String(minute).match(/^(\d+)(?:\+(\d+))?/);
  if (!m) return 0;
  return Number(m[1]) + (m[2] ? Number(m[2]) : 0);
}

function scoreChangedAfterHalftime(match: Match): boolean {
  const htHome = match.score.halfTimeHome;
  const htAway = match.score.halfTimeAway;
  return (
    htHome !== null &&
    htHome !== undefined &&
    htAway !== null &&
    htAway !== undefined &&
    (match.score.home !== htHome || match.score.away !== htAway)
  );
}

export function MatchClock({
  match,
  accurate,
  className = "",
}: {
  match: Match;
  /** Exact broadcast minute (e.g. "41", "90+6") from ESPN - shown verbatim, no "est". */
  accurate?: string | null;
  className?: string;
}) {
  const [now, setNow] = useState<number | null>(null);

  const live = effectiveStatusKind(match) === "live";

  useEffect(() => {
    if (!live) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [live]);

  if (!live) return null;

  // Prefer the exact broadcast minute when available, unless the event stream
  // already proves ESPN's clock is stale.
  const latestEventMinute = Math.max(0, ...match.events.map((e) => clockMinuteValue(e.minute)));
  const accurateMinute = clockMinuteValue(accurate);
  const accurateIsStale =
    Boolean(accurate) &&
    ((latestEventMinute > 0 && accurateMinute > 0 && accurateMinute + 1 < latestEventMinute) ||
      (scoreChangedAfterHalftime(match) && (!accurateMinute || accurateMinute <= 60)));

  if (accurate && !accurateIsStale) {
    const display = /^\d/.test(accurate) ? `${accurate}'` : accurate;
    return (
      <span className={`font-mono text-pitch ${className}`} title="Live match minute (ESPN)">
        {display}
      </span>
    );
  }

  const text = now === null ? "" : liveClock(match, now);
  const estimated = typeof match.minute !== "number" || match.minute <= 0;

  return (
    <span
      className={`font-mono text-pitch ${className}`}
      title={estimated ? "Estimated from kickoff time (free data tier)" : "Official match minute"}
      suppressHydrationWarning
    >
      {text}
      {estimated && text && text !== "HT" ? <span className="text-dim"> est</span> : null}
    </span>
  );
}
