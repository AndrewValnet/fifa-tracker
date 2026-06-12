"use client";

// Animated goal notification (PRD §8.3): full-width flash banner in the
// scoring team's color whenever a new goal appears in the polled match data.

import { useEffect, useRef, useState } from "react";
import { contrastText, getAccentColor } from "@/lib/team-meta";
import type { Match, MatchEvent } from "@/lib/types";

interface Toast {
  key: string;
  text: string;
  bg: string;
  fg: string;
}

export function GoalBanner({ match }: { match: Match }) {
  const goals = match.events.filter((e) => e.type === "GOAL");
  const seen = useRef<number | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    // First render: just record the current count, don't announce history.
    if (seen.current === null) {
      seen.current = goals.length;
      return;
    }
    if (goals.length > seen.current) {
      const g: MatchEvent = goals[goals.length - 1];
      const side = g.side === "HOME" ? match.homeTeam : match.awayTeam;
      const bg = getAccentColor(side?.code);
      setToast({
        key: `${g.player}-${g.minute}-${goals.length}`,
        text: `GOAL! ${g.player} ${g.minute ? `${g.minute}’` : ""} — ${side?.name ?? ""}`,
        bg,
        fg: contrastText(bg),
      });
      const id = setTimeout(() => setToast(null), 5200);
      seen.current = goals.length;
      return () => clearTimeout(id);
    }
    seen.current = goals.length;
  }, [goals.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!toast) return null;
  return (
    <div
      key={toast.key}
      role="status"
      className="animate-goal-banner fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-3 px-4 py-3 font-display text-lg font-bold tracking-wide shadow-xl"
      style={{ background: toast.bg, color: toast.fg }}
    >
      <span aria-hidden>⚽</span>
      {toast.text}
    </div>
  );
}
