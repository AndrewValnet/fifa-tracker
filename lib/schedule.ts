// Static tournament schedule helpers.
// data/schedule.json holds the full 104-match calendar (real fixtures) and is
// the offline-fallback skeleton; live sources overlay scores/events on top.

import scheduleJson from "@/data/schedule.json";
import stadiumsJson from "@/data/stadiums.json";
import { localStampToUtcIso } from "@/lib/time";
import { flagUrl, teamName } from "@/lib/team-meta";
import type {
  GroupStanding,
  Match,
  MatchEvent,
  Scorer,
  Stadium,
  Stage,
  StandingRow,
  TeamRef,
  TeamSeasonStats,
} from "@/lib/types";

export interface ScheduleScorer {
  player: string;
  minute: string | null;
  note?: string;
}

export interface ScheduleEntry {
  id: string;
  type: "group" | "r32" | "r16" | "qf" | "sf" | "third" | "final";
  group: string | null;
  matchday: number | null;
  home: string | null; // FIFA code
  away: string | null;
  homeLabel: string | null;
  awayLabel: string | null;
  localDate: string; // stadium-local "MM/DD/YYYY HH:mm"
  stadiumId: string;
  result: {
    home: number;
    away: number;
    homeScorers: ScheduleScorer[];
    awayScorers: ScheduleScorer[];
  } | null;
}

export const SCHEDULE: ScheduleEntry[] = scheduleJson as ScheduleEntry[];
export const STADIUMS: Stadium[] = stadiumsJson as Stadium[];

const stadiumById = new Map(STADIUMS.map((s) => [s.id, s]));

export function getStadium(id: string | null | undefined): Stadium | null {
  if (!id) return null;
  return stadiumById.get(id) ?? null;
}

/** Resolve a stadium from a free-form venue string (football-data style). */
export function findStadiumByName(venue: string | null | undefined): Stadium | null {
  if (!venue) return null;
  const norm = venue.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const s of STADIUMS) {
    const candidates = [s.name, s.fifaName, ...(s.aliases ?? [])];
    if (candidates.some((c) => {
      const cn = c.toLowerCase().replace(/[^a-z0-9]/g, "");
      return cn && (cn === norm || norm.includes(cn) || cn.includes(norm));
    })) {
      return s;
    }
  }
  return null;
}

/**
 * Find the static schedule entry for a pair of teams around a kickoff time.
 * Pairings are unique per tournament stage, and the 36h window guards against
 * any hypothetical rematch (group vs knockout meeting again).
 */
export function findScheduleEntryByTeams(
  homeCode: string | null | undefined,
  awayCode: string | null | undefined,
  utcIso: string,
): ScheduleEntry | null {
  if (!homeCode || !awayCode) return null;
  const kickoff = new Date(utcIso).getTime();
  if (!Number.isFinite(kickoff)) return null;
  for (const e of SCHEDULE) {
    if (e.home !== homeCode || e.away !== awayCode) continue;
    const t = new Date(entryUtcIso(e)).getTime();
    if (Math.abs(t - kickoff) <= 36 * 3600_000) return e;
  }
  return null;
}

export const STAGE_BY_TYPE: Record<ScheduleEntry["type"], Stage> = {
  group: "GROUP_STAGE",
  r32: "LAST_32",
  r16: "LAST_16",
  qf: "QUARTER_FINALS",
  sf: "SEMI_FINALS",
  third: "THIRD_PLACE",
  final: "FINAL",
};

/**
 * Fallback join for matches whose teams are still TBD (knockout slots):
 * a schedule entry matches if it is the *only* one of that stage kicking off
 * at that instant. Ambiguous (simultaneous) slots stay unresolved.
 */
export function findScheduleEntryByKickoff(stage: Stage, utcIso: string): ScheduleEntry | null {
  const t = new Date(utcIso).getTime();
  if (!Number.isFinite(t)) return null;
  const hits = SCHEDULE.filter(
    (e) => STAGE_BY_TYPE[e.type] === stage && Math.abs(new Date(entryUtcIso(e)).getTime() - t) < 30 * 60_000,
  );
  return hits.length === 1 ? hits[0] : null;
}

