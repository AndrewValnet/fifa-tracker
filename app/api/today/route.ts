import { NextResponse } from "next/server";
import { getAllMatches } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Matches in a rolling window around "now" (recently finished, live, and the
 * next batch). The client groups by the viewer's local date.
 */
export async function GET() {
  const all = await getAllMatches();
  const now = Date.now();
  const from = now - 12 * 3600_000;
  const to = now + 30 * 3600_000;
  const windowed = all.data.filter((m) => {
    const t = new Date(m.utcDate).getTime();
    return t >= from && t <= to;
  });
  return NextResponse.json(
    { ...all, data: windowed },
    { headers: { "Cache-Control": "no-store" } },
  );
}
