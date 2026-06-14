import { NextRequest, NextResponse } from "next/server";
import { getNews } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q");
  const home = sp.get("home");
  const away = sp.get("away");
  const max = Math.min(Number(sp.get("max")) || 10, 20);
  const result = await getNews(q, max, home || away ? { home, away } : undefined);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" },
  });
}
