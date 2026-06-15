import { NextResponse } from "next/server";
import { getStadium } from "@/lib/schedule";
import { getWeatherForKickoff } from "@/lib/weather";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { stadiumId: string } }) {
  const stadium = getStadium(params.stadiumId);
  if (!stadium) return NextResponse.json({ weather: null });
  const { searchParams } = new URL(req.url);
  const utcDate = searchParams.get("date") ?? new Date().toISOString();
  try {
    const weather = await getWeatherForKickoff(stadium.lat, stadium.lng, utcDate);
    return NextResponse.json({ weather }, { headers: { "Cache-Control": "public, s-maxage=1800" } });
  } catch {
    return NextResponse.json({ weather: null });
  }
}
