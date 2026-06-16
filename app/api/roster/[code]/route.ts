import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/cache-policy";
import { getTeamRosterIndex } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** ESPN roster index for a team (used by the player-comparison picker). */
export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const roster = await getTeamRosterIndex(params.code.toUpperCase());
  return NextResponse.json(roster, {
    headers: { "Cache-Control": CACHE_CONTROL.roster },
  });
}