export function entryUtcIso(e: ScheduleEntry): string {
  const tz = getStadium(e.stadiumId)?.tz ?? "America/New_York";
  return localStampToUtcIso(e.localDate, tz) ?? new Date(e.localDate).toISOString();
}

export function teamRefFromCode(code: string | null): TeamRef | null {
  if (!code) return null;
  return {
    id: code,
    name: teamName(code) ?? code,
    code,
    crest: flagUrl(code, "w320"),
  };
}

function eventsFromResult(e: ScheduleEntry): MatchEvent[] {
  if (!e.result) return [];
  const mk = (s: ScheduleScorer, side: "HOME" | "AWAY"): MatchEvent => ({
    minute: s.minute ?? "",
    type: "GOAL",
    side,
    player: s.player,
    note: s.note ?? null,
  });
  return [
    ...e.result.homeScorers.map((s) => mk(s, "HOME")),
    ...e.result.awayScorers.map((s) => mk(s, "AWAY")),
  ].sort((a, b) => parseMinute(a.minute) - parseMinute(b.minute));
}

export function parseMinute(minute: string | null | undefined): number {
  if (!minute) return 0;
  const m = String(minute).match(/^(\d+)(?:\+(\d+))?/);
  if (!m) return 0;
  return Number(m[1]) + (m[2] ? Number(m[2]) / 100 : 0);
}

/**
 * Convert a static schedule entry into a Match.
 * Live overlays (worldcup26) replace status/score; in pure offline mode a
 * match inside its expected window is shown IN_PLAY with unknown score.
 */
export function entryToMatch(e: ScheduleEntry, idPrefix: "demo" | "wc26", now: Date = new Date()): Match {
  const utc = entryUtcIso(e);
  const kickoff = new Date(utc).getTime();
  let status: Match["status"];
  let score: Match["score"] = { home: null, away: null, winner: null };

  if (e.result) {
    status = "FINISHED";
    score = {
      home: e.result.home,
      away: e.result.away,
      winner: e.result.home > e.result.away ? "HOME_TEAM" : e.result.home < e.result.away ? "AWAY_TEAM" : "DRAW",
    };
  } else if (now.getTime() >= kickoff && now.getTime() < kickoff + 150 * 60_000) {
    status = "IN_PLAY";
  } else if (now.getTime() >= kickoff + 150 * 60_000) {
    // Window passed but no result baked in and no live source available.
    status = "FINISHED";
  } else {
    status = "TIMED";
  }

  const stadium = getStadium(e.stadiumId);
  return {
    id: `${idPrefix}-${e.id}`,
    source: idPrefix === "demo" ? "demo" : "worldcup26",
    utcDate: utc,
    status,
    minute: null,
    stage: STAGE_BY_TYPE[e.type],
    group: e.group,
    matchday: e.matchday,
    homeTeam: teamRefFromCode(e.home),
    awayTeam: teamRefFromCode(e.away),
    homeLabel: e.homeLabel,
    awayLabel: e.awayLabel,
    score,
    events: eventsFromResult(e),
    venue: stadium?.name ?? null,
    stadiumId: e.stadiumId,
    referees: [],
    lastUpdated: null,
  };
}

/** Stable order: kickoff time, then match number. */
export function sortMatches(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => {
    const t = new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime();
    if (t !== 0) return t;
    return a.id.localeCompare(b.id, undefined, { numeric: true });
  });
}

// ---------------------------------------------------------------------------
// Derived tables (used for worldcup26 + offline sources; football-data has its
// own standings/scorers endpoints).
// ---------------------------------------------------------------------------

