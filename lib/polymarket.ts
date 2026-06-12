// Polymarket Gamma API client (PRD §5.3). Public read-only, no auth.
// Per-match World Cup events follow the slug convention
//   fifwc-<homeCode>-<awayCode>-<YYYY-MM-DD>           (date = US/Eastern)
// and are negRisk events whose binary markets are "Will X win ...", plus a
// "...end in a draw?" market. Falls back to the outright winner market.

import { cached, fetchWithTimeout } from "@/lib/cache";
import { dateStringInTz, addDays } from "@/lib/time";
import { resolveTeamCode, slugCodeVariants } from "@/lib/team-meta";
import type {
  Match,
  OddsData,
  OddsHistoryPoint,
  PlayerMarket,
  TeamFinance,
  TeamFinanceMatchRow,
  WcTotals,
} from "@/lib/types";

const GAMMA = "https://gamma-api.polymarket.com";
const CLOB = "https://clob.polymarket.com";

interface GammaMarket {
  question?: string;
  slug?: string;
  groupItemTitle?: string;
  outcomes?: string | string[];
  outcomePrices?: string | string[];
  volume?: string | number;
  liquidity?: string | number;
  clobTokenIds?: string | string[];
  active?: boolean;
  closed?: boolean;
}

interface GammaEvent {
  id: string;
  slug: string;
  title: string;
  endDate?: string;
  active?: boolean;
  closed?: boolean;
  negRisk?: boolean;
  volume?: number | string;
  liquidity?: number | string;
  volume24hr?: number | string;
  markets?: GammaMarket[];
}

function parseArr(v: string | string[] | undefined | null): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function num(v: string | number | undefined | null): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function getJson<T>(url: string, ttlMs: number): Promise<T> {
  return cached(`pm:${url}`, ttlMs, async () => {
    const res = await fetchWithTimeout(url, { headers: { Accept: "application/json" } }, 9000);
    if (!res.ok) throw new Error(`Polymarket ${url} -> HTTP ${res.status}`);
    return (await res.json()) as T;
  });
}

/**
 * Slug candidates for a match event. Polymarket mixes FIFA and ISO-2 team
 * codes in slugs (fifwc-usa-par…, fifwc-kr-cze…), and slug dates follow the
 * US/Eastern calendar. Misses are cached, so probing in order is cheap.
 */
function buildSlugCandidates(homeCode: string, awayCode: string, utcDate: string): string[] {
  const etDate = dateStringInTz(utcDate, "America/New_York");
  const utc = utcDate.slice(0, 10);
  const primaryDates = [...new Set([etDate, utc])];
  const extraDates = [addDays(etDate, -1), addDays(etDate, 1)].filter((d) => !primaryDates.includes(d));
  const homes = slugCodeVariants(homeCode);
  const aways = slugCodeVariants(awayCode);

  const out: string[] = [];
  const push = (h: string, a: string, d: string) => {
    for (const slug of [`fifwc-${h}-${a}-${d}`, `fifwc-${a}-${h}-${d}`]) {
      if (!out.includes(slug)) out.push(slug);
    }
  };
  for (const d of primaryDates) for (const h of homes) for (const a of aways) push(h, a, d);
  for (const d of extraDates) push(homes[0], aways[0], d);
  return out;
}

async function eventBySlug(slug: string): Promise<GammaEvent | null> {
  try {
    const events = await getJson<GammaEvent[]>(`${GAMMA}/events?slug=${encodeURIComponent(slug)}`, 55_000);
    return events?.[0] ?? null;
  } catch {
    return null;
  }
}

async function searchEvents(q: string): Promise<GammaEvent[]> {
  try {
    const data = await getJson<{ events?: GammaEvent[] }>(
      `${GAMMA}/public-search?q=${encodeURIComponent(q)}&limit_per_type=8`,
      55_000,
    );
    return data?.events ?? [];
  } catch {
    return [];
  }
}

/** Yes-probability of a binary Gamma market. */
function yesPrice(m: GammaMarket): number | null {
  const outcomes = parseArr(m.outcomes);
  const prices = parseArr(m.outcomePrices);
  if (!prices.length) return null;
  let idx = outcomes.findIndex((o) => /^yes$/i.test(o));
  if (idx < 0) idx = 0;
  const p = Number(prices[idx]);
  return Number.isFinite(p) && p >= 0 && p <= 1 ? p : null;
}

