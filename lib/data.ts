// Data orchestrator — single entry point for pages and API routes.
// Source preference (PRD §5.2, §9, §15):
//   football-data.org (if key set) -> worldcup26.ir (keyless) -> static schedule
// Every result carries a Sourced<> envelope so the UI can show provenance.

import { cache } from "react";
import { mapLimit } from "@/lib/async";
import { cached } from "@/lib/cache";
import { demoMatch, demoMatches, offlineNews } from "@/lib/demo-data";
import { statusKind } from "@/lib/format";
import {
  espnAthleteBio,
  espnLiveScoreMap,
  espnMatchExtras,
  espnTeamRoster,
  findEspnEventId,
  type EspnRosterPlayer,
} from "@/lib/espn";
import { ticketInfoForMatch, type TicketInfo } from "@/lib/seatgeek";
import { playingFoot } from "@/lib/wikidata";
import {
  FootballDataDisabled,
  fdGetMatch,
  fdGetMatches,
  fdGetScorers,
  fdGetStandings,
  fdGetTeam,
  fdGetTeams,
} from "@/lib/football-data";
import { gnewsSearch } from "@/lib/gnews";
import {
  getFavorites,
  getMatchBets,
  getOddsForMatch,
  getPlayerMarkets,
  getTeamFinance,
  getTopAndWeirdBets,
  getWcTotals,
} from "@/lib/polymarket";
import {
  SCHEDULE,
  computeScorers,
  computeStandings,
  computeTeamStats,
  findScheduleEntryByTeams,
} from "@/lib/schedule";
import { TEAMS, flagUrl, resolveTeamCode } from "@/lib/team-meta";
import { wc26GetMatch, wc26GetMatches } from "@/lib/worldcup26";
import type {
  GroupStanding,
  Match,
  MatchExtras,
  NewsArticle,
  OddsData,
  PlayerBio,
  PlayerMarket,
  PlayerMatchLog,
  PlayerMatchStats,
  Scorer,
  Sourced,
  TeamDetail,
  TeamFinance,
  TeamSeasonStats,
} from "@/lib/types";
import { sourced } from "@/lib/types";

const LIVE_STATUSES = new Set(["IN_PLAY", "PAUSED"]);

export function isLive(m: Match): boolean {
  return LIVE_STATUSES.has(m.status);
}

// ---------------------------------------------------------------------------
// Matches
// ---------------------------------------------------------------------------

const EVENTFUL = new Set(["IN_PLAY", "PAUSED", "FINISHED"]);

/**
 * football-data's free tier omits goal/card events for this competition —
 * overlay them from worldcup26.ir (PRD §5.2 "complementary source").
 * Non-fatal: if the community API is down, football-data stands alone.
 */
async function overlayWc26Events(matches: Match[]): Promise<Match[]> {
  if (!matches.some((m) => !m.events.length && EVENTFUL.has(m.status))) return matches;
  try {
    const wc26 = await wc26GetMatches();
    const byId = new Map(wc26.map((w) => [w.id, w]));
    return matches.map((m) => {
      if (m.events.length || !EVENTFUL.has(m.status)) return m;
      const entry = findScheduleEntryByTeams(m.homeTeam?.code, m.awayTeam?.code, m.utcDate);
      const w = entry ? byId.get(`wc26-${entry.id}`) : undefined;
      if (!w?.events.length) return m;
      return { ...m, events: w.events, minute: m.minute ?? w.minute };
    });
  } catch {
    return matches;
  }
}

