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

export function pushDiagnostics() {
  return {
    vapidPublicKeySet: Boolean(PUB),
    vapidPrivateKeySet: Boolean(PRIV),
    subject: SUBJECT,
    redisEnabled: redisEnabled(),
    enabled: pushEnabled(),
  };
}

export type MatchAlertKind = "kickoff" | "goal" | "halftime" | "fulltime" | "lineup";
export type MatchAlertSettings = Partial<Record<MatchAlertKind, boolean>>;

type StoredSub = {
  sub: webpush.PushSubscription;
  teams: string[];
  matchAlerts?: Record<string, MatchAlertSettings>;
};

function endpointId(endpoint: string): string {
  let h = 0;
  for (let i = 0; i < endpoint.length; i++) h = (h * 31 + endpoint.charCodeAt(i)) | 0;
  return `s${Math.abs(h)}`;
}

function parseOne(raw: unknown): StoredSub | null {
  if (typeof raw !== "string") return null;
  try {
    const rec = JSON.parse(raw) as StoredSub;
    return rec?.sub?.endpoint ? rec : null;
  } catch {
    return null;
  }
}

export async function saveSubscription(
  sub: webpush.PushSubscription,
  input: string[] | { teams?: string[]; matchId?: string; matchAlerts?: MatchAlertSettings },
): Promise<boolean> {
  if (!pushEnabled() || !sub?.endpoint) return false;
  const id = endpointId(sub.endpoint);
  const existing = parseOne((await redisPipe([["HGET", HASH, id]]))?.[0]);
  const patch = Array.isArray(input) ? { teams: input } : input;
  const rec: StoredSub = {
    sub,
    teams: (patch.teams ?? existing?.teams ?? []).slice(0, 60),
    matchAlerts: existing?.matchAlerts ?? {},
  };
  if (patch.matchId && patch.matchAlerts) {
    rec.matchAlerts![patch.matchId] = {
      ...(rec.matchAlerts?.[patch.matchId] ?? {}),
      ...patch.matchAlerts,
    };
  }
  if (rec.matchAlerts && !Object.keys(rec.matchAlerts).length) delete rec.matchAlerts;
  return (await redisPipe([["HSET", HASH, id, JSON.stringify(rec)]])) != null;
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

function wantsAlert(
  rec: StoredSub,
  teams: string[],
  kind: MatchAlertKind,
  matchId?: string,
): boolean {
  const explicit = matchId ? rec.matchAlerts?.[matchId]?.[kind] : undefined;
  if (explicit !== undefined) return explicit;

  // Legacy/team-follow behavior: people who enabled the old button still get
  // the two original alerts, but richer alerts require explicit match opt-in.
  if (kind !== "goal" && kind !== "kickoff") return false;
  const want = new Set(teams);
  return !rec.teams.length || rec.teams.some((t) => want.has(t));
}

/** Send to subscribers following ANY of `teams` or opted into this match alert. */
export async function sendToFollowers(
  teams: string[],
  payload: PushPayload,
  options: { kind?: MatchAlertKind; matchId?: string } = {},
): Promise<number> {
  if (!ensureConfigured()) return 0;
  const res = await redisPipe([["HGETALL", HASH]]);
  const subs = parseAll(res?.[0]);
  const kind = options.kind ?? "goal";
  const stale: (string | number)[][] = [];
  let sent = 0;
  await Promise.all(
    subs.map(async (rec) => {
      if (!wantsAlert(rec, teams, kind, options.matchId)) return;
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

export async function pushSubscriptionCount(): Promise<number | null> {
  if (!redisEnabled()) return null;
  const res = await redisPipe([["HLEN", HASH]]);
  const value = res?.[0];
  return typeof value === "number" ? value : Number(value) || null;
}