function classifyMarket(
  m: GammaMarket,
  homeCode: string,
  awayCode: string,
  homeName: string,
  awayName: string,
): "home" | "away" | "draw" | null {
  const suffix = (m.slug ?? "").split("-").pop()?.toUpperCase();
  if (suffix === "DRAW") return "draw";
  if (suffix === homeCode) return "home";
  if (suffix === awayCode) return "away";

  const label = m.groupItemTitle ?? "";
  if (/^draw\b/i.test(label)) return "draw";
  const labelCode = resolveTeamCode(null, label.replace(/\s*\(.*\)\s*$/, ""));
  if (labelCode === homeCode) return "home";
  if (labelCode === awayCode) return "away";

  const q = m.question ?? "";
  if (/end in a draw/i.test(q)) return "draw";
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (norm(q).includes(norm(homeName)) && !norm(q).includes(norm(awayName))) return "home";
  if (norm(q).includes(norm(awayName)) && !norm(q).includes(norm(homeName))) return "away";
  return null;
}

async function priceHistory(tokenId: string): Promise<OddsHistoryPoint[] | undefined> {
  try {
    const data = await getJson<{ history?: { t: number; p: number }[] }>(
      `${CLOB}/prices-history?market=${tokenId}&interval=1w&fidelity=30`,
      300_000,
    );
    const hist = data?.history ?? [];
    if (!hist.length) return undefined;
    // Downsample to <= 80 points to keep payloads small.
    const step = Math.max(1, Math.floor(hist.length / 80));
    return hist.filter((_, i) => i % step === 0 || i === hist.length - 1).map((h) => ({ t: h.t, p: h.p }));
  } catch {
    return undefined;
  }
}

/** Find the per-match market for a Match; null when no market exists. */
export async function getMatchMarket(match: Match): Promise<OddsData | null> {
  const home = match.homeTeam;
  const away = match.awayTeam;
  if (!home?.code || !away?.code) return null;

  let event: GammaEvent | null = null;
  for (const slug of buildSlugCandidates(home.code, away.code, match.utcDate)) {
    event = await eventBySlug(slug);
    if (event) break;
  }

  if (!event) {
    const kickoff = new Date(match.utcDate).getTime();
    const results = await searchEvents(`${home.name} ${away.name}`);
    event =
      results.find((ev) => {
        if (!ev.slug?.startsWith("fifwc-")) return false;
        if (!ev.endDate) return true;
        return Math.abs(new Date(ev.endDate).getTime() - kickoff) < 48 * 3600_000;
      }) ?? null;
  }
  if (!event?.markets?.length) return null;

  const odds: OddsData = {
    matchId: match.id,
    kind: "match",
    title: event.title,
    home: null,
    draw: null,
    away: null,
    homeName: home.name,
    awayName: away.name,
    volume: num(event.volume),
    volume24h: num(event.volume24hr),
    liquidity: num(event.liquidity),
    url: `https://polymarket.com/event/${event.slug}`,
    updated: new Date().toISOString(),
  };

  let homeToken: string | null = null;
  let awayToken: string | null = null;

  for (const m of event.markets) {
    const cls = classifyMarket(m, home.code, away.code, home.name, away.name);
    const p = yesPrice(m);
    if (!cls || p === null) continue;
    if (cls === "home") {
      odds.home = p;
      homeToken = parseArr(m.clobTokenIds)[0] ?? null;
    } else if (cls === "away") {
      odds.away = p;
      awayToken = parseArr(m.clobTokenIds)[0] ?? null;
    } else {
      odds.draw = p;
    }
  }

  if (odds.home === null && odds.away === null && odds.draw === null) return null;

  // Win-probability trend sparklines (best effort).
  const [hh, ah] = await Promise.all([
    homeToken ? priceHistory(homeToken) : Promise.resolve(undefined),
    awayToken ? priceHistory(awayToken) : Promise.resolve(undefined),
  ]);
  odds.homeHistory = hh;
  odds.awayHistory = ah;
  return odds;
}

const WINNER_SLUGS = [
  "2026-fifa-world-cup-winner",
  "fifa-world-cup-winner-2026",
  "world-cup-2026-winner",
  "fifa-world-cup-winner",
];

async function winnerEvent(): Promise<GammaEvent | null> {
  return cached("pm:winner-event", 300_000, async () => {
    for (const slug of WINNER_SLUGS) {
      const ev = await eventBySlug(slug);
      if (ev?.markets?.length) return ev;
    }
    const results = await searchEvents("2026 FIFA World Cup Winner");
    return (
      results.find(
        (ev) =>
          /world.?cup/i.test(ev.slug) &&
          /winner|champion/i.test(ev.slug + " " + ev.title) &&
          (ev.markets?.length ?? 0) > 8,
      ) ?? null
    );
  });
}

