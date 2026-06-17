// Tournament Insights — the "cheeky aggregate" analytics hub.
// Aggregates across matches from sources already wired (Polymarket money + odds
// history, ESPN per-match/per-player stats + attendance, the schedule, and the
// labeled audience model). Heavy work is bounded (finished matches only, capped,
// limited concurrency) and cached. Everything degrades to a friendly empty state
// before enough matches are played, and estimates are clearly labeled as such.

import reachData from "@/data/team-reach.json";
import { mapLimit } from "@/lib/async";
import { cached } from "@/lib/cache";
import { estimateAudience, type ReachLookup } from "@/lib/audience";
import { extrasForMatch, getAllMatches } from "@/lib/data";
import { getOddsForMatch, getOutrightVolumes } from "@/lib/polymarket";
import { getStadium, findStadiumByName, parseMinute } from "@/lib/schedule";
import { teamName } from "@/lib/team-meta";
import type { Match, MatchExtras, OddsData, OddsHistoryPoint } from "@/lib/types";

const REACH = reachData as unknown as ReachLookup;
const FINISHED_CAP = 40; // bound the per-match Polymarket/ESPN fan-out
const PER_SPECTATOR_TONNES = 0.9; // flat published travel+ops factor (see label)
const GDP_PER_HOUR_USD = 25; // crude global average output per worker-hour
const WORK_FRACTION = 0.25; // share of the modeled audience watching on the clock

export interface InsightRow {
  matchId: string | null;
  label: string;
}

export interface InsightsData {
  generatedAt: string;
  finishedCount: number;
  oddsAvailable: boolean;
  money: {
    onLosingSideTotal: number;
    losingSide: (InsightRow & { favCode: string | null; favProb: number; amount: number; result: string })[];
    perCapita: { code: string; name: string; volume: number; perCapita: number; price: number | null }[];
  };
  upsets: {
    biggest: (InsightRow & { winnerCode: string | null; winnerProb: number; scoreline: string })[];
    marketAccuracy: { decided: number; favoriteWon: number; pct: number | null };
    bottleJobs: (InsightRow & { teamCode: string | null; peak: number; final: number; drop: number })[];
  };
  pitch: {
    dirtiest: { code: string; name: string; games: number; fouls: number; yellow: number; red: number; foulsPerGame: number }[];
    theatrics: { code: string; name: string; foulsDrawn: number; foulsCommitted: number; ratio: number }[];
    clutch: { code: string; name: string; goals: number; lateGoals: number; pct: number }[];
    fillFullest: { label: string; attendance: number; capacity: number; pct: number }[];
    fillEmptiest: { label: string; attendance: number; capacity: number; pct: number }[];
  };
  cheeky: {
    carbonTotalTonnes: number;
    carbonRows: { label: string; attendance: number; tonnes: number }[];
    cardiacMultiplier: number;
    cardiacTopMatch: string | null;
    babyBoomWindow: string;
    productivityLostUsd: number;
  };
}

interface Gathered {
  match: Match;
  odds: OddsData | null;
  extras: MatchExtras | null;
}

const codeName = (code: string | null | undefined) => (code ? teamName(code) ?? code : "—");
const label = (m: Match) => `${m.homeTeam?.code ?? "?"} ${m.score.home ?? "–"}–${m.score.away ?? "–"} ${m.awayTeam?.code ?? "?"}`;

function matchWinner(m: Match): "HOME" | "AWAY" | "DRAW" | null {
  if (m.score.home == null || m.score.away == null) return null;
  if (m.score.home > m.score.away) return "HOME";
  if (m.score.home < m.score.away) return "AWAY";
  return "DRAW";
}

// Implied probability at (or just before) kickoff, from the odds-history series.
function probAtKickoff(history: OddsHistoryPoint[] | undefined, kickoffSec: number, fallback: number | null): number | null {
  if (!history?.length) return fallback;
  let chosen = history[0].p;
  for (const pt of history) {
    if (pt.t <= kickoffSec) chosen = pt.p;
    else break;
  }
  return chosen;
}
const peakProb = (h?: OddsHistoryPoint[]) => (h?.length ? Math.max(...h.map((p) => p.p)) : null);
const finalProb = (h: OddsHistoryPoint[] | undefined, fb: number | null) => (h?.length ? h[h.length - 1].p : fb);