// Wrapped in React cache() so the many getAllMatches() calls within a single
// render/request (getTeamMatches, getTeamStats, getTeamHub, odds/extras lookups)
// collapse to one. Per-request only — the cross-request TTL cache (lib/cache.ts)
// still governs freshness.
export const getAllMatches = cache(async (): Promise<Sourced<Match[]>> => {
  try {
    const matches = await fdGetMatches();
    if (matches.length) return sourced(await overlayWc26Events(matches), "football-data");
    throw new Error("football-data returned no matches");
  } catch (err) {
    if (!(err instanceof FootballDataDisabled)) logOnce("fd:matches", err);
  }
  try {
    return sourced(await wc26GetMatches(), "worldcup26");
  } catch (err) {
    logOnce("wc26:matches", err);
  }
  return sourced(demoMatches(), "demo");
});

export async function getLiveMatches(): Promise<Sourced<Match[]>> {
  // football-data first: it's reliable and CDN-cached. worldcup26.ir is only the
  // keyless fallback (it can be slow/unreachable from Vercel; the wc26 client has
  // a short timeout + circuit breaker so it never blocks the page).
  try {
    const live = await fdGetMatches("LIVE");
    const withEvents = await overlayWc26Events(live);
    // ESPN scoreboard updates faster than football-data (~8 s vs ~10 s cache).
    // Overlay ESPN scores and clock to ensure the ticker stays accurate during live matches.
    const espnScores = await espnLiveScoreMap().catch(() => new Map());
    const corrected = withEvents.map((m) => {
      if (!m.homeTeam?.code || !m.awayTeam?.code) return m;
      const espn = espnScores.get(`${m.homeTeam.code}:${m.awayTeam.code}`);
      if (!espn) return m;
      // Parse "56:00" → 56  (ESPN elapsed clock format)
      const espnMinute = espn.clock ? parseInt(espn.clock, 10) || null : null;
      return {
        ...m,
        score: { ...m.score, home: espn.homeScore, away: espn.awayScore },
        minute: espnMinute ?? m.minute,
      };
    });
    return sourced(corrected, "football-data");
  } catch (err) {
    if (!(err instanceof FootballDataDisabled)) logOnce("fd:live", err);
  }
  try {
    const all = await wc26GetMatches();
    return sourced(all.filter(isLive), "worldcup26");
  } catch (err) {
    logOnce("wc26:live", err);
  }
  return sourced(demoMatches().filter(isLive), "demo");
}

export async function getMatchById(id: string): Promise<Sourced<Match> | null> {
  const [prefix, rawId] = splitId(id);

  if (prefix === "fd") {
    try {
      const [enriched] = await overlayWc26Events([await fdGetMatch(rawId)]);
      return sourced(enriched, "football-data");
    } catch (err) {
      // cached() already served stale data if any existed; nothing else maps
      // a football-data id reliably once the API is unreachable.
      if (!(err instanceof FootballDataDisabled)) logOnce("fd:match", err);
      return null;
    }
  }

  if (prefix === "wc26") {
    try {
      const m = await wc26GetMatch(rawId);
      if (m) return sourced(m, "worldcup26");
    } catch (err) {
      logOnce("wc26:match", err);
    }
    const fallback = demoMatch(rawId);
    return fallback ? sourced(fallback, "demo") : null;
  }

  if (prefix === "demo") {
    // Prefer a live overlay if worldcup26 is reachable (ids align).
    try {
      const m = await wc26GetMatch(rawId);
      if (m) return sourced({ ...m, id }, "worldcup26");
    } catch {
      /* offline */
    }
    const m = demoMatch(rawId);
    return m ? sourced(m, "demo") : null;
  }

  return null;
}

function splitId(id: string): [string, string] {
  const i = id.indexOf("-");
  if (i < 0) return ["fd", id]; // bare numeric ids treated as football-data
  return [id.slice(0, i), id.slice(i + 1)];
}

// ---------------------------------------------------------------------------
// Standings & scorers
// ---------------------------------------------------------------------------

export const getStandings = cache(async (): Promise<Sourced<GroupStanding[]>> => {
  try {
    const rows = await fdGetStandings();
    if (rows.length) return sourced(rows, "football-data");
  } catch (err) {
    if (!(err instanceof FootballDataDisabled)) logOnce("fd:standings", err);
  }
  const matches = await getAllMatchesPreferKeyless();
  return sourced(
    await cached(`compute:standings:${matches.source}`, 60_000, async () => computeStandings(matches.data)),
    matches.source,
  );
});

