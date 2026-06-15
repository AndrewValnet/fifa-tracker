import type { Match } from "@/lib/types";

export interface PlayerSuspension {
  player: string;
  teamName: string;
  teamCode: string | null;
  yellows: number;
  suspended: boolean;
  atRisk: boolean;
}

const ACCUMULATION_STAGES = new Set(["GROUP_STAGE", "LAST_32"]);

export function computeSuspensions(matches: Match[]): PlayerSuspension[] {
  const map = new Map<string, PlayerSuspension>();

  for (const m of matches) {
    if (!ACCUMULATION_STAGES.has(m.stage)) continue;
    if (m.status !== "FINISHED") continue;

    for (const ev of m.events) {
      if (ev.type !== "YELLOW") continue;
      if (!ev.player) continue;
      const team = ev.side === "HOME" ? m.homeTeam : m.awayTeam;
      const key = `${ev.player.toLowerCase()}|${team?.code ?? ev.side}`;
      const cur = map.get(key) ?? {
        player: ev.player,
        teamName: team?.name ?? ev.side,
        teamCode: team?.code ?? null,
        yellows: 0,
        suspended: false,
        atRisk: false,
      };
      cur.yellows++;
      map.set(key, cur);
    }
  }

  return [...map.values()]
    .map((r) => ({ ...r, suspended: r.yellows >= 2, atRisk: r.yellows === 1 }))
    .sort((a, b) => b.yellows - a.yellows || a.player.localeCompare(b.player));
}
