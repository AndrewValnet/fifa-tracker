"use client";

// Push notification history page.
// Reads from localStorage key `wc26-notifications` written by the service worker.

import { useEffect, useState } from "react";

interface PushNotification {
  title: string;
  body: string;
  timestamp: string | number;
}

function relativeTime(ts: string | number): string {
  const ms = Date.now() - new Date(ts).getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} hour${h !== 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d !== 1 ? "s" : ""} ago`;
}

const STORAGE_KEY = "wc26-notifications";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PushNotification[];
        if (Array.isArray(parsed)) {
          // Sort newest first
          setNotifications(
            [...parsed].sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
            ),
          );
        }
      }
    } catch {
      // Malformed storage — ignore
    }
  }, []);

  function handleClearAll() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setNotifications([]);
  }

  return (
    <main className="mx-auto max-w-shell px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-ink">
          Notifications
        </h1>
        {notifications.length > 0 && (
          <button
            onClick={handleClearAll}
            className="rounded-lg border border-edge px-3 py-1.5 text-xs text-dim hover:border-live/60 hover:text-live transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {!mounted ? null : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-edge bg-panel py-16 text-center">
          <span className="mb-3 text-4xl" aria-hidden>
            🔔
          </span>
          <p className="font-body text-sm text-dim max-w-xs">
            No notifications yet. Enable push alerts on a match page to start receiving goal alerts.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((n, i) => (
            <li
              key={i}
              className="flex flex-col gap-0.5 rounded-xl border border-edge bg-panel px-4 py-3"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="font-body text-sm font-semibold text-ink leading-snug">
                  {n.title}
                </span>
                <span className="font-mono text-[10px] text-dim shrink-0 mt-0.5">
                  {relativeTime(n.timestamp)}
                </span>
              </div>
              {n.body && (
                <p className="font-body text-xs text-dim leading-snug">{n.body}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
