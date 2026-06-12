"use client";

// Live match clock (PRD §7.2). Ticks every second while in play; clearly an
// estimate when the provider does not report an official minute.

import { useEffect, useState } from "react";
import { liveClock, statusKind } from "@/lib/format";
import type { Match } from "@/lib/types";

export function MatchClock({ match, className = "" }: { match: Match; className?: string }) {
  const [now, setNow] = useState<number | null>(null);

  const live = statusKind(match.status) === "live";

  useEffect(() => {
    if (!live) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [live]);

  if (!live) return null;
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
