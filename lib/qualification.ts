// "What needs to happen to advance" — group-stage scenario calculator.
// Pure logic over the fixtures already in a Match[] (no new data). Simulates
// every remaining group result (3^k, k <= 6 per group) and classifies each
// team as Through / In the hunt / Out, with a plain-English hint for the next
// match. Honest caveats: ranking uses points with a nominal ±1 goal-difference
// per future win as a tie-break proxy (real scorelines can still decide ties),
// and "in the hunt" includes the best-third-place lottery without the full
// cross-group comparison.

import { TEAMS, teamName } from "@/lib/team-meta";
import type { Match } from "@/lib/types";

export interface TeamScenario {
  code: string;
  name: string;
  played: number;
  points: number;
  gd: number;
  gf: number;
  status: "through" | "hunt" | "out";
  qualifyPct: number; // share of remaining scenarios finishing top 2
  hint: string;
}

export interface GroupScenario {
  group: string;
  remaining: number;
  decided: boolean;
  teams: TeamScenario[];
}

interface Rec {
  code: string;
  pts: number;
  gd: number;
  gf: number;
  played: number;
}
interface Fixture {
  home: string;
  away: string;
}

const GROUP_LETTERS = "ABCDEFGHIJKL".split("");

function rank(recs: Rec[]): Rec[] {
  return [...recs].sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.code.localeCompare(b.code));
}

function applyOutcome(map: Map<string, Rec>, f: Fixture, outcome: "H" | "D" | "A") {
  const h = map.get(f.home)!;
  const a = map.get(f.away)!;
  if (outcome === "H") {
    h.pts += 3;
    h.gd += 1;
    h.gf += 1;
    a.gd -= 1;
  } else if (outcome === "A") {
    a.pts += 3;
    a.gd += 1;
    a.gf += 1;
    h.gd -= 1;
  } else {
    h.pts += 1;
    a.pts += 1;
  }
}

const OUTCOMES: ("H" | "D" | "A")[] = ["H", "D", "A"];

/** Position distribution per team across all (optionally constrained) remaining results. */
function distribution(
  base: Rec[],
  remaining: Fixture[],
  forced: ("H" | "D" | "A" | null)[],
): { dist: Map<string, { top2: number; third: number; fourth: number }>; total: number } {
  const freeIdx = remaining.map((_, i) => i).filter((i) => !forced[i]);
  const total = 3 ** freeIdx.length;
  const dist = new Map<string, { top2: number; third: number; fourth: number }>();
  for (const r of base) dist.set(r.code, { top2: 0, third: 0, fourth: 0 });

  for (let s = 0; s < total; s++) {
    const map = new Map<string, Rec>();
    for (const r of base) map.set(r.code, { ...r });
    // apply forced outcomes
    remaining.forEach((f, i) => {
      if (forced[i]) applyOutcome(map, f, forced[i]!);
    });
    // apply this scenario's free outcomes (base-3 digits)
    let n = s;
    for (const i of freeIdx) {
      applyOutcome(map, remaining[i], OUTCOMES[n % 3]);
      n = Math.floor(n / 3);
    }
    const ranked = rank([...map.values()]);
    ranked.forEach((r, pos) => {
      const d = dist.get(r.code)!;
      if (pos <= 1) d.top2++;
      else if (pos === 2) d.third++;
      else d.fourth++;
    });
  }
  return { dist, total };
}

