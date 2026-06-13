import { NextResponse } from "next/server";
import { getAllMatches } from "@/lib/data";
import { stageLabel } from "@/lib/format";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function icsStamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}
function esc(s: string): string {
  return s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

/** Downloadable .ics calendar for all fixtures, or one team's (?team=ESP). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const team = url.searchParams.get("team")?.toUpperCase() || null;
  const all = (await getAllMatches()).data;
  const matches = all.filter((m) => {
    if (!m.utcDate) return false;
    if (!team) return true;
    return m.homeTeam?.code === team || m.awayTeam?.code === team;
  });

  const now = icsStamp(new Date().toISOString());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WC26 Live//World Cup 2026//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${team ? team + " — " : ""}World Cup 2026`,
  ];
  for (const m of matches) {
    const home = m.homeTeam?.name ?? m.homeLabel ?? "TBD";
    const away = m.awayTeam?.name ?? m.awayLabel ?? "TBD";
    const end = new Date(new Date(m.utcDate).getTime() + 2 * 3600_000).toISOString();
    lines.push(
      "BEGIN:VEVENT",
      `UID:${m.id}@wc26live`,
      `DTSTAMP:${now}`,
      `DTSTART:${icsStamp(m.utcDate)}`,
      `DTEND:${icsStamp(end)}`,
      `SUMMARY:${esc(`${home} vs ${away} — ${stageLabel(m.stage, m.group)}`)}`,
      `LOCATION:${esc(m.venue ?? "")}`,
      `DESCRIPTION:${esc(`${stageLabel(m.stage, m.group)} · ${url.origin}/match/${m.id}`)}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="wc26${team ? "-" + team.toLowerCase() : ""}.ics"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
