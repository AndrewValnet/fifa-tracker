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
import { getAllMatches, getLiveMatches, getScorers, getStandings } from "@/lib/data";
import { statusKind } from "@/lib/format";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function HeroLoader() {
  const [live, all] = await Promise.all([getLiveMatches(), getAllMatches()]);
  const upcoming = { ...all, data: all.data.filter((m) => statusKind(m.status) === "upcoming") };
  return <HeroSection initialLive={live} initialUpcoming={upcoming} />;
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
      <div className="rounded-xl border border-edge bg-panel px-4 py-2">
        <TopScorers scorers={scorers.data} />
      </div>
    </>
  );
}

function HeroSkeleton() {
  return (
    <section className="pitch-bg border-b border-edge">
      <div className="mx-auto max-w-shell px-4 pb-8 pt-6 md:pt-10">
        <div className="skeleton mb-6 h-9 w-72" aria-hidden />
        <div className="skeleton h-72 w-full rounded-2xl" aria-hidden />
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

      <section aria-label="Title race" className="mx-auto max-w-shell px-4 pt-10">
        <SectionHeader title="Title Race" right="Polymarket — odds to win it all" />
        <div className="rounded-xl border border-edge bg-panel p-4">
          <FavoritesPanel />
        </div>
      </section>

      <section aria-label="Betting buzz" className="mx-auto max-w-shell px-4 pt-8">
        <SectionHeader title="Betting Buzz" right="biggest &amp; weirdest markets · Polymarket" />
        <div className="rounded-xl border border-edge bg-panel p-4">
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
