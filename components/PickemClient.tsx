"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { EmptyState } from "@/components/EmptyState";
import { Flag } from "@/components/Flag";
import { LocalTime } from "@/components/LocalTime";
import { jsonFetcher } from "@/hooks/fetcher";
import { statusKind } from "@/lib/format";
import { TEAMS } from "@/lib/team-meta";
import type { Match, Sourced } from "@/lib/types";

type Mode = "signin" | "register";
type Outcome = "HOME" | "DRAW" | "AWAY";
type View = "open" | "mine" | "community" | "leaderboard" | "today" | "rules";

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
}

interface PredictionsPayload {
  enabled: boolean;
  user: PoolUser | null;
  picks: Record<string, MatchPick>;
  champion: string | null;
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

interface TodayRow {
  userId: string;
  name: string;
  todayPoints: number;
  todayExact: number;
  todayCorrect: number;
  todayPicked: number;
  totalPoints: number;
  matchedPicks: number;
}

interface TodayLeaderboardPayload {
  enabled: boolean;
  rows: TodayRow[];
}

const SORTED_TEAMS = [...TEAMS].sort((a, b) => a.name.localeCompare(b.name));

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
  if (index === 0) return "Leader";
  if (index === 1) return "Second";
  if (index === 2) return "Third";
  return `#${index + 1}`;
}

function ChampionPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const selected = SORTED_TEAMS.find((team) => team.code === value) ?? null;

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-pitch/20 ${
          open ? "border-pitch/80 bg-black/35 shadow-lg shadow-pitch/10" : "border-white/10 bg-black/20 hover:border-pitch/30"
        }`}
      >
        <span className="min-w-0">
          <span className="block text-[11px] uppercase tracking-[0.22em] text-dim">Champion pick (+25)</span>
          <span className="mt-1 block truncate font-display text-lg font-bold uppercase text-ink">
            {selected ? selected.name : "Pick a champion..."}
          </span>
        </span>
        <span className={`shrink-0 text-dim transition ${open ? "rotate-180 text-pitch" : ""}`}>⌄</span>
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-white/10 bg-[#101826] shadow-2xl shadow-black/40">
          <div className="border-b border-white/10 bg-white/5 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-dim">Select a country</p>
            <p className="mt-1 text-xs text-dim">Your tournament champion earns a big bonus if they win it all.</p>
          </div>
          <div className="max-h-72 overflow-y-auto p-2">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-white/5 ${
                !value ? "bg-pitch/15 text-ink" : "text-dim"
              }`}
            >
              <span className="truncate">No champion selected</span>
              {!value ? <span className="text-pitch">Selected</span> : null}
            </button>
            {SORTED_TEAMS.map((team) => {
              const active = team.code === value;
              return (
                <button
                  type="button"
                  key={team.code}
                  onClick={() => {
                    onChange(team.code);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-white/5 ${
                    active ? "bg-pitch/15 text-ink" : "text-ink"
                  }`}
                >
                  <Flag code={team.code} name={team.name} width={26} />
                  <span className="min-w-0 flex-1 truncate">{team.name}</span>
                  {active ? <span className="shrink-0 rounded-full border border-pitch/30 bg-pitch/10 px-2 py-0.5 text-[11px] text-pitch">Chosen</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HistoryBreakdown({ score, matches }: { score?: ScoreInfo | null; matches: Match[] }) {
  const byMatch = Object.entries(score?.byMatch ?? {}).slice(0, 8);
  if (!score) return null;
  const matchById = new Map(matches.map((match) => [match.id, match]));
  return (
    <section className="surface-card rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-xl font-bold uppercase tracking-wide">Accuracy history</h3>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-dim">
          {score.exact} exact / {score.correct} correct
        </span>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
          <p className="text-[10px] uppercase tracking-wider text-dim">Total points</p>
          <p className="mt-1 font-display text-3xl font-bold text-gold">{score.points}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
          <p className="text-[10px] uppercase tracking-wider text-dim">Matches picked</p>
          <p className="mt-1 font-display text-3xl font-bold text-ink">{score.picked}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
          <p className="text-[10px] uppercase tracking-wider text-dim">Exact scores</p>
          <p className="mt-1 font-display text-3xl font-bold text-pitch">{score.exact}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
          <p className="text-[10px] uppercase tracking-wider text-dim">Correct results</p>
          <p className="mt-1 font-display text-3xl font-bold text-sky">{score.correct}</p>
        </div>
      </div>
      {byMatch.length ? (
        <div className="mt-4 grid gap-2">
          {byMatch.map(([matchId, entry]) => {
            const match = matchById.get(matchId);
            const home = match?.homeTeam?.name ?? match?.homeLabel ?? "Home";
            const away = match?.awayTeam?.name ?? match?.awayLabel ?? "Away";
            const stage = match ? (match.group ? `Group ${match.group}` : match.stage.replace(/_/g, " ")) : "Match";
            const date = match
              ? new Date(match.utcDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })
              : matchId;

            return (
              <div key={matchId} className="rounded-xl border border-white/10 bg-black/15 px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{match ? `${home} vs ${away}` : matchId}</p>
                    <p className="text-[11px] text-dim">{match ? `${stage} · ${date}` : "Match details unavailable"}</p>
                  </div>
                  <span className="shrink-0 font-mono text-gold">
                    {entry.points} pts{entry.exact ? " · exact" : entry.correctResult ? " · result" : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

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
    <section className="premium-border surface-glass overflow-hidden rounded-[2rem]">
      <div className="grid gap-6 bg-[radial-gradient(circle_at_top_left,rgba(0,229,139,0.20),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,209,102,0.16),transparent_34%)] p-4 md:p-7 lg:grid-cols-[1.15fr_420px] lg:items-stretch">
        <div className="flex min-h-[360px] flex-col justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-pitch">Private office pool</p>
            <h2 className="hero-copy-gradient mt-3 max-w-2xl font-display text-4xl font-bold uppercase leading-tight tracking-wide md:text-6xl">
              Sign up, call the score, and own the group chat.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-dim">
              Create a work account, predict every matchup, pick your champion, and watch the leaderboard move as real
              results come in. Picks lock at kickoff, so late edits never spoil the table.
            </p>
          </div>

          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <span className="block font-display text-3xl font-bold text-ink">6</span>
              <span className="text-xs uppercase tracking-wider text-dim">Exact score</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <span className="block font-display text-3xl font-bold text-ink">4</span>
              <span className="text-xs uppercase tracking-wider text-dim">Result + margin</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <span className="block font-display text-3xl font-bold text-ink">25</span>
              <span className="text-xs uppercase tracking-wider text-dim">Champion bonus</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-navy/70 p-3 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="mb-3 grid grid-cols-2 rounded-full bg-black/30 p-1 text-xs">
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
                className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none transition focus:border-pitch focus:ring-2 focus:ring-pitch/20"
              />
            ) : null}
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Work email"
              type="email"
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none transition focus:border-pitch focus:ring-2 focus:ring-pitch/20"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none transition focus:border-pitch focus:ring-2 focus:ring-pitch/20"
            />
            {mode === "register" ? (
              <input
                value={poolCode}
                onChange={(e) => setPoolCode(e.target.value)}
                placeholder="Invite code, if required"
                className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none transition focus:border-pitch focus:ring-2 focus:ring-pitch/20"
              />
            ) : null}
            {error ? <p className="rounded border border-live/40 bg-live/10 px-3 py-2 text-xs text-live">{error}</p> : null}
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="rounded-full bg-gradient-to-r from-pitch via-sky to-gold px-4 py-3 font-display text-sm font-semibold uppercase tracking-wider text-navy shadow-lg shadow-pitch/20 transition hover:brightness-110 disabled:opacity-60"
            >
              {busy ? "Working..." : mode === "register" ? "Join pool" : "Sign in"}
            </button>
            <p className="text-center text-[11px] leading-relaxed text-dim">
              Accounts store only your username, email, encrypted password, champion pick, and match predictions.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

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
    <div className="grid grid-cols-3 gap-1 rounded-full border border-white/10 bg-black/20 p-1 text-[11px]">
      {options.map((outcome) => (
        <button
          key={outcome}
          type="button"
          disabled={disabled}
          onClick={() => onChange(outcome)}
          className={`rounded-full px-2 py-1.5 transition disabled:cursor-not-allowed disabled:opacity-60 ${
            pick?.outcome === outcome ? "bg-pitch font-semibold text-navy shadow-lg shadow-pitch/20" : "text-dim hover:text-ink"
          }`}
        >
          {outcomeLabel(outcome, match)}
        </button>
      ))}
    </div>
  );
}

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
  const isLocked = locked(match);
  const homeName = match.homeTeam?.name ?? match.homeLabel ?? "Home";
  const awayName = match.awayTeam?.name ?? match.awayLabel ?? "Away";
  const current = pick ?? { outcome: "HOME" as Outcome, home: 1, away: 0, updatedAt: new Date().toISOString() };

  function updateScore(side: "home" | "away", value: string) {
    const n = Math.max(0, Math.min(30, Number(value.replace(/[^0-9]/g, "")) || 0));
    const next = { ...current, [side]: n };
    onPick(match.id, { ...next, outcome: outcomeFor(next.home, next.away), updatedAt: new Date().toISOString() });
  }

  function updateOutcome(outcome: Outcome) {
    let home = current.home;
    let away = current.away;
    if (outcome === "HOME" && home <= away) home = away + 1;
    if (outcome === "AWAY" && away <= home) away = home + 1;
    if (outcome === "DRAW") away = home;
    onPick(match.id, { outcome, home, away, updatedAt: new Date().toISOString() });
  }

  return (
    <article
      className={`surface-card overflow-hidden rounded-2xl transition ${
        pick ? "border-pitch/40 shadow-lg shadow-pitch/10" : "hover:border-pitch/30"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/5 px-3 py-2 text-[11px] text-dim">
        <span>
          {match.group ? `Group ${match.group}` : match.stage.replace(/_/g, " ")}
          {isLocked ? " · locked" : ""}
        </span>
        <span className="flex items-center gap-2">
          <LocalTime iso={match.utcDate} style="weekday" className="font-mono" />
          <span className={`rounded-full px-2 py-0.5 ${isLocked ? "bg-live/10 text-live" : "bg-pitch/10 text-pitch"}`}>
            {isLocked ? "Locked" : "Open"}
          </span>
        </span>
      </div>

      <div className="grid gap-3 p-3">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="min-w-0 text-right">
          <div className="flex items-center justify-end gap-2">
            <span className="truncate text-sm font-semibold">{homeName}</span>
            <Flag code={match.homeTeam?.code} name={homeName} width={28} />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <input
            inputMode="numeric"
            value={pick?.home ?? ""}
            disabled={isLocked}
            onChange={(e) => updateScore("home", e.target.value)}
            aria-label={`${homeName} predicted goals`}
            className="h-12 w-12 rounded-xl border border-white/10 bg-navy text-center font-mono text-xl font-bold outline-none transition focus:border-pitch focus:ring-2 focus:ring-pitch/20 disabled:opacity-60"
          />
          <span className="text-dim">-</span>
          <input
            inputMode="numeric"
            value={pick?.away ?? ""}
            disabled={isLocked}
            onChange={(e) => updateScore("away", e.target.value)}
            aria-label={`${awayName} predicted goals`}
            className="h-12 w-12 rounded-xl border border-white/10 bg-navy text-center font-mono text-xl font-bold outline-none transition focus:border-pitch focus:ring-2 focus:ring-pitch/20 disabled:opacity-60"
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Flag code={match.awayTeam?.code} name={awayName} width={28} />
            <span className="truncate text-sm font-semibold">{awayName}</span>
          </div>
        </div>
      </div>

      <div>
        <OutcomeButtons match={match} pick={pick} disabled={isLocked} onChange={updateOutcome} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-dim">
        {pick ? <span>Your pick: {outcomeLabel(pick.outcome, match)} · {scoreline(pick)}</span> : <span>No pick yet</span>}
        {points ? (
          <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 font-mono text-gold">
            {points.points} pts
          </span>
        ) : null}
      </div>
      </div>
    </article>
  );
}

function Leaderboard({ rows, userId }: { rows: LeaderRow[]; userId?: string }) {
  if (!rows.length) {
    return <EmptyState title="No one has joined the office pool yet." description="Create the first account and set the pace." />;
  }
  const podium = rows.slice(0, 3);
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-3">
        {podium.map((row, index) => (
          <article
            key={row.userId}
            className={`surface-card rounded-2xl p-4 ${
              index === 0
                ? "bg-gold/10"
                : row.userId === userId
                  ? "bg-pitch/10"
                  : ""
            }`}
          >
            <p className="text-[11px] uppercase tracking-[0.22em] text-dim">{rankLabel(index)}</p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/predict/${row.userId}`}
                  className="block truncate font-display text-2xl font-bold uppercase tracking-wide hover:text-pitch"
                >
                  {row.name}
                </Link>
                <p className="mt-1 text-xs text-dim">
                  {row.picked} picks / {row.exact} exact / {row.correct} correct
                </p>
              </div>
              <p className="font-display text-4xl font-bold text-gold">{row.points}</p>
            </div>
            {row.champion ? <p className="mt-3 text-xs text-dim">Champion pick: {row.champion}</p> : null}
          </article>
        ))}
      </div>

      <div className="surface-card overflow-hidden rounded-2xl">
        <ol className="divide-y divide-white/10">
        {rows.map((row, index) => (
          <li
            key={row.userId}
            className={`grid grid-cols-[36px_1fr_auto] items-center gap-3 px-3 py-3 text-sm ${
              row.userId === userId ? "bg-pitch/10" : ""
            }`}
          >
            <span className="font-mono text-dim">#{index + 1}</span>
              <span className="min-w-0">
              <Link href={`/predict/${row.userId}`} className="block truncate font-semibold hover:text-pitch">
                {row.name}
              </Link>
              <span className="text-[11px] text-dim">
                {row.picked} picks · {row.correct} correct · {row.exact} exact
                {row.champion ? ` · champion ${row.champion}` : ""}
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
    return <EmptyState title="No matches are ready for pool picks yet." description="Once fixtures are available, everyone's picks will appear here." />;
  }

  return (
    <section className="grid gap-4">
      <div className="surface-card rounded-2xl p-4">
        <label className="flex flex-col gap-1 text-xs text-dim">
          View everyone&apos;s picks for
          <select
            value={selected?.id ?? ""}
            onChange={(e) => onSelect(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-ink outline-none transition focus:border-pitch focus:ring-2 focus:ring-pitch/20"
          >
            {matches.map((match) => (
              <option key={match.id} value={match.id}>
                {(match.homeTeam?.code ?? match.homeLabel ?? "Home")} vs {(match.awayTeam?.code ?? match.awayLabel ?? "Away")} -{" "}
                {match.group ? `Group ${match.group}` : match.stage.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading || !data ? (
        <div className="skeleton h-48 rounded-xl" aria-hidden />
      ) : data.rows.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {data.rows.map((row) => (
            <article key={row.userId} className="surface-card rounded-2xl p-3">
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
                <span className="rounded-xl border border-white/10 bg-navy px-4 py-2 font-mono text-xl font-bold">
                  {row.pick.home}-{row.pick.away}
                </span>
                <span className="text-xs text-dim">{selected?.awayTeam?.code ?? "Away"}</span>
              </div>
              <p className="mt-2 text-xs text-dim">
                {row.pick.outcome === "DRAW"
                  ? "Draw"
                  : row.pick.outcome === "HOME"
                    ? `${selected?.homeTeam?.code ?? "Home"} win`
                    : `${selected?.awayTeam?.code ?? "Away"} win`}
                {row.exact ? " / exact score" : row.correctResult ? " / correct result" : ""}
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

export function PickemClient() {
  const { data: matchData } = useSWR<Sourced<Match[]>>("/api/matches", jsonFetcher);
  const { data: predData, mutate: mutatePreds } = useSWR<PredictionsPayload>("/api/predictions", jsonFetcher);
  const { data: boardData, mutate: mutateBoard } = useSWR<LeaderboardPayload>("/api/leaderboard", jsonFetcher, {
    refreshInterval: 30_000,
  });
  const { data: todayData } = useSWR<TodayLeaderboardPayload>("/api/pool/today", jsonFetcher, {
    refreshInterval: 60_000,
  });
  const [drafts, setDrafts] = useState<Record<string, MatchPick>>({});
  const [champion, setChampion] = useState("");
  const [view, setView] = useState<View>("open");
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!predData?.user) return;
    setDrafts(predData.picks ?? {});
    setChampion(predData.champion ?? "");
  }, [predData?.user, predData?.champion, predData?.picks]);

  async function refreshAll() {
    await Promise.all([mutatePreds(), mutateBoard()]);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setDrafts({});
    setChampion("");
    await refreshAll();
  }

  async function save() {
    setStatus("saving");
    setNotice(null);
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ champion, picks: drafts }),
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
  const todayRows = todayData?.rows ?? [];
  const visibleMatches = view === "mine" ? myMatches : openMatches;

  return (
    <div className="grid gap-6">
      <section className="premium-border surface-glass overflow-hidden rounded-[2rem]">
        <div className="grid gap-5 bg-[radial-gradient(circle_at_top_left,rgba(0,229,139,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,209,102,0.14),transparent_34%)] p-4 md:grid-cols-[1fr_340px] md:p-6">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-pitch">Pool command center</p>
                <h2 className="hero-copy-gradient mt-1 font-display text-3xl font-bold uppercase tracking-wide md:text-5xl">
                  {user.name}
                </h2>
                <p className="text-xs text-dim">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-xs text-dim transition hover:border-live/40 hover:text-ink"
              >
                Sign out
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-[11px] uppercase tracking-wider text-dim">Your points</p>
                <p className="font-display text-4xl font-bold text-gold">{score?.points ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-[11px] uppercase tracking-wider text-dim">Picks made</p>
                <p className="font-display text-4xl font-bold">{Object.keys(drafts).length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-[11px] uppercase tracking-wider text-dim">Pool players</p>
                <p className="font-display text-4xl font-bold">{summary?.players ?? board.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-[11px] uppercase tracking-wider text-dim">Leader</p>
                <p className="truncate font-display text-2xl font-bold">{summary?.leader?.name ?? "Open"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(0,229,139,0.12),transparent_25%),linear-gradient(180deg,rgba(8,15,28,0.92),rgba(7,11,18,0.96))] p-4 shadow-xl shadow-black/20">
          <ChampionPicker value={champion} onChange={setChampion} />
          <button
            type="button"
            onClick={save}
            disabled={status === "saving"}
            className="mt-4 w-full rounded-full bg-gradient-to-r from-pitch via-sky to-gold px-6 py-3 font-display text-sm font-semibold uppercase tracking-wider text-navy shadow-lg shadow-pitch/20 transition hover:brightness-110 disabled:opacity-60"
          >
            {status === "saving" ? "Saving..." : status === "saved" ? "Saved" : "Save predictions"}
          </button>
          <p className="mt-3 text-[11px] leading-relaxed text-dim">
            Save as often as you want. Match picks lock automatically at kickoff.
          </p>
          </div>
        </div>
        {notice ? <p className="mx-4 mb-4 rounded border border-gold/40 bg-gold/10 px-3 py-2 text-xs text-gold md:mx-5">{notice}</p> : null}
      </section>

      <HistoryBreakdown score={score} matches={matches} />

      <nav className="surface-glass sticky top-0 z-20 -mx-4 flex gap-2 overflow-x-auto rounded-none border-x-0 px-4 py-2 md:static md:mx-0 md:rounded-full md:border md:p-1">
        {[
          ["open", `Open picks (${openMatches.length})`],
          ["mine", `My picks (${myMatches.length})`],
          ["community", "Pool picks"],
          ["leaderboard", "Leaderboard"],
          ["today", "Today"],
          ["rules", "Rules"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setView(key as View)}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs transition ${
              view === key
                ? "border-pitch bg-pitch text-navy shadow-lg shadow-pitch/20"
                : "border-transparent text-dim hover:bg-white/5 hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {view === "leaderboard" ? (
        <Leaderboard rows={board} userId={user.id} />
      ) : view === "today" ? (
        todayRows.length ? (
          <section className="grid gap-3">
            <div className="surface-card rounded-2xl p-4">
              <h2 className="font-display text-2xl font-bold uppercase tracking-wide">Best predictor today</h2>
              <p className="mt-1 text-sm text-dim">Ranks people by today&apos;s finished matches, so the office has a live daily race too.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {todayRows.slice(0, 8).map((row, index) => (
                <article key={row.userId} className="surface-card rounded-2xl p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-dim">#{index + 1}</p>
                  <Link href={`/predict/${row.userId}`} className="mt-2 block truncate font-display text-2xl font-bold uppercase hover:text-pitch">
                    {row.name}
                  </Link>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-xl border border-white/10 bg-black/15 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wider text-dim">Today points</p>
                      <p className="font-display text-2xl font-bold text-gold">{row.todayPoints}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/15 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wider text-dim">Today picks</p>
                      <p className="font-display text-2xl font-bold text-ink">{row.todayPicked}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-dim">
                    {row.todayExact} exact / {row.todayCorrect} correct · {row.totalPoints} total
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <EmptyState title="No finished matches today yet." description="The daily ranking will populate once today&apos;s matches start producing results." />
        )
      ) : view === "community" ? (
        <MatchPredictionBoard
          matches={pickableMatches}
          selectedMatchId={selectedMatchId}
          onSelect={setSelectedMatchId}
        />
      ) : view === "rules" ? (
        <section className="surface-card rounded-2xl p-4 text-sm text-dim">
          <h2 className="font-display text-xl font-bold uppercase text-ink">Scoring Rules</h2>
          <ul className="mt-3 grid gap-2">
            <li>6 points for the exact score.</li>
            <li>4 points for correct result plus correct goal difference.</li>
            <li>3 points for the correct result only: home win, draw, or away win.</li>
            <li>1 bonus point for each team score you get exactly right when the full score is not exact.</li>
            <li>25 points if your champion pick wins the tournament.</li>
            <li>Picks lock at kickoff. You can edit any unlocked match as much as you want.</li>
          </ul>
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
          description={view === "mine" ? "Switch to Open picks and start calling scorelines." : "New fixtures will appear here when they are available before kickoff."}
        />
      )}
    </div>
  );
}
