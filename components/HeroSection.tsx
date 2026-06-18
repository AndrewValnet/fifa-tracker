"use client";

// Home hero (PRD §7.1): live match war-room ticker when a game is in play,
// otherwise a countdown to the next kickoff. Fully themed in team colors.

import Link from "next/link";
import { ClipLink } from "@/components/ClipLink";
import { CountdownTimer } from "@/components/CountdownTimer";
import { DataFreshness } from "@/components/DataFreshness";
import { Flag } from "@/components/Flag";
import { GoalBanner } from "@/components/GoalBanner";
import { LiveBadge } from "@/components/LiveBadge";
import { LocalTime } from "@/components/LocalTime";
import { OddsBar } from "@/components/OddsBar";
import { Scoreboard } from "@/components/Scoreboard";
import { TeamColorProvider } from "@/components/TeamColorProvider";
import { useLiveMatch } from "@/hooks/useLiveMatch";
import { useLiveMatches, useUpcomingMatches } from "@/hooks/useFixtures";
import { useMatchOdds } from "@/hooks/useMatchOdds";
import { stageLabel, statusKind } from "@/lib/format";
import { getStadium } from "@/lib/schedule";
import type { Match, Sourced } from "@/lib/types";

function HeroTeam({ match, side }: { match: Match; side: "home" | "away" }) {
  const team = side === "home" ? match.homeTeam : match.awayTeam;
  const label = side === "home" ? match.homeLabel : match.awayLabel;
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Flag code={team?.code} name={team?.name ?? label} width={120} className="md:!h-[120px] md:!w-[160px]" />
      <p
        className="max-w-[180px] font-display text-xl font-semibold uppercase leading-tight tracking-wide md:text-2xl"
        style={{ color: `var(--${side}-color)` }}
      >
        {team?.name ?? label ?? "TBD"}
      </p>
    </div>
  );
}

function HeroOdds({ match }: { match: Match }) {
  const { odds } = useMatchOdds(match.id);
  if (!odds || odds.kind !== "match") return null;
  return (
    <div className="mx-auto mt-5 w-full max-w-md">
      <OddsBar
        home={odds.home}
        draw={odds.draw}
        away={odds.away}
        homeLabel={match.homeTeam?.code ?? "Home"}
        awayLabel={match.awayTeam?.code ?? "Away"}
      />
      <p className="mt-1 text-center text-[10px] text-dim">Polymarket implied probabilities</p>
    </div>
  );
}

function FeaturedMatch({
  match,
  live,
}: {
  match: Match;
  live: boolean;
}) {
  const stadium = getStadium(match.stadiumId);
  const recentGoals = match.events.filter((e) => e.type === "GOAL").slice(-3).reverse();

  return (
    <TeamColorProvider homeCode={match.homeTeam?.code} awayCode={match.awayTeam?.code}>
      {live ? <GoalBanner match={match} /> : null}
      <div className="team-gradient premium-border surface-glass relative overflow-hidden rounded-[2rem] px-4 py-8 md:px-10">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 h-1 rounded-b-full bg-gradient-to-r from-[var(--home-color)] via-sky to-[var(--away-color)]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-32 w-2/3 -translate-x-1/2 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_62%)]"
        />
        <p className="mb-6 text-center text-xs uppercase tracking-[0.3em] text-dim">
          {live ? "Live from" : "Next match"} · {stadium ? `${stadium.name}, ${stadium.city}` : "World Cup 2026"}
        </p>

        <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-[1fr_auto_1fr] md:gap-8">
          <HeroTeam match={match} side="home" />

          <div className="flex min-w-[150px] flex-col items-center gap-2 md:min-w-[260px]">
            {live ? (
              <Scoreboard match={match} />
            ) : (
              <>
                <p className="font-mono text-xs uppercase tracking-widest text-dim">
                  {stageLabel(match.stage, match.group)}
                </p>
                <CountdownTimer targetIso={match.utcDate} />
                <LocalTime iso={match.utcDate} style="datetime" className="text-sm text-dim" />
              </>
            )}
          </div>

          <HeroTeam match={match} side="away" />
        </div>

        {live && recentGoals.length ? (
          <ul className="mx-auto mt-5 flex max-w-md flex-col gap-1 text-center text-sm text-dim">
            {recentGoals.map((g, i) => (
              <li key={`${g.minute}-${g.player}-${i}`}>
                <span aria-hidden>⚽</span> {g.minute}’{" "}
                <ClipLink
                  player={g.player}
                  home={match.homeTeam?.name ?? "Home"}
                  away={match.awayTeam?.name ?? "Away"}
                />
                {g.secondary ? <span className="text-dim/70"> ({g.secondary})</span> : null}
              </li>
            ))}
          </ul>
        ) : null}

        <HeroOdds match={match} />

        <div className="mt-6 text-center">
          <Link
            href={`/match/${match.id}`}
            prefetch={false}
            className="inline-block rounded-full bg-gradient-to-r from-pitch via-sky to-gold px-6 py-2.5 font-display text-sm font-semibold uppercase tracking-wider text-navy shadow-xl shadow-pitch/20 transition-transform hover:scale-105"
          >
            {live ? "Open match centre" : "Match preview"}
          </Link>
        </div>
      </div>
    </TeamColorProvider>
  );
}

