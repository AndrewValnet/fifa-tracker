import { NextResponse } from "next/server";
import { getStandings } from "@/lib/data";
import { computeGroupProbabilities } from "@/lib/monte-carlo";
import { statusKind } from "@/lib/format";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const standings = await getStandings();
  if (!standings.data?.length) {
    return NextResponse.json({ error: "standings unavailable" }, { status: 503 });
  }

  // Build finished match IDs from standings data (we need the match IDs used to compute points)
  // We derive them from all matches: any finished group-stage match
  const { getAllMatches } = await import("@/lib/data");
  const allMatches = await getAllMatches();
  const finishedIds = new Set<string>(
    allMatches.data
      .filter(
        (m) =>
          statusKind(m.status) === "finished" &&
          m.stage?.toLowerCase().includes("group"),
      )
      .map((m) => m.id),
  );

  const probabilities = computeGroupProbabilities(standings.data, finishedIds);

  return NextResponse.json(probabilities, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
