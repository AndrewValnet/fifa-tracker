"use client";

// Live scoreboard (PRD §7.2): giant score, ticking clock, pulsing LIVE badge.
// aria-live region announces score changes to screen readers (PRD §8.5).

import { LiveBadge } from "@/components/LiveBadge";
import { MatchClock } from "@/components/MatchClock";
import { statusKind } from "@/lib/format";
import type { Match } from "@/lib/types";

export function Scoreboard({ match, accurateClock }: { match: Match; accurateClock?: string | null }) {
  const kind = statusKind(match.status);
  const home = match.score.home;
  const away = match.score.away;
  const homeName = match.homeTeam?.name ?? match.homeLabel ?? "TBD";
  const awayName = match.awayTeam?.name ?? match.awayLabel ?? "TBD";

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {`${homeName} ${home ?? "no score"}, ${awayName} ${away ?? "no score"}${kind === "live" ? ", match in play" : ""}`}
      </div>

      {kind === "live" ? (
        <div className="flex items-center gap-3">
          <LiveBadge />
          <MatchClock match={match} accurate={accurateClock} className="text-lg font-semibold" />
        </div>
      ) : kind === "finished" ? (
        <span className="rounded-full border border-edge bg-panel2 px-3 py-1 font-mono text-xs font-bold tracking-widest text-dim">
          FULL TIME
        </span>
      ) : null}

      <div aria-hidden className="flex items-center gap-4 md:gap-7">
        <span
          key={`h${home}`}
          className="animate-score-pop font-display text-7xl font-bold leading-none tabular-nums md:text-8xl"
          style={{ textShadow: "0 0 34px color-mix(in srgb, var(--home-color) 50%, transparent)" }}
        >
          {home ?? "–"}
        </span>
        <span className="font-display text-5xl text-dim md:text-6xl">—</span>
        <span
          key={`a${away}`}
          className="animate-score-pop font-display text-7xl font-bold leading-none tabular-nums md:text-8xl"
          style={{ textShadow: "0 0 34px color-mix(in srgb, var(--away-color) 50%, transparent)" }}
        >
          {away ?? "–"}
        </span>
      </div>

      {match.score.halfTimeHome !== null &&
      match.score.halfTimeHome !== undefined &&
      kind !== "upcoming" ? (
        <p className="font-mono text-xs text-dim">
          HT {match.score.halfTimeHome}–{match.score.halfTimeAway}
        </p>
      ) : null}
    </div>
  );
}
