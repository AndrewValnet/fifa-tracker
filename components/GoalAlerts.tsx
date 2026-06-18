"use client";

// Goal alert banner + notification hook. Lives in the root layout so
// notifications fire on every page while the tab is open.

import { useState, useEffect } from "react";
import { useGoalNotifications } from "@/hooks/useGoalNotifications";
import { useLiveMatches } from "@/hooks/useFixtures";

function NotificationBanner() {
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("unsupported");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!("Notification" in window)) return;
    setPerm(Notification.permission);
  }, []);

  if (perm !== "default" || dismissed) return null;

  const request = async () => {
    const result = await Notification.requestPermission();
    setPerm(result);
  };

  return (
    <div className="surface-glass fixed bottom-20 left-3 right-3 z-50 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl lg:bottom-6 lg:left-auto lg:right-4">
      <span className="shrink-0 text-lg" aria-hidden>🔔</span>
      <span className="text-sm text-dim">Goal alerts when you&rsquo;re away?</span>
      <button
        onClick={request}
        className="shrink-0 rounded-full bg-pitch px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-wider text-navy transition-opacity hover:opacity-80"
      >
        Enable
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 text-sm text-dim hover:text-ink"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

function AlertsWatcher() {
  const { matches } = useLiveMatches();
  useGoalNotifications(matches);
  return null;
}

export function GoalAlerts() {
  return (
    <>
      <NotificationBanner />
      <AlertsWatcher />
    </>
  );
}
