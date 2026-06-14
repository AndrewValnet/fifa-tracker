// Shared domain types. All external API payloads are normalized into these
// shapes so the UI never depends on a specific upstream provider.

export type DataSource = "football-data" | "worldcup26" | "gnews" | "demo";

export type MatchStatus =
  | "SCHEDULED"
  | "TIMED"
  | "IN_PLAY"
  | "PAUSED"
  | "FINISHED"
  | "SUSPENDED"
  | "POSTPONED"
  | "CANCELLED"
  | "AWARDED";

export type Stage =
  | "GROUP_STAGE"
  | "LAST_32"
  | "LAST_16"
  | "QUARTER_FINALS"
  | "SEMI_FINALS"
  | "THIRD_PLACE"
  | "FINAL";

export interface TeamRef {
  /** Source-specific id, stringified */
  id: string;
  name: string;
  /** FIFA three-letter code (e.g. "MEX"); null when unknown */
  code: string | null;
  /** Crest/flag image URL; null when unknown */
  crest: string | null;
}

export type MatchEventType = "GOAL" | "YELLOW" | "RED" | "SUB";

export interface MatchEvent {
  /** Display minute, e.g. "45+2" or "67" (no trailing apostrophe) */
  minute: string;
  type: MatchEventType;
  side: "HOME" | "AWAY";
  player: string;
  /** Assist (goals) or incoming player (subs) */
  secondary?: string | null;
  /** e.g. "pen", "og" */
  note?: string | null;
}

export interface MatchScore {
  home: number | null;
  away: number | null;
  halfTimeHome?: number | null;
  halfTimeAway?: number | null;
  winner?: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
}

export interface Referee {
  name: string;
  nationality: string | null;
  role: string;
}

export interface Match {
  /** Namespaced id: "fd-<id>" | "wc26-<id>" | "demo-<id>" */
  id: string;
  source: DataSource;
  utcDate: string;
  status: MatchStatus;
  /** Match minute reported by the provider, if any */
  minute: number | null;
  stage: Stage;
  /** Group letter "A".."L" for group-stage matches */
  group: string | null;
  matchday: number | null;
  homeTeam: TeamRef | null;
  awayTeam: TeamRef | null;
  /** Placeholder labels for undecided knockout slots, e.g. "Winner Group C" */
  homeLabel: string | null;
  awayLabel: string | null;
  score: MatchScore;
  events: MatchEvent[];
  venue: string | null;
  /** Stadium id within data/stadiums.json, when resolvable */
  stadiumId: string | null;
  referees: Referee[];
  lastUpdated: string | null;
}

export interface StandingRow {
  position: number;
  team: TeamRef;
  played: number;
  won: number;
  draw: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  /** Chronological recent results, latest last, e.g. ["W","D"] */
  form: ("W" | "D" | "L")[];
}

export interface GroupStanding {
  group: string;
  rows: StandingRow[];
}

export interface Scorer {
  player: string;
  team: TeamRef;
  goals: number;
  assists: number | null;
  penalties: number | null;
}

export interface SquadPlayer {
  id: string;
  name: string;
  /** Normalized bucket: GK | DEF | MID | FWD | null */
  position: string | null;
  positionDetail: string | null;
  shirtNumber: number | null;
  nationality: string | null;
  dateOfBirth: string | null;
}

export interface Coach {
  name: string | null;
  nationality: string | null;
}

export interface TeamDetail {
  id: string;
  name: string;
  code: string | null;
  crest: string | null;
  group: string | null;
  coach: Coach | null;
  squad: SquadPlayer[];
}

export interface OddsHistoryPoint {
  t: number; // unix seconds
  p: number; // probability 0..1
}

export interface OddsData {
  matchId: string;
  /** "match" = per-match market; "tournament" = outright winner fallback */
  kind: "match" | "tournament";
  title: string;
  home: number | null;
  draw: number | null;
  away: number | null;
  homeName: string | null;
  awayName: string | null;
  volume: number | null;
  volume24h: number | null;
  liquidity: number | null;
  /** Open interest = pool currently at stake across the event's outcomes. */
  openInterest?: number | null;
  url: string | null;
  homeHistory?: OddsHistoryPoint[];
  awayHistory?: OddsHistoryPoint[];
  updated: string;
}

export interface NewsArticle {
  title: string;
  description: string | null;
  url: string;
  image: string | null;
  source: string;
  publishedAt: string;
}

export interface Stadium {
  id: string;
  name: string;
  fifaName: string;
  city: string;
  country: string;
  capacity: number;
  surface: string;
  tz: string;
  lat: number;
  lng: number;
  image: string;
  aliases?: string[];
}

