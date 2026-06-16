import { NextResponse } from "next/server";
import { mapLimit } from "@/lib/async";
import { getAllMatches, getLiveMatches, getMatchById, getMatchExtras } from "@/lib/data";
import { statusKind } from "@/lib/format";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  if (req.headers.get("authorization") === `Bearer ${secret}`) return true;
  return new URL(req.url).searchParams.get("key") === secret;
}

function nearKickoff(utcDate: string, now = Date.now()): boolean {
  const kickoff = new Date(utcDate).getTime();
  return kickoff > now - 30 * 60_000 && kickoff < now + 90 * 60_000;
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ ok: false }, { status: 401 });

  const started = Date.now();
  const live = await getLiveMatches().catch(() => null);
  const all = await getAllMatches().catch(() => null);
  const matches = all?.data ?? [];
  const now = Date.now();
  const todayWindow = matches.filter((m) => {
    const t = new Date(m.utcDate).getTime();
    return t >= now - 12 * 3600_000 && t <= now + 30 * 3600_000;
  });
  const upcomingDetails = matches
    .filter((m) => statusKind(m.status) === "upcoming")
    .sort((a, b) => +new Date(a.utcDate) - +new Date(b.utcDate))
    .slice(0, 10);
  const lineupCandidates = matches.filter((m) => statusKind(m.status) === "live" || nearKickoff(m.utcDate));

  const warmedDetails = await mapLimit(upcomingDetails, 3, async (m) => Boolean(await getMatchById(m.id).catch(() => null)));
  const warmedExtras = await mapLimit(lineupCandidates, 2, async (m) => Boolean((await getMatchExtras(m.id).catch(() => null))?.extras));

  return NextResponse.json(
    {
      ok: true,
      tookMs: Date.now() - started,
      warmed: {
        liveMatches: live?.data.length ?? 0,
        todayMatches: todayWindow.length,
        upcomingDetailPages: warmedDetails.filter(Boolean).length,
        lineupChecks: warmedExtras.filter(Boolean).length,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
