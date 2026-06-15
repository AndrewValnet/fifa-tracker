// All-time World Cup statistical records (1930–2022).
// Static reference data — not pulled from any live API.

export interface WcLegend {
  name: string;
  nation: string;   // FIFA 3-letter code
  value: number;
  detail?: string;  // e.g. "13 in 1958 alone"
}

// ── All-time top scorers ──────────────────────────────────────────────────────
export const ALL_TIME_SCORERS: WcLegend[] = [
  { name: "Miroslav Klose",  nation: "GER", value: 16, detail: "5 in 2002 · 5 in 2006 · 4 in 2010 · 2 in 2014" },
  { name: "Ronaldo",         nation: "BRA", value: 15, detail: "4 in 1998 · 8 in 2002 · 3 in 2006" },
  { name: "Gerd Müller",     nation: "GER", value: 14, detail: "10 in 1970 · 4 in 1974 (West Germany)" },
  { name: "Lionel Messi",    nation: "ARG", value: 13, detail: "Goals across 2006–2022 tournaments" },
  { name: "Just Fontaine",   nation: "FRA", value: 13, detail: "All 13 in one tournament — France 1958 ✦" },
  { name: "Pelé",            nation: "BRA", value: 12, detail: "6 in 1958 · 1 in 1962 · 1 in 1966 · 4 in 1970" },
  { name: "Kylian Mbappé",   nation: "FRA", value: 12, detail: "1 in 2018 · 8 in 2022 (active)" },
  { name: "Sándor Kocsis",   nation: "HUN", value: 11, detail: "11 in 1954 alone — 'Golden Head'" },
  { name: "Jürgen Klinsmann", nation: "GER", value: 11, detail: "3 in 1990 · 5 in 1994 · 3 in 1998" },
  { name: "Gabriel Batistuta", nation: "ARG", value: 10, detail: "2 in 1994 · 5 in 1998 · 3 in 2002" },
];

// ── Most WC tournament appearances ───────────────────────────────────────────
export const MOST_TOURNAMENTS: WcLegend[] = [
  { name: "Antonio Carbajal", nation: "MEX", value: 5, detail: "1950 · 1954 · 1958 · 1962 · 1966 (goalkeeper)" },
  { name: "Lothar Matthäus",  nation: "GER", value: 5, detail: "1982 · 1986 · 1990 · 1994 · 1998" },
  { name: "Gianluigi Buffon", nation: "ITA", value: 5, detail: "1998 · 2002 · 2006 · 2010 · 2014" },
  { name: "Andoni Zubizarreta", nation: "ESP", value: 4, detail: "1986 · 1990 · 1994 · 1998 (goalkeeper)" },
  { name: "Sergio Ramos",     nation: "ESP", value: 4, detail: "2006 · 2010 · 2014 · 2018" },
  { name: "Pelé",             nation: "BRA", value: 4, detail: "1958 · 1962 · 1966 · 1970" },
  { name: "Uwe Seeler",       nation: "GER", value: 4, detail: "1958 · 1962 · 1966 · 1970" },
  { name: "Mário Zagallo",    nation: "BRA", value: 4, detail: "1958 · 1962 · 1966 · 1974 (also won as manager)" },
];

// ── Most games played ─────────────────────────────────────────────────────────
export const MOST_GAMES: WcLegend[] = [
  { name: "Lothar Matthäus",  nation: "GER", value: 25, detail: "Records across 5 WC tournaments (1982–1998)" },
  { name: "Miroslav Klose",   nation: "GER", value: 24, detail: "24 games · 16 goals · 4 WC tournaments" },
  { name: "Paolo Maldini",    nation: "ITA", value: 23, detail: "1990 · 1994 · 1998 · 2002" },
  { name: "Uwe Seeler",       nation: "GER", value: 21, detail: "Participated across 4 WC tournaments" },
  { name: "Władysław Żmuda",  nation: "POL", value: 21, detail: "3rd place 1974 · 3rd place 1982" },
];

// ── Single-tournament records ─────────────────────────────────────────────────
export interface WcTournamentRecord {
  category: string;
  holder: string;
  nation: string;
  value: string;
  year: number;
  detail?: string;
}

export const TOURNAMENT_RECORDS: WcTournamentRecord[] = [
  { category: "Most goals, one tournament", holder: "Just Fontaine",    nation: "FRA", value: "13 goals", year: 1958, detail: "Unbroken since. 6 games played." },
  { category: "Fastest goal ever",          holder: "Hakan Şükür",      nation: "TUR", value: "10.8 sec", year: 2002, detail: "vs South Korea · 3rd-place playoff" },
  { category: "Youngest scorer",            holder: "Pelé",             nation: "BRA", value: "17y 239d", year: 1958, detail: "vs Wales in the quarter-finals" },
  { category: "Oldest scorer",              holder: "Roger Milla",      nation: "CMR", value: "42y 39d",  year: 1994, detail: "vs Russia · scored from the bench" },
  { category: "Only 3× WC winner (player)", holder: "Pelé",             nation: "BRA", value: "3 titles", year: 1970, detail: "1958 · 1962 · 1970 — unique in WC history" },
  { category: "Most goals, single match",   holder: "Oleg Salenko",     nation: "RUS", value: "5 goals",  year: 1994, detail: "Russia 6–1 Cameroon · group stage" },
  { category: "Biggest victory",            holder: "Hungary",          nation: "HUN", value: "10–1",     year: 1982, detail: "Hungary 10–1 El Salvador" },
  { category: "Highest scoring match",      holder: "Austria vs Switz.", nation: "AUT", value: "12 goals", year: 1954, detail: "Austria 7–5 Switzerland" },
  { category: "Most goals, one WC edition", holder: "France 1998",      nation: "FRA", value: "171 goals", year: 1998, detail: "64 matches · 2.67 goals/game" },
  { category: "Longest unbeaten run",       holder: "Brazil",           nation: "BRA", value: "13 games", year: 1958, detail: "1958–1966 (won 1958 and 1962)" },
];

// ── All-time team records ─────────────────────────────────────────────────────
export interface WcTeamRecord {
  category: string;
  team: string;
  nation: string;
  value: string;
  detail?: string;
}

export const TEAM_RECORDS: WcTeamRecord[] = [
  { category: "Most appearances",     team: "Brazil",    nation: "BRA", value: "22",      detail: "Only nation to play in every WC (1930–2022)" },
  { category: "Most titles",          team: "Brazil",    nation: "BRA", value: "5",       detail: "1958 · 1962 · 1970 · 1994 · 2002" },
  { category: "Most runner-up",       team: "Germany",   nation: "GER", value: "4",       detail: "1966 · 1982 · 1986 · 2002 (+ West Germany)" },
  { category: "Most games played",    team: "Germany",   nation: "GER", value: "109",     detail: "Across 20 WC tournaments (1934–2022)" },
  { category: "All-time top scorer",  team: "Germany",   nation: "GER", value: "226",     detail: "Goals across all WC appearances" },
  { category: "Best win rate",        team: "Brazil",    nation: "BRA", value: "66.7%",   detail: "76W from 114 games" },
  { category: "Most WC hosts",        team: "Mexico / Germany / Italy / France / Brazil", nation: "MEX", value: "2× each", detail: "Mexico hosts for a record 3rd time in 2026" },
];
