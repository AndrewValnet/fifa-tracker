import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flag } from "@/components/Flag";
import { FollowButton } from "@/components/FollowButton";
import { MatchCard } from "@/components/MatchCard";
import { NewsCard } from "@/components/NewsCard";
import { OddsBar } from "@/components/OddsBar";
import { RouteToFinal } from "@/components/RouteToFinal";
import { SectionHeader } from "@/components/SectionHeader";
import { SourceTag } from "@/components/SourceTag";
import { SquadSection } from "@/components/SquadSection";
import { TeamColorProvider } from "@/components/TeamColorProvider";
import { TeamFinancePanel } from "@/components/TeamFinancePanel";
import { getScorers, getStandings, getTeamDetail, getTeamHub, getTeamMatches, getTeamStats } from "@/lib/data";
import { fmtPct, statusKind } from "@/lib/format";
import { getAccentColor } from "@/lib/team-meta";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const team = await getTeamDetail(params.id);
  return { title: team ? `${team.data.name} — Squad, Odds & Money` : "Team" };
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

export default async function TeamPage({ params }: { params: { id: string } }) {
  const res = await getTeamDetail(params.id);
  if (!res) notFound();
  const team = res.data;
  const code = team.code;

  const [matches, stats, standings, scorers, hub] = await Promise.all([
    code ? getTeamMatches(code) : Promise.resolve(null),
    code ? getTeamStats(code) : Promise.resolve(null),
    getStandings(),
    getScorers(30),
    code ? getTeamHub(code, team.name) : Promise.resolve(null),
  ]);

  const groupTable = standings.data.find((g) => g.group === team.group);
  const row = groupTable?.rows.find((r) => r.team.code === code);
  const accent = getAccentColor(code);

  const teamScorers = scorers.data.filter((s) => s.team.code === code);
  const upcoming = matches?.data.filter((m) => statusKind(m.status) !== "finished") ?? [];
  const played = matches?.data.filter((m) => statusKind(m.status) === "finished") ?? [];

  const tiles: [string, string | number][] = stats
    ? [
        ["P", stats.played],
        ["W", stats.won],
        ["D", stats.draw],
        ["L", stats.lost],
        ["GF", stats.gf],
        ["GA", stats.ga],
      ]
    : [];
  if (hub?.possessionAvg !== null && hub?.possessionAvg !== undefined) {
    tiles.push(["Avg poss.", `${hub.possessionAvg.toFixed(1)}%`]);
  }
  if (hub?.discipline) {
    tiles.push(["🟨", hub.discipline.yellow], ["🟥", hub.discipline.red]);
  }

  return (
    <div
      className="min-h-dvh"
      style={{ background: `linear-gradient(180deg, color-mix(in srgb, ${accent} 14%, transparent), transparent 320px)` }}
    >
      <div className="mx-auto max-w-shell px-4 py-8">
        <Link href="/teams" className="text-xs text-dim hover:text-ink">
          ← All teams
        </Link>

        <header className="mt-4 flex flex-wrap items-center gap-6">
          <Flag code={code} name={team.name} width={120} />
          <div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-wide md:text-4xl" style={{ color: accent }}>
              {team.name}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-dim">
              <span className="rounded-full border border-edge px-2.5 py-0.5 font-mono text-xs">
                Group {team.group ?? "?"}
              </span>
              {row ? (
                <span>
                  {ordinal(row.position)} in group · {row.points} pts · {row.gf}-{row.ga} goals
                </span>
              ) : null}
              {hub?.finance?.outright?.price ? (
                <span className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-xs text-gold">
                  🏆 {fmtPct(hub.finance.outright.price, 1)} to win it all
                </span>
              ) : null}
              <SourceTag source={res.source} />
            </p>
            {code ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <FollowButton code={code} />
                <a
                  href={`/api/calendar?team=${code}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-edge px-3 py-1 text-xs text-dim hover:text-ink"
                >
                  📅 Add fixtures to calendar
                </a>
              </div>
            ) : null}
          </div>
        </header>

        {tiles.length ? (
          <dl className="mt-6 grid max-w-3xl grid-cols-3 gap-2 sm:grid-cols-9">
            {tiles.map(([label, v]) => (
              <div key={label} className="rounded-lg border border-edge bg-panel px-2 py-2 text-center">
                <dt className="text-[10px] uppercase tracking-wider text-dim">{label}</dt>
                <dd className="font-display text-xl font-bold">{v}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {/* next match odds */}
        {hub?.nextMatch && hub.nextOdds && hub.nextOdds.kind === "match" ? (
          <TeamColorProvider
            homeCode={hub.nextMatch.homeTeam?.code}
            awayCode={hub.nextMatch.awayTeam?.code}
            className="mt-6 max-w-3xl"
          >
            <div className="rounded-xl border border-edge bg-panel p-4">
              <p className="mb-2 text-[10px] uppercase tracking-widest text-dim">
                Next match · crowd odds (Polymarket)
              </p>
              <OddsBar
                home={hub.nextOdds.home}
                draw={hub.nextOdds.draw}
                away={hub.nextOdds.away}
                homeLabel={hub.nextMatch.homeTeam?.name ?? "Home"}
                awayLabel={hub.nextMatch.awayTeam?.name ?? "Away"}
              />
            </div>
          </TeamColorProvider>
        ) : null}

        {/* route to the final */}
        {team.group ? (
          <section className="mt-10 max-w-3xl" aria-label="Route to the final">
            <SectionHeader title="Road to the Final" right="🏟️ MetLife · Jul 19" />
            <div className="rounded-xl border border-edge bg-panel p-4">
              <RouteToFinal group={team.group} outrightPrice={hub?.finance?.outright?.price ?? null} />
            </div>
          </section>
        ) : null}

        {/* money */}
        {hub?.finance ? (
          <section className="mt-10" aria-label="Prediction-market money">
            <SectionHeader title="The Market on This Team" right="Polymarket public data" />
            <div className="rounded-xl border border-edge bg-panel p-4">
              <TeamFinancePanel finance={hub.finance} teamName={team.name} />
            </div>
          </section>
        ) : null}

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section aria-label="Squad">
            <SectionHeader title="Squad" right={hub?.roster.length ? "tap a player for full stats" : undefined} />
            <div className="rounded-xl border border-edge bg-panel p-4">
              <SquadSection team={team} scorers={teamScorers} rosterIndex={hub?.roster ?? []} />
            </div>
          </section>

          <section aria-label="Schedule">
            <SectionHeader title="Schedule & Results" />
            <div className="flex flex-col gap-3">
              {[...played, ...upcoming].map((m) => (
                <MatchCard key={m.id} match={m} withOdds={statusKind(m.status) !== "finished"} />
              ))}
              {!matches?.data.length ? (
                <p className="rounded-lg border border-dashed border-edge px-4 py-8 text-center text-sm text-dim">
                  No fixtures found for this team.
                </p>
              ) : null}
            </div>
          </section>
        </div>

        {/* team news */}
        {hub?.news.data.length ? (
          <section className="mt-10" aria-label="Team news">
            <SectionHeader
              title={`${team.name} Headlines`}
              right={hub.news.demo ? <span className="text-gold">offline digest</span> : "via GNews · cached 10 min"}
            />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {hub.news.data.slice(0, 6).map((a) => (
                <NewsCard key={a.url + a.title} article={a} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
