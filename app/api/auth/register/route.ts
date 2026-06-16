import { NextResponse } from "next/server";
import { registerUser, setSessionCookie } from "@/lib/accounts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { email?: string; name?: string; password?: string; poolCode?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* ignore */
  }
  const result = await registerUser({
    email: body.email ?? "",
    name: body.name ?? "",
    password: body.password ?? "",
    poolCode: body.poolCode,
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  setSessionCookie(result.token);
  return NextResponse.json({ ok: true, user: result.user }, { headers: { "Cache-Control": "no-store" } });
}