export function HeroSection({
  initialLive,
  initialUpcoming,
}: {
  initialLive?: Sourced<Match[]>;
  initialUpcoming?: Sourced<Match[]>;
}) {
  const liveState = useLiveMatches(initialLive);
  const upcomingState = useUpcomingMatches(initialUpcoming);
  const { matches: live } = liveState;
  const { matches: upcoming } = upcomingState;

  const featured = live[0] ?? upcoming[0] ?? null;
  const others = live.slice(1);
  const activeState = live.length ? liveState : upcomingState;
  const featuredLive = useLiveMatch(
    featured?.id ?? "",
    featured
        ? {
            data: featured,
            source: activeState.source ?? "demo",
            fetchedAt: activeState.fetchedAt ?? new Date().toISOString(),
            demo: activeState.demo ?? false,
          }
      : undefined,
  );
  const featuredMatch = featuredLive.match ?? featured;
  const featuredIsLive = featuredMatch ? statusKind(featuredMatch.status) === "live" : false;

  return (
    <section aria-label="Featured match" className="pitch-bg relative overflow-hidden border-b border-white/10">
      <div className="mx-auto max-w-shell px-4 pb-10 pt-6 md:pt-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <h1 className="hero-copy-gradient font-display text-4xl font-bold uppercase leading-none tracking-wide md:text-6xl">
            World Cup <span className="text-pitch">2026</span> War Room
          </h1>
          <div className="flex flex-col items-end gap-1 text-right">
            {live.length ? <LiveBadge /> : null}
            <DataFreshness
              source={activeState.source}
              fetchedAt={activeState.fetchedAt}
              prefix={live.length ? "Live source" : "Schedule source"}
            />
          </div>
        </div>

        {featured ? (
          <FeaturedMatch match={featuredMatch ?? featured} live={featuredIsLive} />
        ) : (
          <p className="surface-card rounded-2xl px-4 py-10 text-center text-dim">
            The tournament schedule is loading…
          </p>
        )}

        {others.length ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-dim">Also live:</span>
            {others.map((m) => (
              <Link
                key={m.id}
                href={`/match/${m.id}`}
                prefetch={false}
                className="rounded-full border border-live/40 bg-live/10 px-3 py-1.5 font-mono text-xs hover:bg-live/20"
              >
                {(m.homeTeam?.code ?? "TBD")} {m.score.home ?? "–"}:{m.score.away ?? "–"} {(m.awayTeam?.code ?? "TBD")}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
