"use client";

import { useEffect, useMemo, useState } from "react";
import { useFollowedTeams } from "@/hooks/useFollowedTeams";
import type { MatchAlertKind, MatchAlertSettings } from "@/lib/push";

type State = "loading" | "unsupported" | "disabled" | "off" | "on" | "denied" | "saving";

const OPTIONS: { key: MatchAlertKind; label: string; description: string }[] = [
  { key: "kickoff", label: "Kickoff", description: "About 15 minutes before start" },
  { key: "goal", label: "Goals", description: "When either team scores" },
  { key: "halftime", label: "Halftime", description: "When the match reaches HT" },
  { key: "fulltime", label: "Full time", description: "Final score alert" },
  { key: "lineup", label: "Lineups", description: "When starting XIs publish" },
];

const DEFAULT_SETTINGS: MatchAlertSettings = {
  kickoff: true,
  goal: true,
  halftime: false,
  fulltime: true,
  lineup: true,
};

function storageKey(matchId: string) {
  return `wc26-match-alerts:${matchId}`;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function MatchNotificationSettings({
  matchId,
  homeCode,
  awayCode,
}: {
  matchId: string;
  homeCode: string | null | undefined;
  awayCode: string | null | undefined;
}) {
  const { followed } = useFollowedTeams();
  const [settings, setSettings] = useState<MatchAlertSettings>(DEFAULT_SETTINGS);
  const [state, setState] = useState<State>("loading");
  const [vapid, setVapid] = useState<string | null>(null);
  const teams = useMemo(() => [homeCode, awayCode].filter(Boolean) as string[], [homeCode, awayCode]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(matchId));
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as MatchAlertSettings) });
    } catch {
      /* ignore */
    }
  }, [matchId]);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const cap = await fetch("/api/push/subscribe").then((r) => r.json());
        if (cancelled) return;
        if (!cap.enabled || !cap.vapidPublicKey) {
          setState("disabled");
          return;
        }
        setVapid(cap.vapidPublicKey);
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (cancelled) return;
        setState(sub ? "on" : Notification.permission === "denied" ? "denied" : "off");
      } catch {
        if (!cancelled) setState("disabled");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function update(key: MatchAlertKind, checked: boolean) {
    const next = { ...settings, [key]: checked };
    setSettings(next);
    try {
      localStorage.setItem(storageKey(matchId), JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  async function save() {
    if (!vapid) return;
    try {
      setState("saving");
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState("denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapid) as unknown as BufferSource,
        }));
      const mergedTeams = Array.from(new Set([...followed, ...teams]));
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          teams: mergedTeams,
          matchId,
          matchAlerts: settings,
        }),
      });
      setState("on");
    } catch {
      setState("off");
    }
  }

  if (state === "unsupported") return null;

  const disabled = state === "disabled" || state === "denied" || state === "saving";
  const enabledCount = OPTIONS.filter((opt) => settings[opt.key]).length;

  return (
    <section className="mx-auto mt-5 max-w-3xl rounded-xl border border-edge bg-panel/80 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest">Match Alerts</h2>
          <p className="text-xs text-dim">
            {state === "disabled"
              ? "Push alerts need VAPID + Upstash configured."
              : state === "denied"
                ? "Notifications are blocked in your browser settings."
                : `${enabledCount} alert${enabledCount === 1 ? "" : "s"} selected for this match.`}
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={disabled}
          className="rounded-full border border-pitch/60 bg-pitch/10 px-3 py-1.5 text-xs font-semibold text-pitch transition disabled:cursor-not-allowed disabled:border-edge disabled:bg-panel2 disabled:text-dim"
        >
          {state === "saving" ? "Saving..." : state === "on" ? "Save Alerts" : "Enable Alerts"}
        </button>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {OPTIONS.map((opt) => (
          <label
            key={opt.key}
            className="flex min-h-[64px] cursor-pointer items-start gap-2 rounded-lg border border-edge bg-panel2/50 px-3 py-2 text-sm"
          >
            <input
              type="checkbox"
              checked={settings[opt.key] ?? false}
              onChange={(e) => update(opt.key, e.target.checked)}
              className="mt-1 h-4 w-4 accent-pitch"
            />
            <span>
              <span className="block font-semibold text-ink">{opt.label}</span>
              <span className="block text-[11px] leading-snug text-dim">{opt.description}</span>
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}