export interface TeamSeasonStats {
  played: number;
  won: number;
  draw: number;
  lost: number;
  gf: number;
  ga: number;
  cleanSheets: number;
  yellows: number | null;
  reds: number | null;
}

// ---------------------------------------------------------------------------
// ESPN-derived match enrichment (stats, lineups, attendance)
// ---------------------------------------------------------------------------

export interface TeamMatchStats {
  possession: number | null; // percent 0..100
  shots: number | null;
  shotsOnTarget: number | null;
  passes: number | null;
  accuratePasses: number | null;
  corners: number | null;
  fouls: number | null;
  offsides: number | null;
  saves: number | null;
  yellow: number | null;
  red: number | null;
  pkGoals: number | null;
  pkShots: number | null;
  assists: number | null;
}

export interface PlayerMatchStats {
  appearances: number;
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  fouls: number;
  foulsDrawn: number;
  offsides: number;
  yellow: number;
  red: number;
  ownGoals: number;
}

export interface LineupPlayer {
  espnId: string;
  name: string;
  jersey: number | null;
  positionAbbr: string | null;
  starter: boolean;
  subbedIn: boolean;
  subbedOut: boolean;
  formationPlace: number | null;
  headshot: string;
  stats: PlayerMatchStats;
  /** Estimated minutes on pitch (from kickoff/sub/full-time events) */
  minutes: number | null;
}

export interface TeamLineup {
  formation: string | null;
  players: LineupPlayer[];
}

export interface MatchExtras {
  eventId: string;
  state: "pre" | "in" | "post";
  attendance: number | null;
  stats: { home: TeamMatchStats; away: TeamMatchStats } | null;
  lineups: { home: TeamLineup | null; away: TeamLineup | null };
  videos: { headline: string; href: string | null }[];
  updated: string;
}

// ---------------------------------------------------------------------------
// Prediction-market money (Polymarket)
// ---------------------------------------------------------------------------

export interface WcTotals {
  /** Σ traded volume across all WC match + futures events */
  traded: number;
  matchTraded: number;
  futuresTraded: number;
  /** Σ open interest on open events (currently at stake) */
  atStake: number;
  liquidity: number;
  /** Σ open interest of resolved/closed events (pools already paid out) */
  settled: number;
  openEvents: number;
  closedEvents: number;
  updated: string;
}

export interface TeamFinanceMatchRow {
  matchId: string | null;
  label: string;
  eventSlug: string;
  volume: number; // whole event
  teamMarketVolume: number | null; // their own "Will X win" market
  openInterest: number | null;
  closed: boolean;
  /** resolution relative to this team's backers */
  outcome: "won" | "lost" | "open";
  url: string;
}

export interface TeamFinance {
  /** Σ event volume across their matches */
  matchVolume: number;
  /** Σ their own win-market volume ("money bet on this team") */
  backedVolume: number;
  /** Σ open interest on their still-open match events */
  atStake: number;
  /** Σ pools from settled match events where their backers won / lost */
  settledWonPools: number;
  settledLostPools: number;
  rows: TeamFinanceMatchRow[];
  outright: { price: number | null; volume: number | null; url: string | null } | null;
  updated: string;
}

export interface PlayerBio {
  espnId: string;
  name: string;
  headshot: string;
  age: number | null;
  dateOfBirth: string | null;
  height: string | null;
  weight: string | null;
  citizenship: string | null;
  birthPlace: string | null;
  club: string | null;
  position: string | null;
  jersey: number | null;
  foot: "right" | "left" | "both" | null;
}

export interface PlayerMatchLog {
  matchId: string | null;
  opponentCode: string | null;
  opponentName: string;
  utcDate: string;
  scoreline: string;
  started: boolean;
  cameOn: boolean;
  minutes: number | null;
  stats: PlayerMatchStats;
}

export interface PlayerMarket {
  title: string;
  outcomeLabel: string;
  price: number | null;
  volume: number | null;
  url: string;
}

/** A team in the outright "win the World Cup" market. */
export interface Favorite {
  code: string;
  name: string;
  /** Raw Polymarket implied win probability (0..1). */
  price: number;
  volume: number | null;
}

/** One Polymarket market shown in a "top/weird bets" list. */
export interface BetRow {
  label: string;
  volume: number | null;
  price: number | null;
  url: string;
}

export interface BetBuckets {
  top: BetRow[];
  weird: BetRow[];
}

/** Envelope attached to every data response so the UI can surface provenance. */
export interface Sourced<T> {
  data: T;
  source: DataSource;
  demo: boolean;
  fetchedAt: string;
}

export function sourced<T>(data: T, source: DataSource): Sourced<T> {
  return { data, source, demo: source === "demo", fetchedAt: new Date().toISOString() };
}
