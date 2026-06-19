"use client";

// Match centrepiece (PRD §7.2). The server passes initial data + squads +
// stats; this component keeps the match alive with 30s polling, pulls ESPN
// enrichment (stats, confirmed lineups, attendance) at 45s while live, and
// renders pre/live/post states.

import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense } from "react";
import { CountdownTimer } from "@/components/CountdownTimer";
import { MatchFaceoffBanner } from "@/components/MatchFaceoffBanner";
import { DataFreshness } from "@/components/DataFreshness";
import { EmptyState } from "@/components/EmptyState";
import { EventTimeline } from "@/components/EventTimeline";
import { Flag } from "@/components/Flag";
import { FormationDiagram, pickPredictedXI, type FormationPlayer } from "@/components/FormationDiagram";
import { BetsPanel } from "@/components/BetsPanel";
import { GoalBanner } from "@/components/GoalBanner";
import {
  HeadToHeadSkeleton,
  LineupsSkeleton,
  NewsListSkeleton,
  OddsPanelSkeleton,
  SquadSideSkeleton,
  StatsSkeleton,
} from "@/components/LoadingSkeletons";
import { LocalTime } from "@/components/LocalTime";
import { MatchNotificationSettings } from "@/components/MatchNotificationSettings";
import { MatchPredictionWidget } from "@/components/MatchPredictionWidget";
import { MatchDominanceChart } from "@/components/MatchDominanceChart";
import { MatchStatsPanel } from "@/components/MatchStatsPanel";
import { ReactionsBar } from "@/components/ReactionsBar";
import { Scoreboard } from "@/components/Scoreboard";
import { SectionHeader } from "@/components/SectionHeader";
import { SourceTag } from "@/components/SourceTag";
import { StatComparison } from "@/components/StatComparison";
import { TeamColorProvider } from "@/components/TeamColorProvider";
import { VenueCard } from "@/components/VenueCard";
import { WeatherWidget } from "@/components/WeatherWidget";
import { WhereToWatch } from "@/components/WhereToWatch";
import { useLiveMatch } from "@/hooks/useLiveMatch";
import { useMatchExtras } from "@/hooks/useMatchExtras";
import { fmtNumber, stageLabel, statusKind } from "@/lib/format";
import { matchPlayerByName, type EspnRosterPlayer } from "@/lib/espn";
import { reconcileMatchScoreFromEvents } from "@/lib/match-score";
import { getAccentColor } from "@/lib/team-meta";
import type { Match, Scorer, Sourced, Stadium, TeamDetail, TeamSeasonStats } from "@/lib/types";

// Lazy-load the heavy, below-the-fold client leaves so they don't ship in the
// initial match-page bundle (ssr:false is allowed inside this client component).
const AudiencePanel = dynamic(() => import("@/components/AudiencePanel").then((m) => m.AudiencePanel), { ssr: false });
const HeadToHead = dynamic(() => import("@/components/HeadToHead").then((m) => m.HeadToHead), {
  ssr: false,
  loading: () => <HeadToHeadSkeleton />,
});
const LineupSection = dynamic(() => import("@/components/LineupSection").then((m) => m.LineupSection), {
  ssr: false,
  loading: () => <LineupsSkeleton />,
});
const MatchNews = dynamic(() => import("@/components/MatchNews").then((m) => m.MatchNews), {
  ssr: false,
  loading: () => <NewsListSkeleton />,
});
const OddsPanel = dynamic(() => import("@/components/OddsPanel").then((m) => m.OddsPanel), {
  ssr: false,
  loading: () => <OddsPanelSkeleton />,
});
const SquadSection = dynamic(() => import("@/components/SquadSection").then((m) => m.SquadSection), {
  ssr: false,
  loading: () => <SquadSideSkeleton />,
});
const WinProbGraph = dynamic(() => import("@/components/WinProbGraph").then((m) => m.WinProbGraph), {
  ssr: false,
  loading: () => <div className="skeleton h-56 w-full rounded-xl" aria-hidden />,
});
const MatchBanterBoard = dynamic(() => import("@/components/MatchBanterBoard").then((m) => m.MatchBanterBoard), { ssr: false });
const MatchMomentumGraph = dynamic(() => import("@/components/MatchMomentumGraph").then((m) => m.MatchMomentumGraph), { ssr: false });
const ShotQualityChart = dynamic(() => import("@/components/ShotQualityChart").then((m) => m.ShotQualityChart), { ssr: false });
const MatchRatingWidget = dynamic(() => import("@/components/MatchRatingWidget").then((m) => m.MatchRatingWidget), { ssr: false });

