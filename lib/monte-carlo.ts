// Monte Carlo group-stage qualification probability engine.
// Runs N simulations of remaining group matches; returns % chance each team
// finishes 1st, 2nd, or 3rd (3rd may still advance as one of the 8 best thirds).

import { SCHEDULE } from "@/lib/schedule";
import type { GroupStanding } from "@/lib/types";

export interface TeamQualProb {
  code: string | null;
  name: string;
  first: number;    // probability of finishing 1st in group
  second: number;   // probability of finishing 2nd
  third: number;    // probability of finishing 3rd
  fourth: number;   // probability of being eliminated (4th)
  advance: number;  // first + second (guaranteed advance)
  points: number;   // current real points
}

export interface GroupQualProb {
  group: string;
  teams: TeamQualProb[];
}

const N = 8_000; // simulations — fast enough client-side

// Base outcome probabilities for a single match (neutral venue)
const P_W = 0.37; // win
const P_D = 0.27; // draw
const P_L = 1 - P_W - P_D; // loss = 0.36

function rand() { return Math.random(); }

// Strength-adjusted win probability for team A vs team B
function winProb(ptsA: number, ptsB: number): { w: number; d: number; l: number } {
  const diff = Math.min(Math.max(ptsA - ptsB, -6), 6);
  const adj = diff * 0.025; // each point gap shifts win prob by 2.5%
  const w = Math.min(Math.max(P_W + adj, 0.10), 0.72);
  const l = Math.min(Math.max(P_L - adj, 0.10), 0.72);
  const d = 1 - w - l;
  return { w, d, l };
}

function simulateMatch(ptsA: number, ptsB: number): { a: number; b: number } {
  const { w, d } = winProb(ptsA, ptsB);
  const r = rand();
  if (r < w) return { a: 3, b: 0 };
  if (r < w + d) return { a: 1, b: 1 };
  return { a: 0, b: 3 };
}

// Find remaining group matches from static schedule that match known teams
function getRemainingPairs(group: string, finishedIds: Set<string>): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  for (const e of SCHEDULE) {
    if (e.group !== group || e.type !== "group") continue;
    if (finishedIds.has(e.id)) continue;
    if (e.home && e.away) pairs.push([e.home, e.away]);
  }
  return pairs;
}

interface SimRow {
  code: string | null;
  name: string;
  pts: number;
  gf: number;
  ga: number;
}

function sortGroup(rows: SimRow[]): SimRow[] {
  return [...rows].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const gdA = a.gf - a.ga;
    const gdB = b.gf - b.ga;
    if (gdB !== gdA) return gdB - gdA;
    return b.gf - a.gf;
  });
}

export function computeGroupProbabilities(
  standings: GroupStanding[],
  finishedMatchIds: Set<string>,
): GroupQualProb[] {
  const results: GroupQualProb[] = [];

  for (const g of standings) {
    const rows = g.rows;
    const remaining = getRemainingPairs(g.group, finishedMatchIds);

    // Accumulators
    const counts = new Map<string | null, [number, number, number, number]>();
    for (const r of rows) counts.set(r.team.code, [0, 0, 0, 0]);

    for (let i = 0; i < N; i++) {
      // Copy current state
      const sim: SimRow[] = rows.map((r) => ({
        code: r.team.code,
        name: r.team.name,
        pts: r.points,
        gf: r.gf,
        ga: r.ga,
      }));

      // Simulate remaining matches
      for (const [homeCode, awayCode] of remaining) {
        const hi = sim.findIndex((r) => r.code === homeCode);
        const ai = sim.findIndex((r) => r.code === awayCode);
        if (hi < 0 || ai < 0) continue;
        const { a, b } = simulateMatch(sim[hi].pts, sim[ai].pts);
        sim[hi].pts += a;
        sim[ai].pts += b;
        // Simulated goals: add a random 0–3 goals per side for tiebreak realism
        const hg = Math.floor(rand() * 3);
        const ag = Math.floor(rand() * 3);
        sim[hi].gf += hg;
        sim[hi].ga += ag;
        sim[ai].gf += ag;
        sim[ai].ga += hg;
      }

      const sorted = sortGroup(sim);
      sorted.forEach((team, pos) => {
        const c = counts.get(team.code)!;
        c[pos] = (c[pos] ?? 0) + 1;
      });
    }

    const teams: TeamQualProb[] = rows.map((r) => {
      const [f, s, t, fo] = counts.get(r.team.code) ?? [0, 0, 0, 0];
      return {
        code: r.team.code,
        name: r.team.name,
        first:   f / N,
        second:  s / N,
        third:   t / N,
        fourth:  fo / N,
        advance: (f + s) / N,
        points:  r.points,
      };
    });

    // Sort by advance probability desc
    teams.sort((a, b) => b.advance - a.advance || b.first - a.first);
    results.push({ group: g.group, teams });
  }

  return results;
}