/** Tournament-winner odds for the two sides of a match (fallback display). */
export async function getTournamentOdds(match: Match): Promise<OddsData | null> {
  const home = match.homeTeam;
  const away = match.awayTeam;
  if (!home?.code || !away?.code) return null;
  const ev = await winnerEvent();
  if (!ev?.markets?.length) return null;

  let homeP: number | null = null;
  let awayP: number | null = null;
  for (const m of ev.markets) {
    const label = m.groupItemTitle || m.question || "";
    const code = resolveTeamCode(null, label.replace(/^will\s+/i, "").replace(/\s+win.*$/i, ""));
    if (!code) continue;
    const p = yesPrice(m);
    if (p === null) continue;
    if (code === home.code) homeP = p;
    if (code === away.code) awayP = p;
  }
  if (homeP === null && awayP === null) return null;

  return {
    matchId: match.id,
    kind: "tournament",
    title: ev.title,
    home: homeP,
    draw: null,
    away: awayP,
    homeName: home.name,
    awayName: away.name,
    volume: num(ev.volume),
    volume24h: num(ev.volume24hr),
    liquidity: num(ev.liquidity),
    url: `https://polymarket.com/event/${ev.slug}`,
    updated: new Date().toISOString(),
  };
}

export async function getOddsForMatch(match: Match): Promise<OddsData | null> {
  return cached(`pm:odds:${match.id}`, 55_000, async () => {
    const matchOdds = await getMatchMarket(match);
    if (matchOdds) return matchOdds;
    return await getTournamentOdds(match);
  });
}

// ---------------------------------------------------------------------------
// Tournament-wide money totals (war room banner)
// ---------------------------------------------------------------------------

const MATCH_SERIES_ID = "11433"; // Polymarket "FIFA World Cup" per-match series (soccer-fifwc)
const FUTURES_TAGS = ["world-cup", "fifa-world-cup"];
const WC_END = new Date("2026-12-31T23:59:59Z").getTime();
const WC_START = new Date("2025-06-01T00:00:00Z").getTime();

async function collectEvents(params: string, into: Map<string, GammaEvent>): Promise<void> {
  for (let offset = 0; offset < 1500; offset += 100) {
    const page = await getJson<GammaEvent[]>(`${GAMMA}/events?${params}&limit=100&offset=${offset}`, 10 * 60_000);
    if (!Array.isArray(page) || !page.length) break;
    for (const ev of page) {
      if (!ev?.id) continue;
      const end = ev.endDate ? new Date(ev.endDate).getTime() : null;
      if (end !== null && (end > WC_END || end < WC_START)) continue; // 2026 cycle only
      into.set(ev.id, ev);
    }
    if (page.length < 100) break;
  }
}

interface GammaEventTotals extends GammaEvent {
  openInterest?: number | string;
}

export async function getWcTotals(): Promise<WcTotals> {
  return cached("pm:wc-totals", 15 * 60_000, async () => {
    const all = new Map<string, GammaEvent>();
    for (const closed of ["false", "true"]) {
      await collectEvents(`series_id=${MATCH_SERIES_ID}&closed=${closed}`, all);
      for (const tag of FUTURES_TAGS) {
        await collectEvents(`tag_slug=${tag}&closed=${closed}`, all);
      }
    }

    const totals: WcTotals = {
      traded: 0,
      matchTraded: 0,
      futuresTraded: 0,
      atStake: 0,
      liquidity: 0,
      settled: 0,
      openEvents: 0,
      closedEvents: 0,
      updated: new Date().toISOString(),
    };
    for (const ev of all.values()) {
      const vol = num(ev.volume) ?? 0;
      const oi = num((ev as GammaEventTotals).openInterest) ?? 0;
      totals.traded += vol;
      if (ev.slug?.startsWith("fifwc-")) totals.matchTraded += vol;
      else totals.futuresTraded += vol;
      if (ev.closed) {
        totals.closedEvents++;
        totals.settled += oi;
      } else {
        totals.openEvents++;
        totals.atStake += oi;
        totals.liquidity += num(ev.liquidity) ?? 0;
      }
    }
    return totals;
  });
}

// ---------------------------------------------------------------------------
// Per-team market finance
// ---------------------------------------------------------------------------

async function matchEventForTeams(home: string, away: string, utcDate: string): Promise<GammaEvent | null> {
  for (const slug of buildSlugCandidates(home, away, utcDate)) {
    const ev = await eventBySlug(slug);
    if (ev) return ev;
  }
  return null;
}

