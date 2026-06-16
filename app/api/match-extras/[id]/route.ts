import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/cache-policy";
import { getMatchExtras } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** ESPN-derived statistics/lineups/attendance + optional ticket prices. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const payload = await getMatchExtras(params.id);
  const hot = payload.extras?.state === "in" || payload.extras?.state === "pre";
  return NextResponse.json(payload, {
    headers: { "Cache-Control": hot ? CACHE_CONTROL.matchExtrasHot : CACHE_CONTROL.matchExtrasStatic },
  });
}
