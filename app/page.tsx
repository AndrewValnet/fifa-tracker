// Home — the war room (PRD §7.1). The shell + client islands (hero, totals,
// today, news) paint immediately; the server-fetched standings, scorers and the
// seeded hero stream in via Suspense so TTFB never waits on the slowest API.

import { Suspense } from "react";
import Link from "next/link";
import { BetsBuzzPanel } from "@/components/BetsBuzzPanel";
import { FavoritesPanel } from "@/components/FavoritesPanel";
import { MustWatchPanel } from "@/components/MustWatchPanel";
import { FollowedStrip } from "@/components/FollowedStrip";
import { HeroSection } from "@/components/HeroSection";
import { NewsFeed } from "@/components/NewsFeed";
import { OfflineNotice } from "@/components/OfflineNotice";
import { SectionHeader } from "@/components/SectionHeader";
import { SourceTag } from "@/components/SourceTag";
import { StandingsAccordion } from "@/components/StandingsAccordion";
import { TodayStrip } from "@/components/TodayStrip";
import { TopScorers } from "@/components/TopScorers";
import { TotalsBanner } from "@/components/TotalsBanner";
import { PlayerHeadshot } from "@/components/PlayerHeadshot";
import { getPlayerData, getTeamRosterIndex } from "@/lib/data";
import { usageSnapshot } from "@/lib/cache";
import { slimSourcedMatches } from "@/lib/cache-policy";
import { getAllMatches, getLiveMatches, getScorers, getStandings } from "@/lib/data";
import { statusKind } from "@/lib/format";
import { getAccentColor, getTeamColors, teamName } from "@/lib/team-meta";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function HeroLoader() {
  const [live, all] = await Promise.all([getLiveMatches(), getAllMatches()]);
  const upcoming = { ...all, data: all.data.filter((m) => statusKind(m.status) === "upcoming") };
  return <HeroSection initialLive={slimSourcedMatches(live, { keepEvents: true })} initialUpcoming={slimSourcedMatches(upcoming)} />;
}

async function StandingsLoader() {
  const standings = await getStandings();
  return (
    <>
      <SectionHeader
        title="Groups"
        right={
          <span className="flex items-center gap-2">
            <SourceTag source={standings.source} />
            <Link href="/standings" className="text-pitch hover:underline">
              Full tables →
            </Link>
          </span>
        }
      />
      <StandingsAccordion standings={standings.data} />
    </>
  );
}

async function ScorersLoader() {
  const scorers = await getScorers(10);
  return (
    <>
      <SectionHeader title="Golden Boot" right={<SourceTag source={scorers.source} />} />
      <div className="surface-card rounded-2xl px-4 py-2">
        <TopScorers scorers={scorers.data} />
      </div>
    </>
  );
}

