import { NextResponse } from "next/server";
import type webpush from "web-push";
import { pushEnabled, removeSubscription, saveSubscription, vapidPublicKey, type MatchAlertSettings } from "@/lib/push";

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
    matchId?: string;
    matchAlerts?: MatchAlertSettings;
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
  const ok = await saveSubscription(body.subscription, {
    teams: Array.isArray(body.teams) ? body.teams : undefined,
    matchId: typeof body.matchId === "string" ? body.matchId : undefined,
    matchAlerts: body.matchAlerts && typeof body.matchAlerts === "object" ? body.matchAlerts : undefined,
  });
  return NextResponse.json({ ok }, { headers: { "Cache-Control": "no-store" } });
}
