// ESPN public soccer JSON API (keyless) — enrichment source for what the
// free football tiers lack: per-match team statistics (possession, shots,
// passes, corners…), confirmed lineups with formations, per-player match
// stats, headshots, attendance and athlete bios.
//
// League code for the 2026 FIFA World Cup: `fifa.world`.

import { cached, fetchWithTimeout } from "@/lib/cache";
import { dateStringInTz } from "@/lib/time";
import { resolveTeamCode } from "@/lib/team-meta";
import type {
  LineupPlayer,
  Match,
  MatchExtras,
  PlayerBio,
  PlayerMatchStats,
  TeamLineup,
  TeamMatchStats,
} from "@/lib/types";

const SITE = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world";
const WEB = "https://site.web.api.espn.com/apis/common/v3/sports/soccer/fifa.world";
const EN = "lang=en&region=us";

async function espnGet<T>(url: string, ttlMs: number): Promise<T> {
  return cached(`espn:${url}`, ttlMs, async () => {
    const res = await fetchWithTimeout(url, { headers: { Accept: "application/json" } }, 9500);
    if (!res.ok) throw new Error(`ESPN ${url} -> HTTP ${res.status}`);
    return (await res.json()) as T;
  });
}

export function headshotUrl(espnId: string): string {
  return `https://a.espncdn.com/i/headshots/soccer/players/full/${espnId}.png`;
}

// ---------------------------------------------------------------------------
// Teams
// ---------------------------------------------------------------------------

export interface EspnTeam {
  id: string;
  code: string | null;
  name: string;
  logo: string | null;
}

export async function espnTeams(): Promise<EspnTeam[]> {
  interface Raw {
    sports?: { leagues?: { teams?: { team: { id: string; abbreviation?: string; displayName: string; logos?: { href: string }[] } }[] }[] }[];
  }
  const data = await espnGet<Raw>(`${SITE}/teams?limit=60&${EN}`, 24 * 3600_000);
  const teams = data.sports?.[0]?.leagues?.[0]?.teams ?? [];
  return teams.map(({ team }) => ({
    id: team.id,
    code: resolveTeamCode(team.abbreviation ?? null, team.displayName),
    name: team.displayName,
    logo: team.logos?.[0]?.href ?? null,
  }));
}

export async function espnTeamIdForCode(code: string): Promise<string | null> {
  const teams = await espnTeams();
  return teams.find((t) => t.code === code)?.id ?? null;
}

// ---------------------------------------------------------------------------
// Scoreboard → event id mapping
// ---------------------------------------------------------------------------

interface ScoreboardEventLite {
  eventId: string;
  homeCode: string | null;
  awayCode: string | null;
  state: "pre" | "in" | "post";
}

async function scoreboard(yyyymmdd: string): Promise<ScoreboardEventLite[]> {
  interface Raw {
    events?: {
      id: string;
      status?: { type?: { state?: string } };
      competitions?: {
        competitors?: { homeAway?: string; team?: { id: string; abbreviation?: string; displayName?: string } }[];
      }[];
    }[];
  }
  const data = await espnGet<Raw>(`${SITE}/scoreboard?dates=${yyyymmdd}&${EN}`, 60_000);
  return (data.events ?? []).map((e) => {
    const comps = e.competitions?.[0]?.competitors ?? [];
    const home = comps.find((c) => c.homeAway === "home")?.team;
    const away = comps.find((c) => c.homeAway === "away")?.team;
    return {
      eventId: e.id,
      homeCode: home ? resolveTeamCode(home.abbreviation ?? null, home.displayName) : null,
      awayCode: away ? resolveTeamCode(away.abbreviation ?? null, away.displayName) : null,
      state: (e.status?.type?.state as "pre" | "in" | "post") ?? "pre",
    };
  });
}

