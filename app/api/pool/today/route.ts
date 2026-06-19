import { NextResponse } from "next/server";
import { accountsEnabled } from "@/lib/accounts";
import { getTodayLeaderboard, predictionsEnabled } from "@/lib/predictions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!accountsEnabled() || !predictionsEnabled()) {
    return NextResponse.json({ enabled: false, rows: [] });
  }
  const rows = await getTodayLeaderboard();
  return NextResponse.json(
    { enabled: true, rows: rows.slice(0, 25) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
