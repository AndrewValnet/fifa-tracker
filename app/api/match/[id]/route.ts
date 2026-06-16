import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/cache-policy";
import { getMatchById } from "@/lib/data";
import { statusKind } from "@/lib/format";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const result = await getMatchById(params.id);
  if (!result) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }
  const kind = statusKind(result.data.status);
  const cacheControl =
    kind === "live"
      ? CACHE_CONTROL.liveMatch
      : kind === "finished"
        ? CACHE_CONTROL.finishedMatch
        : CACHE_CONTROL.upcomingMatch;
  return NextResponse.json(result, {
    headers: { "Cache-Control": cacheControl },
  });
}
