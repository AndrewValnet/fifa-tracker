"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { EmptyState } from "@/components/EmptyState";
import { Flag } from "@/components/Flag";
import { LocalTime } from "@/components/LocalTime";
import { jsonFetcher } from "@/hooks/fetcher";
import { statusKind } from "@/lib/format";
import { TEAMS } from "@/lib/team-meta";
import { GOLDEN_BALL_CANDIDATES } from "@/data/ballon-dor-candidates";
import type { Match, Sourced } from "@/lib/types";

type Mode = "signin" | "register";
type Outcome = "HOME" | "DRAW" | "AWAY";
type View = "open" | "mine" | "community" | "leaderboard" | "rules";

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

interface ScoreInfo {
  points: number;
  exact: number;
  correct: number;
  picked: number;
  championHit: boolean;
  goldenBallHit: boolean;
  byMatch?: Record<string, { points: number; exact: boolean; correctResult: boolean; correctGoalDiff: boolean }>;
}

type MatchScoreInfo = NonNullable<ScoreInfo["byMatch"]>[string];

interface LeaderRow {
  userId: string;
  name: string;
  points: number;
  exact: number;
  correct: number;
  picked: number;
  champion: string | null;
  championHit: boolean;
  goldenBall: string | null;
  goldenBallHit: boolean;
}

interface PredictionsPayload {
  enabled: boolean;
  user: PoolUser | null;
  picks: Record<string, MatchPick>;
  champion: string | null;
  goldenBall: string | null;
  score: ScoreInfo | null;
}

interface LeaderboardPayload {
  enabled: boolean;
  rows: LeaderRow[];
  summary: {
    players: number;
    totalPicks: number;
    averagePicks: number;
    leader: LeaderRow | null;
  } | null;
}

interface PublicMatchPrediction {
  userId: string;
  name: string;
  pick: MatchPick;
  points: number;
  exact: boolean;
  correctResult: boolean;
}

interface MatchPredictionsPayload {
  enabled: boolean;
  rows: PublicMatchPrediction[];
}

const SORTED_TEAMS = [...TEAMS].sort((a, b) => a.name.localeCompare(b.name));
const SORTED_CANDIDATES = [...GOLDEN_BALL_CANDIDATES].sort((a, b) => a.name.localeCompare(b.name));

function outcomeFor(home: number, away: number): Outcome {
  if (home > away) return "HOME";
  if (away > home) return "AWAY";
  return "DRAW";
}

function locked(match: Match): boolean {
  return statusKind(match.status) !== "upcoming" || new Date(match.utcDate).getTime() <= Date.now();
}

function outcomeLabel(outcome: Outcome, match: Match): string {
  if (outcome === "DRAW") return "Draw";
  return outcome === "HOME" ? `${match.homeTeam?.code ?? "Home"} win` : `${match.awayTeam?.code ?? "Away"} win`;
}

function scoreline(pick?: MatchPick | null): string {
  return pick ? `${pick.home}-${pick.away}` : "-";
}

function rankLabel(index: number): string {
  if (index === 0) return "1st";
  if (index === 1) return "2nd";
  if (index === 2) return "3rd";
  return `#${index + 1}`;
}

function rankMedal(index: number): string {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return "";
}