async function PlayerSpotlightLoader() {
  const [scorers, usage] = await Promise.all([getScorers(1), usageSnapshot()]);
  const top = scorers.data[0];
  if (!top) {
    return (
      <section className="surface-card rounded-2xl p-4">
        <SectionHeader title="Player Spotlight" right={<SourceTag source={scorers.source} />} />
        <p className="text-sm text-dim">No player data is ready yet.</p>
      </section>
    );
  }

  const teamCode = top.team.code;
  const roster = teamCode ? await getTeamRosterIndex(teamCode) : [];
  const match = roster.find((player) => player.name.toLowerCase() === top.player.toLowerCase()) ?? null;
  const playerData = match ? await getPlayerData(match.espnId, teamCode) : null;
  const bio = playerData?.bio;
  const colors = getTeamColors(teamCode);
  const accent = getAccentColor(teamCode);
  const team = teamName(teamCode) ?? top.team.name;
  const matchesPlayed = playerData?.totals.appearances ?? 0;
  const goals = playerData?.totals.goals ?? top.goals;
  const assists = playerData?.totals.assists ?? (top.assists ?? 0);
  const minutes = playerData?.minutesTotal ?? null;
  const freshness = usage.remoteCacheEnabled ? "Cached" : "Local cache";
  const freshnessDetail = usage.remoteCacheEnabled
    ? `Serving cached data to keep us within API limits.`
    : "Redis is unavailable, so the dashboard is using the in-memory cache.";

  return (
    <section className="premium-border surface-glass overflow-hidden rounded-[2rem]">
      <div
        className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]"
        style={{
          background:
            `linear-gradient(135deg, color-mix(in srgb, ${accent} 18%, transparent), rgba(8,12,24,0.6) 48%, color-mix(in srgb, ${colors.secondary} 16%, transparent))`,
        }}
      >
        <div className="relative overflow-hidden px-5 py-5 md:px-7 md:py-7">
          <SectionHeader title="Player Spotlight" right={<SourceTag source={scorers.source} />} />
          <div className="mt-3 flex items-start gap-4">
            <PlayerHeadshot
              src={bio?.headshot ?? match?.headshot ?? null}
              name={top.player}
              size={96}
              colors={colors}
              className="ring-4 ring-black/25"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.3em] text-pitch">Hot right now</p>
              <h3 className="mt-1 font-display text-3xl font-black uppercase leading-none tracking-wide text-ink">
                {top.player}
              </h3>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-dim">
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-ink">
                  {team}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                  {bio?.position ?? match?.positionAbbr ?? "Player"}
                </span>
                {matchesPlayed > 0 ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                    {matchesPlayed} apps
                  </span>
                ) : null}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
              <p className="font-display text-2xl font-bold text-gold">{goals}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-dim">Goals</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
              <p className="font-display text-2xl font-bold text-pitch">{assists}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-dim">Assists</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
              <p className="font-display text-2xl font-bold text-sky">{minutes ?? "—"}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-dim">Minutes</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-xs text-dim">
            <span className="rounded-full border border-pitch/25 bg-pitch/10 px-3 py-1.5 text-pitch">
              Top scorer spotlight
            </span>
            {bio?.height ? <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">{bio.height}</span> : null}
            {bio?.citizenship ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">{bio.citizenship}</span>
            ) : null}
          </div>
        </div>

        <div className="border-t border-white/10 px-5 py-5 lg:border-l lg:border-t-0 md:px-7 md:py-7">
          <p className="text-[10px] uppercase tracking-[0.3em] text-dim">Why he’s here</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-ink/90">
            {bio
              ? `The current tournament data has ${top.player} leading the scoring race for ${team}. The profile below comes from ESPN roster and match data, with cached freshness so it loads fast.`
              : `The current tournament data has ${top.player} leading the scoring race for ${team}. We’re showing the tournament numbers first, then the page can drill into the full profile once the roster match resolves.`}
          </p>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/15 p-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-dim">Profile status</p>
            <p className="mt-1 font-display text-xl font-bold uppercase tracking-wide text-ink">
              {bio ? "Full player profile ready" : "Tournament summary available"}
            </p>
            <p className="mt-2 text-sm text-dim">{freshnessDetail}</p>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-dim">Data freshness</p>
                <p className="mt-0.5 font-semibold text-ink">{freshness}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-dim">API posture</p>
                <p className="mt-0.5 font-semibold text-pitch">Cache-first</p>
              </div>
            </div>
          </div>

          {bio ? (
            <Link
              href={`/players/${bio.espnId}${teamCode ? `?team=${teamCode}` : ""}`}
              prefetch={false}
              className="mt-5 inline-flex rounded-full bg-gradient-to-r from-pitch via-sky to-gold px-5 py-3 font-display text-sm font-bold uppercase tracking-wider text-navy shadow-lg shadow-pitch/20 transition hover:brightness-110"
            >
              Open full profile
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

async function CacheStatusLoader() {
  const usage = await usageSnapshot();
  const fdCalls = usage.upstream?.["football-data"]?.attempts ?? 0;
  const espnCalls = usage.upstream?.espn?.attempts ?? 0;
  const redisHits =
    Object.values(usage.cache ?? {}).reduce((sum, row) => sum + row.remoteHits + row.remoteStaleHits, 0) +
    (usage.remoteDaily?.["cache:football-data:remoteHits"] ?? 0) +
    (usage.remoteDaily?.["cache:espn:remoteHits"] ?? 0);
  const redisMisses =
    Object.values(usage.cache ?? {}).reduce((sum, row) => sum + row.remoteMisses, 0) +
    (usage.remoteDaily?.["cache:football-data:remoteMisses"] ?? 0) +
    (usage.remoteDaily?.["cache:espn:remoteMisses"] ?? 0);
  const hitRate = redisHits + redisMisses > 0 ? Math.round((redisHits / (redisHits + redisMisses)) * 100) : null;
  const payloadSkips = Object.values(usage.cache ?? {}).reduce((sum, row) => sum + row.remoteWriteSkips, 0);

  return (
    <section className="surface-card rounded-2xl p-4 md:p-5">
      <SectionHeader title="Staleness &amp; Cache Status" right="Why the dashboard looks fresh" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-black/15 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-dim">football-data calls</p>
          <p className="mt-2 font-display text-2xl font-bold text-ink">{fdCalls}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/15 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-dim">ESPN calls</p>
          <p className="mt-2 font-display text-2xl font-bold text-ink">{espnCalls}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/15 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-dim">Redis hit rate</p>
          <p className="mt-2 font-display text-2xl font-bold text-pitch">{hitRate !== null ? `${hitRate}%` : "n/a"}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/15 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-dim">Large payload skips</p>
          <p className="mt-2 font-display text-2xl font-bold text-gold">{payloadSkips}</p>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-dim">
        <span className="font-semibold text-ink">Cached</span> when possible, with live-source fallbacks only when needed.
        That keeps the page quick and saves API calls.
      </div>
    </section>
  );
}

function HeroSkeleton() {
  return (
    <section className="pitch-bg border-b border-white/10">
      <div className="mx-auto max-w-shell px-4 pb-8 pt-6 md:pt-10">
        <div className="skeleton mb-6 h-9 w-72" aria-hidden />
        <div className="skeleton h-72 w-full rounded-[2rem]" aria-hidden />
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <OfflineNotice />
      <Suspense fallback={<HeroSkeleton />}>
        <HeroLoader />
      </Suspense>
      <TotalsBanner />
      <FollowedStrip />
      <TodayStrip />

      <section aria-label="Must watch" className="mx-auto max-w-shell px-4 pt-8">
        <SectionHeader title="Must Watch" right="ranked by odds closeness · Polymarket" />
        <MustWatchPanel />
      </section>

      <section aria-label="Player spotlight" className="mx-auto max-w-shell px-4 pt-8">
        <PlayerSpotlightLoader />
      </section>

      <section aria-label="Cache status" className="mx-auto max-w-shell px-4 pt-8">
        <CacheStatusLoader />
      </section>

      <section aria-label="Title race" className="mx-auto max-w-shell px-4 pt-10">
        <SectionHeader title="Title Race" right="Polymarket — odds to win it all" />
        <div className="surface-card rounded-2xl p-4">
          <FavoritesPanel />
        </div>
      </section>

      <section aria-label="Betting buzz" className="mx-auto max-w-shell px-4 pt-8">
        <SectionHeader title="Betting Buzz" right="biggest &amp; weirdest markets · Polymarket" />
        <div className="surface-card rounded-2xl p-4">
          <BetsBuzzPanel />
        </div>
      </section>

      <div className="mx-auto grid max-w-shell gap-10 px-4 pt-10 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <NewsFeed />
        </div>

        <aside className="flex flex-col gap-10">
          <section aria-label="Group standings">
            <Suspense fallback={<div className="skeleton h-72 w-full" aria-hidden />}>
              <StandingsLoader />
            </Suspense>
          </section>

          <section aria-label="Top scorers">
            <Suspense fallback={<div className="skeleton h-64 w-full" aria-hidden />}>
              <ScorersLoader />
            </Suspense>
          </section>
        </aside>
      </div>
    </>
  );
}
