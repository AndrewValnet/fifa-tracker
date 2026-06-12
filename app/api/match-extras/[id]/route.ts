import { NextResponse } from "next/server";
import { getMatchExtras } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** ESPN-derived statistics/lineups/attendance + optional ticket prices. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const payload = await getMatchExtras(params.id);
  return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
}
