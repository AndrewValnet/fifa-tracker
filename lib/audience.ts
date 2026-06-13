// Transparent ESTIMATE of a match's global TV audience. NOT a live count —
// FIFA/broadcasters don't publish real-time viewership through any free API
// (see README "honest limits"). This is a deterministic model anchored to real
// FIFA benchmarks (Qatar 2022: avg 175M/match; final ~571M avg-live-minute /
// 1.42B total reach), driven only by data already on the Match object plus a
// small static reach table (data/team-reach.json). Pure + client-safe.

import type { Match, Stage } from "@/lib/types";

export interface TeamReach {
  popMillions: number;
  fifaRank: number;
}
export type ReachLookup = Record<string, TeamReach | undefined>;

export interface AudienceEstimate {
  /** Modeled average audience per live minute, millions. */
  avgLiveMinuteM: number;
  /** Modeled total who watch >= 1 minute, millions (cumulative reach target). */
  projectedTotalReachM: number;
  /** Modeled people watching at `now`, millions (0 unless live). */
  watchingNowM: number;
  /** Modeled cumulative reach so far at `now`, millions. */
  totalWatchedM: number;
  phase: "pre" | "live" | "post";
}

// Average-live-minute baseline per stage (millions), calibrated so the blended
// tournament average sits near Qatar's 175M and the final near ~571M.
const STAGE_BASE_M: Record<Stage, number> = {
  GROUP_STAGE: 140,
  LAST_32: 175,
  LAST_16: 230,
  QUARTER_FINALS: 330,
  SEMI_FINALS: 450,
  THIRD_PLACE: 300,
  FINAL: 571,
};

// reach (watched >=1 min) as a multiple of avg-live-minute — bigger for later
// rounds (everyone tunes in); anchored to the final's 1420/571 ≈ 2.5.
const REACH_MULTIPLIER: Record<Stage, number> = {
  GROUP_STAGE: 1.8,
  LAST_32: 1.9,
  LAST_16: 2.0,
  QUARTER_FINALS: 2.1,
  SEMI_FINALS: 2.2,
  THIRD_PLACE: 2.0,
  FINAL: 2.5,
};

const HOSTS = new Set(["USA", "MEX", "CAN"]);
const FULL_MATCH_MS = 140 * 60_000; // generous window incl. stoppage + extra time

function rankTier(rank: number): number {
  if (rank <= 5) return 1.0;
  if (rank <= 15) return 0.8;
  if (rank <= 30) return 0.6;
  if (rank <= 50) return 0.45;
  return 0.3;
}

function teamWeight(code: string | null | undefined, reach: ReachLookup): number {
  const r = (code && reach[code]) || undefined;
  const pop = r && Number.isFinite(r.popMillions) ? r.popMillions : 15;
  const rank = r && Number.isFinite(r.fifaRank) ? r.fifaRank : 60;
  const popTerm = Math.log10(pop + 10) / Math.log10(1500); // ~0..1
  return 0.5 * popTerm + 0.5 * rankTier(rank);
}

// US-Eastern kickoff hour as a proxy for "how much of the world is awake".
function kickoffFactor(utcDate: string): number {
  let hour = 12;
  try {
    hour =
      Number(
        new Intl.DateTimeFormat("en-US", {
          timeZone: "America/New_York",
          hour: "2-digit",
          hourCycle: "h23",
        }).format(new Date(utcDate)),
      ) % 24;
  } catch {
    hour = new Date(utcDate).getUTCHours();
  }
  if (hour >= 18 && hour <= 21) return 1.15; // EU primetime + Americas afternoon
  if ((hour >= 15 && hour < 18) || (hour > 21 && hour <= 23)) return 1.0;
  if (hour >= 12 && hour < 15) return 0.85;
  return 0.75; // overnight in the host region
}

function staticReach(match: Match, reach: ReachLookup): { avg: number; total: number } {
  const base = STAGE_BASE_M[match.stage] ?? 140;
  const mtf = teamWeight(match.homeTeam?.code, reach) + teamWeight(match.awayTeam?.code, reach); // ~0.6..2.0
  const hostBonus = HOSTS.has(match.homeTeam?.code ?? "") || HOSTS.has(match.awayTeam?.code ?? "") ? 0.25 : 0;
  const teamMult = Math.min(1.0, mtf / 2 + hostBonus); // 0.3..1.0
  const avg = base * (0.6 + 0.4 * teamMult) * kickoffFactor(match.utcDate);
  const total = avg * (REACH_MULTIPLIER[match.stage] ?? 1.9);
  return { avg, total };
}