export function computeStandings(matches: Match[]): GroupStanding[] {
  const groups = new Map<string, Map<string, StandingRow>>();

  // Seed every group with its four teams so unplayed groups still render.
  for (const e of SCHEDULE) {
    if (e.type !== "group" || !e.group) continue;
    let g = groups.get(e.group);
    if (!g) {
      g = new Map();
      groups.set(e.group, g);
    }
    for (const code of [e.home, e.away]) {
      if (code && !g.has(code)) {
        g.set(code, {
          position: 0,
          team: teamRefFromCode(code)!,
          played: 0,
          won: 0,
          draw: 0,
          lost: 0,
          gf: 0,
          ga: 0,
          gd: 0,
          points: 0,
          form: [],
        });
      }
    }
  }

  const finished = sortMatches(
    matches.filter(
      (m) =>
        m.stage === "GROUP_STAGE" &&
        m.status === "FINISHED" &&
        m.score.home !== null &&
        m.score.away !== null &&
        m.homeTeam?.code &&
        m.awayTeam?.code,
    ),
  );

  for (const m of finished) {
    const g = m.group ? groups.get(m.group) : undefined;
    if (!g) continue;
    const home = g.get(m.homeTeam!.code!);
    const away = g.get(m.awayTeam!.code!);
    if (!home || !away) continue;
    const hs = m.score.home!;
    const as = m.score.away!;
    home.played++;
    away.played++;
    home.gf += hs;
    home.ga += as;
    away.gf += as;
    away.ga += hs;
    if (hs > as) {
      home.won++;
      away.lost++;
      home.points += 3;
      home.form.push("W");
      away.form.push("L");
    } else if (hs < as) {
      away.won++;
      home.lost++;
      away.points += 3;
      away.form.push("W");
      home.form.push("L");
    } else {
      home.draw++;
      away.draw++;
      home.points++;
      away.points++;
      home.form.push("D");
      away.form.push("D");
    }
  }

  const out: GroupStanding[] = [];
  for (const [group, rows] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const table = [...rows.values()];
    for (const r of table) {
      r.gd = r.gf - r.ga;
      r.form = r.form.slice(-5);
    }
    table.sort(
      (a, b) =>
        b.points - a.points ||
        b.gd - a.gd ||
        b.gf - a.gf ||
        a.team.name.localeCompare(b.team.name),
    );
    table.forEach((r, i) => (r.position = i + 1));
    out.push({ group, rows: table });
  }
  return out;
}

export function computeScorers(matches: Match[], limit = 15): Scorer[] {
  const tally = new Map<string, Scorer>();
  for (const m of matches) {
    for (const ev of m.events) {
      if (ev.type !== "GOAL" || !ev.player) continue;
      const ref = ev.side === "HOME" ? m.homeTeam : m.awayTeam;
      if (!ref) continue;
      const key = `${ev.player}|${ref.code ?? ref.id}`;
      const cur = tally.get(key) ?? { player: ev.player, team: ref, goals: 0, assists: null, penalties: null };
      cur.goals++;
      if (ev.note?.toLowerCase().startsWith("pen")) cur.penalties = (cur.penalties ?? 0) + 1;
      tally.set(key, cur);
    }
  }
  return [...tally.values()]
    .sort((a, b) => b.goals - a.goals || a.player.localeCompare(b.player))
    .slice(0, limit);
}

export function computeTeamStats(matches: Match[], code: string): TeamSeasonStats {
  const stats: TeamSeasonStats = {
    played: 0,
    won: 0,
    draw: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    cleanSheets: 0,
    yellows: null,
    reds: null,
  };
  let yellows = 0;
  let reds = 0;
  let sawCards = false;
  for (const m of matches) {
    const side = m.homeTeam?.code === code ? "HOME" : m.awayTeam?.code === code ? "AWAY" : null;
    if (!side || m.status !== "FINISHED" || m.score.home === null || m.score.away === null) continue;
    const gf = side === "HOME" ? m.score.home : m.score.away;
    const ga = side === "HOME" ? m.score.away : m.score.home;
    stats.played++;
    stats.gf += gf;
    stats.ga += ga;
    if (ga === 0) stats.cleanSheets++;
    if (gf > ga) stats.won++;
    else if (gf < ga) stats.lost++;
    else stats.draw++;
    for (const ev of m.events) {
      if (ev.side !== side) continue;
      if (ev.type === "YELLOW") {
        yellows++;
        sawCards = true;
      }
      if (ev.type === "RED") {
        reds++;
        sawCards = true;
      }
    }
  }
  if (sawCards) {
    stats.yellows = yellows;
    stats.reds = reds;
  }
  return stats;
}
