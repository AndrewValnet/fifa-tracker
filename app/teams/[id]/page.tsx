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
import { WcHistoryPanel } from "@/components/WcHistoryPanel";
import { getScorers, getStandings, getTeamDetail, getTeamHub, getTeamMatches, getTeamStats } from "@/lib/data";
import { fmtPct, statusKind } from "@/lib/format";
import { getAccentColor } from "@/lib/team-meta";
import { getTeamHistory } from "@/lib/wc-history";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const team = await getTeamDetail(params.id);
  return { title: team ? `${team.data.name} — World Cup History, Squad & Stats` : "Team" };
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

function StatTile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-edge bg-panel px-2 py-2 text-center">
      <div className="text-[10px] uppercase tracking-wider text-dim">{label}</div>
      <div className="font-display text-xl font-bold">{value}</div>
      {sub && <div className="text-[10px] text-dim">{sub}</div>}
    </div>
  );
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
  const history = code ? getTeamHistory(code) : null;

  const teamScorers = scorers.data.filter((s) => s.team.code === code);
  const upcoming = matches?.data.filter((m) => statusKind(m.status) !== "finished") ?? [];
  const played = matches?.data.filter((m) => statusKind(m.status) === "finished") ?? [];

  // Current-tournament computed stats
  const gf = stats?.gf ?? row?.gf ?? 0;
  const ga = stats?.ga ?? row?.ga ?? 0;
  const gd = gf - ga;
  const ratio = ga > 0 ? (gf / ga).toFixed(2) : gf > 0 ? "∞" : "—";

  const tournamentTiles: [string, string | number, string?][] = stats
    ? [
        ["Played", stats.played],
        ["Won", stats.won],
        ["Drawn", stats.draw],
        ["Lost", stats.lost],
        ["Goals for", stats.gf],
        ["Goals against", stats.ga],
        ["Goal diff", gd >= 0 ? `+${gd}` : gd],
        ["GF/GA ratio", ratio],
      ]
    : row
    ? [
        ["Played", row.played],
        ["Won", row.won],
        ["Drawn", row.draw],
        ["Lost", row.lost],
        ["Goals for", row.gf],
        ["Goals against", row.ga],
        ["Goal diff", gd >= 0 ? `+${gd}` : gd],
        ["GF/GA ratio", ratio],
      ]
    : [];

  if (hub?.possessionAvg !== null && hub?.possessionAvg !== undefined) {
    tournamentTiles.push(["Avg poss.", `${hub.possessionAvg.toFixed(1)}%`]);
  }
  if (hub?.discipline) {
    tournamentTiles.push(
      ["🟨 Yellow", hub.discipline.yellow, "this tournament"],
      ["🟥 Red", hub.discipline.red, "this tournament"],
    );
  }

  // Scorers for this team
  const topScorer = teamScorers[0];
  const topAssist = [...teamScorers].sort((a, b) => (b.assists ?? 0) - (a.assists ?? 0)).find((s) => (s.assists ?? 0) > 0);

  return (
    <div
      className="min-h-dvh"
      style={{ background: `linear-gradient(180deg, color-mix(in srgb, ${accent} 14%, transparent), transparent 360px)` }}
    >
      <div className="mx-auto max-w-shell px-4 py-8">
        <Link href="/teams" className="text-xs text-dim hover:text-ink">
          ← All teams
        </Link>

        {/* ── Header ── */}
        <header className="mt-4 flex flex-wrap items-center gap-6">
          <Flag code={code} name={team.name} width={120} />
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-3xl font-bold uppercase tracking-wide md:text-4xl" style={{ color: accent }}>
              {team.name}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-dim">
              <span className="rounded-full border border-edge px-2.5 py-0.5 font-mono text-xs">
                Group {team.group ?? "?"}
              </span>
              {row ? (
                <span>
                  {ordinal(row.position)} in group · {row.points} pts
                </span>
              ) : null}
              {history ? (
                <span className="rounded-full border border-edge px-2.5 py-0.5 text-xs">
                  {history.appearances + 1} WC appearances
                </span>
              ) : null}
              {history?.titles ? (
                <span className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-xs text-gold">
                  🏆 {history.titles}× World Champions
                </span>
              ) : null}
              {hub?.finance?.outright?.price ? (
                <span className="rounded-full border border-pitch/40 bg-pitch/10 px-2.5 py-0.5 text-xs text-pitch">
                  {fmtPct(hub.finance.outright.price, 1)} to win it all
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

        {/* ── Current-tournament stat tiles ── */}
        {tournamentTiles.length ? (
          <section className="mt-8" aria-label="Tournament stats">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-dim">
              WC 2026 — tournament stats
            </p>
            <dl className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-11">
              {tournamentTiles.map(([label, v, sub]) => (
                <StatTile key={label} label={label} value={v} sub={sub} />
              ))}
            </dl>
          </section>
        ) : null}

        {/* ── Scorers / top performers from this team ── */}
        {(topScorer || topAssist) ? (
          <section className="mt-6 flex flex-wrap gap-3" aria-label="Top performers">
            {topScorer && topScorer.goals > 0 ? (
              <div className="rounded-xl border border-edge bg-panel px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-dim">Top scorer</p>
                <p className="mt-0.5 font-semibold">
                  {topScorer.player}
                  <span className="ml-2 font-mono text-pitch">{topScorer.goals} ⚽</span>
                </p>
              </div>
            ) : null}
            {topAssist && (topAssist.assists ?? 0) > 0 ? (
              <div className="rounded-xl border border-edge bg-panel px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-dim">Top assist</p>
                <p className="mt-0.5 font-semibold">
                  {topAssist.player}
                  <span className="ml-2 font-mono text-pitch">{topAssist.assists} 🅰️</span>
                </p>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* ── Next match odds ── */}
        {hub?.nextMatch && hub.nextOdds && hub.nextOdds.kind === "match" ? (
          <TeamColorProvider
            homeCode={hub.nextMatch.homeTeam?.code}
            awayCode={hub.nextMatch.awayTeam?.code}
            className="mt-8 max-w-3xl"
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

        {/* ── World Cup history ── */}
        {history ? (
          <section className="mt-10" aria-label="World Cup history">
            <SectionHeader title="World Cup History" right="all-time record · 1930–2026" />
            <div className="rounded-xl border border-edge bg-panel p-4 md:p-5">
              <WcHistoryPanel code={code ?? ""} />
            </div>
          </section>
        ) : null}

        {/* ── Prediction-market money ── */}
        {hub?.finance ? (
          <section className="mt-10" aria-label="Prediction-market money">
            <SectionHeader title="The Market on This Team" right="Polymarket public data" />
            <div className="rounded-xl border border-edge bg-panel p-4">
              <TeamFinancePanel finance={hub.finance} teamName={team.name} />
            </div>
          </section>
        ) : null}

        {/* ── Route to the Final ── */}
        {team.group ? (
          <section className="mt-10 max-w-3xl" aria-label="Route to the final">
            <SectionHeader title="Road to the Final" right="🏟️ MetLife · Jul 19" />
            <div className="rounded-xl border border-edge bg-panel p-4">
              <RouteToFinal group={team.group} outrightPrice={hub?.finance?.outright?.price ?? null} />
            </div>
          </section>
        ) : null}

        {/* ── Squad + Schedule ── */}
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section aria-label="Squad">
            <SectionHeader
              title="Squad"
              right={hub?.roster.length ? "tap a player for full stats" : undefined}
            />
            <div className="rounded-xl border border-edge bg-panel p-4">
              <SquadSection team={team} scorers={teamScorers} rosterIndex={hub?.roster ?? []} />
            </div>
          </section>

          <section aria-label="Schedule">
            <SectionHeader title="Schedule & Results" right="all WC 2026 fixtures" />
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

        {/* ── Group table for context ── */}
        {groupTable ? (
          <section className="mt-10 max-w-2xl" aria-label="Group standings">
            <SectionHeader title={`Group ${team.group} Standings`} />
            <div className="rounded-xl border border-edge bg-panel overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-edge/50 text-[10px] uppercase tracking-wider text-dim">
                    <th className="py-2 pl-4 text-left">#</th>
                    <th className="py-2 text-left">Team</th>
                    <th className="py-2 text-center">P</th>
                    <th className="py-2 text-center">W</th>
                    <th className="py-2 text-center">D</th>
                    <th className="py-2 text-center">L</th>
                    <th className="py-2 text-center">GF</th>
                    <th className="py-2 text-center">GA</th>
                    <th className="py-2 text-center">GD</th>
                    <th className="py-2 pr-4 text-center font-bold">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {groupTable.rows.map((r) => (
                    <tr
                      key={r.team.code ?? r.team.name}
                      className={`border-b border-edge/30 last:border-0 ${r.team.code === code ? "bg-pitch/5" : ""}`}
                    >
                      <td className="py-2 pl-4 font-mono text-xs text-dim">{r.position}</td>
                      <td className="py-2 pr-4">
                        <Link href={`/teams/${r.team.code ?? r.team.name}`} className="flex items-center gap-2 hover:text-pitch">
                          <Flag code={r.team.code} name={r.team.name} width={20} />
                          <span className={r.team.code === code ? "font-semibold" : ""}>{r.team.name}</span>
                        </Link>
                      </td>
                      <td className="py-2 text-center tabular-nums">{r.played}</td>
                      <td className="py-2 text-center tabular-nums">{r.won}</td>
                      <td className="py-2 text-center tabular-nums">{r.draw}</td>
                      <td className="py-2 text-center tabular-nums">{r.lost}</td>
                      <td className="py-2 text-center tabular-nums">{r.gf}</td>
                      <td className="py-2 text-center tabular-nums">{r.ga}</td>
                      <td className="py-2 text-center tabular-nums">{r.gf - r.ga >= 0 ? `+${r.gf - r.ga}` : r.gf - r.ga}</td>
                      <td className="py-2 pr-4 text-center font-bold tabular-nums">{r.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {/* ── Team news ── */}
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
