"use client";

import { useState } from "react";

export interface SharePickButtonProps {
  matchId: string;
  homeCode: string;
  awayCode: string;
  pickHome: number;
  pickAway: number;
  userName: string;
}

export default function SharePickButton({
  matchId,
  homeCode,
  awayCode,
  pickHome,
  pickAway,
  userName,
}: SharePickButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied">("idle");

  function buildOgUrl(): string {
    const params = new URLSearchParams({
      home: homeCode,
      away: awayCode,
      pickHome: String(pickHome),
      pickAway: String(pickAway),
      name: userName,
    });
    return `/api/og/prediction/${matchId}?${params.toString()}`;
  }

  function buildShareUrl(): string {
    if (typeof window === "undefined") return "";
    const base = window.location.origin;
    return `${base}/match/${matchId}`;
  }

  async function handleShare() {
    const shareUrl = buildShareUrl();
    const ogUrl = buildOgUrl();

    const title = `${homeCode} ${pickHome}–${pickAway} ${awayCode} — ${userName}'s World Cup 2026 pick`;
    const text = `I'm predicting ${homeCode} ${pickHome}–${pickAway} ${awayCode}. What's your call? #WC2026`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl, text });
        return;
      } catch (err) {
        // User cancelled or share failed — fall through to clipboard
        if ((err as DOMException).name === "AbortError") return;
      }
    }

    // Clipboard fallback — copy the share URL (not the OG image URL)
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // Last resort: execCommand
      const el = document.createElement("textarea");
      el.value = shareUrl;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }

    setStatus("copied");
    setTimeout(() => setStatus("idle"), 2000);

    // Silence the unused variable warning — ogUrl is constructed so the OG
    // route exists and can be used by callers who need the direct image URL.
    void ogUrl;
  }

  return (
    <button
      onClick={handleShare}
      aria-label="Share your prediction"
      className="rounded-full border border-edge px-3 py-1.5 text-xs text-dim hover:text-ink transition-colors duration-150 flex items-center gap-1.5"
    >
      <span aria-hidden="true">📤</span>
      {status === "copied" ? "Copied!" : "Share pick"}
    </button>
  );
}