export const getScorers = cache(async (limit = 12): Promise<Sourced<Scorer[]>> => {
  try {
    const rows = await fdGetScorers(limit);
    if (rows.length) return sourced(rows, "football-data");
  } catch (err) {
    if (!(err instanceof FootballDataDisabled)) logOnce("fd:scorers", err);
  }
  const matches = await getAllMatchesPreferKeyless();
  return sourced(
    await cached(`compute:scorers:${limit}:${matches.source}`, 60_000, async () => computeScorers(matches.data, limit)),
    matches.source,
  );
});

/** Standings/scorers fallback path skips football-data (it just failed). */
async function getAllMatchesPreferKeyless(): Promise<Sourced<Match[]>> {
  try {
    return sourced(await wc26GetMatches(), "worldcup26");
  } catch {
    return sourced(demoMatches(), "demo");
  }
}

export async function getTeamStats(code: string): Promise<TeamSeasonStats> {
  const matches = await getAllMatches();
  return computeTeamStats(matches.data, code);
}

// ---------------------------------------------------------------------------
// Teams
// ---------------------------------------------------------------------------

function registryTeamDetail(code: string): TeamDetail | null {
  const t = TEAMS.find((x) => x.code === code);
  if (!t) return null;
  return {
    id: t.code,
    name: t.name,
    code: t.code,
    crest: flagUrl(t.code, "w320"),
    group: t.group,
    coach: null,
    squad: [],
  };
}

export const getTeams = cache(async (): Promise<Sourced<TeamDetail[]>> => {
  try {
    const teams = await fdGetTeams();
    if (teams.length) return sourced(teams, "football-data");
  } catch (err) {
    if (!(err instanceof FootballDataDisabled)) logOnce("fd:teams", err);
  }
  const teams = TEAMS.map((t) => registryTeamDetail(t.code)!).filter(Boolean);
  return sourced(teams, "demo");
});

/** Accepts a FIFA code ("ESP") or a football-data numeric id. */
export async function getTeamDetail(idOrCode: string): Promise<Sourced<TeamDetail> | null> {
  const code = resolveTeamCode(idOrCode, idOrCode);
  try {
    const teams = await fdGetTeams();
    const hit = teams.find((t) => t.id === idOrCode || (code && t.code === code));
    if (hit) return sourced(hit, "football-data");
    if (/^\d+$/.test(idOrCode)) return sourced(await fdGetTeam(idOrCode), "football-data");
  } catch (err) {
    if (!(err instanceof FootballDataDisabled)) logOnce("fd:team", err);
  }
  if (!code) return null;
  const fallback = registryTeamDetail(code);
  return fallback ? sourced(fallback, "demo") : null;
}

export async function getTeamMatches(code: string): Promise<Sourced<Match[]>> {
  const all = await getAllMatches();
  return {
    ...all,
    data: all.data.filter((m) => m.homeTeam?.code === code || m.awayTeam?.code === code),
  };
}

// ---------------------------------------------------------------------------
// News
// ---------------------------------------------------------------------------

export async function getNews(q?: string | null, max = 10, matchContext?: { home?: string | null; away?: string | null }): Promise<Sourced<NewsArticle[]>> {
  const queries: string[] = [];
  if (q?.trim()) queries.push(q.trim());
  else if (matchContext?.home && matchContext?.away) {
    queries.push(`"${matchContext.home}" "${matchContext.away}"`);
    queries.push(`World Cup "${matchContext.home}"`);
  } else {
    queries.push("FIFA World Cup 2026");
  }

  for (const query of queries) {
    try {
      const articles = await gnewsSearch(query, max);
      if (articles.length) return sourced(articles, "gnews");
    } catch {
      break; // disabled key or quota — go offline
    }
  }
  return sourced(offlineNews(matchContext).slice(0, max), "demo");
}