function TeamHeader({
  match,
  side,
  detail,
}: {
  match: Match;
  side: "home" | "away";
  detail: TeamDetail | null;
}) {
  const team = side === "home" ? match.homeTeam : match.awayTeam;
  const label = side === "home" ? match.homeLabel : match.awayLabel;
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Flag code={team?.code} name={team?.name ?? label} width={160} />
      <div>
        <p
          className="font-display text-2xl font-bold uppercase leading-tight tracking-wide md:text-3xl"
          style={{ color: `var(--${side}-color)` }}
        >
          {team?.code ? (
            <Link href={`/teams/${team.code}`} className="hover:underline underline-offset-4">
              {team.name}
            </Link>
          ) : (
            team?.name ?? label ?? "TBD"
          )}
        </p>
        {detail?.coach?.name ? (
          <p className="mt-1 text-xs text-dim">🧑‍💼 {detail.coach.name}</p>
        ) : null}
      </div>
    </div>
  );
}

function Card({
  id,
  title,
  right,
  children,
}: {
  id?: string;
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="surface-card min-w-0 scroll-mt-24 rounded-2xl p-4 md:p-5">
      <SectionHeader title={title} right={right} />
      {children}
    </section>
  );
}

function espnPositionBucket(abbr: string | null): "GK" | "DEF" | "MID" | "FWD" | null {
  const a = (abbr ?? "").toUpperCase();
  if (a === "GK") return "GK";
  if (/^(CB|LB|RB|LWB|RWB|SW|DF|WB|D)$/.test(a)) return "DEF";
  if (/^(CM|CAM|CDM|LM|RM|MF|AM|DM|M)$/.test(a)) return "MID";
  if (/^(CF|ST|LW|RW|SS|FW|ATT|F|W)$/.test(a)) return "FWD";
  return null;
}

function predictedFor(
  detail: TeamDetail | null,
  roster: EspnRosterPlayer[],
  teamCode: string | null,
): FormationPlayer[] | null {
  const fromFd = !!detail?.squad.length;
  // Fall back to ESPN roster when football-data has no squad
  const sourceSquad = fromFd
    ? detail!.squad
    : roster.map((p) => ({
        id: p.espnId,
        name: p.name,
        position: espnPositionBucket(p.positionAbbr),
        positionDetail: p.positionAbbr,
        shirtNumber: p.jersey,
        nationality: null,
        dateOfBirth: null,
      }));

  if (!sourceSquad.length) return null;
  const xi = pickPredictedXI(sourceSquad);
  if (!xi.length) return null;

  return xi.map((p) => {
    const espn = fromFd
      ? (roster.length ? matchPlayerByName(p.name, roster) : null)
      : roster.find((r) => r.espnId === p.id) ?? null;
    return {
      name: p.name,
      shirtNumber: p.shirtNumber ?? espn?.jersey ?? null,
      positionDetail: p.positionDetail,
      image: espn?.headshot ?? null,
      href: espn ? `/players/${espn.espnId}${teamCode ? `?team=${teamCode}` : ""}` : null,
    };
  });
}

