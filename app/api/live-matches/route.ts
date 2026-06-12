import { NextResponse } from "next/server";
import { getLiveMatches } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const result = await getLiveMatches();
  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
