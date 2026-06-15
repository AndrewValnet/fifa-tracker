import { NextResponse } from "next/server";
import { getAllMatches } from "@/lib/data";
import { computeSuspensions } from "@/lib/suspensions";

export const dynamic = "force-dynamic";

export async function GET() {
  const all = await getAllMatches();
  const suspensions = computeSuspensions(all.data);
  return NextResponse.json(
    { suspensions },
    { headers: { "Cache-Control": "public, s-maxage=120" } },
  );
}
