// worldcup26.ir client (PRD §5.2) — open-source, no-auth World Cup 2026 API.
// Used as the keyless primary for live scores and as redundancy for
// football-data.org. Responses are merged onto the static schedule skeleton
// so knockout placeholders, stadiums and kickoff times stay consistent.

import { cached, fetchWithTimeout } from "@/lib/cache";
import { SCHEDULE, entryToMatch, parseMinute, sortMatches } from "@/lib/schedule";
import { wc26IdToCode } from "@/lib/team-meta";
import type { Match, MatchEvent } from "@/lib/types";

const BASE = "https://worldcup26.ir";

interface Wc26Game {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: string;
  away_score: string;
  home_scorers: string;
  away_scorers: string;
  group: string;
  matchday: string;
  local_date: string;
  stadium_id: string;
  finished: string; // "TRUE" | "FALSE"
  time_elapsed: string; // "notstarted" | "live" | "finished" | minutes
  type: string;
  home_team_label?: string;
  away_team_label?: string;
}

async function getJson<T>(path: string, ttlMs: number): Promise<T> {
  return cached(`wc26:${path}`, ttlMs, async () => {
    const res = await fetchWithTimeout(`${BASE}${path}`, undefined, 9000);
    if (!res.ok) throw new Error(`worldcup26.ir ${path} -> HTTP ${res.status}`);
    return (await res.json()) as T;
  });
}

/**
 * Scorer strings arrive as quasi-JSON with mixed straight/smart quotes:
 *   {"I.B. Hwang 67'","H.G. Oh 80'"}   or   {“J. Quiñones 9'”,”R. Jiménez 67'”}
 */
export function parseScorerString(raw: string | null | undefined): { player: string; minute: string | null; note?: string }[] {
  if (!raw || raw === "null" || raw === "NULL") return [];
  const inner = String(raw).trim().replace(/^\{|\}$/g, "");
  if (!inner) return [];
  return inner
    .split(/["“”’‘]\s*,\s*["“”’‘]/)
    .map((p) => p.replace(/["“”]/g, "").trim())
    .filter(Boolean)
    .map((p) => {
      const m = p.match(/^(.*?)\s+(\d+(?:\+\d+)?)'?\s*(\(pen\.?\)|\(p\)|\(og\))?\s*$/i);
      if (!m) return { player: p, minute: null };
      return {
        player: m[1].trim(),
        minute: m[2],
        note: m[3] ? m[3].replace(/[()]/g, "").toLowerCase() : undefined,
      };
    });
}

function gameEvents(g: Wc26Game): MatchEvent[] {
  const home = parseScorerString(g.home_scorers).map<MatchEvent>((s) => ({
    minute: s.minute ?? "",
    type: "GOAL",
    side: "HOME",
    player: s.player,
    note: s.note ?? null,
  }));
  const away = parseScorerString(g.away_scorers).map<MatchEvent>((s) => ({
    minute: s.minute ?? "",
    type: "GOAL",
    side: "AWAY",
    player: s.player,
    note: s.note ?? null,
  }));
  return [...home, ...away].sort((a, b) => parseMinute(a.minute) - parseMinute(b.minute));
}

function applyGame(match: Match, g: Wc26Game): Match {
  const finished = String(g.finished).toUpperCase() === "TRUE" || g.time_elapsed === "finished";
  const liveMinute = /^\d+$/.test(g.time_elapsed) ? Number(g.time_elapsed) : null;
  const live = g.time_elapsed === "live" || liveMinute !== null;

  let status = match.status;
  let home: number | null = null;
  let away: number | null = null;
  if (finished || live) {
    home = Number.isFinite(Number(g.home_score)) ? Number(g.home_score) : null;
    away = Number.isFinite(Number(g.away_score)) ? Number(g.away_score) : null;
  }
  if (finished) status = "FINISHED";
  else if (live) status = "IN_PLAY";
  else status = new Date(match.utcDate).getTime() > Date.now() ? "TIMED" : match.status;

  // Teams can become known here before the static schedule knows them
  // (knockout slots resolve as the group stage concludes).
  const homeCode = g.home_team_id !== "0" ? wc26IdToCode(g.home_team_id) : null;
  const awayCode = g.away_team_id !== "0" ? wc26IdToCode(g.away_team_id) : null;

  return {
    ...match,
    status,
    minute: liveMinute,
    score: {
      home,
      away,
      winner:
        finished && home !== null && away !== null
          ? home > away
            ? "HOME_TEAM"
            : home < away
              ? "AWAY_TEAM"
              : "DRAW"
          : null,
    },
    events: gameEvents(g),
    homeTeam: match.homeTeam ?? (homeCode ? { id: homeCode, name: homeCode, code: homeCode, crest: null } : null),
    awayTeam: match.awayTeam ?? (awayCode ? { id: awayCode, name: awayCode, code: awayCode, crest: null } : null),
    lastUpdated: new Date().toISOString(),
  };
}

/** All 104 matches: static skeleton + live overlay. Throws if the API is down. */
export async function wc26GetMatches(): Promise<Match[]> {
  const payload = await getJson<{ games: Wc26Game[] }>("/get/games", 25_000);
  if (!payload?.games?.length) throw new Error("worldcup26.ir returned no games");
  const byId = new Map(payload.games.map((g) => [g.id, g]));
  const now = new Date();
  const matches = SCHEDULE.map((entry) => {
    const base = entryToMatch(entry, "wc26", now);
    const g = byId.get(entry.id);
    if (!g) return base;
    return applyGame(base, g);
  });
  return sortMatches(matches);
}

export async function wc26GetMatch(id: string): Promise<Match | null> {
  const all = await wc26GetMatches();
  return all.find((m) => m.id === `wc26-${id}`) ?? null;
}