function parseMinute(s: string): number {
  const m = s.match(/(\d+)(?:\+(\d+))?/);
  if (!m) return NaN;
  return Number(m[1]) + (m[2] ? Number(m[2]) : 0);
}

/** Extra interest from a recent goal (decays over ~3 minutes), capped. */
function goalBoost(match: Match, minute: number): number {
  let boost = 0;
  for (const e of match.events) {
    if (e.type !== "GOAL") continue;
    const gm = parseMinute(e.minute);
    if (!Number.isFinite(gm)) continue;
    const age = minute - gm;
    if (age >= 0 && age <= 3) boost += 0.08 * (1 - age / 3);
  }
  return Math.min(0.2, boost);
}

function currentMinute(match: Match, now: number): number {
  if (typeof match.minute === "number" && match.minute > 0) return match.minute;
  return Math.floor((now - new Date(match.utcDate).getTime()) / 60_000);
}

// Audience-curve multiplier of avg-live-minute across the match timeline.
function liveShape(match: Match, now: number): number {
  if (match.status === "PAUSED") return 0.8; // halftime dip
  const m = currentMinute(match, now);
  if (m < 0) {
    const mins = -m; // pre-kickoff tune-in ramp over the last 15 min
    return mins <= 15 ? 0.6 * (1 - mins / 15) : 0;
  }
  let base: number;
  if (m <= 1) base = 0.85;
  else if (m <= 45) base = 0.85 + (0.1 * (m - 1)) / 44; // 0.85 → 0.95
  else if (m <= 75) base = 0.92 + (0.13 * (m - 45)) / 30; // rebuild after HT
  else if (m <= 90) base = 1.05 + (0.18 * (m - 75)) / 15; // climb to ~1.23
  else base = 1.25; // stoppage-time tension
  return base * (1 + goalBoost(match, m));
}

// Deterministic ±2% jitter, stable within a 5s bucket (no Math.random so the
// number ticks believably without flickering across re-renders).
function jitter(matchId: string, now: number): number {
  const s = `${matchId}:${Math.floor(now / 5000)}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return ((Math.abs(h) % 1000) / 1000 - 0.5) * 0.04;
}

function reachFraction(minute: number): number {
  if (minute <= 0) return 0;
  const x = Math.min(1, minute / 95);
  return 1 - Math.pow(1 - x, 1.5); // ease-out: most have tuned in by full time
}

export function estimateAudience(match: Match, reach: ReachLookup, now: number): AudienceEstimate {
  const { avg, total } = staticReach(match, reach);
  const kickoff = new Date(match.utcDate).getTime();
  const finished = match.status === "FINISHED" || match.status === "AWARDED";
  const cancelled = match.status === "CANCELLED" || match.status === "POSTPONED" || match.status === "SUSPENDED";

  let phase: AudienceEstimate["phase"];
  if (cancelled) phase = "post";
  else if (now < kickoff) phase = "pre";
  else if (!finished && now <= kickoff + FULL_MATCH_MS) phase = "live";
  else phase = "post";

  const minute = currentMinute(match, now);
  const watchingNowM =
    phase === "live" || (phase === "pre" && minute >= -15)
      ? Math.max(0, avg * liveShape(match, now) * (1 + jitter(match.id, now)))
      : 0;

  let totalWatchedM: number;
  if (phase === "pre") totalWatchedM = 0;
  else if (phase === "post") totalWatchedM = cancelled ? 0 : total;
  else totalWatchedM = total * reachFraction(minute);

  return {
    avgLiveMinuteM: avg,
    projectedTotalReachM: total,
    watchingNowM,
    totalWatchedM,
    phase,
  };
}

/** "1.2B", "340M", "8.5M" from a value in MILLIONS. */
export function fmtAudience(millions: number): string {
  if (!Number.isFinite(millions) || millions <= 0) return "—";
  if (millions >= 1000) return `${(millions / 1000).toFixed(2)}B`;
  if (millions >= 100) return `${Math.round(millions)}M`;
  return `${millions.toFixed(1)}M`;
}
