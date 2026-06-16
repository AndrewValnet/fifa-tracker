import { NextResponse } from "next/server";
import { logoutCurrentUser } from "@/lib/accounts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  await logoutCurrentUser();
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
