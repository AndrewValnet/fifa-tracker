import { NextResponse } from "next/server";
import { getAllMatches } from "@/lib/data";
import { getPlayer, predictionsEnabled, savePredictions, scorePredictions } from "@/lib/predictions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const sid = new URL(req.url).searchParams.get("sessionId") ?? "";
  if (!predictionsEnabled() || !sid) {
    return NextResponse.json({ enabled: predictionsEnabled(), picks: {}, name: null, champion: null, score: null });
  }
  const player = (await getPlayer(sid)) ?? { picks: {}, name: null, champion: null };
  const matches = (await getAllMatches()).data;
  const score = scorePredictions(player, matches, null);
  return NextResponse.json(
    { enabled: true, ...player, score },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: Request) {
  if (!predictionsEnabled()) return NextResponse.json({ enabled: false, ok: false }, { status: 200 });
  let body: { sessionId?: string; name?: string; champion?: string; picks?: Record<string, string> } = {};
  try {
    body = await req.json();
  } catch {
    /* ignore */
  }
  if (!body.sessionId) return NextResponse.json({ enabled: true, ok: false }, { status: 400 });
  const ok = await savePredictions(body.sessionId, body);
  return NextResponse.json({ enabled: true, ok }, { headers: { "Cache-Control": "no-store" } });
}