function buildHint(
  code: string,
  base: Rec[],
  remaining: Fixture[],
  status: TeamScenario["status"],
  third: number,
): string {
  if (status === "through") return "Through to the Round of 32 🎉";
  if (status === "out") return "Eliminated";

  // earliest remaining fixture involving this team
  const iF = remaining.findIndex((f) => f.home === code || f.away === code);
  if (iF < 0) return third > 0 ? "Top-2 hopes need other results — chasing a best-third spot" : "Needs results elsewhere";

  const f = remaining[iF];
  const opp = f.home === code ? f.away : f.home;
  const oppName = teamName(opp) ?? opp;
  const isHome = f.home === code;
  const winLetter: "H" | "A" = isHome ? "H" : "A";
  const lossLetter: "H" | "A" = isHome ? "A" : "H";

  const guaranteedTop2 = (letter: "H" | "D" | "A") => {
    const forced = remaining.map(() => null as "H" | "D" | "A" | null);
    forced[iF] = letter;
    const { dist, total } = distribution(base, remaining, forced);
    return dist.get(code)!.top2 === total;
  };
  const canTop2 = (letter: "H" | "D" | "A") => {
    const forced = remaining.map(() => null as "H" | "D" | "A" | null);
    forced[iF] = letter;
    const { dist } = distribution(base, remaining, forced);
    return dist.get(code)!.top2 > 0;
  };

  if (guaranteedTop2("D")) return `Avoid defeat vs ${oppName} to go through`;
  if (guaranteedTop2(winLetter)) return `Beat ${oppName} to guarantee a top-2 finish`;
  if (canTop2(winLetter)) return `Win vs ${oppName} (and hope elsewhere) to reach the top 2`;
  if (!canTop2(winLetter) && !canTop2("D") && !canTop2(lossLetter)) {
    return third > 0 ? "Top-2 gone — alive only via a best-third place" : "Effectively out";
  }
  return third > 0 ? "Slim: needs a win vs " + oppName + " and a best-third spot" : "Needs a win and favours elsewhere";
}

export function qualificationScenarios(matches: Match[]): GroupScenario[] {
  const codesByGroup = new Map<string, string[]>();
  for (const letter of GROUP_LETTERS) {
    codesByGroup.set(
      letter,
      TEAMS.filter((t) => t.group === letter).map((t) => t.code),
    );
  }

  const out: GroupScenario[] = [];
  for (const letter of GROUP_LETTERS) {
    const codes = codesByGroup.get(letter)!;
    if (codes.length < 2) continue;
    const codeSet = new Set(codes);

    // group fixtures from the match list (both teams in this group)
    const fixtures = matches.filter(
      (m) =>
        m.stage === "GROUP_STAGE" &&
        m.homeTeam?.code &&
        m.awayTeam?.code &&
        codeSet.has(m.homeTeam.code) &&
        codeSet.has(m.awayTeam.code),
    );

    const base: Rec[] = codes.map((code) => ({ code, pts: 0, gd: 0, gf: 0, played: 0 }));
    const byCode = new Map(base.map((r) => [r.code, r]));
    const remaining: Fixture[] = [];

    for (const m of fixtures) {
      const home = m.homeTeam!.code!;
      const away = m.awayTeam!.code!;
      const finished = m.status === "FINISHED" && m.score.home != null && m.score.away != null;
      if (finished) {
        const h = byCode.get(home)!;
        const a = byCode.get(away)!;
        const hs = m.score.home!;
        const as = m.score.away!;
        h.played++;
        a.played++;
        h.gf += hs;
        a.gf += as;
        h.gd += hs - as;
        a.gd += as - hs;
        if (hs > as) h.pts += 3;
        else if (hs < as) a.pts += 3;
        else {
          h.pts += 1;
          a.pts += 1;
        }
      } else {
        remaining.push({ home, away });
      }
    }

    // too many unknowns to enumerate (shouldn't exceed 6) — skip detailed calc
    const enumerable = remaining.length <= 8;
    const { dist, total } = enumerable
      ? distribution(base, remaining, remaining.map(() => null))
      : { dist: new Map<string, { top2: number; third: number; fourth: number }>(), total: 1 };

    const teams: TeamScenario[] = rank(base).map((r) => {
      const d = dist.get(r.code) ?? { top2: 0, third: 0, fourth: 0 };
      let status: TeamScenario["status"];
      if (!enumerable) status = "hunt";
      else if (d.top2 === total) status = "through";
      else if (d.fourth === total || (d.top2 === 0 && d.third === 0)) status = "out";
      else status = "hunt";
      return {
        code: r.code,
        name: teamName(r.code) ?? r.code,
        played: r.played,
        points: r.pts,
        gd: r.gd,
        gf: r.gf,
        status,
        qualifyPct: enumerable ? d.top2 / total : 0,
        hint: enumerable ? buildHint(r.code, base, remaining, status, d.third) : "Group in progress",
      };
    });

    out.push({ group: letter, remaining: remaining.length, decided: remaining.length === 0, teams });
  }
  return out;
}