/**
 * Money picture for one team across its match markets plus the outright.
 * Pool framing: a resolved binary market pays its whole pool to the winning
 * side, so settled pools are attributed by the real match result.
 */
export async function getTeamFinance(code: string, matches: Match[]): Promise<TeamFinance> {
  return cached(`pm:finance:${code}`, 5 * 60_000, async () => {
    const finance: TeamFinance = {
      matchVolume: 0,
      backedVolume: 0,
      atStake: 0,
      settledWonPools: 0,
      settledLostPools: 0,
      rows: [],
      outright: null,
      updated: new Date().toISOString(),
    };

    const relevant = matches
      .filter((m) => m.homeTeam?.code && m.awayTeam?.code)
      .filter((m) => m.homeTeam!.code === code || m.awayTeam!.code === code)
      .slice(0, 10);

    for (const m of relevant) {
      const ev = await matchEventForTeams(m.homeTeam!.code!, m.awayTeam!.code!, m.utcDate);
      if (!ev) continue;
      // companion props event ("…-more-markets") counts toward match volume
      const props = await eventBySlug(`${ev.slug}-more-markets`);
      const vol = (num(ev.volume) ?? 0) + (props ? num(props.volume) ?? 0 : 0);
      const oi =
        (num((ev as GammaEventTotals).openInterest) ?? 0) +
        (props ? num((props as GammaEventTotals).openInterest) ?? 0 : 0);

      // the team's own "Will X win" market
      const side = m.homeTeam!.code === code ? "home" : "away";
      let teamMarketVolume: number | null = null;
      for (const market of ev.markets ?? []) {
        const cls = classifyMarket(market, m.homeTeam!.code!, m.awayTeam!.code!, m.homeTeam!.name, m.awayTeam!.name);
        if (cls === side) teamMarketVolume = num(market.volume);
      }

      const finished = m.status === "FINISHED" && m.score.home !== null && m.score.away !== null;
      const teamWon =
        finished &&
        ((side === "home" && m.score.home! > m.score.away!) || (side === "away" && m.score.away! > m.score.home!));

      finance.matchVolume += vol;
      if (teamMarketVolume) finance.backedVolume += teamMarketVolume;
      let outcome: TeamFinanceMatchRow["outcome"] = "open";
      if (finished) {
        outcome = teamWon ? "won" : "lost";
        if (teamWon) finance.settledWonPools += oi;
        else finance.settledLostPools += oi;
      } else {
        finance.atStake += oi;
      }

      finance.rows.push({
        matchId: m.id,
        label: `${m.homeTeam!.code} vs ${m.awayTeam!.code}`,
        eventSlug: ev.slug,
        volume: vol,
        teamMarketVolume,
        openInterest: oi || null,
        closed: !!ev.closed || finished,
        outcome,
        url: `https://polymarket.com/event/${ev.slug}`,
      });
    }

    // outright winner market
    const winner = await winnerEvent();
    if (winner?.markets?.length) {
      for (const market of winner.markets) {
        const label = (market.groupItemTitle || market.question || "").replace(/^will\s+/i, "").replace(/\s+win.*$/i, "");
        if (resolveTeamCode(null, label) === code) {
          finance.outright = {
            price: yesPrice(market),
            volume: num(market.volume),
            url: `https://polymarket.com/event/${winner.slug}`,
          };
          break;
        }
      }
    }

    return finance;
  });
}

// ---------------------------------------------------------------------------
// Player prop markets (e.g. Golden Boot)
// ---------------------------------------------------------------------------

export async function getPlayerMarkets(playerName: string): Promise<PlayerMarket[]> {
  return cached(`pm:player:${playerName.toLowerCase()}`, 10 * 60_000, async () => {
    const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const results = await searchEvents(playerName);
    const out: PlayerMarket[] = [];
    for (const ev of results) {
      if (!/world.?cup|fifwc|golden/i.test(`${ev.slug} ${ev.title}`)) continue;
      for (const market of ev.markets ?? []) {
        const label = market.groupItemTitle || market.question || "";
        if (!norm(label).includes(norm(playerName).split(" ").pop() ?? "")) continue;
        out.push({
          title: ev.title,
          outcomeLabel: label,
          price: yesPrice(market),
          volume: num(market.volume),
          url: `https://polymarket.com/event/${ev.slug}`,
        });
        break;
      }
      if (out.length >= 3) break;
    }
    return out;
  });
}
