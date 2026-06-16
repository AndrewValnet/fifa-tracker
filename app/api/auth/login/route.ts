import { NextResponse } from "next/server";
import { loginUser, setSessionCookie } from "@/lib/accounts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { email?: string; password?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* ignore */
  }
  const result = await loginUser({ email: body.email ?? "", password: body.password ?? "" });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 401 });
  }
  setSessionCookie(result.token);
  return NextResponse.json({ ok: true, user: result.user }, { headers: { "Cache-Control": "no-store" } });
}
