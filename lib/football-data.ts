// football-data.org v4 client (PRD §5.1). Primary match-data source when
// FOOTBALL_DATA_API_KEY is set. Free tier: 10 req/min — guarded by a local
// token bucket plus aggressive TTL caching; on failure callers fall back to
// worldcup26.ir / the static schedule.

import { cacheSet, cached, fetchWithTimeout, takeFootballDataToken } from "@/lib/cache";
import {
  findScheduleEntryByKickoff,
  findScheduleEntryByTeams,
  findStadiumByName,
  getStadium,
  parseMinute,
  sortMatches,
} from "@/lib/schedule";
import { resolveTeamCode, teamGroup } from "@/lib/team-meta";
import type {
  GroupStanding,
  Match,
  MatchEvent,
  MatchStatus,
  Scorer,
  Stage,
  SquadPlayer,
  TeamDetail,
  TeamRef,
} from "@/lib/types";

const BASE = "https://api.football-data.org/v4";
const TTL = {
  LIVE_MATCHES: 10_000,
  MATCH_LIST: 120_000,
  STANDINGS: 5 * 60_000,
  SCORERS: 5 * 60_000,
  TEAM_DETAILS: 24 * 3600_000,
  FINISHED_MATCH: 12 * 3600_000,
  UPCOMING_MATCH: 60 * 60_000,
};

export class FootballDataDisabled extends Error {
  constructor() {
    super("FOOTBALL_DATA_API_KEY is not configured");
  }
}

function apiKey(): string {
  const key = process.env.FOOTBALL_DATA_API_KEY?.trim();
  if (!key) throw new FootballDataDisabled();
  return key;
}

