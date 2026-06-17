import { NextResponse } from "next/server";
import { getMatchPredictions, predictionsEnabled } from "@/lib/predictions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!predictionsEnabled()) return NextResponse.json({ enabled: false, rows: [] });
  const rows = await getMatchPredictions(params.id);
  return NextResponse.json({ enabled: true, rows }, { headers: { "Cache-Control": "no-store" } });
}
