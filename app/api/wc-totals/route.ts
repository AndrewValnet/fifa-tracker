import { NextResponse } from "next/server";
import { getWcTotalsData } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Tournament-wide prediction-market totals (Polymarket). */
export async function GET() {
  const totals = await getWcTotalsData();
  return NextResponse.json({ totals }, { headers: { "Cache-Control": "no-store" } });
}
