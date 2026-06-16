import { NextResponse } from "next/server";
import { CACHE_CONTROL, slimSourcedMatches } from "@/lib/cache-policy";
import { getAllMatches } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Full fixture list (all 104 matches, all statuses). */
export async function GET() {
  const result = await getAllMatches();
  return NextResponse.json(slimSourcedMatches(result), {
    headers: { "Cache-Control": CACHE_CONTROL.matchList },
  });
}
