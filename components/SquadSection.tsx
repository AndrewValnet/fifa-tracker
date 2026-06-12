// Squad list grouped by position with coach card (PRD §7.2, §5.8).
// ESPN headshots and player-page links light up when the roster index is
// available; otherwise initials avatars in team colors stand in.

import Link from "next/link";
import { Flag } from "@/components/Flag";
import { PlayerHeadshot } from "@/components/PlayerHeadshot";
import { matchPlayerByName, type EspnRosterPlayer } from "@/lib/espn";
import { getTeamColors, resolveTeamCode } from "@/lib/team-meta";
import type { Scorer, SquadPlayer, TeamDetail } from "@/lib/types";

const GROUPS: { key: string; label: string }[] = [
  { key: "GK", label: "Goalkeepers" },
  { key: "DEF", label: "Defenders" },
  { key: "MID", label: "Midfielders" },
  { key: "FWD", label: "Forwards" },
  { key: "OTHER", label: "Squad" },
];

function PlayerRow({
  player,
  goals,
  colors,
  espn,
  teamCode,
}: {
  player: SquadPlayer;
  goals: number;
  colors: { primary: string; secondary: string };
  espn: EspnRosterPlayer | null;
  teamCode: string | null;
}) {
  const nameEl = espn ? (
    <Link
      href={`/players/${espn.espnId}${teamCode ? `?team=${teamCode}` : ""}`}
      prefetch={false}
      className="hover:text-gold hover:underline underline-offset-2"
    >
      {player.name}
    </Link>
  ) : (
    player.name
  );
  return (
    <li className="flex items-center gap-2.5 border-t border-edge/50 py-1.5 first:border-t-0">
      <span className="w-6 text-right font-mono text-xs text-dim">
        {player.shirtNumber ?? espn?.jersey ?? "–"}
      </span>
      <PlayerHeadshot src={espn?.headshot} name={player.name} size={28} colors={colors} />
      <span className={`min-w-0 flex-1 truncate text-sm ${goals > 0 ? "font-semibold text-gold" : ""}`}>
        {nameEl}
      </span>
      {goals > 0 ? (
        <span className="font-mono text-xs text-gold" title={`${goals} goals this tournament`}>
          ⚽ {goals}
        </span>
      ) : null}
      <span className="w-20 truncate text-right text-[10px] text-dim">{player.positionDetail ?? ""}</span>
    </li>
  );
}

export function CoachCard({ team }: { team: TeamDetail }) {
  if (!team.coach?.name) return null;
  const natCode = resolveTeamCode(null, team.coach.nationality);
  return (
    <div className="flex items-center gap-3 rounded-lg border border-edge bg-panel2/60 px-3 py-2.5">
      <span aria-hidden className="text-xl">🧑‍💼</span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{team.coach.name}</p>
        <p className="flex items-center gap-1.5 text-[11px] text-dim">
          Head coach
          {team.coach.nationality ? (
            <>
              {" · "}
              {natCode ? <Flag code={natCode} name={team.coach.nationality} width={16} rounded={false} /> : null}
              {team.coach.nationality}
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}

export function SquadSection({
  team,
  scorers = [],
  showCoach = true,
  rosterIndex = [],
}: {
  team: TeamDetail;
  scorers?: Scorer[];
  showCoach?: boolean;
  rosterIndex?: EspnRosterPlayer[];
}) {
  const colors = getTeamColors(team.code);
  const goalsByPlayer = new Map<string, number>();
  for (const s of scorers) {
    if (s.team.code && s.team.code === team.code) goalsByPlayer.set(s.player.toLowerCase(), s.goals);
  }

  if (!team.squad.length) {
    // No football-data squad — fall back to the ESPN roster outright.
    if (rosterIndex.length) {
      return (
        <div>
          {showCoach ? <CoachCard team={team} /> : null}
          <ul className="mt-2">
            {rosterIndex.map((p) => (
              <PlayerRow
                key={p.espnId}
                player={{
                  id: p.espnId,
                  name: p.name,
                  position: null,
                  positionDetail: p.positionAbbr,
                  shirtNumber: p.jersey,
                  nationality: null,
                  dateOfBirth: null,
                }}
                goals={goalsByPlayer.get(p.name.toLowerCase()) ?? 0}
                colors={colors}
                espn={p}
                teamCode={team.code}
              />
            ))}
          </ul>
        </div>
      );
    }
    return (
      <div>
        {showCoach ? <CoachCard team={team} /> : null}
        <p className="mt-3 rounded-lg border border-dashed border-edge px-3 py-5 text-center text-xs text-dim">
          Squad lists need a football-data.org API key (free) — see README.
        </p>
      </div>
    );
  }

  const grouped = GROUPS.map((g) => ({
    ...g,
    players: team.squad.filter((p) => (p.position ?? "OTHER") === g.key),
  })).filter((g) => g.players.length);

  return (
    <div className="flex flex-col gap-3">
      {showCoach ? <CoachCard team={team} /> : null}
      {grouped.map((g) => (
        <div key={g.key}>
          <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-dim">{g.label}</h4>
          <ul>
            {g.players.map((p) => (
              <PlayerRow
                key={p.id}
                player={p}
                goals={goalsByPlayer.get(p.name.toLowerCase()) ?? 0}
                colors={colors}
                espn={rosterIndex.length ? matchPlayerByName(p.name, rosterIndex) : null}
                teamCode={team.code}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
