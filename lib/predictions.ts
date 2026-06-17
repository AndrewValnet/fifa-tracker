// Account-backed office prediction pool. Scoring is computed on demand from
// match results, so the leaderboard can be rebuilt from stored picks anytime.
//
// Points:
//   6 exact score
//   4 correct result + goal difference
//   3 correct result
//   1 correct team goals OR opponent goals
//   +25 champion bonus
//   +15 ballon d'or / golden ball bonus (set via WC26_GOLDEN_BALL env var)

import { getAllMatches } from "@/lib/data";
import { getUserById } from "@/lib/accounts";
import { poolDbEnabled, poolQuery } from "@/lib/pool-db";
import { redis, redisEnabled, redisPipe, sanitizeKey } from "@/lib/redis";
import { goldenBallWinner, GOLDEN_BALL_BONUS } from "@/data/ballon-dor-candidates";
import type { Match } from "@/lib/types";

export const CHAMPION_BONUS = 25;
const MAX_PLAYERS = 500;
const EXACT_POINTS = 6;
const DIFF_POINTS = 4;
const RESULT_POINTS = 3;
const GOAL_POINTS = 1;

export type PickOutcome = "HOME" | "DRAW" | "AWAY";

export interface MatchPick {
  outcome: PickOutcome;
  home: number;
  away: number;
  updatedAt: string;
}

export interface PlayerPredictions {
  picks: Record<string, MatchPick>;
  champion: string | null;
  goldenBall: string | null;
}

export interface PickScore {
  points: number;
  exact: boolean;
  correctResult: boolean;
  correctGoalDiff: boolean;
  locked: boolean;
}

