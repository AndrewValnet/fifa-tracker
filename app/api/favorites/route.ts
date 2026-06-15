import { NextResponse } from "next/server";
import { getFavoritesData } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const favorites = await getFavoritesData();
  return NextResponse.json(
    { favorites },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" } },
  );
}
