import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/cache-policy";
import { getStandings } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const result = await getStandings();
  return NextResponse.json(result, {
    headers: { "Cache-Control": CACHE_CONTROL.standings },
  });
}
