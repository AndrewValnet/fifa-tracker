"use client";

// Two-column player picker for /compare. Picks a team, loads its ESPN roster,
// picks a player, then navigates to the comparison.

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TEAMS } from "@/lib/team-meta";
import type { EspnRosterPlayer } from "@/lib/espn";

const SORTED_TEAMS = [...TEAMS].sort((a, b) => a.name.localeCompare(b.name));

function PickerColumn({
  side,
  team,
  player,
  onTeam,
  onPlayer,
}: {
  side: string;
  team: string;
  player: string;
  onTeam: (code: string) => void;
  onPlayer: (id: string) => void;
}) {
  const [roster, setRoster] = useState<EspnRosterPlayer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!team) {
      setRoster([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/roster/${team}`)
      .then((r) => r.json())
      .then((data: EspnRosterPlayer[]) => {
        if (!cancelled) setRoster(Array.isArray(data) ? data : []);
      })
      .catch(() => !cancelled && setRoster([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [team]);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-edge bg-panel p-4">
      <p className="text-[10px] uppercase tracking-widest text-dim">Player {side}</p>
      <select
        value={team}
        onChange={(e) => {
          onTeam(e.target.value);
          onPlayer("");
        }}
        className="rounded-lg border border-edge bg-panel2 px-3 py-2 text-sm"
        aria-label={`Team ${side}`}
      >
        <option value="">Select a team…</option>
        {SORTED_TEAMS.map((t) => (
          <option key={t.code} value={t.code}>
            {t.name}
          </option>
        ))}
      </select>
      <select
        value={player}
        onChange={(e) => onPlayer(e.target.value)}
        disabled={!team || loading}
        className="rounded-lg border border-edge bg-panel2 px-3 py-2 text-sm disabled:opacity-50"
        aria-label={`Player ${side}`}
      >
        <option value="">{loading ? "Loading roster…" : team ? "Select a player…" : "Pick a team first"}</option>
        {roster
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((p) => (
            <option key={p.espnId} value={p.espnId}>
              {p.jersey ? `#${p.jersey} ` : ""}
              {p.name}
            </option>
          ))}
      </select>
    </div>
  );
}

export function CompareClient({
  initial,
}: {
  initial: { a: string; teamA: string; b: string; teamB: string };
}) {
  const router = useRouter();
  const [teamA, setTeamA] = useState(initial.teamA);
  const [playerA, setPlayerA] = useState(initial.a);
  const [teamB, setTeamB] = useState(initial.teamB);
  const [playerB, setPlayerB] = useState(initial.b);

  const ready = playerA && teamA && playerB && teamB;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <PickerColumn side="A" team={teamA} player={playerA} onTeam={setTeamA} onPlayer={setPlayerA} />
        <PickerColumn side="B" team={teamB} player={playerB} onTeam={setTeamB} onPlayer={setPlayerB} />
      </div>
      <button
        type="button"
        disabled={!ready}
        onClick={() =>
          router.push(`/compare?a=${playerA}&teamA=${teamA}&b=${playerB}&teamB=${teamB}`)
        }
        className="self-start rounded-full border border-gold/50 bg-gold/10 px-5 py-2 text-sm font-semibold text-gold disabled:opacity-40"
      >
        Compare →
      </button>
    </div>
  );
}