// ─────────────────────────────────────────────
// Auth Panel
// ─────────────────────────────────────────────
function AuthPanel({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<Mode>("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [poolCode, setPoolCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const url = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const body = mode === "register" ? { name, email, password, poolCode } : { email, password };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Could not sign in.");
        return;
      }
      onDone();
    } catch {
      setError("Could not reach the prediction pool. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-pitch/30 pitch-horizontal bg-[linear-gradient(135deg,rgba(11,18,32,0.97),rgba(58,9,28,0.86))]">
      <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[1.15fr_420px] lg:items-stretch">
        <div className="flex min-h-[360px] flex-col justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-pitch">⚽ Private office pool</p>
            <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold uppercase leading-tight tracking-wide md:text-5xl">
              Sign up, call the score, and own the group chat.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-dim">
              Predict every match, pick the World Cup champion, call the Ballon d&apos;Or winner, and watch the leaderboard move as real results come in.
            </p>
          </div>

          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-4">
            <div className="border-l-2 border-pitch pl-3">
              <span className="block font-display text-3xl font-bold text-ink">6</span>
              <span className="text-xs uppercase tracking-wider text-dim">Exact score</span>
            </div>
            <div className="border-l-2 border-gold pl-3">
              <span className="block font-display text-3xl font-bold text-ink">4</span>
              <span className="text-xs uppercase tracking-wider text-dim">Result + margin</span>
            </div>
            <div className="border-l-2 border-live pl-3">
              <span className="block font-display text-3xl font-bold text-ink">25</span>
              <span className="text-xs uppercase tracking-wider text-dim">Champion bonus</span>
            </div>
            <div className="border-l-2 border-[#c084fc] pl-3">
              <span className="block font-display text-3xl font-bold text-ink">15</span>
              <span className="text-xs uppercase tracking-wider text-dim">Ballon d&apos;Or</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-navy/70 p-3 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="mb-3 grid grid-cols-2 rounded-lg bg-black/30 p-1 text-xs">
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`rounded-md px-3 py-2 font-semibold transition ${
                mode === "register" ? "bg-pitch text-navy shadow-lg shadow-pitch/20" : "text-dim hover:text-ink"
              }`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`rounded-md px-3 py-2 font-semibold transition ${
                mode === "signin" ? "bg-pitch text-navy shadow-lg shadow-pitch/20" : "text-dim hover:text-ink"
              }`}
            >
              Sign in
            </button>
          </div>
          <div className="grid gap-3">
            <div>
              <h3 className="font-display text-xl font-bold uppercase tracking-wide">
                {mode === "register" ? "Join the league" : "Welcome back"}
              </h3>
              <p className="mt-1 text-xs text-dim">
                {mode === "register" ? "Use your work email so the leaderboard feels like the office." : "Pick up where you left off."}
              </p>
            </div>
            {mode === "register" ? (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Unique username"
                className="rounded-lg border border-edge bg-panel px-3 py-3 text-sm outline-none transition focus:border-pitch focus:ring-2 focus:ring-pitch/20"
              />
            ) : null}
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Work email"
              type="email"
              className="rounded-lg border border-edge bg-panel px-3 py-3 text-sm outline-none transition focus:border-pitch focus:ring-2 focus:ring-pitch/20"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              className="rounded-lg border border-edge bg-panel px-3 py-3 text-sm outline-none transition focus:border-pitch focus:ring-2 focus:ring-pitch/20"
            />
            {mode === "register" ? (
              <input
                value={poolCode}
                onChange={(e) => setPoolCode(e.target.value)}
                placeholder="Invite code, if required"
                className="rounded-lg border border-edge bg-panel px-3 py-3 text-sm outline-none transition focus:border-pitch focus:ring-2 focus:ring-pitch/20"
              />
            ) : null}
            {error ? <p className="rounded border border-live/40 bg-live/10 px-3 py-2 text-xs text-live">{error}</p> : null}
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="rounded-full bg-pitch px-4 py-3 font-display text-sm font-semibold uppercase tracking-wider text-navy shadow-lg shadow-pitch/20 transition hover:brightness-110 disabled:opacity-60"
            >
              {busy ? "Working..." : mode === "register" ? "Join pool" : "Sign in"}
            </button>
            <p className="text-center text-[11px] leading-relaxed text-dim">
              Accounts store only your username, email, encrypted password, and picks.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Score stepper
// ─────────────────────────────────────────────
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
      <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-edge bg-navy font-mono text-xl font-bold transition-all">
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

// ─────────────────────────────────────────────
// Outcome buttons
// ─────────────────────────────────────────────
function OutcomeButtons({
  match,
  pick,
  disabled,
  onChange,
}: {
  match: Match;
  pick: MatchPick | undefined;
  disabled: boolean;
  onChange: (outcome: Outcome) => void;
}) {
  const options: Outcome[] = ["HOME", "DRAW", "AWAY"];
  return (
    <div className="grid grid-cols-3 gap-1 rounded-lg bg-navy p-1 text-[11px]">
      {options.map((outcome) => (
        <button
          key={outcome}
          type="button"
          disabled={disabled}
          onClick={() => onChange(outcome)}
          className={`rounded-md px-2 py-1.5 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            pick?.outcome === outcome
              ? "bg-pitch text-navy shadow-sm shadow-pitch/30"
              : "text-dim hover:bg-panel2 hover:text-ink"
          }`}
        >
          {outcomeLabel(outcome, match)}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Match pick row
// ─────────────────────────────────────────────
function MatchPickRow({
  match,
  pick,
  points,
  onPick,
}: {
  match: Match;
  pick: MatchPick | undefined;
  points?: MatchScoreInfo;
  onPick: (matchId: string, pick: MatchPick) => void;
}) {
  const [justSaved, setJustSaved] = useState(false);
  const isLocked = locked(match);
  const homeName = match.homeTeam?.name ?? match.homeLabel ?? "Home";
  const awayName = match.awayTeam?.name ?? match.awayLabel ?? "Away";
  const current = pick ?? { outcome: "HOME" as Outcome, home: 1, away: 0, updatedAt: new Date().toISOString() };

  function updateScore(side: "home" | "away", value: number) {
    const next = { ...current, [side]: value };
    onPick(match.id, { ...next, outcome: outcomeFor(next.home, next.away), updatedAt: new Date().toISOString() });
    setJustSaved(false);
  }

  function updateOutcome(outcome: Outcome) {
    let home = current.home;
    let away = current.away;
    if (outcome === "HOME" && home <= away) home = away + 1;
    if (outcome === "AWAY" && away <= home) away = home + 1;
    if (outcome === "DRAW") away = home;
    onPick(match.id, { outcome, home, away, updatedAt: new Date().toISOString() });
  }

  const ptsBg =
    points?.exact
      ? "border-pitch/60 bg-pitch/10 text-pitch"
      : points?.correctResult
        ? "border-gold/50 bg-gold/10 text-gold"
        : points?.points
          ? "border-dim/30 bg-panel2 text-dim"
          : "border-gold/40 bg-gold/10 text-gold";

  return (
    <article
      className={`overflow-hidden rounded-xl border transition ${justSaved ? "animate-pick-flash" : ""} ${
        pick ? "border-pitch/40 bg-panel shadow-lg shadow-pitch/5" : "border-edge bg-panel hover:border-pitch/30"
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-edge/60 bg-panel2/40 px-3 py-2 text-[11px] text-dim">
        <span className="font-semibold uppercase tracking-wide">
          {match.group ? `Group ${match.group}` : match.stage.replace(/_/g, " ")}
          {isLocked ? <span className="ml-2 text-live">· locked</span> : ""}
        </span>
        <span className="flex items-center gap-2">
          <LocalTime iso={match.utcDate} style="weekday" className="font-mono" />
          <span
            className={`rounded-full px-2 py-0.5 font-semibold ${
              isLocked ? "bg-live/15 text-live" : "bg-pitch/15 text-pitch"
            }`}
          >
            {isLocked ? "Locked" : "Open"}
          </span>
        </span>
      </div>

      <div className="grid gap-3 p-3">
        {/* Teams + score steppers */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="min-w-0 text-right">
            <div className="flex items-center justify-end gap-2">
              <span className="truncate text-sm font-semibold leading-tight">{homeName}</span>
              <Flag code={match.homeTeam?.code} name={homeName} width={28} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ScoreStepper
              value={pick?.home ?? 0}
              disabled={isLocked}
              onChange={(n) => updateScore("home", n)}
              label={`${homeName} goals`}
            />
            <span className="text-lg font-bold text-dim">–</span>
            <ScoreStepper
              value={pick?.away ?? 0}
              disabled={isLocked}
              onChange={(n) => updateScore("away", n)}
              label={`${awayName} goals`}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Flag code={match.awayTeam?.code} name={awayName} width={28} />
              <span className="truncate text-sm font-semibold leading-tight">{awayName}</span>
            </div>
          </div>
        </div>

        {/* Outcome buttons */}
        <OutcomeButtons match={match} pick={pick} disabled={isLocked} onChange={updateOutcome} />

        {/* Footer: pick summary + points */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-dim">
          {pick ? (
            <span>
              {outcomeLabel(pick.outcome, match)} · {scoreline(pick)}
            </span>
          ) : (
            <span className="italic">No pick yet</span>
          )}
          {points ? (
            <span className={`rounded-full border px-2 py-0.5 font-mono text-xs font-semibold ${ptsBg}`}>
              {points.points} pts
              {points.exact ? " · exact!" : points.correctResult ? " · correct" : ""}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────
// Leaderboard
// ─────────────────────────────────────────────
function Leaderboard({ rows, userId }: { rows: LeaderRow[]; userId?: string }) {
  if (!rows.length) {
    return <EmptyState title="No one has joined the office pool yet." description="Create the first account and set the pace." />;
  }
  const podium = rows.slice(0, 3);
  return (
    <div className="grid gap-4">
      {/* Top 3 podium cards */}
      <div className="grid gap-3 md:grid-cols-3">
        {podium.map((row, index) => (
          <article
            key={row.userId}
            className={`relative overflow-hidden rounded-xl border p-4 ${
              index === 0
                ? "border-gold/60 bg-[radial-gradient(circle_at_top_right,rgba(255,215,0,0.12),transparent_60%),linear-gradient(135deg,rgba(11,18,32,0.98),rgba(58,42,9,0.8))]"
                : row.userId === userId
                  ? "border-pitch/60 bg-pitch/5"
                  : "border-edge bg-panel"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] uppercase tracking-[0.22em] text-dim">
                {rankMedal(index)} {rankLabel(index)}
              </p>
              {index === 0 && (
                <span className="animate-crown-glow text-lg" role="img" aria-label="leader">
                  ⚽
                </span>
              )}
            </div>
            <div className="mt-2 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/predict/${row.userId}`}
                  className="block truncate font-display text-2xl font-bold uppercase tracking-wide hover:text-pitch"
                >
                  {row.name}
                </Link>
                <p className="mt-1 text-xs text-dim">
                  {row.picked} picks · {row.exact} exact
                </p>
              </div>
              <p className={`font-display text-4xl font-bold ${index === 0 ? "text-gold" : "text-ink"}`}>
                {row.points}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              {row.champion && (
                <span className="rounded-full bg-panel2 px-2 py-0.5 text-dim">
                  🏆 {row.champion}
                </span>
              )}
              {row.goldenBall && (
                <span className="rounded-full bg-panel2 px-2 py-0.5 text-[#c084fc]">
                  ✨ {GOLDEN_BALL_CANDIDATES.find((c) => c.id === row.goldenBall)?.name ?? row.goldenBall}
                </span>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* Full table */}
      <div className="overflow-hidden rounded-xl border border-edge bg-panel">
        <ol className="divide-y divide-edge/60">
          {rows.map((row, index) => (
            <li
              key={row.userId}
              className={`grid grid-cols-[44px_1fr_auto] items-center gap-3 px-3 py-3 text-sm transition ${
                row.userId === userId ? "bg-pitch/8" : index < 3 ? "bg-panel2/30" : ""
              }`}
            >
              <span className="text-center font-display text-lg font-bold text-dim">
                {rankMedal(index) || `#${index + 1}`}
              </span>
              <span className="min-w-0">
                <Link href={`/predict/${row.userId}`} className="block truncate font-semibold hover:text-pitch">
                  {row.name}
                  {row.userId === userId && (
                    <span className="ml-2 rounded-full bg-pitch/20 px-1.5 py-0.5 text-[10px] text-pitch">you</span>
                  )}
                </Link>
                <span className="text-[11px] text-dim">
                  {row.picked} picks · {row.correct} correct · {row.exact} exact
                  {row.champion ? ` · 🏆 ${row.champion}` : ""}
                  {row.goldenBall ? ` · ✨ ${GOLDEN_BALL_CANDIDATES.find((c) => c.id === row.goldenBall)?.name ?? row.goldenBall}` : ""}
                </span>
              </span>
              <span className="font-display text-xl font-bold text-gold">{row.points}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Community match prediction board
// ─────────────────────────────────────────────
function MatchPredictionBoard({
  matches,
  selectedMatchId,
  onSelect,
}: {
  matches: Match[];
  selectedMatchId: string;
  onSelect: (id: string) => void;
}) {
  const selected = matches.find((match) => match.id === selectedMatchId) ?? matches[0];
  const { data, isLoading } = useSWR<MatchPredictionsPayload>(
    selected ? `/api/pool/match/${selected.id}/predictions` : null,
    jsonFetcher,
    { refreshInterval: 30_000 },
  );

  if (!matches.length) {
    return (
      <EmptyState
        title="No matches are ready for pool picks yet."
        description="Once fixtures are available, everyone's picks will appear here."
      />
    );
  }

  const homePct = data?.rows.length
    ? Math.round((data.rows.filter((r) => r.pick.outcome === "HOME").length / data.rows.length) * 100)
    : 0;
  const drawPct = data?.rows.length
    ? Math.round((data.rows.filter((r) => r.pick.outcome === "DRAW").length / data.rows.length) * 100)
    : 0;
  const awayPct = data?.rows.length ? 100 - homePct - drawPct : 0;

  return (
    <section className="grid gap-4">
      <div className="rounded-xl border border-edge bg-panel p-4">
        <label className="flex flex-col gap-1 text-xs text-dim">
          View everyone&apos;s picks for
          <select
            value={selected?.id ?? ""}
            onChange={(e) => onSelect(e.target.value)}
            className="rounded-lg border border-edge bg-panel2 px-3 py-3 text-sm text-ink outline-none transition focus:border-pitch focus:ring-2 focus:ring-pitch/20"
          >
            {matches.map((match) => (
              <option key={match.id} value={match.id}>
                {(match.homeTeam?.code ?? match.homeLabel ?? "Home")} vs{" "}
                {(match.awayTeam?.code ?? match.awayLabel ?? "Away")} –{" "}
                {match.group ? `Group ${match.group}` : match.stage.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Community split bar */}
      {data && data.rows.length > 0 && (
        <div className="rounded-xl border border-edge bg-panel p-4">
          <p className="mb-2 text-[11px] uppercase tracking-wider text-dim">
            Pool split ({data.rows.length} pick{data.rows.length !== 1 ? "s" : ""})
          </p>
          <div className="flex h-3 overflow-hidden rounded-full">
            {homePct > 0 && (
              <div
                className="flex items-center justify-center bg-[var(--home-color)] text-[9px] font-bold text-navy transition-all"
                style={{ width: `${homePct}%` }}
                title={`${selected?.homeTeam?.code ?? "Home"} win: ${homePct}%`}
              />
            )}
            {drawPct > 0 && (
              <div
                className="flex items-center justify-center bg-dim text-[9px] font-bold text-navy transition-all"
                style={{ width: `${drawPct}%` }}
                title={`Draw: ${drawPct}%`}
              />
            )}
            {awayPct > 0 && (
              <div
                className="flex items-center justify-center bg-[var(--away-color)] text-[9px] font-bold text-navy transition-all"
                style={{ width: `${awayPct}%` }}
                title={`${selected?.awayTeam?.code ?? "Away"} win: ${awayPct}%`}
              />
            )}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-dim">
            <span>{selected?.homeTeam?.code ?? "Home"} {homePct}%</span>
            <span>Draw {drawPct}%</span>
            <span>{selected?.awayTeam?.code ?? "Away"} {awayPct}%</span>
          </div>
        </div>
      )}

      {isLoading || !data ? (
        <div className="skeleton h-48 rounded-xl" aria-hidden />
      ) : data.rows.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {data.rows.map((row, i) => (
            <article
              key={row.userId}
              className="animate-slide-up rounded-xl border border-edge bg-panel p-3"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <Link href={`/predict/${row.userId}`} className="min-w-0 truncate font-semibold hover:text-pitch">
                  {row.name}
                </Link>
                <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 font-mono text-xs text-gold">
                  {row.points} pts
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xs text-dim">{selected?.homeTeam?.code ?? "Home"}</span>
                <span className="rounded-lg border border-edge bg-navy px-4 py-2 font-mono text-xl font-bold">
                  {row.pick.home}–{row.pick.away}
                </span>
                <span className="text-xs text-dim">{selected?.awayTeam?.code ?? "Away"}</span>
              </div>
              <p className="mt-2 text-xs text-dim">
                {row.pick.outcome === "DRAW"
                  ? "Draw"
                  : row.pick.outcome === "HOME"
                    ? `${selected?.homeTeam?.code ?? "Home"} win`
                    : `${selected?.awayTeam?.code ?? "Away"} win`}
                {row.exact ? " · exact score ✓" : row.correctResult ? " · correct result ✓" : ""}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No one has picked this match yet."
          description="Once coworkers save a scoreline for this fixture, their predictions will show up here."
        />
      )}
    </section>
  );
}

// ─────────────────────────────────────────────
// Invite Link
// ─────────────────────────────────────────────
function InviteLink() {
  const [copied, setCopied] = useState(false)
  const url = typeof window !== "undefined"
    ? window.location.origin + "/predict"
    : "/predict"

  function copy() {
    navigator.clipboard.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-lg border border-edge bg-panel2 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-dim mb-1.5">
        📨 Invite coworkers
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded border border-edge bg-navy px-2 py-1 text-[11px] font-mono text-dim">
          {url}
        </code>
        <button
          onClick={copy}
          className="shrink-0 rounded-full bg-pitch px-3 py-1 text-[11px] font-semibold text-navy transition hover:brightness-110"
        >
          {copied ? "✓ Copied!" : "Copy link"}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main PickemClient
// ─────────────────────────────────────────────
export function PickemClient() {
  const { data: matchData } = useSWR<Sourced<Match[]>>("/api/matches", jsonFetcher);
  const { data: predData, mutate: mutatePreds } = useSWR<PredictionsPayload>("/api/predictions", jsonFetcher);
  const { data: boardData, mutate: mutateBoard } = useSWR<LeaderboardPayload>("/api/leaderboard", jsonFetcher, {
    refreshInterval: 30_000,
  });
  const [drafts, setDrafts] = useState<Record<string, MatchPick>>({});
  const [champion, setChampion] = useState("");
  const [goldenBall, setGoldenBall] = useState("");
  const [bonusTab, setBonusTab] = useState<"champion" | "ballondor">("champion");
  const [view, setView] = useState<View>("open");
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!predData?.user) return;
    setDrafts(predData.picks ?? {});
    setChampion(predData.champion ?? "");
    setGoldenBall(predData.goldenBall ?? "");
  }, [predData?.user, predData?.champion, predData?.goldenBall, predData?.picks]);

  async function refreshAll() {
    await Promise.all([mutatePreds(), mutateBoard()]);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setDrafts({});
    setChampion("");
    setGoldenBall("");
    await refreshAll();
  }

  async function save() {
    setStatus("saving");
    setNotice(null);
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ champion, goldenBall, picks: drafts }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setStatus("error");
        setNotice(json.error ?? "Could not save picks.");
        return;
      }
      setStatus("saved");
      if (json.skippedLocked?.length) {
        setNotice(`${json.skippedLocked.length} locked pick${json.skippedLocked.length === 1 ? "" : "s"} were not changed.`);
      }
      await refreshAll();
      setTimeout(() => setStatus("idle"), 1800);
    } catch {
      setStatus("error");
      setNotice("Could not save picks. Try again.");
    }
  }

  const matches = useMemo(() => matchData?.data ?? [], [matchData?.data]);
  const user = predData?.user ?? null;
  const openMatches = useMemo(
    () =>
      matches
        .filter((match) => !locked(match) && match.homeTeam?.code && match.awayTeam?.code)
        .sort((a, b) => +new Date(a.utcDate) - +new Date(b.utcDate)),
    [matches],
  );
  const pickableMatches = useMemo(
    () =>
      matches
        .filter((match) => match.homeTeam?.code && match.awayTeam?.code)
        .sort((a, b) => +new Date(a.utcDate) - +new Date(b.utcDate)),
    [matches],
  );
  const myMatches = useMemo(
    () =>
      matches
        .filter((match) => drafts[match.id])
        .sort((a, b) => +new Date(a.utcDate) - +new Date(b.utcDate)),
    [matches, drafts],
  );

  useEffect(() => {
    if (!selectedMatchId && pickableMatches[0]) setSelectedMatchId(pickableMatches[0].id);
  }, [pickableMatches, selectedMatchId]);

  if (predData?.enabled === false) {
    return (
      <EmptyState
        title="Prediction pool needs a database before coworkers can join."
        description="Configure Supabase/Postgres for accounts, sessions, picks, and leaderboard scoring. Redis can still handle caching."
      />
    );
  }

  if (!predData || !matchData || !boardData) {
    return <div className="skeleton h-[520px] w-full" aria-hidden />;
  }

  if (!user) return <AuthPanel onDone={refreshAll} />;

  const score = predData.score;
  const board = boardData.rows ?? [];
  const summary = boardData.summary;
  const visibleMatches = view === "mine" ? myMatches : openMatches;

  // Find user's rank
  const userRank = board.findIndex((r) => r.userId === user.id);
  const selectedCandidate = GOLDEN_BALL_CANDIDATES.find((c) => c.id === goldenBall);

  return (
    <div className="grid gap-6">
      {/* Command center */}
      <section className="overflow-hidden rounded-xl border border-pitch/30 pitch-horizontal bg-[linear-gradient(135deg,rgba(16,24,42,0.98),rgba(58,9,28,0.82))]">
        <div className="grid gap-5 p-4 md:grid-cols-[1fr_360px] md:p-5">
          {/* Left: user stats */}
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-pitch">⚽ Pool command center</p>
                <h2 className="mt-1 font-display text-3xl font-bold uppercase tracking-wide md:text-4xl">{user.name}</h2>
                <p className="text-xs text-dim">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-xs text-dim transition hover:text-ink"
              >
                Sign out
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-[11px] uppercase tracking-wider text-dim">Your points</p>
                <p className="font-display text-4xl font-bold text-gold">{score?.points ?? 0}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-[11px] uppercase tracking-wider text-dim">Picks made</p>
                <p className="font-display text-4xl font-bold">{Object.keys(drafts).length}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-[11px] uppercase tracking-wider text-dim">Pool players</p>
                <p className="font-display text-4xl font-bold">{summary?.players ?? board.length}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-[11px] uppercase tracking-wider text-dim">Your rank</p>
                <p className="truncate font-display text-2xl font-bold">
                  {userRank >= 0 ? rankLabel(userRank) : "–"}
                </p>
              </div>
            </div>

            {user && <InviteLink />}
          </div>

          {/* Right: bonus picks panel */}
          <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-navy/70 p-4 shadow-xl shadow-black/20">
            {/* Tabs */}
            <div className="grid grid-cols-2 rounded-lg bg-black/30 p-1 text-xs">
              <button
                type="button"
                onClick={() => setBonusTab("champion")}
                className={`rounded-md px-3 py-2 font-semibold transition ${
                  bonusTab === "champion" ? "bg-pitch text-navy shadow-lg shadow-pitch/20" : "text-dim hover:text-ink"
                }`}
              >
                🏆 Champion (+25)
              </button>
              <button
                type="button"
                onClick={() => setBonusTab("ballondor")}
                className={`rounded-md px-3 py-2 font-semibold transition ${
                  bonusTab === "ballondor" ? "bg-[#9333ea] text-white shadow-lg shadow-purple-500/20" : "text-dim hover:text-ink"
                }`}
              >
                ✨ Ballon d&apos;Or (+15)
              </button>
            </div>

            {bonusTab === "champion" ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-dim">Pick the World Cup champion (+25 pts if correct)</p>
                <select
                  value={champion}
                  onChange={(e) => setChampion(e.target.value)}
                  className="rounded-lg border border-edge bg-panel2 px-3 py-3 text-sm text-ink outline-none transition focus:border-pitch focus:ring-2 focus:ring-pitch/20"
                >
                  <option value="">Pick a champion...</option>
                  {SORTED_TEAMS.map((team) => (
                    <option key={team.code} value={team.code}>
                      {team.name}
                    </option>
                  ))}
                </select>
                {champion && (
                  <div className="flex items-center gap-2 rounded-lg border border-pitch/30 bg-pitch/5 px-3 py-2">
                    <Flag code={champion} name={champion} width={24} />
                    <span className="text-sm font-semibold text-pitch">
                      {SORTED_TEAMS.find((t) => t.code === champion)?.name ?? champion}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-dim">Pick the Ballon d&apos;Or winner (+15 pts if correct)</p>
                <select
                  value={goldenBall}
                  onChange={(e) => setGoldenBall(e.target.value)}
                  className="rounded-lg border border-[#9333ea]/40 bg-panel2 px-3 py-3 text-sm text-ink outline-none transition focus:border-[#9333ea] focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="">Pick a player...</option>
                  {SORTED_CANDIDATES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.teamCode}) — {c.club}
                    </option>
                  ))}
                </select>
                {selectedCandidate && (
                  <div className="flex items-center gap-2 rounded-lg border border-[#9333ea]/30 bg-[#9333ea]/5 px-3 py-2">
                    <Flag code={selectedCandidate.teamCode} name={selectedCandidate.teamCode} width={24} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#c084fc]">{selectedCandidate.name}</p>
                      <p className="text-[11px] text-dim">{selectedCandidate.club}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={save}
              disabled={status === "saving"}
              className="mt-auto w-full rounded-full bg-pitch px-6 py-3 font-display text-sm font-semibold uppercase tracking-wider text-navy shadow-lg shadow-pitch/20 transition hover:brightness-110 disabled:opacity-60"
            >
              {status === "saving" ? "Saving..." : status === "saved" ? "✓ Saved" : "Save all predictions"}
            </button>
            <p className="text-[11px] leading-relaxed text-dim">
              Save anytime. Match picks lock at kickoff automatically.
            </p>
          </div>
        </div>

        {notice ? (
          <p className="mx-4 mb-4 rounded border border-gold/40 bg-gold/10 px-3 py-2 text-xs text-gold md:mx-5">
            {notice}
          </p>
        ) : null}
      </section>

      {/* Navigation tabs */}
      <nav className="sticky top-0 z-20 -mx-4 flex gap-2 overflow-x-auto border-y border-edge bg-navy/95 px-4 py-2 backdrop-blur md:static md:mx-0 md:rounded-full md:border md:bg-panel/80 md:p-1">
        {(
          [
            ["open", `Open (${openMatches.length})`],
            ["mine", `My picks (${myMatches.length})`],
            ["community", "Pool picks"],
            ["leaderboard", "Leaderboard"],
            ["rules", "Rules"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setView(key as View)}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
              view === key
                ? "border-pitch bg-pitch text-navy"
                : "border-transparent text-dim hover:bg-panel2 hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* View content */}
      {view === "leaderboard" ? (
        <Leaderboard rows={board} userId={user.id} />
      ) : view === "community" ? (
        <MatchPredictionBoard
          matches={pickableMatches}
          selectedMatchId={selectedMatchId}
          onSelect={setSelectedMatchId}
        />
      ) : view === "rules" ? (
        <section className="rounded-xl border border-edge bg-panel p-5">
          <h2 className="font-display text-2xl font-bold uppercase text-ink">Scoring Rules</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { pts: "6", label: "Exact score", desc: "You called the exact scoreline.", color: "pitch" },
              { pts: "4", label: "Result + margin", desc: "Correct outcome and correct goal difference.", color: "gold" },
              { pts: "3", label: "Correct result", desc: "Right outcome (win/draw/loss) but different margin.", color: "live" },
              { pts: "1", label: "One team's goals", desc: "One team's scoreline is exactly right.", color: "dim" },
              { pts: "+25", label: "Champion bonus", desc: "Your World Cup champion wins the Final.", color: "gold" },
              { pts: "+15", label: "Ballon d'Or bonus", desc: "Your player pick wins the Ballon d'Or.", color: "[#c084fc]" },
            ].map(({ pts, label, desc, color }) => (
              <div key={label} className={`rounded-lg border border-${color}/30 bg-${color}/5 p-3`}>
                <p className={`font-display text-3xl font-bold text-${color}`}>{pts}</p>
                <p className="mt-1 text-sm font-semibold">{label}</p>
                <p className="mt-0.5 text-xs text-dim">{desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded border border-edge bg-panel2/50 px-3 py-2 text-xs text-dim">
            Picks lock automatically at kickoff. You can edit any unlocked match as much as you like before then.
          </p>
        </section>
      ) : visibleMatches.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {visibleMatches.map((match) => (
            <MatchPickRow
              key={match.id}
              match={match}
              pick={drafts[match.id]}
              points={score?.byMatch?.[match.id]}
              onPick={(matchId, pick) => setDrafts((prev) => ({ ...prev, [matchId]: pick }))}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={view === "mine" ? "You have not made any match picks yet." : "No unlocked matches right now."}
          description={
            view === "mine"
              ? "Switch to Open picks and start calling scorelines."
              : "New fixtures will appear here when they are available before kickoff."
          }
        />
      )}
    </div>
  );
}
