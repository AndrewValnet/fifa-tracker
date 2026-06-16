import { NextResponse } from "next/server";
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
      ? "public, s-maxage=6, stale-while-revalidate=15"
      : kind === "finished"
        ? "public, s-maxage=3600, stale-while-revalidate=86400"
        : "public, s-maxage=60, stale-while-revalidate=300";
  return NextResponse.json(result, {
    headers: { "Cache-Control": cacheControl },
  });
}
