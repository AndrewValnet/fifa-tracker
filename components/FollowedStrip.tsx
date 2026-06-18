"use client";

// "My Teams" - pins followed teams' live/next fixtures on the War Room.
// Pure client personalization (localStorage); fetches the cached match list.

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { Flag } from "@/components/Flag";
import { LocalTime } from "@/components/LocalTime";
import { PushButton } from "@/components/PushButton";
import { jsonFetcher } from "@/hooks/fetcher";
import { useFollowedTeams } from "@/hooks/useFollowedTeams";
import { useMounted } from "@/hooks/useMounted";
import { statusKind } from "@/lib/format";
import { TEAMS, teamGroup, teamName } from "@/lib/team-meta";
import type { Match, Sourced } from "@/lib/types";

function TeamPicker({
  followed,
  onPick,
}: {
  followed: string[];
  onPick: (code: string) => void;
}) {
  const [value, setValue] = useState("");
  const options = TEAMS.filter((t) => !followed.includes(t.code));
  if (!options.length) return null;
  return (
    <label className="inline-flex items-center gap-2 text-xs text-dim">
      <span className="sr-only">Add a country</span>
      <select
        value={value}
        onChange={(e) => {
          const code = e.target.value;
          setValue("");
          if (code) onPick(code);
        }}
        className="max-w-[220px] rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-ink outline-none transition focus:border-pitch focus:ring-2 focus:ring-pitch/20"
      >
        <option value="">Add country...</option>
        {options.map((t) => (
          <option key={t.code} value={t.code}>
            {t.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FollowedStrip() {
  const mounted = useMounted();
  const { followed, toggle } = useFollowedTeams();
  const { data } = useSWR<Sourced<Match[]>>(mounted && followed.length ? "/api/matches" : null, jsonFetcher);

  if (!mounted) return null;

  if (!followed.length) {
    return (
      <section className="mx-auto max-w-shell px-4 pt-6">
        <div className="surface-card flex flex-wrap items-center justify-center gap-3 rounded-2xl px-4 py-3 text-center text-xs text-dim">
          <span>Build My Teams for next matches, news, standings, and live alerts.</span>
          <TeamPicker followed={followed} onPick={toggle} />
          <Link href="/teams" className="text-pitch hover:underline">
            Browse teams
          </Link>
          <PushButton />
        </div>
      </section>
    );
  }

  const matches = data?.data ?? [];

  return (
    <section aria-label="My teams" className="mx-auto max-w-shell px-4 pt-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-dim">My Teams</h2>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <TeamPicker followed={followed} onPick={toggle} />
          <PushButton />
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {followed.map((code) => {
          const tm = matches.filter((m) => m.homeTeam?.code === code || m.awayTeam?.code === code);
          const live = tm.find((m) => statusKind(m.status) === "live");
          const next = tm
            .filter((m) => statusKind(m.status) === "upcoming")
            .sort((a, b) => +new Date(a.utcDate) - +new Date(b.utcDate))[0];
          const focus = live ?? next;
          const opp = focus ? (focus.homeTeam?.code === code ? focus.awayTeam : focus.homeTeam) : null;
          const group = teamGroup(code);

          return (
            <div
              key={code}
              className="surface-card flex min-w-[230px] flex-col gap-1 rounded-2xl px-3 py-2.5"
            >
              <div className="flex items-center gap-2">
                <Link href={`/teams/${code}`} className="flex min-w-0 items-center gap-2 hover:text-gold">
                  <Flag code={code} name={teamName(code)} width={22} />
                  <span className="truncate text-sm font-semibold">{teamName(code) ?? code}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => toggle(code)}
                  aria-label={`Unfollow ${teamName(code) ?? code}`}
                  className="ml-auto text-dim hover:text-live"
                >
                  x
                </button>
              </div>
              {focus ? (
                <Link href={`/match/${focus.id}`} className="text-[11px] text-dim hover:text-ink">
                  {live ? <span className="font-semibold text-live">LIVE </span> : null}
                  vs {opp?.code ?? opp?.name ?? "TBD"}{" "}
                  {live ? (
                    <span>
                      {focus.score.home ?? 0}-{focus.score.away ?? 0}
                    </span>
                  ) : (
                    <LocalTime iso={focus.utcDate} style="weekday" />
                  )}
                </Link>
              ) : (
                <span className="text-[11px] text-dim">No upcoming fixtures</span>
              )}
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] uppercase tracking-wider text-dim">
                <Link href={`/teams/${code}`} className="hover:text-pitch">
                  Team news
                </Link>
                <Link href={`/standings${group ? `#group-${group}` : ""}`} className="hover:text-pitch">
                  Standings
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
