import { NextResponse } from "next/server";
import { accountsEnabled, currentUser } from "@/lib/accounts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    { enabled: accountsEnabled(), user: await currentUser() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
