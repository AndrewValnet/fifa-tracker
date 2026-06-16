import { NextResponse } from "next/server";
import { CACHE_CONTROL, slimSourcedMatches } from "@/lib/cache-policy";
import { getLiveMatches } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const result = await getLiveMatches();
  return NextResponse.json(slimSourcedMatches(result, { keepEvents: true }), {
    headers: { "Cache-Control": CACHE_CONTROL.liveList },
  });
}
