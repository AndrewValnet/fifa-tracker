// Score pick'em + champion prediction, stored in Upstash. Scoring is computed
// on demand from real results (no incremental state to corrupt). Disabled
// (returns empty) without UPSTASH_* env.
//
// Points: 5 exact score · 3 correct result + goal difference · 2 correct result.
// Champion bonus: +25 if your pick wins the tournament.

import { getAllMatches } from "@/lib/data";
import { redis, redisEnabled, redisPipe, sanitizeKey } from "@/lib/redis";
import type { Match } from "@/lib/types";

const CHAMPION_BONUS = 25;
const MAX_PLAYERS = 300;

export function predictionsEnabled(): boolean {
  return redisEnabled();
}

export interface PlayerPredictions {
  picks: Record<string, string>; // matchId -> "home:away"
  name: string | null;
  champion: string | null;
}

export interface PlayerScore {
  sessionId: string;
  name: string;
  points: number;
  exact: number;
  correct: number;
  champion: string | null;
  championHit: boolean;
}

function toObject(v: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (Array.isArray(v)) {
    for (let i = 0; i + 1 < v.length; i += 2) out[String(v[i])] = String(v[i + 1]);
  } else if (v && typeof v === "object") {
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) out[k] = String(val);
  }
  return out;
}

export async function savePredictions(
  sessionId: string,
  data: { name?: string; champion?: string; picks?: Record<string, string> },
): Promise<boolean> {
  if (!redisEnabled()) return false;
  const sid = sanitizeKey(sessionId);
  if (!sid) return false;
  const cmds: (string | number)[][] = [["SADD", "players", sid]];
  if (data.name != null) cmds.push(["SET", `pname:${sid}`, data.name.slice(0, 40) || "Anonymous"]);
  if (data.champion) cmds.push(["SET", `pchamp:${sid}`, data.champion.slice(0, 8)]);
  if (data.picks && Object.keys(data.picks).length) {
    const hset: (string | number)[] = ["HSET", `ppicks:${sid}`];
    for (const [k, v] of Object.entries(data.picks)) {
      hset.push(sanitizeKey(k), String(v).slice(0, 7));
    }
    cmds.push(hset);
  }
  return (await redisPipe(cmds)) != null;
}

export async function getPlayer(sessionId: string): Promise<PlayerPredictions | null> {
  if (!redisEnabled()) return null;
  const sid = sanitizeKey(sessionId);
  const res = await redisPipe([
    ["HGETALL", `ppicks:${sid}`],
    ["GET", `pname:${sid}`],
    ["GET", `pchamp:${sid}`],
  ]);
  if (!res) return null;
  return {
    picks: toObject(res[0]),
    name: (res[1] as string) ?? null,
    champion: (res[2] as string) ?? null,
  };
}

function scoreOne(pred: string, m: Match): number {
  const [ph, pa] = pred.split(":").map(Number);
  if (!Number.isFinite(ph) || !Number.isFinite(pa)) return 0;
  if (m.status !== "FINISHED" || m.score.home == null || m.score.away == null) return 0;
  const ah = m.score.home;
  const aa = m.score.away;
  if (ph === ah && pa === aa) return 5;
  if (Math.sign(ph - pa) !== Math.sign(ah - aa)) return 0;
  if (ph - pa === ah - aa) return 3;
  return 2;
}

function championWinner(matches: Match[]): string | null {
  const f = matches.find(
    (m) => m.stage === "FINAL" && m.status === "FINISHED" && m.score.home != null && m.score.away != null,
  );
  if (!f) return null;
  if (f.score.home! > f.score.away!) return f.homeTeam?.code ?? null;
  if (f.score.home! < f.score.away!) return f.awayTeam?.code ?? null;
  return null;
}

export function scorePredictions(
  p: PlayerPredictions,
  matches: Match[],
  winner: string | null,
): { points: number; exact: number; correct: number; championHit: boolean } {
  const byId = new Map(matches.map((m) => [m.id, m]));
  let points = 0;
  let exact = 0;
  let correct = 0;
  for (const [mid, pred] of Object.entries(p.picks)) {
    const m = byId.get(mid);
    if (!m) continue;
    const s = scoreOne(pred, m);
    points += s;
    if (s === 5) exact++;
    if (s > 0) correct++;
  }
  const championHit = !!winner && p.champion === winner;
  if (championHit) points += CHAMPION_BONUS;
  return { points, exact, correct, championHit };
}

export async function getLeaderboard(): Promise<PlayerScore[]> {
  if (!redisEnabled()) return [];
  const players = ((await redis("SMEMBERS", "players")) as string[] | null) ?? [];
  if (!players.length) return [];
  const ids = players.slice(0, MAX_PLAYERS);
  const cmds: (string | number)[][] = [];
  for (const sid of ids) {
    cmds.push(["HGETALL", `ppicks:${sid}`], ["GET", `pname:${sid}`], ["GET", `pchamp:${sid}`]);
  }
  const res = await redisPipe(cmds);
  if (!res) return [];

  const matches = (await getAllMatches()).data;
  const winner = championWinner(matches);

  const rows: PlayerScore[] = [];
  ids.forEach((sid, i) => {
    const p: PlayerPredictions = {
      picks: toObject(res[i * 3]),
      name: (res[i * 3 + 1] as string) ?? null,
      champion: (res[i * 3 + 2] as string) ?? null,
    };
    const s = scorePredictions(p, matches, winner);
    rows.push({
      sessionId: sid,
      name: p.name || "Anonymous",
      points: s.points,
      exact: s.exact,
      correct: s.correct,
      champion: p.champion,
      championHit: s.championHit,
    });
  });
  return rows.sort((a, b) => b.points - a.points || b.exact - a.exact);
}
