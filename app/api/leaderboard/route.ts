import { NextResponse } from "next/server";
import { accountsEnabled } from "@/lib/accounts";
import { getLeaderboard, predictionsEnabled } from "@/lib/predictions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!accountsEnabled() || !predictionsEnabled()) {
    return NextResponse.json({ enabled: false, rows: [], summary: null });
  }
  try {
    const rows = await getLeaderboard();
    const totalPicks = rows.reduce((sum, row) => sum + row.picked, 0);
    const summary = {
      players: rows.length,
      totalPicks,
      averagePicks: rows.length ? totalPicks / rows.length : 0,
      leader: rows[0] ?? null,
    };
    return NextResponse.json(
      { enabled: true, rows: rows.slice(0, 100), summary },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("leaderboard route failed", error);
    return NextResponse.json(
      { enabled: true, rows: [], summary: null, error: "Leaderboard temporarily unavailable." },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
}
