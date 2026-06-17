"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { EmptyState } from "@/components/EmptyState";
import { Flag } from "@/components/Flag";
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
  goldenBall: string | null;
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

function ScoreStepper({
  value,
  disabled,
  onChange,
  label,
}: {
  value: number;
  disabled: boolean;
  onChange: (n: number) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        disabled={disabled || value >= 20}
        onClick={() => onChange(value + 1)}
        aria-label={`Increase ${label}`}
        className="score-stepper flex h-7 w-7 items-center justify-center rounded-full border border-edge bg-panel2 text-sm font-bold text-dim disabled:opacity-40"
      >
        +
      </button>
      <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-edge bg-navy font-mono text-xl font-bold">
        {value}
      </span>
      <button
        type="button"
        disabled={disabled || value <= 0}
        onClick={() => onChange(value - 1)}
        aria-label={`Decrease ${label}`}
        className="score-stepper flex h-7 w-7 items-center justify-center rounded-full border border-edge bg-panel2 text-sm font-bold text-dim disabled:opacity-40"
      >
        −
      </button>
    </div>
  );
}

export function MatchPredictionWidget({ match }: { match: Match }) {
  const { data, mutate } = useSWR<PredictionsPayload>("/api/predictions", jsonFetcher);
  const [draft, setDraft] = useState<MatchPick>({ outcome: "HOME", home: 1, away: 0 });
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const locked = isLocked(match);
  const saved = data?.picks?.[match.id];

  useEffect(() => {
    if (saved) setDraft(saved);
  }, [saved]);

  function setScore(side: "home" | "away", value: number) {
    const next = { ...draft, [side]: value };
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
    setSaveState("saving");
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ picks: { [match.id]: draft } }),
      });
      if (!res.ok) {
        setSaveState("error");
        return;
      }
      await mutate();
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1800);
    } catch {
      setSaveState("error");
    }
  }

  if (data?.enabled === false) return null;

  if (!data) return <div className="skeleton h-52 rounded-xl" aria-hidden />;

  if (!data.user) {
    return (
      <EmptyState
        title="Join the office pool to predict this match."
        description="Create an account once, then make score picks and climb the coworker leaderboard."
        action={<Link href="/predict">Open prediction pool</Link>}
      />
    );
  }

  const homeName = match.homeTeam?.name ?? match.homeLabel ?? "Home";
  const awayName = match.awayTeam?.name ?? match.awayLabel ?? "Away";

  return (
    <div className={`grid gap-3 ${saveState === "saved" ? "animate-pick-flash" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-dim">Your call</p>
          <p className="mt-0.5 text-sm text-dim">
            {locked ? "Pick is locked." : "Edit until kickoff."}{" "}
            <span className="text-ink">{data.user.name}</span>
          </p>
        </div>
        <Link
          href="/predict"
          className="rounded-full border border-edge px-3 py-1.5 text-xs text-dim transition hover:border-pitch/40 hover:text-ink"
        >
          Leaderboard →
        </Link>
      </div>

      {/* Team names + score steppers */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="min-w-0 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <span className="truncate text-xs font-semibold leading-tight text-dim">{homeName}</span>
            <Flag code={match.homeTeam?.code} name={homeName} width={22} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ScoreStepper
            value={draft.home}
            disabled={locked}
            onChange={(n) => setScore("home", n)}
            label={`${homeName} goals`}
          />
          <span className="text-lg font-bold text-dim">–</span>
          <ScoreStepper
            value={draft.away}
            disabled={locked}
            onChange={(n) => setScore("away", n)}
            label={`${awayName} goals`}
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Flag code={match.awayTeam?.code} name={awayName} width={22} />
            <span className="truncate text-xs font-semibold leading-tight text-dim">{awayName}</span>
          </div>
        </div>
      </div>

      {/* Outcome selector */}
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-navy p-1 text-[11px]">
        {(["HOME", "DRAW", "AWAY"] as Outcome[]).map((outcome) => (
          <button
            key={outcome}
            type="button"
            disabled={locked}
            onClick={() => setOutcome(outcome)}
            className={`rounded-md px-2 py-1.5 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              draft.outcome === outcome
                ? "bg-pitch text-navy shadow-sm shadow-pitch/30"
                : "text-dim hover:bg-panel2 hover:text-ink"
            }`}
          >
            {outcomeLabel(outcome, match)}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={save}
        disabled={locked || saveState === "saving"}
        className="rounded-full bg-pitch px-4 py-2.5 font-display text-sm font-semibold uppercase tracking-wider text-navy shadow-sm shadow-pitch/20 transition hover:brightness-110 disabled:opacity-60"
      >
        {saveState === "saving" ? "Saving..." : saveState === "saved" ? "✓ Saved" : locked ? "Locked" : "Save pick"}
      </button>

      {saveState === "error" ? (
        <p className="text-xs text-live">Could not save this pick. Please try again.</p>
      ) : null}
    </div>
  );
}
