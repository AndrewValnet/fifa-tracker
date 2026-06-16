"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { EmptyState } from "@/components/EmptyState";
import { jsonFetcher } from "@/hooks/fetcher";
import { statusKind } from "@/lib/format";
import type { Match } from "@/lib/types";

type Outcome = "HOME" | "DRAW" | "AWAY";

interface PoolUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface MatchPick {
  outcome: Outcome;
  home: number;
  away: number;
  updatedAt?: string;
}

interface PredictionsPayload {
  enabled: boolean;
  user: PoolUser | null;
  picks: Record<string, MatchPick>;
  champion: string | null;
}

function outcomeFor(home: number, away: number): Outcome {
  if (home > away) return "HOME";
  if (away > home) return "AWAY";
  return "DRAW";
}

function isLocked(match: Match): boolean {
  return statusKind(match.status) !== "upcoming" || new Date(match.utcDate).getTime() <= Date.now();
}

function outcomeLabel(outcome: Outcome, match: Match): string {
  if (outcome === "DRAW") return "Draw";
  return outcome === "HOME" ? `${match.homeTeam?.code ?? "Home"} win` : `${match.awayTeam?.code ?? "Away"} win`;
}

function normalizeScore(value: string): number {
  return Math.max(0, Math.min(30, Number(value.replace(/[^0-9]/g, "")) || 0));
}

export function MatchPredictionWidget({ match }: { match: Match }) {
  const { data, mutate } = useSWR<PredictionsPayload>("/api/predictions", jsonFetcher);
  const [draft, setDraft] = useState<MatchPick>({ outcome: "HOME", home: 1, away: 0 });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const locked = isLocked(match);
  const saved = data?.picks?.[match.id];

  useEffect(() => {
    if (saved) setDraft(saved);
  }, [saved]);

  function setScore(side: "home" | "away", value: string) {
    const next = { ...draft, [side]: normalizeScore(value) };
    setDraft({ ...next, outcome: outcomeFor(next.home, next.away), updatedAt: new Date().toISOString() });
  }

  function setOutcome(outcome: Outcome) {
    let home = draft.home;
    let away = draft.away;
    if (outcome === "HOME" && home <= away) home = away + 1;
    if (outcome === "AWAY" && away <= home) away = home + 1;
    if (outcome === "DRAW") away = home;
    setDraft({ outcome, home, away, updatedAt: new Date().toISOString() });
  }

  async function save() {
    setStatus("saving");
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ picks: { [match.id]: draft } }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      await mutate();
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1500);
    } catch {
      setStatus("error");
    }
  }

  if (data?.enabled === false) {
    return null;
  }

  if (!data) {
    return <div className="skeleton h-44 rounded-xl" aria-hidden />;
  }

  if (!data.user) {
    return (
      <EmptyState
        title="Join the office pool to predict this match."
        description="Create an account once, then make score picks and climb the coworker leaderboard."
        action={<Link href="/predict">Open prediction pool</Link>}
      />
    );
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-dim">Your call</p>
          <p className="mt-1 text-sm text-dim">
            {locked ? "This pick is locked." : "Edit until kickoff."} Signed in as {data.user.name}.
          </p>
        </div>
        <Link href="/predict" className="rounded-full border border-edge px-3 py-1.5 text-xs text-dim hover:text-ink">
          Leaderboard
        </Link>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <p className="truncate text-right text-sm font-semibold">{match.homeTeam?.name ?? match.homeLabel ?? "Home"}</p>
        <div className="flex items-center gap-1">
          <input
            inputMode="numeric"
            value={draft.home}
            disabled={locked}
            onChange={(e) => setScore("home", e.target.value)}
            className="h-10 w-12 rounded-lg border border-edge bg-panel2 text-center font-mono text-lg outline-none focus:border-pitch disabled:opacity-60"
            aria-label="Home predicted goals"
          />
          <span className="text-dim">-</span>
          <input
            inputMode="numeric"
            value={draft.away}
            disabled={locked}
            onChange={(e) => setScore("away", e.target.value)}
            className="h-10 w-12 rounded-lg border border-edge bg-panel2 text-center font-mono text-lg outline-none focus:border-pitch disabled:opacity-60"
            aria-label="Away predicted goals"
          />
        </div>
        <p className="truncate text-sm font-semibold">{match.awayTeam?.name ?? match.awayLabel ?? "Away"}</p>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-lg bg-navy p-1 text-[11px]">
        {(["HOME", "DRAW", "AWAY"] as Outcome[]).map((outcome) => (
          <button
            key={outcome}
            type="button"
            disabled={locked}
            onClick={() => setOutcome(outcome)}
            className={`rounded-md px-2 py-1.5 transition disabled:cursor-not-allowed disabled:opacity-60 ${
              draft.outcome === outcome ? "bg-pitch font-semibold text-navy" : "text-dim hover:text-ink"
            }`}
          >
            {outcomeLabel(outcome, match)}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={save}
        disabled={locked || status === "saving"}
        className="rounded-full bg-pitch px-4 py-2 font-display text-sm font-semibold uppercase tracking-wider text-navy disabled:opacity-60"
      >
        {status === "saving" ? "Saving..." : status === "saved" ? "Saved" : locked ? "Locked" : "Save match pick"}
      </button>
      {status === "error" ? <p className="text-xs text-live">Could not save this pick. Please try again.</p> : null}
    </div>
  );
}