export function MatchView({
  initial,
  homeDetail,
  awayDetail,
  homeStats,
  awayStats,
  stadium,
  scorers,
  homeRoster,
  awayRoster,
}: {
  initial: Sourced<Match>;
  homeDetail: TeamDetail | null;
  awayDetail: TeamDetail | null;
  homeStats: TeamSeasonStats | null;
  awayStats: TeamSeasonStats | null;
  stadium: Stadium | null;
  scorers: Scorer[];
  homeRoster: EspnRosterPlayer[];
  awayRoster: EspnRosterPlayer[];
}) {
  const { match: polled, source, fetchedAt } = useLiveMatch(initial.data.id, initial);
  const match = polled ?? initial.data;
  const kind = statusKind(match.status);
  const kickoffMs = new Date(match.utcDate).getTime();
  const extrasEnabled =
    kind === "live" ||
    kind === "finished" ||
    (Date.now() > kickoffMs - 2 * 3600_000 && Date.now() < kickoffMs + 3 * 3600_000);
  const { extras, ticket, isLoading: extrasLoading } = useMatchExtras(
    match.id,
    kind === "live",
    kind === "finished",
    extrasEnabled,
  );
  const liveEvents = extras?.timeline?.length ? extras.timeline : (match.events ?? []);
  const displayMatch = reconcileMatchScoreFromEvents(match, liveEvents);

  const referee = displayMatch.referees.find((r) => /referee/i.test(r.role)) ?? displayMatch.referees[0];
  const confirmedLineups = extras?.lineups.home?.players.length && extras?.lineups.away?.players.length;
  const homeXI = confirmedLineups ? null : predictedFor(homeDetail, homeRoster, match.homeTeam?.code ?? null);
  const awayXI = confirmedLineups ? null : predictedFor(awayDetail, awayRoster, match.awayTeam?.code ?? null);
  const matchFetchedAt = fetchedAt ?? initial.fetchedAt;
  const sectionLinks = [
    { href: "#your-pick", label: "Your Pick", show: true },
    { href: "#events", label: "Events", show: kind !== "upcoming" },
    { href: "#lineups", label: confirmedLineups ? "Lineups" : "Predicted XI", show: true },
    { href: "#squads", label: "Squads", show: Boolean(homeDetail || awayDetail) },
    { href: "#match-stats", label: "Stats", show: true },
    { href: "#past-matches", label: "Past Matches", show: true },
  ].filter((link) => link.show);

  return (
    <TeamColorProvider homeCode={displayMatch.homeTeam?.code} awayCode={displayMatch.awayTeam?.code}>
      <GoalBanner match={displayMatch} />
      <div className="team-gradient min-h-dvh">
        <div className="mx-auto max-w-shell px-4 py-6">
          {/* breadcrumb + stage */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2 text-xs text-dim">
            <Link href="/" className="hover:text-ink">
              ← War Room
            </Link>
            <span className="flex items-center gap-2">
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 font-mono uppercase tracking-wider shadow-inner shadow-black/20">
                {stageLabel(match.stage, match.group)}
                {match.matchday && match.stage === "GROUP_STAGE" ? ` · MD${match.matchday}` : ""}
              </span>
              <SourceTag source={source ?? initial.source} />
              <DataFreshness
                source={source ?? initial.source}
                fetchedAt={matchFetchedAt}
                prefix={kind === "live" ? "Live source" : "Match source"}
              />
            </span>
          </div>

          {/* header: teams + scoreboard */}
          <header className="premium-border surface-glass relative overflow-hidden rounded-[2rem] px-4 py-7 md:px-8">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-8 top-0 h-1 rounded-b-full bg-gradient-to-r from-[var(--home-color)] via-sky to-[var(--away-color)]"
            />
            <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_auto_1fr] md:gap-10">
            <TeamHeader match={displayMatch} side="home" detail={homeDetail} />

            <div className="order-first flex min-w-[220px] flex-col items-center gap-3 md:order-none md:min-w-[280px]">
              <div className="text-center text-xs text-dim">
                {stadium ? (
                  <p>
                    🏟️ {stadium.name} · {stadium.city}
                  </p>
                ) : displayMatch.venue ? (
                  <p>🏟️ {displayMatch.venue}</p>
                ) : null}
                <p>
                  <LocalTime iso={displayMatch.utcDate} style="datetime" />
                </p>
                {referee ? (
                  <p>
                    👤 Referee: {referee.name}
                    {referee.nationality ? ` (${referee.nationality})` : ""}
                  </p>
                ) : null}
                {kind === "upcoming" && displayMatch.stadiumId ? (
                  <WeatherWidget stadiumId={displayMatch.stadiumId} utcDate={displayMatch.utcDate} />
                ) : null}
                {extras?.attendance ? <p>🎟️ Attendance: {fmtNumber(extras.attendance)}</p> : null}
                {ticket?.averagePrice ? (
                  <p>
                    💵 Avg resale ticket: ${Math.round(ticket.averagePrice)}
                    {ticket.lowestPrice ? ` (from $${Math.round(ticket.lowestPrice)})` : ""}
                    {ticket.url ? (
                      <>
                        {" "}
                        <a href={ticket.url} target="_blank" rel="noopener noreferrer" className="text-pitch hover:underline">
                          SeatGeek ↗
                        </a>
                      </>
                    ) : null}
                  </p>
                ) : null}
              </div>

              {kind === "upcoming" ? (
                <MatchFaceoffBanner
                  match={displayMatch}
                  homeDetail={homeDetail}
                  awayDetail={awayDetail}
                  liveClock={extras?.liveClock ?? null}
                />
              ) : null}
              {kind === "upcoming" ? (
                <>
                  <CountdownTimer targetIso={displayMatch.utcDate} />
                  <p className="text-[10px] uppercase tracking-[0.25em] text-dim">to kickoff</p>
                </>
              ) : (
                <Scoreboard match={displayMatch} accurateClock={extras?.liveClock ?? null} />
              )}
              {extras?.coolingBreakActive ? (
                <p className="animate-pulse-dot rounded-full border border-gold/50 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
                  🥤 Hydration break in progress
                </p>
              ) : null}
            </div>

            <TeamHeader match={displayMatch} side="away" detail={awayDetail} />
            </div>
          </header>

          <ReactionsBar matchId={displayMatch.id} />
          <MatchNotificationSettings
            matchId={displayMatch.id}
            homeCode={displayMatch.homeTeam?.code}
            awayCode={displayMatch.awayTeam?.code}
          />

          <div className="mt-6">
            <Card id="your-pick" title="Office Prediction">
              <MatchPredictionWidget match={displayMatch} />
            </Card>
          </div>

          {sectionLinks.length ? (
            <nav
              aria-label="Match sections"
              className="surface-glass sticky top-0 z-30 -mx-4 mt-6 rounded-none border-x-0 px-4 py-2 md:static md:mx-0 md:rounded-2xl md:border md:p-2"
            >
              <div className="flex snap-x gap-2 overflow-x-auto pb-0.5 md:flex-wrap md:justify-center md:overflow-visible">
                {sectionLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="shrink-0 snap-start whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-dim transition hover:border-pitch/60 hover:bg-pitch/10 hover:text-ink"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </nav>
          ) : null}

          {/* content grid */}
          <div className="mt-10 grid min-w-0 gap-6 lg:grid-cols-3">
            <div className="min-w-0 flex flex-col gap-6 lg:col-span-2">
              {kind !== "upcoming" ? (
                <Card id="events" title="Match Events" right={<span>tap a scorer for clips</span>}>
                  <EventTimeline events={liveEvents} match={displayMatch} />
                  {extras && (extras.addedTime.firstHalf !== null || extras.addedTime.secondHalf !== null) ? (
                    <p className="mt-3 border-t border-edge/50 pt-2 text-[11px] text-dim">
                      ⏱ Added time —
                      {extras.addedTime.firstHalf !== null ? ` 1st half +${extras.addedTime.firstHalf}’` : ""}
                      {extras.addedTime.firstHalf !== null && extras.addedTime.secondHalf !== null ? " ·" : ""}
                      {extras.addedTime.secondHalf !== null ? ` 2nd half +${extras.addedTime.secondHalf}’` : ""}
                    </p>
                  ) : null}
                  {extras?.videos.length ? (
                    <div className="mt-4 border-t border-edge/50 pt-3">
                      <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-dim">
                        📺 Clips &amp; reactions (ESPN)
                      </h4>
                      <ul className="flex flex-col gap-1 text-sm">
                        {extras.videos.slice(0, 6).map((v) =>
                          v.href ? (
                            <li key={v.headline}>
                              <a
                                href={v.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-pitch underline-offset-2 hover:underline"
                              >
                                {v.headline} ↗
                              </a>
                            </li>
                          ) : (
                            <li key={v.headline} className="text-dim">
                              {v.headline}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  ) : null}
                </Card>
              ) : null}

              {(kind === "live" || kind === "finished") ? (
                <section aria-label="Match momentum">
                  <SectionHeader title="Match Momentum" />
                  <MatchMomentumGraph
                    events={liveEvents}
                    homeCode={displayMatch.homeTeam?.code ?? null}
                    awayCode={displayMatch.awayTeam?.code ?? null}
                    homeScore={displayMatch.score?.home ?? null}
                    awayScore={displayMatch.score?.away ?? null}
                    isLive={statusKind(displayMatch.status) === "live"}
                  />
                </section>
              ) : null}

              {kind !== "upcoming" ? <WinProbGraph match={displayMatch} /> : null}

              {confirmedLineups ? (
                <Card id="lineups" title={kind === "upcoming" ? "Starting Lineups" : "Lineups"} right="confirmed · via ESPN">
                  <LineupSection match={displayMatch} home={extras!.lineups.home!} away={extras!.lineups.away!} />
                </Card>
              ) : homeXI || awayXI ? (
                <Card id="lineups" title="Predicted XI" right="squad-based projection — confirmed lineups appear ~1h before kickoff">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {homeXI ? (
                      <FormationDiagram
                        formation="4-3-3"
                        players={homeXI}
                        color={getAccentColor(match.homeTeam?.code)}
                        label={`${match.homeTeam?.name ?? "Home"} — predicted`}
                      />
                    ) : null}
                    {awayXI ? (
                      <FormationDiagram
                        formation="4-3-3"
                        players={awayXI}
                        color={getAccentColor(match.awayTeam?.code)}
                        label={`${match.awayTeam?.name ?? "Away"} — predicted`}
                      />
                    ) : null}
                  </div>
                </Card>
              ) : (
                <Card id="lineups" title="Lineups">
                  <EmptyState
                    title="Lineups are not published yet."
                    description="Lineups usually appear about 1 hour before kickoff. We will keep checking ESPN and the team feeds."
                  />
                </Card>
              )}

              {homeDetail || awayDetail ? (
                <Card id="squads" title="Squads">
                  <div className="grid gap-6 md:grid-cols-2">
                    {homeDetail ? (
                      <SquadSection team={homeDetail} scorers={scorers} rosterIndex={homeRoster} />
                    ) : (
                      <div />
                    )}
                    {awayDetail ? (
                      <SquadSection team={awayDetail} scorers={scorers} rosterIndex={awayRoster} />
                    ) : (
                      <div />
                    )}
                  </div>
                </Card>
              ) : null}

              <Card id="past-matches" title="Past Matches / Head to Head">
                <HeadToHead
                  homeCode={displayMatch.homeTeam?.code}
                  awayCode={displayMatch.awayTeam?.code}
                  homeName={displayMatch.homeTeam?.name ?? "Home"}
                  awayName={displayMatch.awayTeam?.name ?? "Away"}
                />
              </Card>

              {kind === "finished" ? (
                <Card title="Rate This Match">
                  <MatchRatingWidget matchId={displayMatch.id} status={displayMatch.status} />
                </Card>
              ) : null}

              <Suspense fallback={null}>
                <section aria-label="Match chat">
                  <MatchBanterBoard matchId={displayMatch.id} />
                </section>
              </Suspense>
            </div>

            <aside className="min-w-0 flex flex-col gap-6">
              <Card title="Audience" right={kind === "live" ? "live" : undefined}>
                <AudiencePanel match={displayMatch} />
              </Card>

              <Card title="Polymarket Odds">
                <OddsPanel match={displayMatch} />
              </Card>

              <BetsPanel matchId={displayMatch.id} />

              <Card title="Where to Watch">
                <WhereToWatch />
              </Card>

              <Card
                id="match-stats"
                title="Match Stats"
                right={
                  extras?.updated ? (
                    <DataFreshness sourceName="ESPN" fetchedAt={extras.updated} prefix="Stats from" separator="" />
                  ) : (
                    "ESPN"
                  )
                }
              >
                {extrasLoading && !extras ? (
                  <StatsSkeleton />
                ) : extras?.stats ? (
                  <MatchStatsPanel
                    home={extras.stats.home}
                    away={extras.stats.away}
                    homeName={displayMatch.homeTeam?.code ?? "Home"}
                    awayName={displayMatch.awayTeam?.code ?? "Away"}
                  />
                ) : (
                  <EmptyState
                    title="Stats are not published yet."
                    description="Stats appear once ESPN publishes match data. This section will update automatically when they arrive."
                  />
                )}
              </Card>

              {extras?.stats ? (
                <Card title="Possession &amp; Shots">
                  <MatchDominanceChart
                    homeStats={extras.stats.home}
                    awayStats={extras.stats.away}
                    homeScore={displayMatch.score?.home ?? null}
                    awayScore={displayMatch.score?.away ?? null}
                    homeCode={displayMatch.homeTeam?.code ?? null}
                    awayCode={displayMatch.awayTeam?.code ?? null}
                  />
                </Card>
              ) : null}

              {extras?.stats ? (
                <Card title="Shot Quality">
                  <ShotQualityChart
                    homeCode={displayMatch.homeTeam?.code ?? null}
                    awayCode={displayMatch.awayTeam?.code ?? null}
                    homeStats={extras.stats.home}
                    awayStats={extras.stats.away}
                  />
                </Card>
              ) : null}

              {homeStats && awayStats ? (
                <Card id="tournament-form" title="Tournament Form">
                  <StatComparison
                    home={homeStats}
                    away={awayStats}
                    homeName={displayMatch.homeTeam?.code ?? "Home"}
                    awayName={displayMatch.awayTeam?.code ?? "Away"}
                  />
                </Card>
              ) : null}

              <Card title="Match News">
                <MatchNews home={displayMatch.homeTeam?.name ?? null} away={displayMatch.awayTeam?.name ?? null} />
              </Card>

              {stadium ? (
                <section aria-label="Venue">
                  <SectionHeader title="Venue" />
                  <VenueCard stadium={stadium} />
                </section>
              ) : null}
            </aside>
          </div>

        </div>
      </div>
    </TeamColorProvider>
  );
}
