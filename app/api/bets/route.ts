import { NextResponse } from "next/server";
import { getTopBetsData } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const bets = await getTopBetsData();
  return NextResponse.json(
    { bets },
    { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" } },
  );
}