// ---------------------------------------------------------------------------
// Odds
// ---------------------------------------------------------------------------

export async function getOddsForMatchId(matchId: string): Promise<OddsData | null> {
  // The cached fixture list already has everything Polymarket lookup needs
  // (teams + kickoff). Hitting the per-match endpoint here would burn one
  // football-data request per odds bar on screen.
  let match: Match | undefined;
  try {
    match = (await getAllMatches()).data.find((m) => m.id === matchId);
  } catch {
    /* fall through to direct lookup */
  }
  if (!match) {
    const res = await getMatchById(matchId);
    if (!res) return null;
    match = res.data;
  }
  try {
    return await getOddsForMatch(match);
  } catch (err) {
    logOnce("pm:odds", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// ESPN enrichment: match statistics, confirmed lineups, attendance
// ---------------------------------------------------------------------------

/**
 * ESPN summaries get "hot" caching while a match is live or near kickoff
 * (confirmed lineups drop ~70 minutes before the whistle).
 */
export async function extrasForMatch(match: Match): Promise<MatchExtras | null> {
  if (!match.homeTeam?.code || !match.awayTeam?.code) return null;
  const eventId = await findEspnEventId(match);
  if (!eventId) return null;
  const kick = new Date(match.utcDate).getTime();
  const hot = isLive(match) || (Date.now() > kick - 2 * 3600_000 && Date.now() < kick + 3 * 3600_000);
  try {
    return await espnMatchExtras(eventId, hot);
  } catch (err) {
    logOnce("espn:summary", err);
    return null;
  }
}

export interface MatchExtrasPayload {
  extras: MatchExtras | null;
  ticket: TicketInfo | null;
}

export async function getMatchExtras(matchId: string): Promise<MatchExtrasPayload> {
  let match: Match | undefined;
  try {
    match = (await getAllMatches()).data.find((m) => m.id === matchId);
  } catch {
    /* fall through */
  }
  if (!match) {
    const res = await getMatchById(matchId);
    match = res?.data;
  }
  if (!match) return { extras: null, ticket: null };

  const [extras, ticket] = await Promise.all([
    extrasForMatch(match),
    ticketInfoForMatch(match).catch(() => null),
  ]);
  return { extras, ticket };
}

// ---------------------------------------------------------------------------
// Team hub: market finance, possession, discipline, news, roster index
// ---------------------------------------------------------------------------

export interface TeamHub {
  finance: TeamFinance | null;
  nextMatch: Match | null;
  nextOdds: OddsData | null;
  possessionAvg: number | null;
  discipline: { yellow: number; red: number } | null;
  news: Sourced<NewsArticle[]>;
  roster: EspnRosterPlayer[];
}

export async function getTeamHub(code: string, name: string): Promise<TeamHub> {
  const matches = (await getTeamMatches(code)).data;
  const played = matches.filter((m) => m.status === "FINISHED");
  const nextMatch = matches.find((m) => statusKind(m.status) === "upcoming") ?? null;

  const [finance, nextOdds, news, roster] = await Promise.all([
    getTeamFinance(code, matches).catch((err) => {
      logOnce("pm:finance", err);
      return null;
    }),
    nextMatch ? getOddsForMatch(nextMatch).catch(() => null) : Promise.resolve(null),
    getNews(`"${name}" World Cup`, 5),
    espnTeamRoster(code).catch(() => [] as EspnRosterPlayer[]),
  ]);

  // possession / cards averaged & summed from ESPN match stats — fan out the
  // per-match ESPN lookups with bounded concurrency instead of one-at-a-time.
  let posSum = 0;
  let posN = 0;
  let yellow = 0;
  let red = 0;
  let sawDiscipline = false;
  const recent = played.slice(-8);
  const recentExtras = await mapLimit(recent, 6, (m) => extrasForMatch(m).catch(() => null));
  recent.forEach((m, i) => {
    const side = m.homeTeam?.code === code ? "home" : "away";
    const st = recentExtras[i]?.stats?.[side];
    if (!st) return;
    if (st.possession !== null) {
      posSum += st.possession;
      posN++;
    }
    if (st.yellow !== null || st.red !== null) {
      yellow += st.yellow ?? 0;
      red += st.red ?? 0;
      sawDiscipline = true;
    }
  });

  return {
    finance,
    nextMatch,
    nextOdds,
    possessionAvg: posN ? posSum / posN : null,
    discipline: sawDiscipline ? { yellow, red } : null,
    news,
    roster,
  };
}

// ---------------------------------------------------------------------------
// Player pages
// ---------------------------------------------------------------------------

export interface PlayerData {
  bio: PlayerBio | null;
  teamCode: string | null;
  log: PlayerMatchLog[];
  totals: PlayerMatchStats;
  starts: number;
  minutesTotal: number | null;
  minutesAvg: number | null;
  markets: PlayerMarket[];
}

const EMPTY_PLAYER_STATS: PlayerMatchStats = {
  appearances: 0,
  goals: 0,
  assists: 0,
  shots: 0,
  shotsOnTarget: 0,
  fouls: 0,
  foulsDrawn: 0,
  offsides: 0,
  yellow: 0,
  red: 0,
  ownGoals: 0,
};

export async function getPlayerData(espnId: string, teamCode: string | null): Promise<PlayerData | null> {
  const [bioBase, roster] = await Promise.all([
    espnAthleteBio(espnId),
    teamCode ? espnTeamRoster(teamCode).catch(() => [] as EspnRosterPlayer[]) : Promise.resolve([] as EspnRosterPlayer[]),
  ]);
  const rosterEntry = roster.find((r) => r.espnId === espnId) ?? null;
  if (!bioBase && !rosterEntry) return null;

  const name = bioBase?.name ?? rosterEntry?.name ?? "Unknown";
  // Kick these off now and await later so they overlap the match-log fan-out.
  const footP = playingFoot(name);
  const marketsP = getPlayerMarkets(name).catch(() => [] as PlayerMarket[]);

  const bio: PlayerBio = {
    espnId,
    name,
    headshot: bioBase?.headshot ?? rosterEntry?.headshot ?? "",
    age: bioBase?.age ?? rosterEntry?.age ?? null,
    dateOfBirth: bioBase?.dateOfBirth ?? null,
    height: bioBase?.height ?? rosterEntry?.height ?? null,
    weight: bioBase?.weight ?? null,
    citizenship: bioBase?.citizenship ?? rosterEntry?.citizenship ?? null,
    birthPlace: rosterEntry?.birthPlace ?? null,
    club: bioBase?.club ?? null,
    position: bioBase?.position ?? rosterEntry?.positionAbbr ?? null,
    jersey: rosterEntry?.jersey ?? bioBase?.jersey ?? null,
    foot: await footP,
  };

  // tournament log from the team's played matches
  const log: PlayerMatchLog[] = [];
  const totals: PlayerMatchStats = { ...EMPTY_PLAYER_STATS };
  let starts = 0;
  let minutesTotal: number | null = null;

  if (teamCode) {
    const matches = (await getTeamMatches(teamCode)).data.filter((m) => m.status === "FINISHED");
    // Fan out the per-match ESPN lookups (was 2*N serial round-trips).
    const extrasList = await mapLimit(matches, 6, (m) => extrasForMatch(m).catch(() => null));
    matches.forEach((m, i) => {
      const side = m.homeTeam?.code === teamCode ? "home" : "away";
      const lineup = extrasList[i]?.lineups?.[side];
      const entry = lineup?.players.find((p) => p.espnId === espnId);
      if (!entry) return;

      const opp = side === "home" ? m.awayTeam : m.homeTeam;
      const gf = side === "home" ? m.score.home : m.score.away;
      const ga = side === "home" ? m.score.away : m.score.home;
      log.push({
        matchId: m.id,
        opponentCode: opp?.code ?? null,
        opponentName: opp?.name ?? "TBD",
        utcDate: m.utcDate,
        scoreline: `${gf ?? "–"}–${ga ?? "–"}`,
        started: entry.starter,
        cameOn: entry.subbedIn,
        minutes: entry.minutes,
        stats: entry.stats,
      });

      if (entry.stats.appearances > 0 || entry.starter || entry.subbedIn) {
        for (const k of Object.keys(totals) as (keyof PlayerMatchStats)[]) {
          totals[k] += entry.stats[k];
        }
        if (entry.starter) starts++;
        if (entry.minutes !== null) minutesTotal = (minutesTotal ?? 0) + entry.minutes;
      }
    });
  }

  const markets = await marketsP;
  const apps = totals.appearances;

  return {
    bio,
    teamCode,
    log,
    totals,
    starts,
    minutesTotal,
    minutesAvg: minutesTotal !== null && apps > 0 ? minutesTotal / apps : null,
    markets,
  };
}

export async function getTeamRosterIndex(code: string): Promise<EspnRosterPlayer[]> {
  return espnTeamRoster(code).catch(() => []);
}

export async function getWcTotalsData() {
  try {
    return await getWcTotals();
  } catch (err) {
    logOnce("pm:totals", err);
    return null;
  }
}

export async function getFavoritesData() {
  try {
    return await getFavorites();
  } catch (err) {
    logOnce("pm:favorites", err);
    return [];
  }
}

export async function getTopBetsData() {
  try {
    return await getTopAndWeirdBets();
  } catch (err) {
    logOnce("pm:topbets", err);
    return { top: [], weird: [] };
  }
}

export async function getMatchBetsData(matchId: string) {
  let match: Match | undefined;
  try {
    match = (await getAllMatches()).data.find((m) => m.id === matchId);
  } catch {
    /* fall through */
  }
  if (!match) {
    const res = await getMatchById(matchId);
    match = res?.data;
  }
  if (!match) return null;
  try {
    return await getMatchBets(match);
  } catch (err) {
    logOnce("pm:matchbets", err);
    return null;
  }
}

// ---------------------------------------------------------------------------

export function scheduleSize(): number {
  return SCHEDULE.length;
}

/**
 * Finished matches with events populated from ESPN timeline where native
 * events are absent. worldcup26.ir is unreachable from some hosts; ESPN is
 * the reliable fallback for goal/card events on finished matches.
 */
export const getFinishedMatchesWithEvents = cache(async (): Promise<Match[]> => {
  return cached("finished-with-events", 5 * 60_000, async () => {
    const all = await getAllMatches();
    const finished = all.data.filter((m) => statusKind(m.status) === "finished");

    const noEvents = finished.filter((m) => !m.events.length);
    if (!noEvents.length) return finished;

    const espnMap = new Map<string, MatchExtras>();
    await mapLimit(noEvents, 6, async (m) => {
      const ex = await extrasForMatch(m).catch(() => null);
      if (ex?.timeline?.length) espnMap.set(m.id, ex);
    });

    return finished.map((m) => {
      if (m.events.length) return m;
      const ex = espnMap.get(m.id);
      if (!ex?.timeline?.length) return m;
      return { ...m, events: ex.timeline };
    });
  });
});

// Avoid log spam: remember the last message per channel for 5 minutes.
const lastLog = new Map<string, number>();
function logOnce(channel: string, err: unknown): void {
  const now = Date.now();
  const last = lastLog.get(channel) ?? 0;
  if (now - last < 300_000) return;
  lastLog.set(channel, now);
  console.warn(`[wc26] ${channel} failed:`, err instanceof Error ? err.message : err);
}
