"use client";

// Live match clock (PRD §7.2). Ticks every second while in play; clearly an
// estimate when the provider does not report an official minute.

import { useEffect, useState } from "react";
import { liveClock, statusKind } from "@/lib/format";
import type { Match } from "@/lib/types";

export function MatchClock({
  match,
  accurate,
  className = "",
}: {
  match: Match;
  /** Exact broadcast minute (e.g. "41", "90+6") from ESPN — shown verbatim, no "est". */
  accurate?: string | null;
  className?: string;
}) {
  const [now, setNow] = useState<number | null>(null);

  const live = statusKind(match.status) === "live";

  useEffect(() => {
    if (!live) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [live]);

  if (!live) return null;

  // Prefer the exact broadcast minute when available (accurate, no estimate tag).
  if (accurate) {
    const display = /^\d/.test(accurate) ? `${accurate}’` : accurate;
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
