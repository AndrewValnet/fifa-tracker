import { NextResponse } from "next/server";
import { getAllMatches, getOddsForMatchId } from "@/lib/data";
import { statusKind } from "@/lib/format";

export const dynamic = "force-dynamic";

export interface MustWatchMatch {
  matchId: string;
  utcDate: string;
  homeCode: string | null;
  homeName: string;
  awayCode: string | null;
  awayName: string;
  stage: string;
  group: string | null;
  stadiumId: string | null;
  homeOdds: number | null;
  awayOdds: number | null;
  drawOdds: number | null;
  excitementScore: number;
}

export async function GET() {
  const all = await getAllMatches();
  const upcoming = all.data
    .filter((m) => statusKind(m.status) === "upcoming")
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
    .slice(0, 14);

  const withOdds = await Promise.all(
    upcoming.map(async (m) => {
      try {
        const odds = await getOddsForMatchId(m.id);
        const home = odds?.home ?? null;
        const away = odds?.away ?? null;
        const total = (home ?? 0) + (away ?? 0);
        const excitementScore =
          total > 0.1 ? 1 - Math.abs((home ?? 0) / total - 0.5) * 2 : 0;
        return {
          matchId: m.id,
          utcDate: m.utcDate,
          homeCode: m.homeTeam?.code ?? null,
          homeName: m.homeTeam?.name ?? m.homeLabel ?? "TBD",
          awayCode: m.awayTeam?.code ?? null,
          awayName: m.awayTeam?.name ?? m.awayLabel ?? "TBD",
          stage: m.stage,
          group: m.group,
          stadiumId: m.stadiumId,
          homeOdds: home,
          awayOdds: away,
          drawOdds: odds?.draw ?? null,
          excitementScore,
        } as MustWatchMatch;
      } catch {
        return null;
      }
    }),
  );

  const ranked = withOdds
    .filter((m): m is MustWatchMatch => m !== null && m.excitementScore > 0)
    .sort((a, b) => b.excitementScore - a.excitementScore)
    .slice(0, 5);

  return NextResponse.json(
    { matches: ranked },
    { headers: { "Cache-Control": "public, s-maxage=300" } },
  );
}
