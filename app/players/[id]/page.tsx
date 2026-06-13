import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipLink } from "@/components/ClipLink";
import { Flag } from "@/components/Flag";
import { LocalTime } from "@/components/LocalTime";
import { PlayerHeadshot } from "@/components/PlayerHeadshot";
import { SectionHeader } from "@/components/SectionHeader";
import { getPlayerData } from "@/lib/data";
import { fmtPct, fmtUsdCompact } from "@/lib/format";
import { getAccentColor, getTeamColors, resolveTeamCode, teamName } from "@/lib/team-meta";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
  searchParams: { team?: string };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const data = await getPlayerData(params.id, searchParams.team ?? null);
  return { title: data?.bio?.name ? `${data.bio.name} — Player Profile` : "Player" };
}

function Tile({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-edge bg-panel px-2 py-2.5 text-center">
      <p className={`font-display text-2xl font-bold tabular-nums ${accent ? "text-gold" : ""}`}>{value}</p>
      <p className="mt-0.5 text-[10px] uppercase leading-tight tracking-wider text-dim">{label}</p>
    </div>
  );
}

function BioRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <>
      <dt className="text-dim">{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

const FOOT_LABEL: Record<string, string> = { right: "Right", left: "Left", both: "Both (two-footed)" };

export default async function PlayerPage({ params, searchParams }: Props) {
  const teamCode = searchParams.team ? resolveTeamCode(searchParams.team, searchParams.team) : null;
  const data = await getPlayerData(params.id, teamCode);
  if (!data?.bio) notFound();
  const { bio, log, totals, starts, minutesTotal, minutesAvg, markets } = data;

  const accent = getAccentColor(teamCode);
  const colors = getTeamColors(teamCode);
  const team = teamCode ? teamName(teamCode) : null;
  const apps = totals.appearances;
  const conversion = totals.shots > 0 ? totals.goals / totals.shots : null;
  const minsPerGoal = totals.goals > 0 && minutesTotal ? Math.round(minutesTotal / totals.goals) : null;
  const accuracy = totals.shots > 0 ? totals.shotsOnTarget / totals.shots : null;

  return (
    <div
      className="min-h-dvh"
      style={{ background: `linear-gradient(180deg, color-mix(in srgb, ${accent} 16%, transparent), transparent 340px)` }}
    >
      <div className="mx-auto max-w-shell px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <Link href={teamCode ? `/teams/${teamCode}` : "/teams"} className="text-xs text-dim hover:text-ink">
            ← {team ?? "Teams"}
          </Link>
          <Link
            href={`/compare?a=${params.id}${teamCode ? `&teamA=${teamCode}` : ""}`}
            className="text-xs text-dim hover:text-gold"
          >
            ⚖ Compare with another player →
          </Link>
        </div>

        {/* hero */}
        <header className="mt-4 flex flex-wrap items-center gap-6">
          <PlayerHeadshot src={bio.headshot} name={bio.name} size={112} colors={colors} className="ring-2 ring-edge" />
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-bold uppercase tracking-wide md:text-4xl" style={{ color: accent }}>
              {bio.jersey ? <span className="mr-3 text-dim">#{bio.jersey}</span> : null}
              {bio.name}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-dim">
              {bio.position ? <span className="rounded-full border border-edge px-2.5 py-0.5">{bio.position}</span> : null}
              {teamCode ? (
                <Link href={`/teams/${teamCode}`} className="flex items-center gap-1.5 hover:text-ink">
                  <Flag code={teamCode} name={team} width={20} /> {team}
                </Link>
              ) : null}
              {bio.club ? <span>Club: {bio.club}</span> : null}
            </p>
          </div>
        </header>

        {/* bio facts */}
        <dl className="mt-6 grid max-w-2xl grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 rounded-xl border border-edge bg-panel p-4 text-sm sm:grid-cols-[auto_1fr_auto_1fr]">
          <BioRow label="Age" value={bio.age !== null ? `${bio.age}${bio.dateOfBirth ? ` (${bio.dateOfBirth})` : ""}` : null} />
          <BioRow label="Height" value={bio.height} />
          <BioRow label="Weight" value={bio.weight} />
          <BioRow label="Preferred foot" value={bio.foot ? FOOT_LABEL[bio.foot] : null} />
          <BioRow label="Born in" value={bio.birthPlace} />
          <BioRow label="Nationality" value={bio.citizenship} />
        </dl>
        {!bio.foot ? (
          <p className="mt-1 text-[10px] text-dim">Preferred foot not recorded in public data for this player.</p>
        ) : null}

        {/* tournament stats */}
        <section className="mt-8" aria-label="Tournament statistics">
          <SectionHeader title="World Cup 2026 Numbers" right={apps ? `${apps} appearance${apps === 1 ? "" : "s"}` : "no minutes yet"} />
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            <Tile label="Apps" value={apps} />
            <Tile label="Starts" value={starts} />
            <Tile label="Minutes (est)" value={minutesTotal ?? "—"} />
            <Tile label="Avg min / app" value={minutesAvg !== null ? Math.round(minutesAvg) : "—"} />
            <Tile label="Goals" value={totals.goals} accent />
            <Tile label="Assists" value={totals.assists} accent />
            <Tile label="Shots" value={totals.shots} />
            <Tile label="On target" value={totals.shotsOnTarget} />
            <Tile label="Shot accuracy" value={accuracy !== null ? fmtPct(accuracy) : "—"} />
            <Tile label="Fouls committed" value={totals.fouls} />
            <Tile label="Fouls drawn" value={totals.foulsDrawn} />
            <Tile label="Offsides" value={totals.offsides} />
            <Tile label="Yellow cards" value={totals.yellow} />
            <Tile label="Red cards" value={totals.red} />
          </div>
          {(conversion !== null || minsPerGoal !== null) && (
            <div className="mt-2 grid grid-cols-2 gap-2 sm:max-w-md">
              {conversion !== null ? <Tile label="Shot conversion" value={fmtPct(conversion)} accent /> : null}
              {minsPerGoal !== null ? <Tile label="Minutes per goal" value={minsPerGoal} accent /> : null}
            </div>
          )}
          <p className="mt-2 text-[10px] text-dim">
            Stats aggregated from ESPN match data; minutes estimated from kickoff and substitution times.
          </p>
        </section>

        {/* match log */}
        <section className="mt-8" aria-label="Match log">
          <SectionHeader title="Match Log" />
          {log.length ? (
            <div className="overflow-x-auto rounded-xl border border-edge bg-panel">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-dim">
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Opponent</th>
                    <th className="px-3 py-2 text-center font-medium">Score</th>
                    <th className="px-3 py-2 text-center font-medium">Role</th>
                    <th className="px-3 py-2 text-right font-medium">Min</th>
                    <th className="px-3 py-2 text-right font-medium">G</th>
                    <th className="px-3 py-2 text-right font-medium">A</th>
                    <th className="px-3 py-2 text-right font-medium">SH</th>
                    <th className="px-3 py-2 text-right font-medium">SOG</th>
                    <th className="px-3 py-2 text-right font-medium">Cards</th>
                  </tr>
                </thead>
                <tbody>
                  {log.map((row) => (
                    <tr key={row.utcDate} className="border-t border-edge/50">
                      <td className="px-3 py-2 text-xs text-dim">
                        <LocalTime iso={row.utcDate} style="date" />
                      </td>
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-2">
                          <Flag code={row.opponentCode} name={row.opponentName} width={20} />
                          {row.matchId ? (
                            <Link href={`/match/${row.matchId}`} prefetch={false} className="hover:text-gold">
                              {row.opponentName}
                            </Link>
                          ) : (
                            row.opponentName
                          )}
                          {row.stats.goals > 0 && team ? (
                            <ClipLink player={bio.name} home={team} away={row.opponentName} className="text-xs" />
                          ) : null}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center font-mono">{row.scoreline}</td>
                      <td className="px-3 py-2 text-center text-xs">
                        {row.started ? "Started" : row.cameOn ? "Sub ▲" : "Unused"}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{row.minutes ?? "—"}</td>
                      <td className="px-3 py-2 text-right font-mono">{row.stats.goals || ""}</td>
                      <td className="px-3 py-2 text-right font-mono">{row.stats.assists || ""}</td>
                      <td className="px-3 py-2 text-right font-mono">{row.stats.shots || ""}</td>
                      <td className="px-3 py-2 text-right font-mono">{row.stats.shotsOnTarget || ""}</td>
                      <td className="px-3 py-2 text-right">
                        {"🟨".repeat(row.stats.yellow)}
                        {"🟥".repeat(row.stats.red)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-edge px-4 py-8 text-center text-sm text-dim">
              No tournament appearances logged yet{teamCode ? "" : " — open this page from a team squad to link match data"}.
            </p>
          )}
        </section>

        {/* betting markets */}
        <section className="mt-8 max-w-2xl" aria-label="Betting markets">
          <SectionHeader title="Prediction Markets" />
          {markets.length ? (
            <ul className="flex flex-col gap-2">
              {markets.map((m) => (
                <li key={m.url + m.outcomeLabel} className="flex items-center justify-between gap-3 rounded-lg border border-edge bg-panel px-4 py-3 text-sm">
                  <a href={m.url} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate hover:text-gold">
                    {m.title} ↗
                  </a>
                  <span className="flex shrink-0 items-center gap-3 font-mono text-xs">
                    <span className="text-gold">{fmtPct(m.price, 1)}</span>
                    <span className="text-dim">{fmtUsdCompact(m.volume)} traded</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg border border-dashed border-edge px-4 py-6 text-center text-xs text-dim">
              No Polymarket player markets found for {bio.name} — player props (Golden Boot etc.) appear as the
              tournament progresses.
            </p>
          )}
          <p className="mt-2 text-[10px] text-dim">
            Per-player money won/lost isn&apos;t published by any free source; market volume is the money traded on
            markets naming this player.
          </p>
        </section>
      </div>
    </div>
  );
}