export interface PlayerScore {
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

export interface PublicMatchPrediction {
  userId: string;
  name: string;
  pick: MatchPick;
  points: number;
  exact: boolean;
  correctResult: boolean;
}

export interface PublicProfile {
  userId: string;
  name: string;
  champion: string | null;
  goldenBall: string | null;
  score: ReturnType<typeof scorePredictions>;
  picks: {
    match: Match;
    pick: MatchPick;
    points: number;
    exact: boolean;
    correctResult: boolean;
  }[];
}

export interface PoolSummary {
  players: number;
  totalPicks: number;
  averagePicks: number;
  leader: PlayerScore | null;
}

interface PickRow {
  match_id: string;
  outcome: PickOutcome;
  home_goals: number;
  away_goals: number;
  updated_at: Date | string;
}

interface LeaderPickRow extends PickRow {
  user_id: string;
  name: string;
  champion_code: string | null;
  golden_ball_code: string | null;
}

interface PublicUserRow {
  id: string;
  name: string;
  champion_code: string | null;
  golden_ball_code: string | null;
}

function picksKey(userId: string): string {
  return `pool:picks:${sanitizeKey(userId)}`;
}

function championKey(userId: string): string {
  return `pool:champion:${sanitizeKey(userId)}`;
}

function goldenBallKey(userId: string): string {
  return `pool:goldenball:${sanitizeKey(userId)}`;
}

export function predictionsEnabled(): boolean {
  return poolDbEnabled() || redisEnabled();
}

function parsePick(raw: unknown): MatchPick | null {
  if (typeof raw !== "string") return null;
  try {
    const pick = JSON.parse(raw) as MatchPick;
    if (!["HOME", "DRAW", "AWAY"].includes(pick.outcome)) return null;
    if (!Number.isInteger(pick.home) || !Number.isInteger(pick.away)) return null;
    if (pick.home < 0 || pick.home > 30 || pick.away < 0 || pick.away > 30) return null;
    return {
      outcome: pick.outcome,
      home: pick.home,
      away: pick.away,
      updatedAt: pick.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function parsePicks(raw: unknown): Record<string, MatchPick> {
  const out: Record<string, MatchPick> = {};
  const add = (key: unknown, value: unknown) => {
    const id = sanitizeKey(String(key));
    const pick = parsePick(value);
    if (id && pick) out[id] = pick;
  };
  if (Array.isArray(raw)) {
    for (let i = 0; i + 1 < raw.length; i += 2) add(raw[i], raw[i + 1]);
  } else if (raw && typeof raw === "object") {
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) add(key, value);
  }
  return out;
}

function outcomeFor(home: number, away: number): PickOutcome {
  if (home > away) return "HOME";
  if (away > home) return "AWAY";
  return "DRAW";
}

export function normalizePick(input: unknown): MatchPick | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as { home?: unknown; away?: unknown; h?: unknown; a?: unknown; outcome?: unknown };
  const home = Number(raw.home ?? raw.h);
  const away = Number(raw.away ?? raw.a);
  if (!Number.isInteger(home) || !Number.isInteger(away)) return null;
  if (home < 0 || home > 30 || away < 0 || away > 30) return null;
  const implied = outcomeFor(home, away);
  const outcome = raw.outcome === "HOME" || raw.outcome === "DRAW" || raw.outcome === "AWAY" ? raw.outcome : implied;
  return { outcome, home, away, updatedAt: new Date().toISOString() };
}

export function isLocked(match: Match, now = Date.now()): boolean {
  return match.status !== "SCHEDULED" && match.status !== "TIMED" ? true : new Date(match.utcDate).getTime() <= now;
}

function scoreOne(pick: MatchPick | undefined, match: Match): PickScore {
  if (!pick) return { points: 0, exact: false, correctResult: false, correctGoalDiff: false, locked: isLocked(match) };
  if (match.status !== "FINISHED" || match.score.home == null || match.score.away == null) {
    return { points: 0, exact: false, correctResult: false, correctGoalDiff: false, locked: isLocked(match) };
  }

  const actualHome = match.score.home;
  const actualAway = match.score.away;
  const actualOutcome = outcomeFor(actualHome, actualAway);
  const exact = pick.home === actualHome && pick.away === actualAway;
  const correctResult = pick.outcome === actualOutcome;
  const correctGoalDiff = correctResult && pick.home - pick.away === actualHome - actualAway;

  let points = 0;
  if (exact) points = EXACT_POINTS;
  else if (correctGoalDiff) points = DIFF_POINTS;
  else if (correctResult) points = RESULT_POINTS;
  if (!exact) {
    if (pick.home === actualHome) points += GOAL_POINTS;
    if (pick.away === actualAway) points += GOAL_POINTS;
  }

  return { points, exact, correctResult, correctGoalDiff, locked: true };
}

function championWinner(matches: Match[]): string | null {
  const final = matches.find(
    (m) => m.stage === "FINAL" && m.status === "FINISHED" && m.score.home != null && m.score.away != null,
  );
  if (!final) return null;
  if (final.score.home! > final.score.away!) return final.homeTeam?.code ?? null;
  if (final.score.home! < final.score.away!) return final.awayTeam?.code ?? null;
  return null;
}

export function scorePredictions(
  player: PlayerPredictions,
  matches: Match[],
  winner = championWinner(matches),
  gbWinner = goldenBallWinner(),
): {
  points: number;
  exact: number;
  correct: number;
  picked: number;
  championHit: boolean;
  goldenBallHit: boolean;
  byMatch: Record<string, PickScore>;
} {
  let points = 0;
  let exact = 0;
  let correct = 0;
  const byMatch: Record<string, PickScore> = {};

  for (const match of matches) {
    const pick = player.picks[match.id];
    if (!pick) continue;
    const score = scoreOne(pick, match);
    byMatch[match.id] = score;
    points += score.points;
    if (score.exact) exact++;
    if (score.correctResult) correct++;
  }

  const championHit = !!winner && player.champion === winner;
  if (championHit) points += CHAMPION_BONUS;

  const goldenBallHit = !!gbWinner && player.goldenBall === gbWinner;
  if (goldenBallHit) points += GOLDEN_BALL_BONUS;

  return { points, exact, correct, picked: Object.keys(player.picks).length, championHit, goldenBallHit, byMatch };
}

export async function savePredictions(
  userId: string,
  data: { champion?: string | null; goldenBall?: string | null; picks?: Record<string, unknown> },
): Promise<{ ok: boolean; saved: number; skippedLocked: string[] }> {
  if (!predictionsEnabled()) return { ok: false, saved: 0, skippedLocked: [] };
  const uid = sanitizeKey(userId);
  if (!uid) return { ok: false, saved: 0, skippedLocked: [] };

  const matches = (await getAllMatches()).data;
  const byId = new Map(matches.map((match) => [match.id, match]));
  const skippedLocked: string[] = [];
  let saved = 0;

  if (poolDbEnabled()) {
    if (data.champion !== undefined || data.goldenBall !== undefined) {
      const champion = data.champion !== undefined ? sanitizeKey(data.champion ?? "").slice(0, 8) || null : undefined;
      const goldenBall = data.goldenBall !== undefined ? sanitizeKey(data.goldenBall ?? "").slice(0, 32) || null : undefined;
      if (champion !== undefined && goldenBall !== undefined) {
        await poolQuery("update pool_users set champion_code = $1, golden_ball_code = $2 where id = $3", [champion, goldenBall, uid]);
      } else if (champion !== undefined) {
        await poolQuery("update pool_users set champion_code = $1 where id = $2", [champion, uid]);
      } else if (goldenBall !== undefined) {
        await poolQuery("update pool_users set golden_ball_code = $1 where id = $2", [goldenBall, uid]);
      }
    }

    if (data.picks) {
      for (const [matchId, raw] of Object.entries(data.picks)) {
        const id = sanitizeKey(matchId);
        const match = byId.get(id);
        const pick = normalizePick(raw);
        if (!id || !match || !pick) continue;
        if (isLocked(match)) {
          skippedLocked.push(id);
          continue;
        }
        await poolQuery(
          `insert into pool_picks (user_id, match_id, outcome, home_goals, away_goals, updated_at)
           values ($1, $2, $3, $4, $5, $6)
           on conflict (user_id, match_id)
           do update set
             outcome = excluded.outcome,
             home_goals = excluded.home_goals,
             away_goals = excluded.away_goals,
             updated_at = excluded.updated_at`,
          [uid, id, pick.outcome, pick.home, pick.away, pick.updatedAt],
        );
        saved++;
      }
    }

    return { ok: true, saved, skippedLocked };
  }

  const cmds: (string | number)[][] = [["SADD", "pool:users", uid]];

  if (data.champion !== undefined) {
    const champion = sanitizeKey(data.champion ?? "").slice(0, 8);
    if (champion) cmds.push(["SET", championKey(uid), champion]);
    else cmds.push(["DEL", championKey(uid)]);
  }

  if (data.goldenBall !== undefined) {
    const gb = sanitizeKey(data.goldenBall ?? "").slice(0, 32);
    if (gb) cmds.push(["SET", goldenBallKey(uid), gb]);
    else cmds.push(["DEL", goldenBallKey(uid)]);
  }

  if (data.picks) {
    const hset: (string | number)[] = ["HSET", picksKey(uid)];
    for (const [matchId, raw] of Object.entries(data.picks)) {
      const id = sanitizeKey(matchId);
      const match = byId.get(id);
      const pick = normalizePick(raw);
      if (!id || !match || !pick) continue;
      if (isLocked(match)) {
        skippedLocked.push(id);
        continue;
      }
      hset.push(id, JSON.stringify(pick));
      saved++;
    }
    if (hset.length > 1) cmds.push(hset);
  }

  if (cmds.length === 1 && !saved) return { ok: true, saved, skippedLocked };
  const ok = (await redisPipe(cmds)) != null;
  return { ok, saved, skippedLocked };
}

export async function getPlayer(userId: string): Promise<PlayerPredictions | null> {
  const uid = sanitizeKey(userId);
  if (!uid) return null;
  if (poolDbEnabled()) {
    const [pickRows, userRows] = await Promise.all([
      poolQuery<PickRow>("select * from pool_picks where user_id = $1", [uid]),
      poolQuery<{ champion_code: string | null; golden_ball_code: string | null }>(
        "select champion_code, golden_ball_code from pool_users where id = $1 limit 1",
        [uid],
      ),
    ]);
    const picks: Record<string, MatchPick> = {};
    for (const row of pickRows.rows) {
      picks[row.match_id] = {
        outcome: row.outcome,
        home: row.home_goals,
        away: row.away_goals,
        updatedAt: new Date(row.updated_at).toISOString(),
      };
    }
    return {
      picks,
      champion: userRows.rows[0]?.champion_code ?? null,
      goldenBall: userRows.rows[0]?.golden_ball_code ?? null,
    };
  }
  if (!redisEnabled()) return null;
  const res = await redisPipe([
    ["HGETALL", picksKey(uid)],
    ["GET", championKey(uid)],
    ["GET", goldenBallKey(uid)],
  ]);
  if (!res) return null;
  return {
    picks: parsePicks(res[0]),
    champion: (res[1] as string) ?? null,
    goldenBall: (res[2] as string) ?? null,
  };
}

export async function getLeaderboard(): Promise<PlayerScore[]> {
  if (!predictionsEnabled()) return [];
  const matches = await getAllMatches().then((x) => x.data);
  const winner = championWinner(matches);
  const gbWinner = goldenBallWinner();
  const rows: PlayerScore[] = [];

  if (poolDbEnabled()) {
    const res = await poolQuery<LeaderPickRow>(
      `select
         u.id as user_id,
         u.name,
         u.champion_code,
         u.golden_ball_code,
         p.match_id,
         p.outcome,
         p.home_goals,
         p.away_goals,
         p.updated_at
       from pool_users u
       left join pool_picks p on p.user_id = u.id
       order by u.created_at asc
       limit $1`,
      [MAX_PLAYERS * 120],
    );
    const grouped = new Map<
      string,
      { name: string; champion: string | null; goldenBall: string | null; picks: Record<string, MatchPick> }
    >();
    for (const row of res.rows) {
      const current = grouped.get(row.user_id) ?? {
        name: row.name,
        champion: row.champion_code,
        goldenBall: row.golden_ball_code,
        picks: {},
      };
      if (row.match_id) {
        current.picks[row.match_id] = {
          outcome: row.outcome,
          home: row.home_goals,
          away: row.away_goals,
          updatedAt: new Date(row.updated_at).toISOString(),
        };
      }
      grouped.set(row.user_id, current);
    }
    for (const [userId, player] of grouped) {
      const score = scorePredictions(
        { picks: player.picks, champion: player.champion, goldenBall: player.goldenBall },
        matches,
        winner,
        gbWinner,
      );
      rows.push({
        userId,
        name: player.name,
        points: score.points,
        exact: score.exact,
        correct: score.correct,
        picked: score.picked,
        champion: player.champion,
        championHit: score.championHit,
        goldenBall: player.goldenBall,
        goldenBallHit: score.goldenBallHit,
      });
    }
    return rows.sort((a, b) => b.points - a.points || b.exact - a.exact || b.correct - a.correct || b.picked - a.picked);
  }

  const players = ((await redis("SMEMBERS", "pool:users")) as string[] | null) ?? [];
  if (!players.length) return [];
  const ids = players.slice(0, MAX_PLAYERS);
  const cmds: (string | number)[][] = [];
  for (const uid of ids) {
    cmds.push(["HGETALL", picksKey(uid)], ["GET", championKey(uid)], ["GET", goldenBallKey(uid)]);
  }

  const res = await redisPipe(cmds);
  if (!res) return [];

  for (let i = 0; i < ids.length; i++) {
    const user = await getUserById(ids[i]);
    if (!user) continue;
    const player: PlayerPredictions = {
      picks: parsePicks(res[i * 3]),
      champion: (res[i * 3 + 1] as string) ?? null,
      goldenBall: (res[i * 3 + 2] as string) ?? null,
    };
    const score = scorePredictions(player, matches, winner, gbWinner);
    rows.push({
      userId: ids[i],
      name: user.name,
      points: score.points,
      exact: score.exact,
      correct: score.correct,
      picked: score.picked,
      champion: player.champion,
      championHit: score.championHit,
      goldenBall: player.goldenBall,
      goldenBallHit: score.goldenBallHit,
    });
  }

  return rows.sort((a, b) => b.points - a.points || b.exact - a.exact || b.correct - a.correct || b.picked - a.picked);
}

export async function getMatchPredictions(matchId: string): Promise<PublicMatchPrediction[]> {
  const id = sanitizeKey(matchId);
  if (!id || !predictionsEnabled()) return [];
  const matches = await getAllMatches().then((x) => x.data);
  const match = matches.find((m) => m.id === id);
  if (!match) return [];

  if (poolDbEnabled()) {
    const res = await poolQuery<LeaderPickRow>(
      `select
         u.id as user_id,
         u.name,
         u.champion_code,
         u.golden_ball_code,
         p.match_id,
         p.outcome,
         p.home_goals,
         p.away_goals,
         p.updated_at
       from pool_picks p
       join pool_users u on u.id = p.user_id
       where p.match_id = $1
       order by p.updated_at asc`,
      [id],
    );
    return res.rows.map((row) => {
      const pick: MatchPick = {
        outcome: row.outcome,
        home: row.home_goals,
        away: row.away_goals,
        updatedAt: new Date(row.updated_at).toISOString(),
      };
      const score = scoreOne(pick, match);
      return {
        userId: row.user_id,
        name: row.name,
        pick,
        points: score.points,
        exact: score.exact,
        correctResult: score.correctResult,
      };
    });
  }

  if (!redisEnabled()) return [];
  const players = ((await redis("SMEMBERS", "pool:users")) as string[] | null) ?? [];
  const out: PublicMatchPrediction[] = [];
  for (const userId of players.slice(0, MAX_PLAYERS)) {
    const user = await getUserById(userId);
    const player = await getPlayer(userId);
    const pick = player?.picks[id];
    if (!user || !pick) continue;
    const score = scoreOne(pick, match);
    out.push({ userId, name: user.name, pick, points: score.points, exact: score.exact, correctResult: score.correctResult });
  }
  return out;
}

export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  const uid = sanitizeKey(userId);
  if (!uid || !predictionsEnabled()) return null;
  const matches = await getAllMatches().then((x) => x.data);
  const byId = new Map(matches.map((match) => [match.id, match]));

  if (poolDbEnabled()) {
    const [userRows, pickRows] = await Promise.all([
      poolQuery<PublicUserRow>(
        "select id, name, champion_code, golden_ball_code from pool_users where id = $1 limit 1",
        [uid],
      ),
      poolQuery<PickRow>("select * from pool_picks where user_id = $1 order by updated_at desc", [uid]),
    ]);
    const user = userRows.rows[0];
    if (!user) return null;
    const picks: Record<string, MatchPick> = {};
    for (const row of pickRows.rows) {
      picks[row.match_id] = {
        outcome: row.outcome,
        home: row.home_goals,
        away: row.away_goals,
        updatedAt: new Date(row.updated_at).toISOString(),
      };
    }
    const player: PlayerPredictions = { picks, champion: user.champion_code, goldenBall: user.golden_ball_code };
    const score = scorePredictions(player, matches);
    return {
      userId: user.id,
      name: user.name,
      champion: user.champion_code,
      goldenBall: user.golden_ball_code,
      score,
      picks: Object.entries(picks)
        .map(([matchId, pick]) => {
          const match = byId.get(matchId);
          if (!match) return null;
          const one = score.byMatch[matchId] ?? scoreOne(pick, match);
          return { match, pick, points: one.points, exact: one.exact, correctResult: one.correctResult };
        })
        .filter((row): row is PublicProfile["picks"][number] => Boolean(row))
        .sort((a, b) => +new Date(a.match.utcDate) - +new Date(b.match.utcDate)),
    };
  }

  const user = await getUserById(uid);
  const player = await getPlayer(uid);
  if (!user || !player) return null;
  const score = scorePredictions(player, matches);
  return {
    userId: uid,
    name: user.name,
    champion: player.champion,
    goldenBall: player.goldenBall,
    score,
    picks: Object.entries(player.picks)
      .map(([matchId, pick]) => {
        const match = byId.get(matchId);
        if (!match) return null;
        const one = score.byMatch[matchId] ?? scoreOne(pick, match);
        return { match, pick, points: one.points, exact: one.exact, correctResult: one.correctResult };
      })
      .filter((row): row is PublicProfile["picks"][number] => Boolean(row))
      .sort((a, b) => +new Date(a.match.utcDate) - +new Date(b.match.utcDate)),
  };
}

export async function getPoolSummary(): Promise<PoolSummary> {
  const rows = await getLeaderboard();
  const totalPicks = rows.reduce((sum, row) => sum + row.picked, 0);
  return {
    players: rows.length,
    totalPicks,
    averagePicks: rows.length ? totalPicks / rows.length : 0,
    leader: rows[0] ?? null,
  };
}
