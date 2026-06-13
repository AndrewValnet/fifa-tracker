import { NextResponse } from "next/server";
import type webpush from "web-push";
import { pushEnabled, removeSubscription, saveSubscription, vapidPublicKey } from "@/lib/push";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET → capability + VAPID public key for the client to subscribe with. */
export async function GET() {
  return NextResponse.json({ enabled: pushEnabled(), vapidPublicKey: vapidPublicKey() });
}

/** POST → save a subscription (with followed teams), or unsubscribe. */
export async function POST(req: Request) {
  if (!pushEnabled()) return NextResponse.json({ enabled: false, ok: false });
  let body: {
    subscription?: webpush.PushSubscription;
    teams?: string[];
    unsubscribe?: boolean;
    endpoint?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    /* ignore */
  }
  if (body.unsubscribe && body.endpoint) {
    await removeSubscription(body.endpoint);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  }
  if (!body.subscription?.endpoint) return NextResponse.json({ ok: false }, { status: 400 });
  const ok = await saveSubscription(body.subscription, Array.isArray(body.teams) ? body.teams : []);
  return NextResponse.json({ ok }, { headers: { "Cache-Control": "no-store" } });
}
