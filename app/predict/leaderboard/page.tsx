"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Flag } from "@/components/Flag";
import { LocalTime } from "@/components/LocalTime";
import { jsonFetcher } from "@/hooks/fetcher";
import { statusKind } from "@/lib/format";
import type { Match, Sourced } from "@/lib/types";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type Outcome = "HOME" | "DRAW" | "AWAY";

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
  user: { id: string; name: string } | null;
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

// ─────────────────────────────────────────────
// Scoring constants
// ─────────────────────────────────────────────
const EXACT_POINTS = 6;
const DIFF_POINTS = 4;
const RESULT_POINTS = 3;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function rankBadge(index: number) {
  if (index === 0) return <span className="text-gold font-bold text-base">1st</span>;
  if (index === 1) return <span className="text-[#c0c0c0] font-bold text-base">2nd</span>;
  if (index === 2) return <span className="text-[#cd7f32] font-bold text-base">3rd</span>;
  return <span className="text-dim text-sm font-mono">#{index + 1}</span>;
}

function pointsBadge(points: number) {
  if (points === EXACT_POINTS)
    return (
      <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-pitch/20 text-pitch border border-pitch/30">
        Exact +{points}
      </span>
    );
  if (points >= DIFF_POINTS)
    return (
      <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gold/15 text-gold border border-gold/30">
        Diff +{points}
      </span>
    );
  if (points >= RESULT_POINTS)
    return (
      <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-white/5 text-ink border border-white/10">
        Result +{points}
      </span>
    );
  if (points > 0)
    return (
      <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-white/5 text-dim border border-white/10">
        Goal +{points}
      </span>
    );
  return (
    <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-900/20 text-red-400 border border-red-900/30">
      Miss 0
    </span>
  );
}

function statusLabel(match: Match): string {
  const kind = statusKind(match.status);
  if (kind === "live") return "LIVE";
  if (kind === "finished") return "FT";
  return "Upcoming";
}

// ─────────────────────────────────────────────
// Scoring Info Box
// ─────────────────────────────────────────────
function ScoringInfo() {
  return (
    <div className="rounded-xl border border-gold/20 bg-gold/5 p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-gold mb-3">How scoring works</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg border border-pitch/30 bg-pitch/10 px-3 py-2.5">
          <p className="font-display text-2xl font-bold text-pitch">6</p>
          <p className="mt-0.5 text-[11px] text-dim uppercase tracking-wider">Exact score</p>
        </div>
        <div className="rounded-lg border border-gold/30 bg-gold/5 px-3 py-2.5">
          <p className="font-display text-2xl font-bold text-gold">4</p>
          <p className="mt-0.5 text-[11px] text-dim uppercase tracking-wider">+Goal diff</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2.5">
          <p className="font-display text-2xl font-bold text-ink">3</p>
          <p className="mt-0.5 text-[11px] text-dim uppercase tracking-wider">Correct result</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2.5">
          <p className="font-display text-2xl font-bold text-dim">1</p>
          <p className="mt-0.5 text-[11px] text-dim uppercase tracking-wider">Correct team score</p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
          <p className="font-display text-lg font-bold text-ink">+25</p>
          <p className="mt-0.5 text-[11px] text-dim uppercase tracking-wider">Champion bonus</p>
        </div>
        <div className="rounded-lg border border-[#9333ea]/30 bg-[#9333ea]/5 px-3 py-2">
          <p className="font-display text-lg font-bold text-[#c084fc]">+15</p>
          <p className="mt-0.5 text-[11px] text-dim uppercase tracking-wider">Ballon d&apos;Or bonus</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Upcoming Matches Section
// ─────────────────────────────────────────────
function UpcomingMatchCard({ match }: { match: Match }) {
  return (
    <Link
      href="/predict"
      className="rounded-xl border border-edge bg-panel hover:border-pitch/40 transition-colors p-4 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-dim">
          {match.stage.replace(/_/g, " ")}
          {match.group ? ` · Group ${match.group}` : ""}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-pitch">Predict now →</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {match.homeTeam?.code ? (
            <Flag code={match.homeTeam.code} width={20} />
          ) : (
            <span className="w-5 h-5 rounded-full bg-white/10 flex-shrink-0" />
          )}
          <span className="truncate text-sm font-medium text-ink">
            {match.homeTeam?.name ?? match.homeLabel ?? "TBD"}
          </span>
        </div>
        <span className="text-xs font-mono text-dim flex-shrink-0 px-2">vs</span>
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="truncate text-sm font-medium text-ink text-right">
            {match.awayTeam?.name ?? match.awayLabel ?? "TBD"}
          </span>
          {match.awayTeam?.code ? (
            <Flag code={match.awayTeam.code} width={20} />
          ) : (
            <span className="w-5 h-5 rounded-full bg-white/10 flex-shrink-0" />
          )}
        </div>
      </div>
      <p className="text-[11px] text-dim">
        <LocalTime iso={match.utcDate} />
        {match.venue ? ` · ${match.venue}` : ""}
      </p>
    </Link>
  );
}

