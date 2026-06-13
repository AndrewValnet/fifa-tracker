import { NextResponse } from "next/server";
import { resolvePlayerImage } from "@/lib/playerimage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Keyless fallback headshot resolver — called by <PlayerHeadshot> only when
 *  the ESPN image 404s (or no ESPN id exists), so first paint never fans out. */
export async function GET(req: Request) {
  const name = new URL(req.url).searchParams.get("name");
  if (!name) return NextResponse.json({ url: null, source: null }, { status: 400 });
  const img = await resolvePlayerImage(name);
  return NextResponse.json(img ?? { url: null, source: null }, {
    headers: { "Cache-Control": "public, max-age=86400, s-maxage=2592000" },
  });
}
