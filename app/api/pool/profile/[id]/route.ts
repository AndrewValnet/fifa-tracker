import { NextResponse } from "next/server";
import { getPublicProfile, predictionsEnabled } from "@/lib/predictions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!predictionsEnabled()) return NextResponse.json({ enabled: false, profile: null });
  const profile = await getPublicProfile(params.id);
  if (!profile) return NextResponse.json({ enabled: true, profile: null }, { status: 404 });
  return NextResponse.json({ enabled: true, profile }, { headers: { "Cache-Control": "no-store" } });
}
