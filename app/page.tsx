// Home — the war room (PRD §7.1): hero, breaking news, today's matches,
// standings summary, top scorers. Server-rendered with live initial data,
// then client polling takes over.

import Link from "next/link";
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

export default async function HomePage() {
  const [live, all, standings, scorers] = await Promise.all([
    getLiveMatches(),
    getAllMatches(),
    getStandings(),
    getScorers(10),
  ]);

  const now = Date.now();
  const upcoming = {
    ...all,
    data: all.data.filter((m) => statusKind(m.status) === "upcoming"),
  };
  const today = {
    ...all,
    data: all.data.filter((m) => {
      const t = new Date(m.utcDate).getTime();
      return t >= now - 12 * 3600_000 && t <= now + 30 * 3600_000;
    }),
  };

  return (
    <>
      <OfflineNotice />
      <HeroSection initialLive={live} initialUpcoming={upcoming} />
      <TotalsBanner />
      <FollowedStrip />
      <TodayStrip initial={today} />

      <div className="mx-auto grid max-w-shell gap-10 px-4 pt-10 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <NewsFeed />
        </div>

        <aside className="flex flex-col gap-10">
          <section aria-label="Group standings">
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
          </section>

          <section aria-label="Top scorers">
            <SectionHeader
              title="Golden Boot"
              right={<SourceTag source={scorers.source} />}
            />
            <div className="rounded-xl border border-edge bg-panel px-4 py-2">
              <TopScorers scorers={scorers.data} />
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