/** ESPN buckets fixtures by US/Eastern date. */
export async function findEspnEventId(match: Match): Promise<string | null> {
  const home = match.homeTeam?.code;
  const away = match.awayTeam?.code;
  if (!home || !away) return null;
  const etDate = dateStringInTz(match.utcDate, "America/New_York").replace(/-/g, "");
  try {
    const events = await scoreboard(etDate);
    const hit = events.find((e) => e.homeCode === home && e.awayCode === away);
    return hit?.eventId ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Match summary → MatchExtras
// ---------------------------------------------------------------------------

interface RawStat {
  name: string;
  value?: number;
  displayValue?: string;
}

interface RawRosterEntry {
  starter?: boolean;
  jersey?: string;
  subbedIn?: boolean;
  subbedOut?: boolean;
  formationPlace?: string;
  position?: { abbreviation?: string };
  athlete?: { id: string; displayName: string };
  stats?: { abbreviation?: string; name?: string; value?: number }[];
}

interface RawSummary {
  boxscore?: {
    teams?: { team: { id: string }; statistics?: RawStat[] }[];
  };
  rosters?: {
    homeAway?: string;
    team?: { id: string };
    formation?: string;
    roster?: RawRosterEntry[];
  }[];
  gameInfo?: { attendance?: number };
  keyEvents?: {
    type?: { type?: string };
    clock?: { value?: number };
    participants?: { athlete?: { id: string } }[];
  }[];
  videos?: { headline?: string; links?: { web?: { href?: string } } }[];
  header?: { competitions?: { status?: { type?: { state?: string } } }[] };
}

function statMap(stats: RawStat[] | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of stats ?? []) {
    const v = s.value ?? Number(s.displayValue);
    if (s.name && Number.isFinite(v)) out[s.name] = v;
  }
  return out;
}

function teamStatsFrom(stats: RawStat[] | undefined): TeamMatchStats {
  const m = statMap(stats);
  const get = (k: string): number | null => (k in m ? m[k] : null);
  return {
    possession: get("possessionPct"),
    shots: get("totalShots"),
    shotsOnTarget: get("shotsOnTarget"),
    passes: get("totalPasses"),
    accuratePasses: get("accuratePasses"),
    corners: get("wonCorners"),
    fouls: get("foulsCommitted"),
    offsides: get("offsides"),
    saves: get("saves"),
    yellow: get("yellowCards"),
    red: get("redCards"),
    pkGoals: get("penaltyKickGoals"),
    pkShots: get("penaltyKickShots"),
    assists: null, // filled from lineup player sums below
  };
}

function playerStatsFrom(entry: RawRosterEntry): PlayerMatchStats {
  const m: Record<string, number> = {};
  for (const s of entry.stats ?? []) {
    const key = s.abbreviation ?? s.name ?? "";
    if (key && Number.isFinite(s.value)) m[key] = s.value as number;
  }
  return {
    appearances: m.APP ?? 0,
    goals: m.G ?? 0,
    assists: m.A ?? 0,
    shots: m.SHOT ?? 0,
    shotsOnTarget: m.SOG ?? 0,
    fouls: m.FC ?? 0,
    foulsDrawn: m.FA ?? 0,
    offsides: m.OF ?? 0,
    yellow: m.YC ?? 0,
    red: m.RC ?? 0,
    ownGoals: m.OG ?? 0,
  };
}

/**
 * Minutes on pitch, estimated from substitution key-events (clock.value is
 * seconds). Starters without a sub-off get the full match length.
 */
function minutesFor(
  espnId: string,
  entry: RawRosterEntry,
  subs: { inId: string | null; outId: string | null; minute: number }[],
  matchMinutes: number,
): number | null {
  if (!entry.starter && !entry.subbedIn) return entry.stats?.length ? 0 : null;
  let start = entry.starter ? 0 : null;
  let end: number | null = null;
  for (const s of subs) {
    if (s.inId === espnId) start = s.minute;
    if (s.outId === espnId) end = s.minute;
  }
  if (start === null) return null; // subbedIn flag but no event found
  return Math.max(0, Math.round((end ?? matchMinutes) - start));
}

function lineupFrom(
  roster: NonNullable<RawSummary["rosters"]>[number],
  subs: { inId: string | null; outId: string | null; minute: number }[],
  matchMinutes: number,
): TeamLineup {
  const players: LineupPlayer[] = (roster.roster ?? [])
    .filter((e) => e.athlete?.id)
    .map((e) => {
      const id = e.athlete!.id;
      return {
        espnId: id,
        name: e.athlete!.displayName,
        jersey: e.jersey ? Number(e.jersey) || null : null,
        positionAbbr: e.position?.abbreviation ?? null,
        starter: !!e.starter,
        subbedIn: !!e.subbedIn,
        subbedOut: !!e.subbedOut,
        formationPlace: e.formationPlace ? Number(e.formationPlace) || null : null,
        headshot: headshotUrl(id),
        stats: playerStatsFrom(e),
        minutes: minutesFor(id, e, subs, matchMinutes),
      };
    });
  return { formation: roster.formation ?? null, players };
}

export async function espnMatchExtras(eventId: string, live: boolean): Promise<MatchExtras> {
  const data = await espnGet<RawSummary>(`${SITE}/summary?event=${eventId}&${EN}`, live ? 30_000 : 6 * 3600_000);

  const state = (data.header?.competitions?.[0]?.status?.type?.state as MatchExtras["state"]) ?? "pre";

  // home/away orientation comes from rosters[].homeAway
  const homeRoster = data.rosters?.find((r) => r.homeAway === "home") ?? null;
  const awayRoster = data.rosters?.find((r) => r.homeAway === "away") ?? null;

  // substitutions → minutes-on-pitch estimates
  const subs = (data.keyEvents ?? [])
    .filter((e) => e.type?.type === "substitution")
    .map((e) => ({
      inId: e.participants?.[0]?.athlete?.id ?? null,
      outId: e.participants?.[1]?.athlete?.id ?? null,
      minute: e.clock?.value ? Math.round(e.clock.value / 60) : 0,
    }));
  const endEvent = (data.keyEvents ?? []).find((e) => e.type?.type === "end-regular-time");
  const matchMinutes = endEvent?.clock?.value ? Math.round(endEvent.clock.value / 60) : state === "post" ? 90 : 90;

  const homeLineup = homeRoster ? lineupFrom(homeRoster, subs, matchMinutes) : null;
  const awayLineup = awayRoster ? lineupFrom(awayRoster, subs, matchMinutes) : null;

  // team stats keyed by team id → orient via rosters
  let stats: MatchExtras["stats"] = null;
  const boxTeams = data.boxscore?.teams ?? [];
  if (boxTeams.length === 2 && homeRoster?.team?.id) {
    const homeBox = boxTeams.find((t) => t.team.id === homeRoster.team!.id);
    const awayBox = boxTeams.find((t) => t.team.id !== homeRoster.team!.id);
    if (homeBox && awayBox) {
      const home = teamStatsFrom(homeBox.statistics);
      const away = teamStatsFrom(awayBox.statistics);
      home.assists = homeLineup ? homeLineup.players.reduce((s, p) => s + p.stats.assists, 0) : null;
      away.assists = awayLineup ? awayLineup.players.reduce((s, p) => s + p.stats.assists, 0) : null;
      stats = { home, away };
    }
  }

  return {
    eventId,
    state,
    attendance: data.gameInfo?.attendance || null,
    stats,
    lineups: { home: homeLineup, away: awayLineup },
    videos: (data.videos ?? [])
      .filter((v) => v.headline)
      .map((v) => ({ headline: v.headline!, href: v.links?.web?.href ?? null })),
    updated: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Athletes
// ---------------------------------------------------------------------------

export interface EspnRosterPlayer {
  espnId: string;
  name: string;
  jersey: number | null;
  positionAbbr: string | null;
  age: number | null;
  height: string | null;
  citizenship: string | null;
  birthPlace: string | null;
  headshot: string;
}

export async function espnTeamRoster(code: string): Promise<EspnRosterPlayer[]> {
  const teamId = await espnTeamIdForCode(code);
  if (!teamId) return [];
  interface Raw {
    athletes?: {
      id: string;
      displayName: string;
      jersey?: string;
      displayHeight?: string;
      age?: number;
      citizenship?: string;
      birthPlace?: { city?: string; country?: string };
      position?: { abbreviation?: string };
    }[];
  }
  const data = await espnGet<Raw>(`${SITE}/teams/${teamId}/roster?${EN}`, 24 * 3600_000);
  return (data.athletes ?? []).map((a) => ({
    espnId: a.id,
    name: a.displayName,
    jersey: a.jersey ? Number(a.jersey) || null : null,
    positionAbbr: a.position?.abbreviation ?? null,
    age: a.age ?? null,
    height: a.displayHeight ?? null,
    citizenship: a.citizenship ?? null,
    birthPlace: [a.birthPlace?.city, a.birthPlace?.country].filter(Boolean).join(", ") || null,
    headshot: headshotUrl(a.id),
  }));
}

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Match a football-data squad name ("M. Crépeau" / "Maxime Crépeau") to an
 * ESPN roster entry. Last name must match; first name or initial must agree
 * when both are present.
 */
export function matchPlayerByName(name: string, roster: EspnRosterPlayer[]): EspnRosterPlayer | null {
  const target = normalizeName(name).split(" ").filter(Boolean);
  if (!target.length) return null;
  const targetLast = target[target.length - 1];
  const targetFirst = target[0];

  let best: EspnRosterPlayer | null = null;
  for (const p of roster) {
    const parts = normalizeName(p.name).split(" ").filter(Boolean);
    if (!parts.length) continue;
    const last = parts[parts.length - 1];
    if (last !== targetLast) continue;
    if (target.length === 1 || parts.length === 1) {
      best = best ?? p;
      continue;
    }
    const first = parts[0];
    if (first === targetFirst || first[0] === targetFirst[0]) return p; // exact-enough
  }
  return best;
}

export async function espnAthleteBio(espnId: string): Promise<Omit<PlayerBio, "foot"> | null> {
  interface Raw {
    athlete?: {
      id: string;
      displayName: string;
      displayHeight?: string;
      displayWeight?: string;
      displayDOB?: string;
      dateOfBirth?: string;
      age?: number;
      citizenship?: string;
      position?: { displayName?: string };
      jersey?: string;
      team?: { displayName?: string };
      headshot?: { href?: string };
    };
  }
  try {
    const data = await espnGet<Raw>(`${WEB}/athletes/${espnId}?region=us&lang=en`, 24 * 3600_000);
    const a = data.athlete;
    if (!a) return null;
    return {
      espnId: a.id,
      name: a.displayName,
      headshot: a.headshot?.href ?? headshotUrl(a.id),
      age: a.age ?? null,
      dateOfBirth: a.displayDOB ?? a.dateOfBirth ?? null,
      height: a.displayHeight ?? null,
      weight: a.displayWeight ?? null,
      citizenship: a.citizenship ?? null,
      birthPlace: null, // present on the roster endpoint, not here
      club: a.team?.displayName ?? null,
      position: a.position?.displayName ?? null,
      jersey: a.jersey ? Number(a.jersey) || null : null,
    };
  } catch {
    return null;
  }
}
