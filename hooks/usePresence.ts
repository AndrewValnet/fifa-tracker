"use client";

// Heartbeats the current viewer to /api/presence/[id] every 30s while the tab
// is visible, and returns the live concurrent + cumulative counts. A stable
// per-browser session id (localStorage) lets the server count distinct people.

import { useEffect, useState } from "react";

export interface PresenceState {
  enabled: boolean;
  watching: number | null;
  total: number | null;
}

const HEARTBEAT_MS = 30_000;

function getSessionId(): string {
  try {
    const key = "wc26-sid";
    let v = localStorage.getItem(key);
    if (!v) {
      v = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      localStorage.setItem(key, v);
    }
    return v;
  } catch {
    return `${Math.random().toString(36).slice(2)}`;
  }
}

export function usePresence(matchId: string, active = true): PresenceState | null {
  const [state, setState] = useState<PresenceState | null>(null);

  useEffect(() => {
    if (!active || !matchId) return;
    let cancelled = false;
    const sessionId = getSessionId();

    async function beat() {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const res = await fetch(`/api/presence/${encodeURIComponent(matchId)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const json = (await res.json()) as PresenceState;
        if (!cancelled) setState(json);
      } catch {
        /* keep last known state */
      }
    }

    void beat();
    const timer = setInterval(beat, HEARTBEAT_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [matchId, active]);

  return state;
}
