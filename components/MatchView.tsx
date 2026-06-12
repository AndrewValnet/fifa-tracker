"use client";

// Match centrepiece (PRD §7.2). The server passes initial data + squads +
// stats; this component keeps the match alive with 30s polling, pulls ESPN
// enrichment (stats, confirmed lineups, attendance) at 45s while live, and
// renders pre/live/post states.

import Link from "next/link";
import { CountdownTimer } from "@/components/CountdownTimer";
import { EventTimeline } from "@/components/EventTimeline";
import { Flag } from "@/components/Flag";
import { FormationDiagram, pickPredictedXI, type FormationPlayer } from "@/components/FormationDiagram";
import { GoalBanner } from "@/components/GoalBanner";
import { LineupSection } from "@/components/LineupSection";
import { LocalTime } from "@/components/LocalTime";
import { MatchNews } from "@/components/MatchNews";
import { MatchStatsPanel } from "@/components/MatchStatsPanel";
import { OddsPanel } from "@/components/OddsPanel";
import { Scoreboard } from "@/components/Scoreboard";
import { SectionHeader } from "@/components/SectionHeader";
import { SourceTag } from "@/components/SourceTag";
import { SquadSection } from "@/components/SquadSection";
import { StatComparison } from "@/components/StatComparison";
import { TeamColorProvider } from "@/components/TeamColorProvider";
import { VenueCard } from "@/components/VenueCard";
import { useLiveMatch } from "@/hooks/useLiveMatch";
import { useMatchExtras } from "@/hooks/useMatchExtras";
import { fmtNumber, stageLabel, statusKind } from "@/lib/format";
import { matchPlayerByName, type EspnRosterPlayer } from "@/lib/espn";
import { getAccentColor } from "@/lib/team-meta";
import type { Match, Scorer, Sourced, Stadium, TeamDetail, TeamSeasonStats } from "@/lib/types";

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

function Card({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-edge bg-panel/80 p-4 md:p-5">
      <SectionHeader title={title} right={right} />
      {children}
    </section>
  );
}

function predictedFor(
  detail: TeamDetail | null,
  roster: EspnRosterPlayer[],
  teamCode: string | null,
): FormationPlayer[] | null {
  const squad = detail?.squad.length
    ? pickPredictedXI(detail.squad)
    : null;
  if (squad) {
    return squad.map((p) => {
      const espn = roster.length ? matchPlayerByName(p.name, roster) : null;
      return {
        name: p.name,
        shirtNumber: p.shirtNumber ?? espn?.jersey ?? null,
        positionDetail: p.positionDetail,
        image: espn?.headshot ?? null,
        href: espn ? `/players/${espn.espnId}${teamCode ? `?team=${teamCode}` : ""}` : null,
      };
    });
  }
  return null;
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
  const { match: polled, source } = useLiveMatch(initial.data.id, initial);
  const match = polled ?? initial.data;
  const kind = statusKind(match.status);
  const { extras, ticket } = useMatchExtras(match.id, kind === "live", kind === "finished");

  const referee = match.referees.find((r) => /referee/i.test(r.role)) ?? match.referees[0];
  const confirmedLineups = extras?.lineups.home?.players.length && extras?.lineups.away?.players.length;
  const homeXI = confirmedLineups ? null : predictedFor(homeDetail, homeRoster, match.homeTeam?.code ?? null);
  const awayXI = confirmedLineups ? null : predictedFor(awayDetail, awayRoster, match.awayTeam?.code ?? null);

  return (
    <TeamColorProvider homeCode={match.homeTeam?.code} awayCode={match.awayTeam?.code}>
      <GoalBanner match={match} />
      <div className="team-gradient min-h-dvh">
        <div className="mx-auto max-w-shell px-4 py-6">
          {/* breadcrumb + stage */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2 text-xs text-dim">
            <Link href="/" className="hover:text-ink">
              ← War Room
            </Link>
            <span className="flex items-center gap-2">
              <span className="rounded-full border border-edge bg-panel px-3 py-1 font-mono uppercase tracking-wider">
                {stageLabel(match.stage, match.group)}
                {match.matchday && match.stage === "GROUP_STAGE" ? ` · MD${match.matchday}` : ""}
              </span>
              <SourceTag source={source ?? initial.source} />
            </span>
          </div>

          {/* header: teams + scoreboard */}
          <header className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_auto_1fr] md:gap-10">
            <TeamHeader match={match} side="home" detail={homeDetail} />

            <div className="order-first flex min-w-[220px] flex-col items-center gap-3 md:order-none md:min-w-[280px]">
              <div className="text-center text-xs text-dim">
                {stadium ? (
                  <p>
                    🏟️ {stadium.name} · {stadium.city}
                  </p>
                ) : match.venue ? (
                  <p>🏟️ {match.venue}</p>
                ) : null}
                <p>
                  <LocalTime iso={match.utcDate} style="datetime" />
                </p>
                {referee ? (
                  <p>
                    👤 Referee: {referee.name}
                    {referee.nationality ? ` (${referee.nationality})` : ""}
                  </p>
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
                <>
                  <CountdownTimer targetIso={match.utcDate} />
                  <p className="text-[10px] uppercase tracking-[0.25em] text-dim">to kickoff</p>
                </>
              ) : (
                <Scoreboard match={match} />
              )}
            </div>

            <TeamHeader match={match} side="away" detail={awayDetail} />
          </header>

          {/* content grid */}
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="flex flex-col gap-6 lg:col-span-2">
              {kind !== "upcoming" ? (
                <Card title="Match Events" right={<span>tap a scorer for clips</span>}>
                  <EventTimeline match={match} />
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

              {confirmedLineups ? (
                <Card title={kind === "upcoming" ? "Starting Lineups" : "Lineups"} right="confirmed · via ESPN">
                  <LineupSection match={match} home={extras!.lineups.home!} away={extras!.lineups.away!} />
                </Card>
              ) : homeXI || awayXI ? (
                <Card title="Predicted XI" right="squad-based projection — confirmed lineups appear ~1h before kickoff">
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
              ) : null}

              {homeDetail || awayDetail ? (
                <Card title="Squads">
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
            </div>

            <aside className="flex flex-col gap-6">
              <Card title="Polymarket Odds">
                <OddsPanel match={match} />
              </Card>

              {extras?.stats ? (
                <Card title="Match Stats">
                  <MatchStatsPanel
                    home={extras.stats.home}
                    away={extras.stats.away}
                    homeName={match.homeTeam?.code ?? "Home"}
                    awayName={match.awayTeam?.code ?? "Away"}
                  />
                </Card>
              ) : null}

              {homeStats && awayStats ? (
                <Card title="Tournament Form">
                  <StatComparison
                    home={homeStats}
                    away={awayStats}
                    homeName={match.homeTeam?.code ?? "Home"}
                    awayName={match.awayTeam?.code ?? "Away"}
                  />
                </Card>
              ) : null}

              <Card title="Match News">
                <MatchNews home={match.homeTeam?.name ?? null} away={match.awayTeam?.name ?? null} />
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
