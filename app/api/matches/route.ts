import { NextResponse } from "next/server";
import { getAllMatches } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Full fixture list (all 104 matches, all statuses). */
export async function GET() {
  const result = await getAllMatches();
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
