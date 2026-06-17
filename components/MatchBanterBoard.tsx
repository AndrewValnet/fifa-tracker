"use client";

import { useState, useRef, useCallback } from "react";
import useSWR from "swr";
import { jsonFetcher } from "@/hooks/fetcher";
import { useDisplayName } from "@/hooks/useDisplayName";
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
    <div className="flex animate-pulse flex-col gap-1 border-b border-edge py-3">
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
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const { name, source, setLocalName } = useDisplayName();

  const { data, mutate } = useSWR<{ comments: BanterComment[] }>(
    `/api/banter/${matchId}`,
    jsonFetcher,
    { refreshInterval: 15000 },
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name) return;
      setSubmitError(null);
      setSubmitting(true);
      try {
        const res = await fetch(`/api/banter/${matchId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, msg: msg.trim() }),
        });
        if (!res.ok) {
          const body = (await res.json()) as { error?: string };
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
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

  function saveNameEdit() {
    if (nameInput.trim()) {
      setLocalName(nameInput.trim());
    }
    setEditingName(false);
    setNameInput("");
  }

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
        <span className="text-xs text-dim" aria-hidden>
          {open ? "Hide chat ↑" : "Show chat ↓"}
        </span>
      </button>

      {open && (
        <div className="border-t border-edge px-4 pb-4 pt-3">

          {/* Account identity bar */}
          <div className="mb-3 flex items-center justify-between rounded-lg border border-edge bg-panel2 px-3 py-2">
            {name && !editingName ? (
              <>
                <p className="text-xs text-dim">
                  Chatting as{" "}
                  <span className="font-semibold text-ink">{name}</span>
                  {source === "pool" && (
                    <span className="ml-1.5 rounded-full bg-pitch/10 px-1.5 py-0.5 text-[10px] font-medium text-pitch">
                      pool account
                    </span>
                  )}
                </p>
                {source !== "pool" && (
                  <button
                    type="button"
                    onClick={() => { setEditingName(true); setNameInput(name); }}
                    className="text-[11px] text-dim underline hover:text-ink"
                  >
                    Change
                  </button>
                )}
              </>
            ) : editingName ? (
              <div className="flex w-full items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveNameEdit(); if (e.key === "Escape") setEditingName(false); }}
                  maxLength={30}
                  placeholder="Your display name"
                  className="flex-1 rounded border border-pitch bg-navy px-2 py-1 text-sm text-ink focus:outline-none"
                />
                <button
                  type="button"
                  onClick={saveNameEdit}
                  disabled={!nameInput.trim()}
                  className="rounded-full bg-pitch px-3 py-1 text-[11px] font-semibold text-navy disabled:opacity-40"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingName(false)}
                  className="text-[11px] text-dim hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            ) : (
              // No name set yet — inline prompt
              <div className="flex w-full items-center gap-2">
                <p className="shrink-0 text-xs text-dim">Set a display name to chat:</p>
                <input
                  autoFocus
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveNameEdit(); }}
                  maxLength={30}
                  placeholder="Your name"
                  className="flex-1 rounded border border-edge bg-navy px-2 py-1 text-sm text-ink placeholder:text-dim focus:border-pitch focus:outline-none"
                />
                <button
                  type="button"
                  onClick={saveNameEdit}
                  disabled={!nameInput.trim()}
                  className="rounded-full bg-pitch px-3 py-1 text-[11px] font-semibold text-navy disabled:opacity-40"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          {/* Comments list */}
          <div className="mb-4 max-h-72 overflow-y-auto">
            {displayComments === null ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : displayComments.length === 0 ? (
              <p className="py-6 text-center text-sm text-dim">No comments yet. Be first!</p>
            ) : (
              displayComments.map((c, i) => (
                <div key={`${c.ts}-${i}`} className="border-b border-edge py-3 last:border-b-0">
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{c.name}</span>
                    <span className="font-mono text-xs text-dim">{timeAgo(c.ts)}</span>
                  </div>
                  <p className="text-sm text-dim">{c.msg}</p>
                </div>
              ))
            )}
          </div>

          {/* Message form — name pre-filled, no name input shown */}
          {name && (
            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-2">
              <div className="flex gap-2">
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
                  disabled={submitting || !msg.trim()}
                  className="flex-shrink-0 rounded-full bg-pitch px-4 py-1.5 text-sm font-semibold text-navy transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {submitting ? "…" : "Send"}
                </button>
              </div>
              {submitError && <p className="text-xs text-live">{submitError}</p>}
            </form>
          )}
        </div>
      )}
    </div>
  );
}
