"use client";

import { useState, useRef, useCallback } from "react";
import useSWR from "swr";
import { jsonFetcher } from "@/hooks/fetcher";
import { SectionHeader } from "@/components/SectionHeader";
import type { BanterComment } from "@/app/api/banter/[matchId]/route";

export interface MatchBanterBoardProps {
  matchId: string;
}

function timeAgo(ts: number): string {
  const diffMs = Date.now() - ts;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 30) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function SkeletonRow() {
  return (
    <div className="flex flex-col gap-1 border-b border-edge py-3 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-3 w-20 rounded bg-panel2" />
        <div className="h-3 w-12 rounded bg-panel2" />
      </div>
      <div className="h-3 w-3/4 rounded bg-panel2" />
    </div>
  );
}

export function MatchBanterBoard({ matchId }: MatchBanterBoardProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const { data, mutate } = useSWR<{ comments: BanterComment[] }>(
    `/api/banter/${matchId}`,
    jsonFetcher,
    { refreshInterval: 15000 },
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError(null);
      setSubmitting(true);
      try {
        const res = await fetch(`/api/banter/${matchId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), msg: msg.trim() }),
        });
        if (!res.ok) {
          const body = (await res.json()) as { error?: string };
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        setName("");
        setMsg("");
        await mutate();
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "Failed to send comment");
      } finally {
        setSubmitting(false);
      }
    },
    [matchId, name, msg, mutate],
  );

  // Newest first, max 20 shown
  const displayComments = data
    ? [...data.comments].sort((a, b) => b.ts - a.ts).slice(0, 20)
    : null;

  return (
    <div className="rounded-xl border border-edge bg-panel">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="font-display text-base font-semibold uppercase tracking-wider text-white">
          💬 Match Chat
        </span>
        <span className="text-xs text-dim transition-transform duration-200" aria-hidden>
          {open ? "Hide chat ↑" : "Show chat ↓"}
        </span>
      </button>

      {open && (
        <div className="border-t border-edge px-4 pb-4 pt-3">
          <SectionHeader title="💬 Match Chat" className="sr-only" />

          {/* Comments list */}
          <div className="mb-4 max-h-72 overflow-y-auto">
            {displayComments === null ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : displayComments.length === 0 ? (
              <p className="py-6 text-center text-sm text-dim">
                No comments yet. Be first!
              </p>
            ) : (
              displayComments.map((c, i) => (
                <div
                  key={`${c.ts}-${i}`}
                  className="border-b border-edge py-3 last:border-b-0"
                >
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{c.name}</span>
                    <span className="font-mono text-xs text-dim">{timeAgo(c.ts)}</span>
                  </div>
                  <p className="text-sm text-dim">{c.msg}</p>
                </div>
              ))
            )}
          </div>

          {/* Input form */}
          <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
                required
                disabled={submitting}
                className="w-28 flex-shrink-0 rounded-lg border border-edge bg-panel2 px-3 py-1.5 text-sm text-white placeholder:text-dim focus:border-pitch focus:outline-none disabled:opacity-50"
              />
              <input
                type="text"
                placeholder="What a game!"
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                maxLength={200}
                required
                disabled={submitting}
                className="min-w-0 flex-1 rounded-lg border border-edge bg-panel2 px-3 py-1.5 text-sm text-white placeholder:text-dim focus:border-pitch focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={submitting || !name.trim() || !msg.trim()}
                className="flex-shrink-0 rounded-full bg-pitch px-4 py-1.5 text-sm font-semibold text-navy transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {submitting ? "…" : "Send"}
              </button>
            </div>
            {submitError && (
              <p className="text-xs text-live">{submitError}</p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
