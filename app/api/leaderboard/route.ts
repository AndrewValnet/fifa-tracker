import { NextResponse } from "next/server";
import { getLeaderboard, predictionsEnabled } from "@/lib/predictions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!predictionsEnabled()) return NextResponse.json({ enabled: false, rows: [] });
  const rows = await getLeaderboard();
  return NextResponse.json({ enabled: true, rows: rows.slice(0, 100) }, { headers: { "Cache-Control": "no-store" } });
}
