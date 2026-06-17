"use client";

import { useMemo } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import { Flag } from "@/components/Flag";
import type { Match } from "@/lib/types";

interface FavoriteTeamsFeedProps {
  matches: Match[];
}

const MAX_SHOWN = 5;

function formatMatchDate(utcDate: string): string {
  try {
    const d = new Date(utcDate);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return utcDate;
  }
}

export function FavoriteTeamsFeed({ matches }: FavoriteTeamsFeedProps) {
  const { favorites } = useFavorites();

  const upcomingMatches = useMemo(() => {
    if (favorites.length === 0) return [];

    const favSet = new Set(favorites);

    return matches
      .filter((m) => {
        // Only upcoming/scheduled matches
        if (
          m.status !== "SCHEDULED" &&
          m.status !== "TIMED" &&
          m.status !== "IN_PLAY" &&
          m.status !== "PAUSED"
        ) {
          return false;
        }
        // Must involve at least one favorite team
        const homeCode = m.homeTeam?.code ?? null;
        const awayCode = m.awayTeam?.code ?? null;
        if (!homeCode && !awayCode) return false;
        return (
          (homeCode !== null && favSet.has(homeCode)) ||
          (awayCode !== null && favSet.has(awayCode))
        );
      })
      .sort((a, b) => {
        const ta = new Date(a.utcDate).getTime();
        const tb = new Date(b.utcDate).getTime();
        return ta - tb;
      })
      .slice(0, MAX_SHOWN);
  }, [matches, favorites]);

  // No favorites selected
  if (favorites.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-edge bg-panel/50 px-6 py-10 text-center">
        <p className="font-body text-sm text-dim">
          No favorite teams yet. Star a team to see their upcoming matches here.
        </p>
      </div>
    );
  }

  // Favorites selected but no upcoming matches
  if (upcomingMatches.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-edge bg-panel/50 px-6 py-10 text-center">
        <p className="font-body text-sm text-dim">
          No upcoming matches for your favorite teams right now.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {upcomingMatches.map((match) => {
        const home = match.homeTeam;
        const away = match.awayTeam;
        const isLive =
          match.status === "IN_PLAY" || match.status === "PAUSED";

        return (
          <div
            key={match.id}
            className="flex items-center gap-3 rounded-xl border border-edge bg-panel px-4 py-3 hover:border-edge/70 transition-colors duration-150"
          >
            {/* Live badge */}
            {isLive && (
              <span className="flex-shrink-0 rounded-full bg-live/15 px-2 py-0.5 text-[10px] font-display font-semibold text-live uppercase tracking-wider">
                Live
              </span>
            )}

            {/* Home team */}
            <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
              <span className="font-body text-sm text-ink truncate text-right">
                {home?.name ?? match.homeLabel ?? "TBD"}
              </span>
              {home && (
                <Flag code={home.code} name={home.name} width={24} />
              )}
            </div>

            {/* Score / VS */}
            <div className="flex-shrink-0 flex flex-col items-center min-w-[48px]">
              {isLive || match.status === "FINISHED" ? (
                <span className="font-mono text-sm font-semibold text-ink tabular-nums">
                  {match.score.home ?? 0} – {match.score.away ?? 0}
                </span>
              ) : (
                <span className="font-mono text-xs text-dim">vs</span>
              )}
              {match.status === "IN_PLAY" && match.minute !== null && (
                <span className="text-[10px] text-live font-semibold">
                  {match.minute}&apos;
                </span>
              )}
            </div>

            {/* Away team */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {away && (
                <Flag code={away.code} name={away.name} width={24} />
              )}
              <span className="font-body text-sm text-ink truncate">
                {away?.name ?? match.awayLabel ?? "TBD"}
              </span>
            </div>

            {/* Date */}
            {!isLive && (
              <span className="flex-shrink-0 text-[11px] text-dim text-right hidden sm:block whitespace-nowrap">
                {formatMatchDate(match.utcDate)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
