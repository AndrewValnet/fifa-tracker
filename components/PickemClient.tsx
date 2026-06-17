"use client";

import { useEffect, useMemo, useState } from "react";
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
type View = "open" | "mine" | "leaderboard" | "rules";

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
    <section className="overflow-hidden rounded-xl border border-pitch/30 bg-[radial-gradient(circle_at_top_left,rgba(0,217,126,0.18),transparent_32%),linear-gradient(135deg,rgba(11,18,32,0.96),rgba(58,9,28,0.82))]">
      <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[1.15fr_420px] lg:items-stretch">
        <div className="flex min-h-[360px] flex-col justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-pitch">Private office pool</p>
            <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold uppercase leading-tight tracking-wide md:text-5xl">
              Sign up, call the score, and own the group chat.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-dim">
              Create a work account, predict every matchup, pick your champion, and watch the leaderboard move as real
              results come in. Picks lock at kickoff, so late edits never spoil the table.
            </p>
          </div>

          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
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
                placeholder="Display name"
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
              Accounts store only your name, email, encrypted password, champion pick, and match predictions.
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
    <div className="grid grid-cols-3 gap-1 rounded-lg bg-navy p-1 text-[11px]">
      {options.map((outcome) => (
        <button
          key={outcome}
          type="button"
          disabled={disabled}
          onClick={() => onChange(outcome)}
          className={`rounded-md px-2 py-1.5 transition disabled:cursor-not-allowed disabled:opacity-60 ${
            pick?.outcome === outcome ? "bg-pitch font-semibold text-navy" : "text-dim hover:text-ink"
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
      className={`overflow-hidden rounded-xl border bg-panel transition ${
        pick ? "border-pitch/40 shadow-lg shadow-pitch/5" : "border-edge hover:border-pitch/30"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-edge/60 bg-panel2/40 px-3 py-2 text-[11px] text-dim">
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
            className="h-12 w-12 rounded-lg border border-edge bg-navy text-center font-mono text-xl font-bold outline-none transition focus:border-pitch focus:ring-2 focus:ring-pitch/20 disabled:opacity-60"
          />
          <span className="text-dim">-</span>
          <input
            inputMode="numeric"
            value={pick?.away ?? ""}
            disabled={isLocked}
            onChange={(e) => updateScore("away", e.target.value)}
            aria-label={`${awayName} predicted goals`}
            className="h-12 w-12 rounded-lg border border-edge bg-navy text-center font-mono text-xl font-bold outline-none transition focus:border-pitch focus:ring-2 focus:ring-pitch/20 disabled:opacity-60"
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
            className={`rounded-xl border p-4 ${
              index === 0
                ? "border-gold/60 bg-gold/10"
                : row.userId === userId
                  ? "border-pitch/60 bg-pitch/10"
                  : "border-edge bg-panel"
            }`}
          >
            <p className="text-[11px] uppercase tracking-[0.22em] text-dim">{rankLabel(index)}</p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-display text-2xl font-bold uppercase tracking-wide">{row.name}</h3>
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

      <div className="overflow-hidden rounded-xl border border-edge bg-panel">
        <ol className="divide-y divide-edge/60">
        {rows.map((row, index) => (
          <li
            key={row.userId}
            className={`grid grid-cols-[36px_1fr_auto] items-center gap-3 px-3 py-3 text-sm ${
              row.userId === userId ? "bg-pitch/10" : ""
            }`}
          >
            <span className="font-mono text-dim">#{index + 1}</span>
            <span className="min-w-0">
              <span className="block truncate font-semibold">{row.name}</span>
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

export function PickemClient() {
  const { data: matchData } = useSWR<Sourced<Match[]>>("/api/matches", jsonFetcher);
  const { data: predData, mutate: mutatePreds } = useSWR<PredictionsPayload>("/api/predictions", jsonFetcher);
  const { data: boardData, mutate: mutateBoard } = useSWR<LeaderboardPayload>("/api/leaderboard", jsonFetcher, {
    refreshInterval: 30_000,
  });
  const [drafts, setDrafts] = useState<Record<string, MatchPick>>({});
  const [champion, setChampion] = useState("");
  const [view, setView] = useState<View>("open");
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
  const myMatches = useMemo(
    () =>
      matches
        .filter((match) => drafts[match.id])
        .sort((a, b) => +new Date(a.utcDate) - +new Date(b.utcDate)),
    [matches, drafts],
  );

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

  return (
    <div className="grid gap-6">
      <section className="overflow-hidden rounded-xl border border-pitch/30 bg-[radial-gradient(circle_at_top_left,rgba(0,217,126,0.16),transparent_30%),linear-gradient(135deg,rgba(16,24,42,0.98),rgba(58,9,28,0.78))]">
        <div className="grid gap-5 p-4 md:grid-cols-[1fr_340px] md:p-5">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-pitch">Pool command center</p>
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
                <p className="text-[11px] uppercase tracking-wider text-dim">Leader</p>
                <p className="truncate font-display text-2xl font-bold">{summary?.leader?.name ?? "Open"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-navy/70 p-4 shadow-xl shadow-black/20">
          <label className="flex flex-col gap-1 text-xs text-dim">
            Champion pick (+25)
            <select
              value={champion}
              onChange={(e) => setChampion(e.target.value)}
              className="mt-1 rounded-lg border border-edge bg-panel2 px-3 py-3 text-sm text-ink outline-none transition focus:border-pitch focus:ring-2 focus:ring-pitch/20"
            >
              <option value="">Pick a champion...</option>
              {SORTED_TEAMS.map((team) => (
                <option key={team.code} value={team.code}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={save}
            disabled={status === "saving"}
            className="mt-4 w-full rounded-full bg-pitch px-6 py-3 font-display text-sm font-semibold uppercase tracking-wider text-navy shadow-lg shadow-pitch/20 transition hover:brightness-110 disabled:opacity-60"
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

      <nav className="sticky top-0 z-20 -mx-4 flex gap-2 overflow-x-auto border-y border-edge bg-navy/95 px-4 py-2 backdrop-blur md:static md:mx-0 md:rounded-full md:border md:bg-panel/80 md:p-1">
        {[
          ["open", `Open picks (${openMatches.length})`],
          ["mine", `My picks (${myMatches.length})`],
          ["leaderboard", "Leaderboard"],
          ["rules", "Rules"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setView(key as View)}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs transition ${
              view === key ? "border-pitch bg-pitch text-navy" : "border-transparent text-dim hover:bg-panel2 hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {view === "leaderboard" ? (
        <Leaderboard rows={board} userId={user.id} />
      ) : view === "rules" ? (
        <section className="rounded-xl border border-edge bg-panel p-4 text-sm text-dim">
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
