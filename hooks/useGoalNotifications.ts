"use client";

import { useEffect, useRef } from "react";
import type { Match } from "@/lib/types";

function goalKey(matchId: string, minute: string, player: string) {
  return `${matchId}:${minute}:${player}`;
}

/**
 * Watches live matches and fires a browser Notification whenever a new goal
 * appears. On first call the existing goals are seeded into the seen set so
 * we never replay goals that happened before the page loaded.
 */
export function useGoalNotifications(matches: Match[]) {
  const seen = useRef<Set<string>>(new Set());
  const seeded = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    if (!seeded.current) {
      for (const m of matches) {
        for (const ev of m.events) {
          if (ev.type === "GOAL") seen.current.add(goalKey(m.id, ev.minute, ev.player));
        }
      }
      seeded.current = true;
      return;
    }

    for (const m of matches) {
      if (m.status !== "IN_PLAY" && m.status !== "PAUSED") continue;
      const home = m.homeTeam?.name ?? "Home";
      const away = m.awayTeam?.name ?? "Away";
      const hs = m.score.home ?? 0;
      const as_ = m.score.away ?? 0;

      for (const ev of m.events) {
        if (ev.type !== "GOAL") continue;
        const key = goalKey(m.id, ev.minute, ev.player);
        if (seen.current.has(key)) continue;
        seen.current.add(key);

        const extra = ev.note === "pen" ? " (pen)" : ev.note === "og" ? " (og)" : "";
        const scorer = ev.player;
        const scoringTeam = ev.side === "HOME" ? home : away;

        new Notification(`⚽  ${scoringTeam} score! ${scorer}${extra}`, {
          body: `${ev.minute}' — ${home} ${hs}–${as_} ${away}`,
          icon: "/icon.svg",
          tag: key,           // browser deduplicates across tabs
          silent: false,
        });
      }
    }
  }, [matches]);
}
