// Web Push (goal alerts + kickoff reminders). Subscriptions live in Upstash;
// sending uses VAPID via the web-push library. Fully optional: disabled unless
// both VAPID_* keys and UPSTASH_* are set.

import webpush from "web-push";
import { redisEnabled, redisPipe } from "@/lib/redis";

const PUB = process.env.VAPID_PUBLIC_KEY?.trim();
const PRIV = process.env.VAPID_PRIVATE_KEY?.trim();
const SUBJECT = process.env.VAPID_SUBJECT?.trim() || "mailto:alerts@wc26live.local";
const HASH = "pushsubs";

let configured = false;
function ensureConfigured(): boolean {
  if (!PUB || !PRIV) return false;
  if (!configured) {
    webpush.setVapidDetails(SUBJECT, PUB, PRIV);
    configured = true;
  }
  return true;
}

export function pushEnabled(): boolean {
  return Boolean(PUB && PRIV && redisEnabled());
}
export function vapidPublicKey(): string | null {
  return PUB ?? null;
}

type StoredSub = { sub: webpush.PushSubscription; teams: string[] };

function endpointId(endpoint: string): string {
  let h = 0;
  for (let i = 0; i < endpoint.length; i++) h = (h * 31 + endpoint.charCodeAt(i)) | 0;
  return `s${Math.abs(h)}`;
}

export async function saveSubscription(sub: webpush.PushSubscription, teams: string[]): Promise<boolean> {
  if (!pushEnabled() || !sub?.endpoint) return false;
  const rec: StoredSub = { sub, teams: teams.slice(0, 60) };
  return (await redisPipe([["HSET", HASH, endpointId(sub.endpoint), JSON.stringify(rec)]])) != null;
}

export async function removeSubscription(endpoint: string): Promise<void> {
  if (!redisEnabled() || !endpoint) return;
  await redisPipe([["HDEL", HASH, endpointId(endpoint)]]);
}

function parseAll(v: unknown): StoredSub[] {
  const out: StoredSub[] = [];
  const add = (val: string) => {
    try {
      const rec = JSON.parse(val) as StoredSub;
      if (rec?.sub?.endpoint) out.push(rec);
    } catch {
      /* skip */
    }
  };
  if (Array.isArray(v)) {
    for (let i = 1; i < v.length; i += 2) add(String(v[i]));
  } else if (v && typeof v === "object") {
    for (const val of Object.values(v as Record<string, unknown>)) add(String(val));
  }
  return out;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/** Send to subscribers following ANY of `teams` (subs with no teams = all matches). */
export async function sendToFollowers(teams: string[], payload: PushPayload): Promise<number> {
  if (!ensureConfigured()) return 0;
  const res = await redisPipe([["HGETALL", HASH]]);
  const subs = parseAll(res?.[0]);
  const want = new Set(teams);
  const stale: (string | number)[][] = [];
  let sent = 0;
  await Promise.all(
    subs.map(async (rec) => {
      const targeted = !rec.teams.length || rec.teams.some((t) => want.has(t));
      if (!targeted) return;
      try {
        await webpush.sendNotification(rec.sub, JSON.stringify(payload));
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) stale.push(["HDEL", HASH, endpointId(rec.sub.endpoint)]);
      }
    }),
  );
  if (stale.length) await redisPipe(stale);
  return sent;
}
