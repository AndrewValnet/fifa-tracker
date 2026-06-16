import { NextResponse } from "next/server";
import { getAllMatches, getLiveMatches, getMatchExtras } from "@/lib/data";
import { stageLabel } from "@/lib/format";
import { pushEnabled, sendToFollowers } from "@/lib/push";
import { redisPipe } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Vercel Cron sends an Authorization: Bearer <CRON_SECRET> header. We also
// accept ?key= so a free external cron can call the route too.
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  if (req.headers.get("authorization") === `Bearer ${secret}`) return true;
  return new URL(req.url).searchParams.get("key") === secret;
}

function teams(m: { homeTeam?: { code: string | null } | null; awayTeam?: { code: string | null } | null }) {
  return [m.homeTeam?.code, m.awayTeam?.code].filter(Boolean) as string[];
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
      alerts += await sendToFollowers(teams(m), {
        title: `GOAL - ${m.homeTeam.code} ${m.score.home ?? 0}-${m.score.away ?? 0} ${m.awayTeam.code}`,
        body: stageLabel(m.stage, m.group),
        url: `/match/${m.id}`,
        tag: `goal-${m.id}`,
      }, {
        kind: "goal",
        matchId: m.id,
      });
    }
  }

  const all = (await getAllMatches().catch(() => null))?.data ?? [];
  const now = Date.now();

  for (const m of all) {
    if (!m.homeTeam?.code || !m.awayTeam?.code) continue;
    const kickoff = new Date(m.utcDate).getTime();
    const mins = (kickoff - now) / 60_000;

    // Kickoff reminders: fire once per match about 15 minutes before kickoff.
    if (mins > 0 && mins <= 15) {
      const set = (await redisPipe([["SET", `koalert:${m.id}`, "1", "NX", "EX", 3600]]))?.[0];
      if (set === "OK") {
        alerts += await sendToFollowers(teams(m), {
          title: `Kickoff soon - ${m.homeTeam.code} vs ${m.awayTeam.code}`,
          body: `Starts in ~${Math.max(1, Math.round(mins))} min - ${stageLabel(m.stage, m.group)}`,
          url: `/match/${m.id}`,
          tag: `ko-${m.id}`,
        }, {
          kind: "kickoff",
          matchId: m.id,
        });
      }
    }

    // Lineups usually arrive within 60-75 minutes of kickoff. This doubles as
    // a gentle ESPN summary prewarm during the exact window users care about.
    if (mins <= 90 && mins >= -10) {
      const extras = await getMatchExtras(m.id).catch(() => null);
      const hasLineups = Boolean(extras?.extras?.lineups.home?.players.length && extras?.extras?.lineups.away?.players.length);
      if (hasLineups) {
        const setLineup = (await redisPipe([["SET", `lineupalert:${m.id}`, "1", "NX", "EX", 8 * 3600]]))?.[0];
        if (setLineup === "OK") {
          alerts += await sendToFollowers(teams(m), {
            title: `Lineups out - ${m.homeTeam.code} vs ${m.awayTeam.code}`,
            body: `Starting XIs are available - ${stageLabel(m.stage, m.group)}`,
            url: `/match/${m.id}#lineups`,
            tag: `lineup-${m.id}`,
          }, {
            kind: "lineup",
            matchId: m.id,
          });
        }
      }
    }

    if (m.status === "PAUSED") {
      const setHt = (await redisPipe([["SET", `htalert:${m.id}`, "1", "NX", "EX", 6 * 3600]]))?.[0];
      if (setHt === "OK") {
        alerts += await sendToFollowers(teams(m), {
          title: `Halftime - ${m.homeTeam.code} ${m.score.home ?? 0}-${m.score.away ?? 0} ${m.awayTeam.code}`,
          body: stageLabel(m.stage, m.group),
          url: `/match/${m.id}`,
          tag: `ht-${m.id}`,
        }, {
          kind: "halftime",
          matchId: m.id,
        });
      }
    }

    // Time-bound finished games so a fresh Redis/deploy never blasts old scores.
    if (m.status === "FINISHED" && now - kickoff < 4 * 3600_000) {
      const setFt = (await redisPipe([["SET", `ftalert:${m.id}`, "1", "NX", "EX", 24 * 3600]]))?.[0];
      if (setFt === "OK") {
        alerts += await sendToFollowers(teams(m), {
          title: `Full time - ${m.homeTeam.code} ${m.score.home ?? 0}-${m.score.away ?? 0} ${m.awayTeam.code}`,
          body: stageLabel(m.stage, m.group),
          url: `/match/${m.id}`,
          tag: `ft-${m.id}`,
        }, {
          kind: "fulltime",
          matchId: m.id,
        });
      }
    }
  }

  return NextResponse.json({ ok: true, alerts }, { headers: { "Cache-Control": "no-store" } });
}
