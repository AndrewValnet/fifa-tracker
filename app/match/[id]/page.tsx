import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MatchView } from "@/components/MatchView";
import { getMatchById, getScorers, getTeamRosterIndex, getTeams, getTeamStats } from "@/lib/data";
import { matchSlugTitle, stageLabel } from "@/lib/format";
import { findStadiumByName, getStadium } from "@/lib/schedule";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const res = await getMatchById(params.id);
  if (!res) return { title: "Match" };
  const m = res.data;
  return {
    title: `${matchSlugTitle(m)} — ${stageLabel(m.stage, m.group)}`,
    description: `Live score, Polymarket odds, lineups and news for ${matchSlugTitle(m)} at the 2026 FIFA World Cup.`,
  };
}

export default async function MatchPage({ params }: { params: { id: string } }) {
  const res = await getMatchById(params.id);
  if (!res) notFound();
  const m = res.data;

  const homeCode = m.homeTeam?.code ?? null;
  const awayCode = m.awayTeam?.code ?? null;

  const [teams, scorers, homeStats, awayStats, homeRoster, awayRoster] = await Promise.all([
    getTeams(),
    getScorers(30),
    homeCode ? getTeamStats(homeCode) : Promise.resolve(null),
    awayCode ? getTeamStats(awayCode) : Promise.resolve(null),
    homeCode ? getTeamRosterIndex(homeCode) : Promise.resolve([]),
    awayCode ? getTeamRosterIndex(awayCode) : Promise.resolve([]),
  ]);

  const homeDetail = homeCode ? teams.data.find((t) => t.code === homeCode) ?? null : null;
  const awayDetail = awayCode ? teams.data.find((t) => t.code === awayCode) ?? null : null;
  const stadium = getStadium(m.stadiumId) ?? findStadiumByName(m.venue);

  return (
    <MatchView
      initial={res}
      homeDetail={homeDetail}
      awayDetail={awayDetail}
      homeStats={homeStats}
      awayStats={awayStats}
      stadium={stadium}
      scorers={scorers.data}
      homeRoster={homeRoster}
      awayRoster={awayRoster}
    />
  );
}
