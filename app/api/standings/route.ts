import { NextResponse } from "next/server";
import { getStandings } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const result = await getStandings();
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
