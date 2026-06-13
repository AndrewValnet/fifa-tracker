"use client";

// "Your Teams" — pins followed teams' live/next fixtures on the War Room.
// Pure client personalization (localStorage); fetches the cached match list.

import Link from "next/link";
import useSWR from "swr";
import { Flag } from "@/components/Flag";
import { LocalTime } from "@/components/LocalTime";
import { PushButton } from "@/components/PushButton";
import { jsonFetcher } from "@/hooks/fetcher";
import { useFollowedTeams } from "@/hooks/useFollowedTeams";
import { useMounted } from "@/hooks/useMounted";
import { statusKind } from "@/lib/format";
import { teamName } from "@/lib/team-meta";
import type { Match, Sourced } from "@/lib/types";

export function FollowedStrip() {
  const mounted = useMounted();
  const { followed, toggle } = useFollowedTeams();
  const { data } = useSWR<Sourced<Match[]>>(mounted && followed.length ? "/api/matches" : null, jsonFetcher);

  if (!mounted) return null;

  if (!followed.length) {
    return (
      <section className="mx-auto max-w-shell px-4 pt-6">
        <div className="flex flex-wrap items-center justify-center gap-3 rounded-xl border border-dashed border-edge px-4 py-3 text-center text-xs text-dim">
          <span>
            ★ Follow teams on their page to pin their fixtures here.{" "}
            <Link href="/teams" className="text-pitch hover:underline">
              Browse teams →
            </Link>
          </span>
          <PushButton />
        </div>
      </section>
    );
  }

  const matches = data?.data ?? [];

  return (
    <section aria-label="Your teams" className="mx-auto max-w-shell px-4 pt-6">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-dim">★ Your Teams</h2>
        <PushButton />
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

          return (
            <div
              key={code}
              className="flex min-w-[210px] flex-col gap-1 rounded-xl border border-edge bg-panel px-3 py-2.5"
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
                  ✕
                </button>
              </div>
              {focus ? (
                <Link href={`/match/${focus.id}`} className="text-[11px] text-dim hover:text-ink">
                  {live ? <span className="font-semibold text-live">🔴 LIVE </span> : null}
                  vs {opp?.code ?? opp?.name ?? "TBD"} ·{" "}
                  {live ? (
                    <span>
                      {focus.score.home ?? 0}–{focus.score.away ?? 0}
                    </span>
                  ) : (
                    <LocalTime iso={focus.utcDate} style="weekday" />
                  )}
                </Link>
              ) : (
                <span className="text-[11px] text-dim">No upcoming fixtures</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
