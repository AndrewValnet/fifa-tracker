import { NextResponse } from "next/server";
import { heartbeat, presenceEnabled, readCounts } from "@/lib/presence";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST: record a viewer heartbeat for this match and return live counts. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  let sessionId = "";
  try {
    sessionId = ((await req.json()) as { sessionId?: string })?.sessionId ?? "";
  } catch {
    /* empty body */
  }
  const counts = sessionId ? await heartbeat(params.id, sessionId, Date.now()) : await readCounts(params.id, Date.now());
  return NextResponse.json(
    { enabled: presenceEnabled(), watching: counts?.watching ?? null, total: counts?.total ?? null },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** GET: read-only counts (no heartbeat). */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const counts = await readCounts(params.id, Date.now());
  return NextResponse.json(
    { enabled: presenceEnabled(), watching: counts?.watching ?? null, total: counts?.total ?? null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
