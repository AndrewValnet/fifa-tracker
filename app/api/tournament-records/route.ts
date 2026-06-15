// Derived tournament records from live match events:
// hat-tricks, own goals, fastest goals, clean sheets.
import { NextResponse } from "next/server";
import { getAllMatches } from "@/lib/data";
import { statusKind } from "@/lib/format";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export interface HatTrick {
  player: string;
  teamName: string;
  teamCode: string | null;
  goals: number;
  matchId: string;
  opponent: string;
  date: string;
}

export interface OwnGoal {
  player: string;
  teamName: string;   // team the player plays for (who scored the OG against themselves)
  teamCode: string | null;
  minute: string;
  matchId: string;
  matchLabel: string;
  date: string;
}

export interface FastGoal {
  player: string;
  teamName: string;
  teamCode: string | null;
  minute: number;     // parsed minute
  minuteRaw: string;
  matchId: string;
  matchLabel: string;
  date: string;
}

export interface CleanSheet {
  teamName: string;
  teamCode: string | null;
  count: number;
}

export interface TournamentRecords {
  hatTricks: HatTrick[];
  ownGoals: OwnGoal[];
  fastestGoals: FastGoal[];
  cleanSheets: CleanSheet[];
  penaltyShootouts: PenaltyShootout[];
}

export interface PenaltyShootout {
  matchId: string;
  matchLabel: string;
  winner: string;
  winnerCode: string | null;
  loser: string;
  loserCode: string | null;
  score: string;   // e.g. "5-3"
  date: string;
}

function parseMin(raw: string | null): number {
  if (!raw) return 999;
  const m = parseInt(raw.replace(/[^0-9]/g, ""), 10);
  return isNaN(m) ? 999 : m;
}

export async function GET() {
  const all = await getAllMatches();
  const finished = all.data.filter((m) => statusKind(m.status) === "finished");

  const hatTricks: HatTrick[] = [];
  const ownGoals: OwnGoal[] = [];
  const fastGoalsList: FastGoal[] = [];
  const cleanSheetMap = new Map<string, { teamName: string; teamCode: string | null; count: number }>();
  const penaltyShootouts: PenaltyShootout[] = [];

  for (const m of finished) {
    const home = m.homeTeam?.name ?? "Home";
    const away = m.awayTeam?.name ?? "Away";
    const homeCode = m.homeTeam?.code ?? null;
    const awayCode = m.awayTeam?.code ?? null;
    const matchLabel = `${home} vs ${away}`;
    const date = m.utcDate;

    // ── Clean sheets ──────────────────────────────────────────────────────
    const hs = m.score.home ?? 0;
    const as_ = m.score.away ?? 0;
    if (as_ === 0 && homeCode) {
      const cur = cleanSheetMap.get(homeCode) ?? { teamName: home, teamCode: homeCode, count: 0 };
      cur.count++;
      cleanSheetMap.set(homeCode, cur);
    }
    if (hs === 0 && awayCode) {
      const cur = cleanSheetMap.get(awayCode) ?? { teamName: away, teamCode: awayCode, count: 0 };
      cur.count++;
      cleanSheetMap.set(awayCode, cur);
    }

    // ── Match events ─────────────────────────────────────────────────────
    // Group goals by player per match
    const goalsByPlayer = new Map<string, { count: number; team: string; code: string | null; side: string }>();
    for (const ev of m.events) {
      if (ev.type !== "GOAL") continue;

      const side = ev.side ?? "HOME";
      const teamName = side === "HOME" ? home : away;
      const teamCode = side === "HOME" ? homeCode : awayCode;
      const player = ev.player ?? "Unknown";
      const min = parseMin(ev.minute);

      // Own goals
      if (ev.note === "og") {
        ownGoals.push({
          player,
          teamName,
          teamCode,
          minute: ev.minute ?? "?",
          matchId: m.id,
          matchLabel,
          date,
        });
        continue;
      }

      // Fastest goals
      if (min <= 5) {
        fastGoalsList.push({
          player,
          teamName,
          teamCode,
          minute: min,
          minuteRaw: ev.minute ?? "?",
          matchId: m.id,
          matchLabel,
          date,
        });
      }

      // Hat-trick tracking
      const key = `${m.id}::${player}`;
      const prev = goalsByPlayer.get(key) ?? { count: 0, team: teamName, code: teamCode, side };
      prev.count++;
      goalsByPlayer.set(key, prev);
    }

    // Emit hat-tricks
    for (const [key, info] of goalsByPlayer) {
      if (info.count < 3) continue;
      const player = key.split("::")[1];
      const opponent = info.side === "HOME" ? away : home;
      hatTricks.push({
        player,
        teamName: info.team,
        teamCode: info.code,
        goals: info.count,
        matchId: m.id,
        opponent,
        date,
      });
    }

    // ── Penalty shootout detection via events ────────────────────────────
    // We detect shootouts by looking for multiple GOAL events with note "pen"
    // occurring for both sides (indicating a PSO, not just a penalty in normal time).
    const penGoalsHome = m.events.filter((ev) => ev.type === "GOAL" && ev.note === "pen" && ev.side === "HOME").length;
    const penGoalsAway = m.events.filter((ev) => ev.type === "GOAL" && ev.note === "pen" && ev.side === "AWAY").length;
    if (penGoalsHome >= 2 && penGoalsAway >= 2) {
      const winner = penGoalsHome > penGoalsAway ? home : away;
      const winnerCode = penGoalsHome > penGoalsAway ? homeCode : awayCode;
      const loser = penGoalsHome > penGoalsAway ? away : home;
      const loserCode = penGoalsHome > penGoalsAway ? awayCode : homeCode;
      penaltyShootouts.push({
        matchId: m.id,
        matchLabel,
        winner,
        winnerCode,
        loser,
        loserCode,
        score: `${Math.max(penGoalsHome, penGoalsAway)}–${Math.min(penGoalsHome, penGoalsAway)}`,
        date,
      });
    }
  }

  const cleanSheets: CleanSheet[] = [...cleanSheetMap.values()]
    .sort((a, b) => b.count - a.count);

  fastGoalsList.sort((a, b) => a.minute - b.minute);

  const records: TournamentRecords = {
    hatTricks,
    ownGoals,
    fastestGoals: fastGoalsList.slice(0, 20),
    cleanSheets,
    penaltyShootouts,
  };

  return NextResponse.json(records, {
    headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" },
  });
}
