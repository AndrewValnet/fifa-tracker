import { NextResponse } from "next/server";
import { accountsEnabled, currentUser } from "@/lib/accounts";
import { getAllMatches } from "@/lib/data";
import { getPlayer, predictionsEnabled, savePredictions, scorePredictions } from "@/lib/predictions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const user = await currentUser();
  if (!accountsEnabled() || !predictionsEnabled()) {
    return NextResponse.json({ enabled: false, user: null, picks: {}, champion: null, score: null });
  }
  if (!user) {
    return NextResponse.json({ enabled: true, user: null, picks: {}, champion: null, score: null });
  }

  const player = (await getPlayer(user.id)) ?? { picks: {}, champion: null };
  const matches = (await getAllMatches()).data;
  const score = scorePredictions(player, matches);
  return NextResponse.json(
    { enabled: true, user, ...player, score },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: Request) {
  if (!accountsEnabled() || !predictionsEnabled()) return NextResponse.json({ enabled: false, ok: false });
  const user = await currentUser();
  if (!user) return NextResponse.json({ enabled: true, ok: false, error: "Sign in to save predictions." }, { status: 401 });

  let body: { champion?: string | null; picks?: Record<string, unknown> } = {};
  try {
    body = await req.json();
  } catch {
    /* ignore */
  }
  const result = await savePredictions(user.id, body);
  return NextResponse.json(
    { enabled: true, ...result },
    { status: result.ok ? 200 : 400, headers: { "Cache-Control": "no-store" } },
  );
}