export async function getInsights(): Promise<InsightsData> {
  return cached("insights:all", 10 * 60_000, async () => {
    const all = (await getAllMatches()).data;
    const finished = all.filter(
      (m) => m.status === "FINISHED" && m.score.home != null && m.score.away != null && m.homeTeam?.code && m.awayTeam?.code,
    );
    const sample = finished.slice(-FINISHED_CAP); // most-recent finished matches

    // Independent single fetch — overlap it with the per-match fan-out below.
    const outrightP = getOutrightVolumes().catch(() => ({}) as Record<string, { volume: number | null; price: number | null }>);

    const gathered: Gathered[] = await mapLimit(sample, 6, async (match) => {
      const [odds, extras] = await Promise.all([
        getOddsForMatch(match).catch(() => null),
        extrasForMatch(match).catch(() => null),
      ]);
      return { match, odds, extras };
    });
    const oddsAvailable = gathered.some((g) => g.odds && (g.odds.home != null || g.odds.away != null));

    // ---- Money mischief ----------------------------------------------------
    let onLosingSideTotal = 0;
    const losingSide: InsightsData["money"]["losingSide"] = [];
    let decided = 0;
    let favoriteWon = 0;
    const biggest: InsightsData["upsets"]["biggest"] = [];
    const bottleJobs: InsightsData["upsets"]["bottleJobs"] = [];

    for (const g of gathered) {
      if (!g.odds) continue;
      const kickoffSec = Math.floor(new Date(g.match.utcDate).getTime() / 1000);
      const homePre = probAtKickoff(g.odds.homeHistory, kickoffSec, g.odds.home);
      const awayPre = probAtKickoff(g.odds.awayHistory, kickoffSec, g.odds.away);
      const result = matchWinner(g.match);
      if (homePre == null || awayPre == null || !result) continue;

      const favSide: "HOME" | "AWAY" = homePre >= awayPre ? "HOME" : "AWAY";
      const favProb = Math.max(homePre, awayPre);
      const favCode = (favSide === "HOME" ? g.match.homeTeam : g.match.awayTeam)?.code ?? null;

      // market accuracy (decisive results only)
      if (result !== "DRAW") {
        decided++;
        if (result === favSide) favoriteWon++;
      }

      // money that backed the favorite when the favorite didn't win
      const oi = g.odds.openInterest ?? null;
      if (oi && result !== favSide) {
        const amount = oi * favProb;
        onLosingSideTotal += amount;
        losingSide.push({
          matchId: g.match.id,
          label: label(g.match),
          favCode,
          favProb,
          amount,
          result: result === "DRAW" ? "drew" : "lost",
        });
      }

      // biggest upset (winner's pre-match win probability)
      if (result !== "DRAW") {
        const winnerCode = (result === "HOME" ? g.match.homeTeam : g.match.awayTeam)?.code ?? null;
        const winnerProb = result === "HOME" ? homePre : awayPre;
        biggest.push({
          matchId: g.match.id,
          label: label(g.match),
          winnerCode,
          winnerProb,
          scoreline: `${g.match.score.home}–${g.match.score.away}`,
        });
      }

      // biggest bottle job (peak win prob → final, for a side that didn't win)
      for (const side of ["HOME", "AWAY"] as const) {
        const hist = side === "HOME" ? g.odds.homeHistory : g.odds.awayHistory;
        const pk = peakProb(hist);
        const fn = finalProb(hist, side === "HOME" ? g.odds.home : g.odds.away);
        if (pk == null || fn == null) continue;
        const drop = pk - fn;
        if (pk >= 0.55 && drop >= 0.15 && result !== side) {
          bottleJobs.push({
            matchId: g.match.id,
            label: label(g.match),
            teamCode: (side === "HOME" ? g.match.homeTeam : g.match.awayTeam)?.code ?? null,
            peak: pk,
            final: fn,
            drop,
          });
        }
      }
    }
    losingSide.sort((a, b) => b.amount - a.amount);
    biggest.sort((a, b) => a.winnerProb - b.winnerProb);
    bottleJobs.sort((a, b) => b.drop - a.drop);

    // per-capita outright faith (single futures-market fetch, started above)
    const outright = await outrightP;
    const perCapita = Object.entries(outright)
      .map(([code, v]) => {
        const pop = REACH[code]?.popMillions ?? 0;
        const volume = v.volume ?? 0;
        return {
          code,
          name: codeName(code),
          volume,
          perCapita: pop > 0 ? volume / (pop * 1_000_000) : 0,
          price: v.price,
        };
      })
      .filter((r) => r.volume > 0 && r.perCapita > 0)
      .sort((a, b) => b.perCapita - a.perCapita)
      .slice(0, 10);

    // ---- On-pitch spice ----------------------------------------------------
    const teamAgg = new Map<string, { games: number; fouls: number; yellow: number; red: number; foulsDrawn: number }>();
    const bump = (code: string) => {
      let e = teamAgg.get(code);
      if (!e) {
        e = { games: 0, fouls: 0, yellow: 0, red: 0, foulsDrawn: 0 };
        teamAgg.set(code, e);
      }
      return e;
    };
    for (const g of gathered) {
      if (!g.extras?.stats) continue;
      for (const side of ["home", "away"] as const) {
        const code = (side === "home" ? g.match.homeTeam : g.match.awayTeam)?.code;
        if (!code) continue;
        const st = g.extras.stats[side];
        const e = bump(code);
        e.games++;
        e.fouls += st.fouls ?? 0;
        e.yellow += st.yellow ?? 0;
        e.red += st.red ?? 0;
        const lineup = g.extras.lineups?.[side];
        if (lineup) for (const p of lineup.players) e.foulsDrawn += p.stats.foulsDrawn ?? 0;
      }
    }
    const dirtiest = [...teamAgg.entries()]
      .filter(([, e]) => e.games > 0 && (e.fouls > 0 || e.yellow > 0 || e.red > 0))
      .map(([code, e]) => ({
        code,
        name: codeName(code),
        games: e.games,
        fouls: e.fouls,
        yellow: e.yellow,
        red: e.red,
        foulsPerGame: e.fouls / e.games,
      }))
      .sort((a, b) => b.yellow + b.red * 2 + b.foulsPerGame / 10 - (a.yellow + a.red * 2 + a.foulsPerGame / 10))
      .slice(0, 10);
    const theatrics = [...teamAgg.entries()]
      .filter(([, e]) => e.foulsDrawn > 0 && e.fouls > 0)
      .map(([code, e]) => ({
        code,
        name: codeName(code),
        foulsDrawn: e.foulsDrawn,
        foulsCommitted: e.fouls,
        ratio: e.fouls > 0 ? e.foulsDrawn / e.fouls : 0,
      }))
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, 10);

    // clutch index — late goals from ESPN timeline (worldcup26 events unreliable)
    const goalAgg = new Map<string, { goals: number; late: number }>();
    for (const g of gathered) {
      const evs = g.extras?.timeline?.length ? g.extras.timeline : g.match.events;
      for (const ev of evs) {
        if (ev.type !== "GOAL") continue;
        const code = (ev.side === "HOME" ? g.match.homeTeam : g.match.awayTeam)?.code;
        if (!code) continue;
        let e = goalAgg.get(code);
        if (!e) {
          e = { goals: 0, late: 0 };
          goalAgg.set(code, e);
        }
        e.goals++;
        if (parseMinute(ev.minute) >= 75) e.late++;
      }
    }
    const clutch = [...goalAgg.entries()]
      .filter(([, e]) => e.goals >= 3)
      .map(([code, e]) => ({ code, name: codeName(code), goals: e.goals, lateGoals: e.late, pct: e.late / e.goals }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 10);

    // stadium fill rate
    const fill: { label: string; attendance: number; capacity: number; pct: number }[] = [];
    for (const g of gathered) {
      const att = g.extras?.attendance;
      const stadium = getStadium(g.match.stadiumId) ?? findStadiumByName(g.match.venue);
      if (!att || !stadium?.capacity) continue;
      fill.push({
        label: `${g.match.homeTeam?.code ?? "?"} v ${g.match.awayTeam?.code ?? "?"} · ${stadium.city}`,
        attendance: att,
        capacity: stadium.capacity,
        pct: att / stadium.capacity,
      });
    }
    const fillFullest = [...fill].sort((a, b) => b.pct - a.pct).slice(0, 6);
    const fillEmptiest = [...fill].sort((a, b) => a.pct - b.pct).slice(0, 6);

    // ---- Cheeky estimates --------------------------------------------------
    let carbonTotalTonnes = 0;
    const carbonRows: { label: string; attendance: number; tonnes: number }[] = [];
    let cardiacTop = { label: "", score: 0 };
    for (const g of gathered) {
      const att = g.extras?.attendance;
      if (!att) continue;
      const tonnes = att * PER_SPECTATOR_TONNES;
      carbonTotalTonnes += tonnes;
      carbonRows.push({ label: label(g.match), attendance: att, tonnes });
      if (att > cardiacTop.score) cardiacTop = { label: label(g.match), score: att };
    }
    carbonRows.sort((a, b) => b.tonnes - a.tonnes);

    // productivity lost — modeled audience watching during work hours, all matches
    let productivityLostUsd = 0;
    const nowMs = Date.now();
    for (const m of all) {
      const est = estimateAudience(m, REACH, nowMs);
      // avg-live-minute (millions) * ~2 match hours * working-hours fraction * GDP/hour
      productivityLostUsd += est.avgLiveMinuteM * 1_000_000 * 2 * WORK_FRACTION * GDP_PER_HOUR_USD;
    }

    // baby-boom window: ~40 weeks after the tournament's midpoint
    const dates = all.map((m) => new Date(m.utcDate).getTime()).filter(Number.isFinite);
    const mid = dates.length ? (Math.min(...dates) + Math.max(...dates)) / 2 : nowMs;
    const due = new Date(mid + 280 * 24 * 3600_000);
    const babyBoomWindow = due.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    return {
      generatedAt: new Date().toISOString(),
      finishedCount: finished.length,
      oddsAvailable,
      money: { onLosingSideTotal, losingSide: losingSide.slice(0, 8), perCapita },
      upsets: {
        biggest: biggest.slice(0, 8),
        marketAccuracy: { decided, favoriteWon, pct: decided > 0 ? favoriteWon / decided : null },
        bottleJobs: bottleJobs.slice(0, 8),
      },
      pitch: { dirtiest, theatrics, clutch, fillFullest, fillEmptiest },
      cheeky: {
        carbonTotalTonnes,
        carbonRows: carbonRows.slice(0, 6),
        cardiacMultiplier: 2.66,
        cardiacTopMatch: cardiacTop.label || null,
        babyBoomWindow,
        productivityLostUsd,
      },
    };
  });
}
