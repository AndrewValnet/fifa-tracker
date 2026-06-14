import { NextResponse } from "next/server";
import { getMatchBetsData } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Biggest + weirdest Polymarket markets for one match. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const bets = await getMatchBetsData(params.id);
  return NextResponse.json(
    { bets },
    { headers: { "Cache-Control": "public, s-maxage=55, stale-while-revalidate=300" } },
  );
}
