import type { Metadata } from "next";
import { Flag } from "@/components/Flag";
import { SectionHeader } from "@/components/SectionHeader";
import { getScorers } from "@/lib/data";
import { MOTM_WINNERS, type MOTMEntry } from "@/data/motm-winners";
import { GOALKEEPER_STATS, type GoalkeeperStat } from "@/data/goalkeeper-stats";

export const metadata: Metadata = { title: "WC 2026 Awards" };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function RatingBadge({ rating }: { rating: number }) {
  const color =
    rating >= 9.5
      ? "text-gold border-gold/50 bg-gold/10"
      : rating >= 9.0
        ? "text-pitch border-pitch/50 bg-pitch/10"
        : "text-ink/80 border-edge bg-panel";
  return (
    <span
      className={`rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-bold tabular-nums ${color}`}
    >
      {rating.toFixed(1)}
    </span>
  );
}

function StatBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-edge/40">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, background: color }}
        aria-hidden
      />
    </div>
  );
}

export default async function AwardsPage() {
  const scorersResult = await getScorers(5);
  const topScorers = scorersResult.data;

  const sortedGKs: GoalkeeperStat[] = [...GOALKEEPER_STATS]
    .sort((a, b) => b.savePct - a.savePct)
    .slice(0, 8);
  const maxSaves = Math.max(...sortedGKs.map((g) => g.saves));

  const sortedMOTM: MOTMEntry[] = [...MOTM_WINNERS].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  // Aggregate MOTM wins per player
  const motmCount: Record<string, { count: number; teamCode: string; teamName: string }> = {};
  for (const entry of MOTM_WINNERS) {
    if (!motmCount[entry.playerName]) {
      motmCount[entry.playerName] = { count: 0, teamCode: entry.teamCode, teamName: entry.teamName };
    }
    motmCount[entry.playerName].count += 1;
  }
  const peoplesLeaderboard = Object.entries(motmCount)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const maxGoals = Math.max(...topScorers.map((s) => s.goals), 1);

  return (
    <div className="mx-auto max-w-shell px-4 py-8">
      {/* Hero */}
      <div className="mb-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <span className="text-4xl" role="img" aria-label="trophy">
              🏆
            </span>
            <h1 className="font-display text-3xl font-bold uppercase tracking-wide md:text-4xl">
              Awards &amp;{" "}
              <span className="text-gold">Accolades</span>
            </h1>
          </div>
          <p className="ml-[3.25rem] text-sm text-dim">
            FIFA World Cup 2026 — live tracking of individual honours
          </p>
        </div>
        <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gold">
          WC 2026
        </span>
      </div>

      {/* Golden Boot */}
      <section className="mb-12" aria-label="Golden Boot">
        <SectionHeader title="Golden Boot" right="top 5 scorers" />
        <div className="mt-3 overflow-hidden rounded-2xl border border-gold/30 bg-panel">
          {/* Header row */}
          <div className="grid grid-cols-[2rem_1fr_3rem_3rem_3rem] gap-2 border-b border-edge px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-dim">
            <span>#</span>
            <span>Player</span>
            <span className="text-right">Goals</span>
            <span className="text-right">Ast</span>
            <span className="text-right">Pen</span>
          </div>
          <ol>
            {topScorers.map((s, i) => (
              <li
                key={`${s.player}-${s.team.id}`}
                className="group grid grid-cols-[2rem_1fr_3rem_3rem_3rem] items-center gap-2 border-t border-edge/50 px-4 py-3 first:border-t-0 hover:bg-gold/5 transition-colors"
              >
                <span
                  className={`font-display text-base font-bold ${i === 0 ? "text-gold" : i === 1 ? "text-[#C0C0C0]" : i === 2 ? "text-[#CD7F32]" : "text-dim"}`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{s.player}</span>
                  <span className="flex items-center gap-1.5 text-[11px] text-dim">
                    <Flag code={s.team.code} name={s.team.name} width={14} rounded={false} />
                    {s.team.name}
                  </span>
                  <div className="mt-1.5">
                    <StatBar value={s.goals} max={maxGoals} color="#ffd700" />
                  </div>
                </span>
                <span className="text-right font-display text-2xl font-bold text-gold">
                  {s.goals}
                </span>
                <span className="text-right font-mono text-sm text-dim">
                  {s.assists ?? "—"}
                </span>
                <span className="text-right font-mono text-sm text-dim">
                  {s.penalties ?? "—"}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Golden Glove */}
      <section className="mb-12" aria-label="Golden Glove">
        <SectionHeader title="Golden Glove" right="top 8 by save %" />
        <div className="mt-3 overflow-x-auto rounded-2xl border border-edge bg-panel">
          <table className="w-full min-w-[540px] text-sm">
            <thead>
              <tr className="border-b border-edge text-[10px] font-semibold uppercase tracking-widest text-dim">
                <th className="py-2 pl-4 text-left">#</th>
                <th className="py-2 text-left">Goalkeeper</th>
                <th className="py-2 text-right pr-3">MP</th>
                <th className="py-2 text-right pr-3">Saves</th>
                <th className="py-2 text-right pr-3">GA</th>
                <th className="py-2 pr-4 text-right">CS</th>
                <th className="py-2 pr-4 text-right">Save%</th>
              </tr>
            </thead>
            <tbody>
              {sortedGKs.map((gk, i) => (
                <tr
                  key={gk.name}
                  className="border-t border-edge/50 hover:bg-pitch/5 transition-colors"
                >
                  <td className="py-3 pl-4">
                    <span
                      className={`font-display text-sm font-bold ${i === 0 ? "text-gold" : i === 1 ? "text-[#C0C0C0]" : i === 2 ? "text-[#CD7F32]" : "text-dim"}`}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="flex items-center gap-2">
                      <Flag code={gk.teamCode} name={gk.teamName} width={20} />
                      <span>
                        <span className="block font-medium">{gk.name}</span>
                        <span className="text-[11px] text-dim">{gk.teamName}</span>
                      </span>
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-right font-mono text-dim">{gk.matches}</td>
                  <td className="py-3 pr-3 text-right">
                    <span className="font-semibold text-pitch">{gk.saves}</span>
                    <div className="mt-0.5 w-16 ml-auto">
                      <StatBar value={gk.saves} max={maxSaves} color="#00d45e" />
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-right font-mono text-dim">{gk.goalsAllowed}</td>
                  <td className="py-3 pr-4 text-right">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-pitch/20 text-[11px] font-bold text-pitch">
                      {gk.cleanSheets}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right font-display font-bold text-gold">
                    {gk.savePct.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Man of the Match */}
      <section className="mb-12" aria-label="Man of the Match">
        <SectionHeader title="Man of the Match" right="most recent first" />

        {/* People's Player sub-leaderboard */}
        <div className="mt-3 mb-6 rounded-2xl border border-gold/30 bg-panel p-4">
          <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-gold">
            People&apos;s Player — MOTM Leaderboard
          </h3>
          <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {peoplesLeaderboard.map((p, i) => (
              <li
                key={p.name}
                className="flex items-center gap-3 rounded-xl border border-edge/60 bg-navy/60 px-3 py-2"
              >
                <span
                  className={`w-5 font-display text-sm font-bold ${i === 0 ? "text-gold" : i === 1 ? "text-[#C0C0C0]" : i === 2 ? "text-[#CD7F32]" : "text-dim"}`}
                >
                  {i + 1}
                </span>
                <Flag code={p.teamCode} name={p.teamName} width={20} />
                <span className="flex-1 truncate text-sm font-medium">{p.name}</span>
                <span className="flex items-center gap-1">
                  <span className="text-lg" role="img" aria-label="star">⭐</span>
                  <span className="font-display text-base font-bold text-gold">{p.count}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* MOTM timeline */}
        <div className="relative flex flex-col gap-0">
          {/* vertical timeline line */}
          <div
            className="absolute left-[1.625rem] top-0 h-full w-px bg-gradient-to-b from-gold/60 via-edge/30 to-transparent"
            aria-hidden
          />
          {sortedMOTM.map((entry) => (
            <article
              key={entry.matchId}
              className="relative ml-12 mb-4 rounded-2xl border border-edge/70 bg-panel p-4 hover:border-gold/40 transition-colors"
              aria-label={`MOTM: ${entry.playerName} — ${entry.homeTeam} vs ${entry.awayTeam}`}
            >
              {/* timeline dot */}
              <span
                className="absolute -left-[2.1rem] top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-gold bg-navy text-[9px] font-bold text-gold"
                aria-hidden
              >
                ★
              </span>

              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Flag code={entry.teamCode} name={entry.teamName} width={22} />
                    <span className="font-display text-base font-bold">{entry.playerName}</span>
                    <RatingBadge rating={entry.rating} />
                  </div>
                  <p className="mt-0.5 text-xs text-dim">
                    <span className="font-semibold text-ink/70">
                      {entry.homeTeam} {entry.score} {entry.awayTeam}
                    </span>
                    {" · "}
                    {formatDate(entry.date)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs text-dim">
                  {entry.goals > 0 && (
                    <span className="flex items-center gap-1">
                      <span role="img" aria-label="goals">⚽</span>
                      <span className="font-bold text-ink/80">{entry.goals}</span>
                    </span>
                  )}
                  {entry.assists > 0 && (
                    <span className="flex items-center gap-1">
                      <span role="img" aria-label="assists">🎯</span>
                      <span className="font-bold text-ink/80">{entry.assists}</span>
                    </span>
                  )}
                  {entry.goals === 0 && entry.assists === 0 && (
                    <span className="italic text-dim/70">Dominant display</span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
