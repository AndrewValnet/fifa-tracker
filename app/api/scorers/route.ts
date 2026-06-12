import { NextRequest, NextResponse } from "next/server";
import { getScorers } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 12, 30);
  const result = await getScorers(limit);
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