async function fdFetch<T>(path: string, ttlMs: number): Promise<T> {
  const key = apiKey(); // throw before touching cache when disabled
  return cached(`fd:${path}`, ttlMs, async () => {
    await takeFootballDataToken();
    if (process.env.WC26_DEBUG_FD) console.log(`[fd-call] ${new Date().toISOString()} ${path}`);
    const res = await fetchWithTimeout(`${BASE}${path}`, { headers: { "X-Auth-Token": key } }, 9500);
    if (!res.ok) {
      throw new Error(`football-data.org ${path} -> HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  });
}

// --- raw API shapes (subset) -----------------------------------------------

interface FdTeamRef {
  id: number;
  name: string;
  shortName?: string;
  tla?: string;
  crest?: string;
}

interface FdPerson {
  id?: number;
  name: string;
  nationality?: string | null;
}

interface FdMatch {
  id: number;
  utcDate: string;
  status: MatchStatus;
  minute?: number | string | null;
  matchday?: number | null;
  stage: string;
  group?: string | null;
  lastUpdated?: string;
  venue?: string | null;
  homeTeam: FdTeamRef;
  awayTeam: FdTeamRef;
  score: {
    winner?: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    fullTime: { home: number | null; away: number | null };
    halfTime?: { home: number | null; away: number | null };
  };
  goals?: {
    minute: number | null;
    injuryTime?: number | null;
    team: { id: number };
    scorer: FdPerson;
    assist?: FdPerson | null;
    type?: string | null; // REGULAR | OWN | PENALTY
  }[];
  bookings?: {
    minute: number | null;
    team: { id: number };
    player: FdPerson;
    card: "YELLOW" | "YELLOW_RED" | "RED";
  }[];
  substitutions?: {
    minute: number | null;
    team: { id: number };
    playerOut: FdPerson;
    playerIn: FdPerson;
  }[];
  referees?: { name: string; nationality?: string | null; type?: string | null }[];
}

// --- normalization ----------------------------------------------------------

const STAGE_MAP: Record<string, Stage> = {
  GROUP_STAGE: "GROUP_STAGE",
  LAST_32: "LAST_32",
  ROUND_OF_32: "LAST_32",
  PLAYOFF_ROUND: "LAST_32",
  LAST_16: "LAST_16",
  ROUND_OF_16: "LAST_16",
  QUARTER_FINALS: "QUARTER_FINALS",
  SEMI_FINALS: "SEMI_FINALS",
  THIRD_PLACE: "THIRD_PLACE",
  FINAL: "FINAL",
};

function normalizeStage(stage: string, group: string | null): Stage {
  return STAGE_MAP[stage] ?? (group ? "GROUP_STAGE" : "LAST_32");
}

function normalizeGroup(group: string | null | undefined): string | null {
  if (!group) return null;
  return group.replace(/^GROUP[_ ]/i, "").trim() || null;
}

function teamRef(t: FdTeamRef): TeamRef {
  const code = resolveTeamCode(t.tla ?? null, t.name);
  return {
    id: String(t.id),
    name: t.shortName || t.name,
    code,
    crest: t.crest ?? null,
  };
}

function fmtMinute(minute: number | null | undefined, injuryTime?: number | null): string {
  if (minute === null || minute === undefined) return "";
  return injuryTime ? `${minute}+${injuryTime}` : String(minute);
}

function matchEvents(m: FdMatch): MatchEvent[] {
  const events: MatchEvent[] = [];
  const sideOf = (teamId: number): "HOME" | "AWAY" => (teamId === m.homeTeam.id ? "HOME" : "AWAY");

  for (const g of m.goals ?? []) {
    events.push({
      minute: fmtMinute(g.minute, g.injuryTime),
      type: "GOAL",
      side: sideOf(g.team.id),
      player: g.scorer?.name ?? "Unknown",
      secondary: g.assist?.name ?? null,
      note: g.type === "PENALTY" ? "pen" : g.type === "OWN" ? "og" : null,
    });
  }
  for (const b of m.bookings ?? []) {
    events.push({
      minute: fmtMinute(b.minute),
      type: b.card === "YELLOW" ? "YELLOW" : "RED",
      side: sideOf(b.team.id),
      player: b.player?.name ?? "Unknown",
    });
  }
  for (const s of m.substitutions ?? []) {
    events.push({
      minute: fmtMinute(s.minute),
      type: "SUB",
      side: sideOf(s.team.id),
      player: s.playerOut?.name ?? "Unknown",
      secondary: s.playerIn?.name ?? null,
    });
  }
  return events.sort((a, b) => parseMinute(a.minute) - parseMinute(b.minute));
}

export function normalizeFdMatch(m: FdMatch): Match {
  const group = normalizeGroup(m.group);
  const homeRef = m.homeTeam?.name ? teamRef(m.homeTeam) : null;
  const awayRef = m.awayTeam?.name ? teamRef(m.awayTeam) : null;
  // football-data's WC payloads omit the venue — join the static schedule
  // (unique pairing + kickoff window; stage + kickoff for TBD knockout slots).
  let stadium = findStadiumByName(m.venue);
  if (!stadium) {
    const entry =
      findScheduleEntryByTeams(homeRef?.code, awayRef?.code, m.utcDate) ??
      findScheduleEntryByKickoff(normalizeStage(m.stage, group), m.utcDate);
    stadium = getStadium(entry?.stadiumId);
  }
  const minute = typeof m.minute === "number" ? m.minute : Number.isFinite(Number(m.minute)) && m.minute !== null && m.minute !== undefined && m.minute !== "" ? Number(m.minute) : null;
  return {
    id: `fd-${m.id}`,
    source: "football-data",
    utcDate: m.utcDate,
    status: m.status,
    minute,
    stage: normalizeStage(m.stage, group),
    group,
    matchday: m.matchday ?? null,
    homeTeam: homeRef,
    awayTeam: awayRef,
    homeLabel: homeRef ? null : "TBD",
    awayLabel: awayRef ? null : "TBD",
    score: {
      home: m.score?.fullTime?.home ?? null,
      away: m.score?.fullTime?.away ?? null,
      halfTimeHome: m.score?.halfTime?.home ?? null,
      halfTimeAway: m.score?.halfTime?.away ?? null,
      winner: m.score?.winner ?? null,
    },
    events: matchEvents(m),
    venue: stadium?.name ?? m.venue ?? null,
    stadiumId: stadium?.id ?? null,
    referees: (m.referees ?? [])
      .filter((r) => r?.name)
      .map((r) => ({ name: r.name, nationality: r.nationality ?? null, role: r.type ?? "REFEREE" })),
    lastUpdated: m.lastUpdated ?? null,
  };
}

// --- endpoints ---------------------------------------------------------------

export async function fdGetMatches(status?: "LIVE" | "SCHEDULED" | "FINISHED"): Promise<Match[]> {
  const qs = status ? `?status=${status}` : "";
  const ttl =
    status === "LIVE"
      ? TTL.LIVE_MATCHES
      : status === "FINISHED"
        ? TTL.FINISHED_MATCH
        : status === "SCHEDULED"
          ? TTL.UPCOMING_MATCH
          : TTL.MATCH_LIST;
  const data = await fdFetch<{ matches: FdMatch[] }>(`/competitions/WC/matches${qs}`, ttl);
  return sortMatches((data.matches ?? []).map(normalizeFdMatch));
}

export async function fdGetMatch(id: string | number): Promise<Match> {
  const path = `/matches/${id}`;
  const data = await fdFetch<FdMatch & { match?: FdMatch }>(path, 25_000);
  const raw = (data.match ?? data) as FdMatch;
  const match = normalizeFdMatch(raw);
  // Stretch the cache for matches that can't change soon: finished games and
  // fixtures more than 2h from kickoff don't need 25s freshness.
  const farFromKickoff = new Date(match.utcDate).getTime() - Date.now() > 2 * 3600_000;
  if (match.status === "FINISHED" || farFromKickoff) {
    cacheSet(`fd:${path}`, data, match.status === "FINISHED" ? TTL.FINISHED_MATCH : TTL.UPCOMING_MATCH);
  }
  return match;
}

export async function fdGetStandings(): Promise<GroupStanding[]> {
  const data = await fdFetch<{
    standings: {
      stage: string;
      type: string;
      group: string | null;
      table: {
        position: number;
        team: FdTeamRef;
        playedGames: number;
        won: number;
        draw: number;
        lost: number;
        points: number;
        goalsFor: number;
        goalsAgainst: number;
        goalDifference: number;
        form?: string | null;
      }[];
    }[];
  }>(`/competitions/WC/standings`, TTL.STANDINGS);

  return (data.standings ?? [])
    .filter((s) => s.type === "TOTAL" && s.group)
    .map((s) => ({
      group: normalizeGroup(s.group) ?? "?",
      rows: s.table.map((r) => ({
        position: r.position,
        team: teamRef(r.team),
        played: r.playedGames,
        won: r.won,
        draw: r.draw,
        lost: r.lost,
        gf: r.goalsFor,
        ga: r.goalsAgainst,
        gd: r.goalDifference,
        points: r.points,
        form: (r.form ?? "")
          .split(",")
          .map((f) => f.trim())
          .filter((f): f is "W" | "D" | "L" => f === "W" || f === "D" || f === "L"),
      })),
    }))
    .sort((a, b) => a.group.localeCompare(b.group));
}

export async function fdGetScorers(limit = 15): Promise<Scorer[]> {
  // Always fetch the same page size so every caller shares one cache entry
  // (limit is applied locally) — keeps the 10 req/min budget predictable.
  const data = await fdFetch<{
    scorers: {
      player: FdPerson;
      team: FdTeamRef;
      goals: number;
      assists?: number | null;
      penalties?: number | null;
    }[];
  }>(`/competitions/WC/scorers?limit=30`, TTL.SCORERS);
  return (data.scorers ?? []).slice(0, limit).map((s) => ({
    player: s.player?.name ?? "Unknown",
    team: teamRef(s.team),
    goals: s.goals ?? 0,
    assists: s.assists ?? null,
    penalties: s.penalties ?? null,
  }));
}

interface FdSquadMember {
  id: number;
  name: string;
  position?: string | null;
  shirtNumber?: number | null;
  nationality?: string | null;
  dateOfBirth?: string | null;
}

interface FdTeamFull extends FdTeamRef {
  coach?: { name?: string | null; nationality?: string | null } | null;
  squad?: FdSquadMember[];
}

export function normalizePosition(position: string | null | undefined): string | null {
  if (!position) return null;
  const p = position.toLowerCase();
  if (p.includes("keeper") || p === "gk") return "GK";
  if (p.includes("back") || p.includes("defence") || p.includes("defender") || p.includes("defense")) return "DEF";
  if (p.includes("midfield")) return "MID";
  if (p.includes("offence") || p.includes("offense") || p.includes("forward") || p.includes("winger") || p.includes("striker")) return "FWD";
  return null;
}

function normalizeTeamDetail(t: FdTeamFull): TeamDetail {
  const code = resolveTeamCode(t.tla ?? null, t.name);
  return {
    id: String(t.id),
    name: t.shortName || t.name,
    code,
    crest: t.crest ?? null,
    group: teamGroup(code),
    coach: t.coach?.name ? { name: t.coach.name, nationality: t.coach.nationality ?? null } : null,
    squad: (t.squad ?? []).map<SquadPlayer>((p) => ({
      id: String(p.id),
      name: p.name,
      position: normalizePosition(p.position),
      positionDetail: p.position ?? null,
      shirtNumber: p.shirtNumber ?? null,
      nationality: p.nationality ?? null,
      dateOfBirth: p.dateOfBirth ?? null,
    })),
  };
}

export async function fdGetTeams(): Promise<TeamDetail[]> {
  const data = await fdFetch<{ teams: FdTeamFull[] }>(`/competitions/WC/teams`, TTL.TEAM_DETAILS);
  return (data.teams ?? []).map(normalizeTeamDetail);
}

export async function fdGetTeam(id: string | number): Promise<TeamDetail> {
  const data = await fdFetch<FdTeamFull>(`/teams/${id}`, TTL.TEAM_DETAILS);
  return normalizeTeamDetail(data);
}
