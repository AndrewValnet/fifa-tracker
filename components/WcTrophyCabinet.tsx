import { wc_tournaments, type WcTournament } from "@/data/wc-tournament-winners";
import { Flag } from "@/components/Flag";
import { SectionHeader } from "@/components/SectionHeader";

// Trophy count per nation across all 22 tournaments
const TROPHY_LEADERS: { code: string; name: string; count: number }[] = [
  { code: "BRA", name: "Brazil", count: 5 },
  { code: "GER", name: "Germany", count: 4 },
  { code: "ITA", name: "Italy", count: 4 },
  { code: "ARG", name: "Argentina", count: 3 },
  { code: "FRA", name: "France", count: 2 },
  { code: "URU", name: "Uruguay", count: 2 },
  { code: "ENG", name: "England", count: 1 },
  { code: "ESP", name: "Spain", count: 1 },
];

function TrophyLeaderStrip() {
  return (
    <div className="mb-8 flex flex-wrap items-center gap-2">
      {TROPHY_LEADERS.map(({ code, name, count }) => (
        <div
          key={code}
          className="flex items-center gap-2 rounded-lg border border-edge bg-panel px-3 py-2"
        >
          <Flag code={code} name={name} width={24} />
          <span className="font-display text-sm font-semibold uppercase tracking-wide text-ink">
            {name}
          </span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold font-display text-xs font-black text-navy">
            {count}
          </span>
        </div>
      ))}
    </div>
  );
}

function TournamentCard({ t }: { t: WcTournament }) {
  return (
    <div className="group flex flex-col gap-3 rounded-xl border border-edge bg-panel p-4 transition-transform duration-150 hover:-translate-y-0.5">
      {/* Year + Host */}
      <div className="flex items-start justify-between gap-2">
        <span className="font-display text-4xl font-black leading-none text-gold">
          {t.year}
        </span>
        <div className="flex flex-col items-end gap-1">
          <Flag code={t.hostCode} name={t.host} width={28} />
          <span className="text-xs text-dim">{t.host}</span>
        </div>
      </div>

      {/* Winner */}
      <div className="flex items-center gap-2 rounded-lg bg-panel2 px-3 py-2">
        <Flag code={t.winnerCode} name={t.winner} width={32} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-bold uppercase tracking-wide text-ink">
            {t.winner}
          </p>
          <p className="text-xs text-dim">Winner</p>
        </div>
        {/* Trophy icon */}
        <span className="text-lg" aria-hidden>
          🏆
        </span>
      </div>

      {/* Score */}
      <div className="flex items-center justify-center rounded border border-edge py-1">
        <span className="font-mono text-sm font-semibold text-pitch">
          {t.score}
        </span>
      </div>

      {/* Runner-up */}
      <div className="flex items-center gap-2">
        <Flag code={t.runnerUpCode} name={t.runnerUp} width={24} />
        <span className="truncate text-sm text-dim">{t.runnerUp}</span>
        <span className="ml-auto shrink-0 text-xs text-dim">Runner-up</span>
      </div>

      {/* Venue */}
      <div className="flex items-center gap-1 text-xs text-dim">
        <span aria-hidden>📍</span>
        <span>{t.venue}</span>
      </div>

      {/* Divider */}
      <div className="border-t border-edge" />

      {/* Top scorer */}
      <div className="flex items-start gap-1 text-xs text-dim">
        <span aria-hidden className="shrink-0">
          ⚽
        </span>
        <span className="leading-snug">{t.topScorer}</span>
      </div>

      {/* Attendance */}
      <p className="text-right font-mono text-xs text-dim">
        {t.attendance.toLocaleString()} att.
      </p>
    </div>
  );
}

export function WcTrophyCabinet() {
  // Newest first
  const sorted = [...wc_tournaments].sort((a, b) => b.year - a.year);

  return (
    <section className="min-h-screen bg-navy px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mx-auto max-w-shell">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-black uppercase tracking-wider text-ink sm:text-4xl">
            World Cup{" "}
            <span className="text-gold">Trophy Cabinet</span>
          </h1>
          <p className="mt-1 font-mono text-sm text-dim">
            22 tournaments · 1930 – 2022
          </p>
        </div>

        {/* Trophy leaders */}
        <SectionHeader title="All-Time Champions" className="mb-2" />
        <TrophyLeaderStrip />

        {/* Tournament grid */}
        <SectionHeader title="All Tournaments" right={`${sorted.length} editions`} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sorted.map((t) => (
            <TournamentCard key={t.year} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default WcTrophyCabinet;
