"use client";

// Goal-alert / kickoff-reminder opt-in. Hides itself unless push is configured
// (VAPID + Upstash) and the browser supports the Push API.

import { useEffect, useState } from "react";
import { useFollowedTeams } from "@/hooks/useFollowedTeams";

type State = "loading" | "hidden" | "off" | "on" | "denied";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function PushButton() {
  const { followed } = useFollowedTeams();
  const [state, setState] = useState<State>("loading");
  const [vapid, setVapid] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("hidden");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const cap = await fetch("/api/push/subscribe").then((r) => r.json());
        if (cancelled) return;
        if (!cap.enabled || !cap.vapidPublicKey) {
          setState("hidden");
          return;
        }
        setVapid(cap.vapidPublicKey);
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (cancelled) return;
        setState(sub ? "on" : Notification.permission === "denied" ? "denied" : "off");
      } catch {
        if (!cancelled) setState("hidden");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = async () => {
    if (!vapid) return;
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState("denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid) as unknown as BufferSource,
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), teams: followed }),
      });
      setState("on");
    } catch {
      setState("off");
    }
  };

  const disable = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ unsubscribe: true, endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
    } catch {
      /* ignore */
    }
    setState("off");
  };

  if (state === "loading" || state === "hidden") return null;

  const scope = followed.length ? `${followed.length} team${followed.length === 1 ? "" : "s"}` : "all matches";

  if (state === "denied") {
    return <span className="text-[11px] text-dim">🔕 Notifications blocked in your browser settings</span>;
  }

  return (
    <button
      type="button"
      onClick={state === "on" ? disable : enable}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
        state === "on" ? "border-pitch/60 bg-pitch/10 text-pitch" : "border-edge text-dim hover:text-ink"
      }`}
      title={state === "on" ? "Goal alerts on — tap to turn off" : "Get goal + kickoff alerts"}
    >
      {state === "on" ? `🔔 Alerts on · ${scope}` : "🔔 Goal alerts"}
    </button>
  );
}
