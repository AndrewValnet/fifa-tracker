import { NextResponse } from "next/server";
import { getAllMatches, getLiveMatches } from "@/lib/data";
import { stageLabel } from "@/lib/format";
import { pushEnabled, sendToFollowers } from "@/lib/push";
import { redisPipe } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Vercel Cron sends an Authorization: Bearer <CRON_SECRET> header. We also accept
// ?key= so a free external cron (e.g. cron-job.org) works on the Hobby plan.
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  if (req.headers.get("authorization") === `Bearer ${secret}`) return true;
  return new URL(req.url).searchParams.get("key") === secret;
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  if (!pushEnabled()) return NextResponse.json({ ok: true, skipped: "push not configured" });

  let alerts = 0;

  // Goal alerts: diff each live match's score against the last seen value.
  const live = (await getLiveMatches().catch(() => null))?.data ?? [];
  for (const m of live) {
    if (!m.homeTeam?.code || !m.awayTeam?.code) continue;
    const key = `lastscore:${m.id}`;
    const prev = ((await redisPipe([["GET", key]]))?.[0] as string | null) ?? null;
    const cur = `${m.score.home ?? 0}:${m.score.away ?? 0}`;
    await redisPipe([["SET", key, cur, "EX", 6 * 3600]]);
    if (prev && prev !== cur) {
      alerts += await sendToFollowers([m.homeTeam.code, m.awayTeam.code], {
        title: `GOAL — ${m.homeTeam.code} ${m.score.home ?? 0}–${m.score.away ?? 0} ${m.awayTeam.code}`,
        body: stageLabel(m.stage, m.group),
        url: `/match/${m.id}`,
        tag: `goal-${m.id}`,
      });
    }
  }

  // Kickoff reminders: fire once per match ~15 min before kickoff.
  const all = (await getAllMatches().catch(() => null))?.data ?? [];
  const now = Date.now();
  for (const m of all) {
    if (!m.homeTeam?.code || !m.awayTeam?.code) continue;
    const mins = (new Date(m.utcDate).getTime() - now) / 60_000;
    if (mins <= 0 || mins > 15) continue;
    const set = (await redisPipe([["SET", `koalert:${m.id}`, "1", "NX", "EX", 3600]]))?.[0];
    if (set === "OK") {
      alerts += await sendToFollowers([m.homeTeam.code, m.awayTeam.code], {
        title: `Kickoff soon — ${m.homeTeam.code} vs ${m.awayTeam.code}`,
        body: `Starts in ~${Math.max(1, Math.round(mins))} min · ${stageLabel(m.stage, m.group)}`,
        url: `/match/${m.id}`,
        tag: `ko-${m.id}`,
      });
    }
  }

  return NextResponse.json({ ok: true, alerts }, { headers: { "Cache-Control": "no-store" } });
}
