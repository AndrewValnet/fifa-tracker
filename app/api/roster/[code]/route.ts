import { NextResponse } from "next/server";
import { getTeamRosterIndex } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** ESPN roster index for a team (used by the player-comparison picker). */
export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const roster = await getTeamRosterIndex(params.code.toUpperCase());
  return NextResponse.json(roster, {
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
  });
}
