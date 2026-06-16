import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/cache-policy";
import { getOddsForMatchId } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { matchId: string } }) {
  const odds = await getOddsForMatchId(params.matchId);
  // 200 with null payload (not 404): "no market" is an expected state the
  // client renders as an empty panel without SWR error churn.
  return NextResponse.json({ odds }, {
    headers: { "Cache-Control": CACHE_CONTROL.odds },
  });
}
