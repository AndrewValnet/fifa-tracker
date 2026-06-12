// Confirmed lineups from ESPN: real formations, starters at their formation
// slots (with headshots), bench with substitution minutes.

import Link from "next/link";
import { FormationDiagram, type FormationPlayer } from "@/components/FormationDiagram";
import { PlayerHeadshot } from "@/components/PlayerHeadshot";
import { getAccentColor, getTeamColors } from "@/lib/team-meta";
import type { LineupPlayer, Match, TeamLineup } from "@/lib/types";

function playerHref(p: LineupPlayer, teamCode: string | null): string {
  return `/players/${p.espnId}${teamCode ? `?team=${teamCode}` : ""}`;
}

function toFormationPlayers(lineup: TeamLineup, teamCode: string | null): FormationPlayer[] {
  return lineup.players
    .filter((p) => p.starter)
    .sort((a, b) => (a.formationPlace ?? 99) - (b.formationPlace ?? 99))
    .map((p) => ({
      name: p.name,
      shirtNumber: p.jersey,
      positionDetail: p.positionAbbr,
      image: p.headshot,
      href: playerHref(p, teamCode),
    }));
}

function Bench({ lineup, teamCode }: { lineup: TeamLineup; teamCode: string | null }) {
  const colors = getTeamColors(teamCode);
  const used = lineup.players.filter((p) => p.subbedIn);
  const unused = lineup.players.filter((p) => !p.starter && !p.subbedIn);
  if (!used.length && !unused.length) return null;
  return (
    <div className="mt-2">
      <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-dim">Bench</h4>
      <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
        {[...used, ...unused].map((p) => (
          <li key={p.espnId} className="flex items-center gap-1.5 text-xs">
            <PlayerHeadshot src={p.headshot} name={p.name} size={20} colors={colors} />
            <Link href={playerHref(p, teamCode)} prefetch={false} className="hover:text-gold">
              {p.name}
            </Link>
            {p.subbedIn ? (
              <span className="font-mono text-[10px] text-pitch" title="Came on">
                ▲{p.minutes !== null ? ` ${p.minutes}′` : ""}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LineupSection({
  match,
  home,
  away,
}: {
  match: Match;
  home: TeamLineup;
  away: TeamLineup;
}) {
  const homeCode = match.homeTeam?.code ?? null;
  const awayCode = match.awayTeam?.code ?? null;
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div>
        <FormationDiagram
          formation={home.formation ?? "4-3-3"}
          players={toFormationPlayers(home, homeCode)}
          color={getAccentColor(homeCode)}
          label={match.homeTeam?.name ?? "Home"}
        />
        <Bench lineup={home} teamCode={homeCode} />
      </div>
      <div>
        <FormationDiagram
          formation={away.formation ?? "4-3-3"}
          players={toFormationPlayers(away, awayCode)}
          color={getAccentColor(awayCode)}
          label={match.awayTeam?.name ?? "Away"}
        />
        <Bench lineup={away} teamCode={awayCode} />
      </div>
    </div>
  );
}