// ─────────────────────────────────────────────
// My Predictions History (client-side, signed-in)
// ─────────────────────────────────────────────
interface MyHistoryProps {
  picks: Record<string, MatchPick>;
  matches: Match[];
  byMatch: Record<string, { points: number; exact: boolean; correctResult: boolean; correctGoalDiff: boolean }>;
}

function MyPredictionHistory({ picks, matches, byMatch }: MyHistoryProps) {
  const rows = useMemo(() => {
    return matches
      .filter((m) => picks[m.id])
      .map((match) => {
        const pick = picks[match.id];
        const scored = byMatch[match.id] ?? null;
        return { match, pick, scored };
      })
      .sort((a, b) => +new Date(a.match.utcDate) - +new Date(b.match.utcDate));
  }, [picks, matches, byMatch]);

  if (!rows.length) {
    return (
      <div className="rounded-xl border border-edge bg-panel px-4 py-8 text-center text-sm text-dim">
        No predictions yet. Head to the{" "}
        <Link href="/predict" className="text-pitch hover:underline">
          Prediction Pool
        </Link>{" "}
        to start picking.
      </div>
    );
  }

  const played = rows.filter((r) => r.scored !== null);
  const totalPoints = played.reduce((s, r) => s + (r.scored?.points ?? 0), 0);
  const exactCount = played.filter((r) => r.scored?.exact).length;
  const correctCount = played.filter((r) => r.scored?.correctResult && !r.scored.exact).length;
  const accuracy = played.length ? Math.round(((exactCount + correctCount) / played.length) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Mini summary */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg border border-edge bg-panel px-4 py-3 text-center">
          <p className="font-display text-2xl font-bold text-pitch">{totalPoints}</p>
          <p className="text-[11px] uppercase tracking-wider text-dim mt-0.5">Points scored</p>
        </div>
        <div className="rounded-lg border border-edge bg-panel px-4 py-3 text-center">
          <p className="font-display text-2xl font-bold text-ink">{rows.length}</p>
          <p className="text-[11px] uppercase tracking-wider text-dim mt-0.5">Predictions</p>
        </div>
        <div className="rounded-lg border border-edge bg-panel px-4 py-3 text-center">
          <p className="font-display text-2xl font-bold text-gold">{exactCount}</p>
          <p className="text-[11px] uppercase tracking-wider text-dim mt-0.5">Exact scores</p>
        </div>
        <div className="rounded-lg border border-edge bg-panel px-4 py-3 text-center">
          <p className="font-display text-2xl font-bold text-ink">{accuracy}%</p>
          <p className="text-[11px] uppercase tracking-wider text-dim mt-0.5">Accuracy</p>
        </div>
      </div>

      {/* Row list */}
      <div className="divide-y divide-edge rounded-xl border border-edge overflow-hidden">
        {rows.map(({ match, pick, scored }) => {
          const finished = match.status === "FINISHED";
          return (
            <div key={match.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 bg-panel hover:bg-white/[0.02] transition-colors">
              {/* Teams */}
              <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
                {match.homeTeam?.code && <Flag code={match.homeTeam.code} width={16} />}
                <span className="text-xs text-ink font-medium">{match.homeTeam?.code ?? "?"}</span>
                <span className="text-xs text-dim mx-1">vs</span>
                <span className="text-xs text-ink font-medium">{match.awayTeam?.code ?? "?"}</span>
                {match.awayTeam?.code && <Flag code={match.awayTeam.code} width={16} />}
              </div>

              {/* My prediction */}
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-dim">My pick</p>
                <p className="text-sm font-mono font-bold text-ink">
                  {pick.home}–{pick.away}
                </p>
              </div>

              {/* Actual score */}
              <div className="text-center min-w-[56px]">
                <p className="text-[10px] uppercase tracking-wider text-dim">Actual</p>
                {finished && match.score.home != null ? (
                  <p className="text-sm font-mono font-bold text-pitch">
                    {match.score.home}–{match.score.away}
                  </p>
                ) : (
                  <p className="text-sm font-mono text-dim">{statusLabel(match)}</p>
                )}
              </div>

              {/* Points badge */}
              <div className="ml-auto">
                {scored !== null ? (
                  pointsBadge(scored.points)
                ) : (
                  <span className="text-[10px] text-dim uppercase tracking-wider">Pending</span>
                )}
              </div>

              {/* Date */}
              <div className="w-full text-[10px] text-dim sm:hidden">
                <LocalTime iso={match.utcDate} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Leaderboard Table
// ─────────────────────────────────────────────
function LeaderboardTable({ rows, currentUserId }: { rows: LeaderRow[]; currentUserId?: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!rows.length) {
    return (
      <div className="rounded-xl border border-edge bg-panel px-4 py-8 text-center text-sm text-dim">
        No entries yet — be the first to join the pool.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-edge overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[2rem_1fr_3rem_3rem_3rem_3rem] gap-x-3 px-4 py-2.5 bg-black/30 border-b border-edge">
        <span className="text-[10px] uppercase tracking-widest text-dim">#</span>
        <span className="text-[10px] uppercase tracking-widest text-dim">Player</span>
        <span className="text-[10px] uppercase tracking-widest text-dim text-right">Pts</span>
        <span className="text-[10px] uppercase tracking-widest text-dim text-right">Exact</span>
        <span className="text-[10px] uppercase tracking-widest text-dim text-right hidden sm:block">Result</span>
        <span className="text-[10px] uppercase tracking-widest text-dim text-right hidden sm:block">Picks</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-edge bg-panel">
        {rows.map((row, index) => {
          const isMe = row.userId === currentUserId;
          const isExp = expanded === row.userId;
          return (
            <div
              key={row.userId}
              className={`transition-colors ${isMe ? "bg-pitch/5" : ""}`}
            >
              <button
                onClick={() => setExpanded(isExp ? null : row.userId)}
                className="grid grid-cols-[2rem_1fr_3rem_3rem_3rem_3rem] gap-x-3 w-full px-4 py-3 items-center hover:bg-white/[0.03] text-left"
              >
                <span className="flex justify-center">{rankBadge(index)}</span>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate text-sm font-medium text-ink">
                    {row.name}
                    {isMe && (
                      <span className="ml-1.5 text-[10px] text-pitch font-bold uppercase tracking-wider">(you)</span>
                    )}
                  </span>
                  {row.championHit && (
                    <span title="Champion correct" className="text-gold text-xs">🏆</span>
                  )}
                  {row.goldenBallHit && (
                    <span title="Ballon d'Or correct" className="text-[#c084fc] text-xs">⭐</span>
                  )}
                </div>
                <span className="text-right font-display font-bold text-pitch text-base">{row.points}</span>
                <span className="text-right text-sm font-mono text-gold">{row.exact}</span>
                <span className="text-right text-sm font-mono text-ink hidden sm:block">{row.correct}</span>
                <span className="text-right text-sm font-mono text-dim hidden sm:block">{row.picked}</span>
              </button>

              {/* Expanded row details */}
              {isExp && (
                <div className="px-4 pb-4 border-t border-edge bg-black/20">
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
                    <div>
                      <p className="text-dim uppercase tracking-wider">Total points</p>
                      <p className="font-bold text-pitch text-lg">{row.points}</p>
                    </div>
                    <div>
                      <p className="text-dim uppercase tracking-wider">Exact scores</p>
                      <p className="font-bold text-gold text-lg">{row.exact}</p>
                    </div>
                    <div>
                      <p className="text-dim uppercase tracking-wider">Correct results</p>
                      <p className="font-bold text-ink text-lg">{row.correct}</p>
                    </div>
                    <div>
                      <p className="text-dim uppercase tracking-wider">Predictions</p>
                      <p className="font-bold text-ink text-lg">{row.picked}</p>
                    </div>
                  </div>
                  {row.champion && (
                    <p className="mt-2 text-xs text-dim">
                      Champion pick:{" "}
                      <span className={`font-bold ${row.championHit ? "text-gold" : "text-ink"}`}>
                        {row.champion}
                        {row.championHit ? " ✓" : ""}
                      </span>
                    </p>
                  )}
                  {row.goldenBall && (
                    <p className="mt-1 text-xs text-dim">
                      Ballon d&apos;Or pick:{" "}
                      <span className={`font-bold ${row.goldenBallHit ? "text-[#c084fc]" : "text-ink"}`}>
                        {row.goldenBall}
                        {row.goldenBallHit ? " ✓" : ""}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function PredictLeaderboardPage() {
  const { data: matchData } = useSWR<Sourced<Match[]>>("/api/matches", jsonFetcher);
  const { data: predData } = useSWR<PredictionsPayload>("/api/predictions", jsonFetcher);
  const { data: lbData } = useSWR<LeaderboardPayload>("/api/leaderboard", jsonFetcher, { refreshInterval: 30000 });

  const matches = matchData?.data ?? [];
  const upcomingMatches = useMemo(
    () =>
      matches
        .filter((m) => statusKind(m.status) === "upcoming" && new Date(m.utcDate).getTime() > Date.now())
        .sort((a, b) => +new Date(a.utcDate) - +new Date(b.utcDate))
        .slice(0, 3),
    [matches],
  );

  const leaderboardEnabled = lbData?.enabled ?? false;
  const isSignedIn = predData?.enabled && predData.user;
  const myScore = predData?.score ?? null;
  const myPicks = predData?.picks ?? {};
  const myByMatch = myScore?.byMatch ?? {};

  // Pool-wide stats
  const poolSummary = lbData?.summary;
  const allPredictions = poolSummary?.totalPicks ?? 0;
  const totalPlayers = poolSummary?.players ?? 0;
  const lbRows = lbData?.rows ?? [];

  // Accuracy %: ratio of picks that scored at least a correct result
  const myAccuracy = useMemo(() => {
    if (!myScore || myScore.picked === 0) return null;
    const played = Object.values(myByMatch).length;
    if (!played) return null;
    const hits = Object.values(myByMatch).filter((s) => s.correctResult || s.exact).length;
    return Math.round((hits / played) * 100);
  }, [myScore, myByMatch]);

  // Determine current user's rank
  const currentUserId = predData?.user?.id;
  const myRank = useMemo(() => {
    if (!currentUserId || !lbRows.length) return null;
    const idx = lbRows.findIndex((r) => r.userId === currentUserId);
    return idx >= 0 ? idx + 1 : null;
  }, [currentUserId, lbRows]);

  return (
    <div className="mx-auto max-w-shell px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-dim">
        <Link href="/" className="hover:text-ink">War Room</Link>
        <span>/</span>
        <Link href="/predict" className="hover:text-ink">Predict</Link>
        <span>/</span>
        <span className="text-ink">Leaderboard</span>
      </div>

      {/* Hero */}
      <div className="mt-4 overflow-hidden rounded-xl border border-edge bg-[linear-gradient(135deg,rgba(11,18,32,0.98),rgba(20,40,20,0.72))]">
        <div className="px-5 py-5 md:px-7 md:py-6">
          <p className="text-xs uppercase tracking-[0.28em] text-pitch">Score Predictor</p>
          <h1 className="mt-1 font-display text-3xl font-bold uppercase leading-tight tracking-wide md:text-5xl">
            Leaderboard
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-dim">
            Predict every scoreline, pick the champion and Ballon d&apos;Or winner — climb the office table. Picks lock at kickoff.
          </p>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-2 gap-px border-t border-edge sm:grid-cols-4">
          <div className="bg-panel/60 px-4 py-3 text-center">
            <p className="font-display text-2xl font-bold text-pitch">{totalPlayers}</p>
            <p className="text-[11px] uppercase tracking-wider text-dim mt-0.5">Players</p>
          </div>
          <div className="bg-panel/60 px-4 py-3 text-center">
            <p className="font-display text-2xl font-bold text-ink">{allPredictions}</p>
            <p className="text-[11px] uppercase tracking-wider text-dim mt-0.5">Total picks</p>
          </div>
          {myRank ? (
            <div className="bg-panel/60 px-4 py-3 text-center">
              <p className="font-display text-2xl font-bold text-gold">#{myRank}</p>
              <p className="text-[11px] uppercase tracking-wider text-dim mt-0.5">My rank</p>
            </div>
          ) : (
            <div className="bg-panel/60 px-4 py-3 text-center">
              <p className="font-display text-2xl font-bold text-dim">—</p>
              <p className="text-[11px] uppercase tracking-wider text-dim mt-0.5">My rank</p>
            </div>
          )}
          {myAccuracy !== null ? (
            <div className="bg-panel/60 px-4 py-3 text-center">
              <p className="font-display text-2xl font-bold text-ink">{myAccuracy}%</p>
              <p className="text-[11px] uppercase tracking-wider text-dim mt-0.5">My accuracy</p>
            </div>
          ) : (
            <div className="bg-panel/60 px-4 py-3 text-center">
              <p className="font-display text-2xl font-bold text-dim">—</p>
              <p className="text-[11px] uppercase tracking-wider text-dim mt-0.5">My accuracy</p>
            </div>
          )}
        </div>
      </div>

      {/* Scoring info */}
      <div className="mt-6">
        <ScoringInfo />
      </div>

      {/* Upcoming predictions */}
      {upcomingMatches.length > 0 && (
        <section className="mt-8">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold uppercase tracking-wider">
              <span aria-hidden className="inline-block h-4 w-1 rounded bg-gold" />
              Upcoming — Predict Now
            </h2>
            <Link href="/predict" className="text-xs text-dim hover:text-ink">
              View all →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingMatches.map((m) => (
              <UpcomingMatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* Leaderboard table */}
      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold uppercase tracking-wider">
            <span aria-hidden className="inline-block h-4 w-1 rounded bg-gold" />
            Office Table
          </h2>
          {lbData && (
            <span className="text-xs text-dim">
              {leaderboardEnabled
                ? `${lbRows.length} player${lbRows.length !== 1 ? "s" : ""}`
                : "Pool not active"}
            </span>
          )}
        </div>

        {!lbData ? (
          <div className="rounded-xl border border-edge bg-panel px-4 py-8 text-center text-sm text-dim">
            Loading leaderboard…
          </div>
        ) : !leaderboardEnabled ? (
          <div className="rounded-xl border border-edge bg-panel px-4 py-8 text-center">
            <p className="text-sm text-dim">The prediction pool is not currently active.</p>
            <Link href="/predict" className="mt-2 inline-block text-xs text-pitch hover:underline">
              Go to predictions →
            </Link>
          </div>
        ) : (
          <LeaderboardTable rows={lbRows} currentUserId={currentUserId} />
        )}
      </section>

      {/* My prediction history */}
      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold uppercase tracking-wider">
            <span aria-hidden className="inline-block h-4 w-1 rounded bg-gold" />
            My Prediction History
          </h2>
          {myScore && (
            <span className="text-xs text-dim">
              {myScore.picked} pick{myScore.picked !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {!predData ? (
          <div className="rounded-xl border border-edge bg-panel px-4 py-8 text-center text-sm text-dim">
            Loading your predictions…
          </div>
        ) : !predData.enabled ? (
          <div className="rounded-xl border border-edge bg-panel px-4 py-8 text-center">
            <p className="text-sm text-dim">Prediction pool is not active yet.</p>
          </div>
        ) : !isSignedIn ? (
          <div className="rounded-xl border border-edge bg-panel px-4 py-8 text-center space-y-3">
            <p className="text-sm text-dim">Sign in to track your personal prediction history and see your score.</p>
            <Link
              href="/predict"
              className="inline-flex items-center gap-1.5 rounded-lg border border-pitch/40 bg-pitch/10 px-4 py-2 text-sm font-medium text-pitch hover:bg-pitch/20 transition-colors"
            >
              Sign in to predict →
            </Link>
          </div>
        ) : (
          <MyPredictionHistory
            picks={myPicks}
            matches={matches}
            byMatch={myByMatch as Record<string, { points: number; exact: boolean; correctResult: boolean; correctGoalDiff: boolean }>}
          />
        )}
      </section>

      {/* My bonuses */}
      {isSignedIn && myScore && (predData.champion || predData.goldenBall) && (
        <section className="mt-6">
          <div className="rounded-xl border border-edge bg-panel p-4 space-y-2">
            <p className="text-xs uppercase tracking-widest text-dim font-bold">Bonus picks</p>
            {predData.champion && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-dim">World Cup Champion</span>
                <span className={`font-bold ${myScore.championHit ? "text-gold" : "text-ink"}`}>
                  {predData.champion}
                  {myScore.championHit ? " ✓ +25" : ""}
                </span>
              </div>
            )}
            {predData.goldenBall && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-dim">Ballon d&apos;Or / Golden Ball</span>
                <span className={`font-bold ${myScore.goldenBallHit ? "text-[#c084fc]" : "text-ink"}`}>
                  {predData.goldenBall}
                  {myScore.goldenBallHit ? " ✓ +15" : ""}
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-edge flex items-center justify-between">
              <span className="text-xs text-dim uppercase tracking-wider">Total score</span>
              <span className="font-display text-xl font-bold text-pitch">{myScore.points} pts</span>
            </div>
          </div>
        </section>
      )}

      {/* Footer link */}
      <div className="mt-8 text-center">
        <Link
          href="/predict"
          className="inline-flex items-center gap-1.5 rounded-lg border border-pitch/40 bg-pitch/10 px-5 py-2.5 text-sm font-medium text-pitch hover:bg-pitch/20 transition-colors"
        >
          ← Back to Prediction Pool
        </Link>
      </div>
    </div>
  );
}
