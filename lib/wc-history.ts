// Historical World Cup data for all 48 WC 2026 teams.
// Records cover tournaments 1930–2022 (22 editions) — excludes WC 2026.
// all-time stats are authoritative for top-10 nations; approximate for others.

export const WC_YEARS = [
  1930, 1934, 1938, 1950, 1954, 1958, 1962, 1966, 1970, 1974,
  1978, 1982, 1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022,
] as const;

export type Confederation = "UEFA" | "CONMEBOL" | "CONCACAF" | "CAF" | "AFC" | "OFC";

export interface WcTeamHistory {
  code: string;
  confederation: Confederation;
  appearances: number;           // WC appearances before WC 2026
  debut: number | null;          // null = WC 2026 is their debut
  bestFinish: string;
  titles: number;
  runnerUp: number;
  thirdPlace: number;
  knockoutApps: number;          // times advanced past group stage
  qualifiedYears: number[];
  allTime: { p: number; w: number; d: number; l: number; gf: number; ga: number } | null;
  historicalNote?: string;
}

const HISTORY: WcTeamHistory[] = [
  // ── Group A ──────────────────────────────────────────────────────────────
  {
    code: "MEX", confederation: "CONCACAF",
    appearances: 19, debut: 1930,
    bestFinish: "Quarter-finals", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 12,
    qualifiedYears: [1930, 1950, 1954, 1958, 1962, 1966, 1970, 1978, 1982, 1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022],
    allTime: { p: 62, w: 17, d: 14, l: 31, gf: 67, ga: 102 },
    historicalNote: "7 consecutive Round of 16 exits 1994–2018. Hosts WC 2026 for the third time.",
  },
  {
    code: "RSA", confederation: "CAF",
    appearances: 3, debut: 1998,
    bestFinish: "Group Stage", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 0,
    qualifiedYears: [1998, 2002, 2010],
    allTime: { p: 9, w: 2, d: 2, l: 5, gf: 10, ga: 17 },
    historicalNote: "Hosted and co-hosted 2010 — first WC on African soil.",
  },
  {
    code: "KOR", confederation: "AFC",
    appearances: 11, debut: 1954,
    bestFinish: "4th Place", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 6,
    qualifiedYears: [1954, 1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022],
    allTime: { p: 37, w: 11, d: 4, l: 22, gf: 44, ga: 77 },
    historicalNote: "Co-hosted 2002 with Japan; reached the semi-finals — best ever Asian WC finish.",
  },
  {
    code: "CZE", confederation: "UEFA",
    appearances: 4, debut: 1994,
    bestFinish: "Quarter-finals", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 2,
    qualifiedYears: [1994, 1998, 2002, 2006],
    allTime: { p: 15, w: 6, d: 3, l: 6, gf: 20, ga: 22 },
    historicalNote: "As Czechoslovakia: runner-up 1934 & 1962, 3rd place 1938. Independent since 1994.",
  },

  // ── Group B ──────────────────────────────────────────────────────────────
  {
    code: "CAN", confederation: "CONCACAF",
    appearances: 2, debut: 1986,
    bestFinish: "Group Stage", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 0,
    qualifiedYears: [1986, 2022],
    allTime: { p: 6, w: 1, d: 0, l: 5, gf: 3, ga: 13 },
    historicalNote: "36-year gap between appearances. Co-hosts WC 2026.",
  },
  {
    code: "BIH", confederation: "UEFA",
    appearances: 1, debut: 2014,
    bestFinish: "Group Stage", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 0,
    qualifiedYears: [2014],
    allTime: { p: 3, w: 1, d: 0, l: 2, gf: 4, ga: 7 },
  },
  {
    code: "QAT", confederation: "AFC",
    appearances: 1, debut: 2022,
    bestFinish: "Group Stage", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 0,
    qualifiedYears: [2022],
    allTime: { p: 3, w: 0, d: 0, l: 3, gf: 1, ga: 7 },
    historicalNote: "First host nation to be eliminated in the group stage (2022).",
  },
  {
    code: "SUI", confederation: "UEFA",
    appearances: 14, debut: 1934,
    bestFinish: "Quarter-finals", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 8,
    qualifiedYears: [1934, 1938, 1950, 1954, 1962, 1966, 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022],
    allTime: { p: 47, w: 16, d: 10, l: 21, gf: 67, ga: 77 },
    historicalNote: "Hosted 1954. QF five times including 2022 — consistent underachievers or overachievers?",
  },

  // ── Group C ──────────────────────────────────────────────────────────────
  {
    code: "BRA", confederation: "CONMEBOL",
    appearances: 22, debut: 1930,
    bestFinish: "🏆 Winners", titles: 5, runnerUp: 2, thirdPlace: 2, knockoutApps: 18,
    qualifiedYears: [1930, 1934, 1938, 1950, 1954, 1958, 1962, 1966, 1970, 1974, 1978, 1982, 1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022],
    allTime: { p: 114, w: 76, d: 18, l: 20, gf: 237, ga: 103 },
    historicalNote: "Only nation to appear in every World Cup. 5 titles (1958, 1962, 1970, 1994, 2002).",
  },
  {
    code: "MAR", confederation: "CAF",
    appearances: 5, debut: 1970,
    bestFinish: "4th Place", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 2,
    qualifiedYears: [1970, 1986, 1994, 1998, 2022],
    allTime: { p: 18, w: 6, d: 2, l: 10, gf: 20, ga: 29 },
    historicalNote: "Historic run to the semi-finals at Qatar 2022 — best ever result for an African nation.",
  },
  {
    code: "HAI", confederation: "CONCACAF",
    appearances: 1, debut: 1974,
    bestFinish: "Group Stage", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 0,
    qualifiedYears: [1974],
    allTime: { p: 3, w: 0, d: 0, l: 3, gf: 2, ga: 14 },
  },
  {
    code: "SCO", confederation: "UEFA",
    appearances: 8, debut: 1954,
    bestFinish: "Group Stage", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 0,
    qualifiedYears: [1954, 1958, 1974, 1978, 1982, 1986, 1990, 1998],
    allTime: { p: 23, w: 4, d: 7, l: 12, gf: 25, ga: 41 },
    historicalNote: "8 appearances, never advanced from the group stage. Missed 2022 via playoff.",
  },

  // ── Group D ──────────────────────────────────────────────────────────────
  {
    code: "USA", confederation: "CONCACAF",
    appearances: 11, debut: 1930,
    bestFinish: "3rd Place", titles: 0, runnerUp: 0, thirdPlace: 1, knockoutApps: 5,
    qualifiedYears: [1930, 1934, 1950, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2022],
    allTime: { p: 38, w: 14, d: 6, l: 18, gf: 59, ga: 74 },
    historicalNote: "3rd place in the inaugural 1930 WC. Shocked England 1–0 in 1950. Quarter-finals 2002.",
  },
  {
    code: "PAR", confederation: "CONMEBOL",
    appearances: 8, debut: 1930,
    bestFinish: "Quarter-finals", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 4,
    qualifiedYears: [1930, 1950, 1958, 1986, 1998, 2002, 2006, 2010],
    allTime: { p: 27, w: 8, d: 10, l: 9, gf: 30, ga: 38 },
  },
  {
    code: "AUS", confederation: "AFC",
    appearances: 5, debut: 1974,
    bestFinish: "Quarter-finals", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 2,
    qualifiedYears: [1974, 2006, 2010, 2014, 2022],
    allTime: { p: 18, w: 6, d: 3, l: 9, gf: 25, ga: 34 },
    historicalNote: "Switched from OFC to AFC in 2006. Quarter-finals in 2022.",
  },
  {
    code: "TUR", confederation: "UEFA",
    appearances: 2, debut: 1954,
    bestFinish: "3rd Place", titles: 0, runnerUp: 0, thirdPlace: 1, knockoutApps: 1,
    qualifiedYears: [1954, 2002],
    allTime: { p: 10, w: 5, d: 1, l: 4, gf: 20, ga: 17 },
    historicalNote: "48-year gap between appearances. Reached 3rd place at 2002 under Hiddink.",
  },

  // ── Group E ──────────────────────────────────────────────────────────────
  {
    code: "GER", confederation: "UEFA",
    appearances: 20, debut: 1934,
    bestFinish: "🏆 Winners", titles: 4, runnerUp: 4, thirdPlace: 4, knockoutApps: 18,
    qualifiedYears: [1934, 1938, 1954, 1958, 1962, 1966, 1970, 1974, 1978, 1982, 1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022],
    allTime: { p: 109, w: 67, d: 21, l: 21, gf: 226, ga: 127 },
    historicalNote: "Competed as West Germany 1954–1990. Titles: 1954, 1974, 1990, 2014. Group stage exit in 2018 & 2022.",
  },
  {
    code: "CUW", confederation: "CONCACAF",
    appearances: 0, debut: null,
    bestFinish: "N/A — WC 2026 debut", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 0,
    qualifiedYears: [],
    allTime: null,
  },
  {
    code: "CIV", confederation: "CAF",
    appearances: 3, debut: 2006,
    bestFinish: "Group Stage", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 0,
    qualifiedYears: [2006, 2010, 2014],
    allTime: { p: 9, w: 1, d: 2, l: 6, gf: 8, ga: 16 },
    historicalNote: "Drawn in 'Group of Death' alongside Portugal, Mexico and Brazil in 2006.",
  },
  {
    code: "ECU", confederation: "CONMEBOL",
    appearances: 4, debut: 2002,
    bestFinish: "Round of 16", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 1,
    qualifiedYears: [2002, 2006, 2014, 2022],
    allTime: { p: 13, w: 4, d: 2, l: 7, gf: 14, ga: 22 },
  },

  // ── Group F ──────────────────────────────────────────────────────────────
  {
    code: "NED", confederation: "UEFA",
    appearances: 11, debut: 1934,
    bestFinish: "Runner-up", titles: 0, runnerUp: 3, thirdPlace: 1, knockoutApps: 9,
    qualifiedYears: [1934, 1938, 1974, 1978, 1990, 1994, 1998, 2006, 2010, 2014, 2022],
    allTime: { p: 52, w: 27, d: 11, l: 14, gf: 93, ga: 60 },
    historicalNote: "Runner-up 1974, 1978, 2010. Known for 'Total Football'. 3rd place 2014.",
  },
  {
    code: "JPN", confederation: "AFC",
    appearances: 7, debut: 1998,
    bestFinish: "Round of 16", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 3,
    qualifiedYears: [1998, 2002, 2006, 2010, 2014, 2018, 2022],
    allTime: { p: 26, w: 9, d: 3, l: 14, gf: 28, ga: 39 },
    historicalNote: "Co-hosted 2002. Beat Germany and Spain in 2022 group stage.",
  },
  {
    code: "SWE", confederation: "UEFA",
    appearances: 13, debut: 1934,
    bestFinish: "Runner-up", titles: 0, runnerUp: 1, thirdPlace: 2, knockoutApps: 9,
    qualifiedYears: [1934, 1938, 1950, 1954, 1958, 1970, 1974, 1978, 1990, 1994, 2002, 2006, 2018],
    allTime: { p: 51, w: 22, d: 12, l: 17, gf: 83, ga: 68 },
    historicalNote: "Hosted and were runners-up in 1958 (lost to Brazil). 3rd place 1950 and 1994.",
  },
  {
    code: "TUN", confederation: "CAF",
    appearances: 6, debut: 1978,
    bestFinish: "Group Stage", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 0,
    qualifiedYears: [1978, 1998, 2002, 2006, 2018, 2022],
    allTime: { p: 18, w: 2, d: 5, l: 11, gf: 12, ga: 31 },
    historicalNote: "First African team to win a WC match (1978, beat Mexico 3–1).",
  },

  // ── Group G ──────────────────────────────────────────────────────────────
  {
    code: "BEL", confederation: "UEFA",
    appearances: 14, debut: 1930,
    bestFinish: "3rd Place", titles: 0, runnerUp: 0, thirdPlace: 1, knockoutApps: 9,
    qualifiedYears: [1930, 1934, 1938, 1954, 1970, 1982, 1986, 1990, 1994, 1998, 2002, 2014, 2018, 2022],
    allTime: { p: 48, w: 21, d: 7, l: 20, gf: 76, ga: 75 },
    historicalNote: "Ranked #1 in the FIFA Rankings for a record 3+ years. 3rd place at Russia 2018.",
  },
  {
    code: "EGY", confederation: "CAF",
    appearances: 3, debut: 1934,
    bestFinish: "Group Stage", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 0,
    qualifiedYears: [1934, 1990, 2018],
    allTime: { p: 9, w: 1, d: 1, l: 7, gf: 10, ga: 24 },
    historicalNote: "First African nation to play in a World Cup (1934).",
  },
  {
    code: "IRN", confederation: "AFC",
    appearances: 6, debut: 1978,
    bestFinish: "Group Stage", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 0,
    qualifiedYears: [1978, 1998, 2006, 2014, 2018, 2022],
    allTime: { p: 18, w: 2, d: 3, l: 13, gf: 13, ga: 43 },
    historicalNote: "Most appearances (6) of any Asian nation without advancing from the group stage.",
  },
  {
    code: "NZL", confederation: "OFC",
    appearances: 2, debut: 1982,
    bestFinish: "Group Stage", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 0,
    qualifiedYears: [1982, 2010],
    allTime: { p: 6, w: 0, d: 3, l: 3, gf: 4, ga: 12 },
    historicalNote: "Best result was 3 draws (vs Slovakia, Italy, Paraguay) at 2010 — only team unbeaten.",
  },

  // ── Group H ──────────────────────────────────────────────────────────────
  {
    code: "ESP", confederation: "UEFA",
    appearances: 16, debut: 1934,
    bestFinish: "🏆 Winners", titles: 1, runnerUp: 0, thirdPlace: 0, knockoutApps: 9,
    qualifiedYears: [1934, 1950, 1962, 1966, 1978, 1982, 1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022],
    allTime: { p: 67, w: 35, d: 12, l: 20, gf: 121, ga: 85 },
    historicalNote: "Won their only title in 2010 in South Africa. Co-hosts WC 2026.",
  },
  {
    code: "CPV", confederation: "CAF",
    appearances: 0, debut: null,
    bestFinish: "N/A — WC 2026 debut", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 0,
    qualifiedYears: [],
    allTime: null,
  },
  {
    code: "KSA", confederation: "AFC",
    appearances: 6, debut: 1994,
    bestFinish: "Round of 16", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 1,
    qualifiedYears: [1994, 1998, 2002, 2006, 2018, 2022],
    allTime: { p: 19, w: 5, d: 2, l: 12, gf: 20, ga: 40 },
    historicalNote: "Shocked Argentina 2–1 in 2022 group stage. Hosts AFC Asian Cup 2027.",
  },
  {
    code: "URU", confederation: "CONMEBOL",
    appearances: 14, debut: 1930,
    bestFinish: "🏆 Winners", titles: 2, runnerUp: 0, thirdPlace: 0, knockoutApps: 9,
    qualifiedYears: [1930, 1950, 1954, 1962, 1966, 1970, 1974, 1986, 1990, 2002, 2010, 2014, 2018, 2022],
    allTime: { p: 56, w: 28, d: 11, l: 17, gf: 92, ga: 65 },
    historicalNote: "Won the first-ever World Cup (1930) on home soil. 2nd title in 1950 Maracanã final.",
  },

  // ── Group I ──────────────────────────────────────────────────────────────
  {
    code: "FRA", confederation: "UEFA",
    appearances: 16, debut: 1930,
    bestFinish: "🏆 Winners", titles: 2, runnerUp: 1, thirdPlace: 2, knockoutApps: 11,
    qualifiedYears: [1930, 1934, 1938, 1954, 1958, 1966, 1978, 1982, 1986, 1998, 2002, 2006, 2010, 2014, 2018, 2022],
    allTime: { p: 66, w: 38, d: 9, l: 19, gf: 128, ga: 83 },
    historicalNote: "Titles in 1998 (home) and 2018. Runner-up 2006. First WC was the inaugural 1930.",
  },
  {
    code: "SEN", confederation: "CAF",
    appearances: 3, debut: 2002,
    bestFinish: "Quarter-finals", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 2,
    qualifiedYears: [2002, 2018, 2022],
    allTime: { p: 10, w: 4, d: 2, l: 4, gf: 11, ga: 14 },
    historicalNote: "Stunned France in 2002 opener. Semi-finalists in same tournament — African record at the time.",
  },
  {
    code: "IRQ", confederation: "AFC",
    appearances: 1, debut: 1986,
    bestFinish: "Group Stage", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 0,
    qualifiedYears: [1986],
    allTime: { p: 3, w: 0, d: 0, l: 3, gf: 1, ga: 4 },
  },
  {
    code: "NOR", confederation: "UEFA",
    appearances: 3, debut: 1938,
    bestFinish: "Round of 16", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 2,
    qualifiedYears: [1938, 1994, 1998],
    allTime: { p: 8, w: 3, d: 1, l: 4, gf: 8, ga: 11 },
    historicalNote: "Beat Brazil in 1998 group stage. Erling Haaland leads a new golden generation.",
  },

  // ── Group J ──────────────────────────────────────────────────────────────
  {
    code: "ARG", confederation: "CONMEBOL",
    appearances: 18, debut: 1930,
    bestFinish: "🏆 Winners", titles: 3, runnerUp: 3, thirdPlace: 0, knockoutApps: 15,
    qualifiedYears: [1930, 1934, 1958, 1962, 1966, 1974, 1978, 1982, 1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022],
    allTime: { p: 90, w: 48, d: 16, l: 26, gf: 153, ga: 97 },
    historicalNote: "3 titles: 1978, 1986 (Maradona), 2022 (Messi). 3 runner-up finishes.",
  },
  {
    code: "ALG", confederation: "CAF",
    appearances: 4, debut: 1982,
    bestFinish: "Round of 16", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 1,
    qualifiedYears: [1982, 1986, 2010, 2014],
    allTime: { p: 13, w: 4, d: 2, l: 7, gf: 17, ga: 23 },
    historicalNote: "Shocked West Germany 2–1 in 1982 — first African/Asian win over a then-champion.",
  },
  {
    code: "AUT", confederation: "UEFA",
    appearances: 7, debut: 1934,
    bestFinish: "3rd Place", titles: 0, runnerUp: 0, thirdPlace: 1, knockoutApps: 3,
    qualifiedYears: [1934, 1954, 1958, 1978, 1982, 1990, 1998],
    allTime: { p: 26, w: 12, d: 4, l: 10, gf: 40, ga: 43 },
    historicalNote: "The 1930s 'Wunderteam' was among the world's best. 3rd place in 1954.",
  },
  {
    code: "JOR", confederation: "AFC",
    appearances: 0, debut: null,
    bestFinish: "N/A — WC 2026 debut", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 0,
    qualifiedYears: [],
    allTime: null,
  },

  // ── Group K ──────────────────────────────────────────────────────────────
  {
    code: "POR", confederation: "UEFA",
    appearances: 8, debut: 1966,
    bestFinish: "3rd Place", titles: 0, runnerUp: 0, thirdPlace: 1, knockoutApps: 6,
    qualifiedYears: [1966, 1986, 2002, 2006, 2010, 2014, 2018, 2022],
    allTime: { p: 34, w: 17, d: 7, l: 10, gf: 62, ga: 43 },
    historicalNote: "Eusébio led them to 3rd in 1966. Ronaldo era: SF 2006, multiple QF exits.",
  },
  {
    code: "COD", confederation: "CAF",
    appearances: 1, debut: 1974,
    bestFinish: "Group Stage", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 0,
    qualifiedYears: [1974],
    allTime: { p: 3, w: 0, d: 0, l: 3, gf: 0, ga: 14 },
    historicalNote: "Competed as Zaire in 1974 — first sub-Saharan African team in a World Cup.",
  },
  {
    code: "UZB", confederation: "AFC",
    appearances: 0, debut: null,
    bestFinish: "N/A — WC 2026 debut", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 0,
    qualifiedYears: [],
    allTime: null,
  },
  {
    code: "COL", confederation: "CONMEBOL",
    appearances: 7, debut: 1962,
    bestFinish: "Quarter-finals", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 4,
    qualifiedYears: [1962, 1990, 1994, 1998, 2014, 2018, 2022],
    allTime: { p: 24, w: 11, d: 3, l: 10, gf: 37, ga: 35 },
    historicalNote: "Golden era under José Pékerman: QF 2014 with James Rodríguez as top scorer.",
  },

  // ── Group L ──────────────────────────────────────────────────────────────
  {
    code: "ENG", confederation: "UEFA",
    appearances: 16, debut: 1950,
    bestFinish: "🏆 Winners", titles: 1, runnerUp: 0, thirdPlace: 0, knockoutApps: 11,
    qualifiedYears: [1950, 1954, 1958, 1962, 1966, 1970, 1982, 1986, 1990, 1998, 2002, 2006, 2010, 2014, 2018, 2022],
    allTime: { p: 69, w: 31, d: 19, l: 19, gf: 96, ga: 73 },
    historicalNote: "Won their only title in 1966 on home soil. Semi-finalists 1990 and 2018.",
  },
  {
    code: "CRO", confederation: "UEFA",
    appearances: 6, debut: 1998,
    bestFinish: "Runner-up", titles: 0, runnerUp: 1, thirdPlace: 2, knockoutApps: 5,
    qualifiedYears: [1998, 2002, 2006, 2014, 2018, 2022],
    allTime: { p: 27, w: 14, d: 7, l: 6, gf: 43, ga: 27 },
    historicalNote: "3rd place on debut in 1998. Runner-up 2018. 3rd place again in 2022.",
  },
  {
    code: "GHA", confederation: "CAF",
    appearances: 4, debut: 2006,
    bestFinish: "Quarter-finals", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 2,
    qualifiedYears: [2006, 2010, 2014, 2022],
    allTime: { p: 14, w: 4, d: 3, l: 7, gf: 12, ga: 22 },
    historicalNote: "Inches from the semi-final in 2010 — Suárez handball, penalty miss by Gyan in extra time.",
  },
  {
    code: "PAN", confederation: "CONCACAF",
    appearances: 2, debut: 2018,
    bestFinish: "Group Stage", titles: 0, runnerUp: 0, thirdPlace: 0, knockoutApps: 0,
    qualifiedYears: [2018, 2022],
    allTime: { p: 6, w: 0, d: 2, l: 4, gf: 4, ga: 16 },
  },
];

const BY_CODE = new Map(HISTORY.map((h) => [h.code, h]));

export function getTeamHistory(code: string): WcTeamHistory | null {
  return BY_CODE.get(code.toUpperCase()) ?? null;
}

export function missedYears(h: WcTeamHistory): number[] {
  return WC_YEARS.filter((y) => !h.qualifiedYears.includes(y));
}
