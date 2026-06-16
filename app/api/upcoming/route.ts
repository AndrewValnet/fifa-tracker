import { NextResponse } from "next/server";
import { CACHE_CONTROL, slimSourcedMatches } from "@/lib/cache-policy";
import { getAllMatches } from "@/lib/data";
import { statusKind } from "@/lib/format";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const all = await getAllMatches();
  const upcoming = all.data.filter((m) => statusKind(m.status) === "upcoming");
  return NextResponse.json(
    slimSourcedMatches({ ...all, data: upcoming }),
    { headers: { "Cache-Control": CACHE_CONTROL.upcomingList } },
  );
}
