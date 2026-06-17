import type { Metadata } from "next";
import Link from "next/link";
import { Flag } from "@/components/Flag";
import { LocalTime } from "@/components/LocalTime";

import { getAllMatches } from "@/lib/data";
import { statusKind, stageLabel } from "@/lib/format";
import type { Match, Stage } from "@/lib/types";

export const metadata: Metadata = {
  title: "Match Calendar",
  description: "All 104 FIFA World Cup 2026 matches in a full calendar view.",
};

export const dynamic = "force-dynamic";

// ─── helpers ────────────────────────────────────────────────────────────────

/** "Tue 17 Jun" style heading */
function formatDateHeading(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** YYYY-MM-DD bucket key (UTC) */
function dateBucket(iso: string): string {
  return iso.slice(0, 10);
}

const KNOCKOUT_STAGES: Stage[] = [
  "LAST_32",
  "LAST_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "THIRD_PLACE",
  "FINAL",
];

function isKnockout(stage: Stage): boolean {
  return KNOCKOUT_STAGES.includes(stage);
}

// ─── filter bar ─────────────────────────────────────────────────────────────

function FilterBar({ active }: { active: string }) {
  const tabs = [
    { label: "All", value: "" },
    { label: "Group Stage", value: "group" },
    { label: "Knockout", value: "knockout" },
  ];

  return (
    <nav
      aria-label="Stage filter"
      className="mb-6 flex gap-2 overflow-x-auto pb-1"
    >
      {tabs.map((tab) => {
        const isActive = active === tab.value;
        return (
          <Link
            key={tab.value}
            href={tab.value ? `/calendar?stage=${tab.value}` : "/calendar"}
            className={[
              "shrink-0 rounded-full border px-4 py-1.5 font-display text-xs font-semibold uppercase tracking-wider transition-colors",
              isActive
                ? "border-pitch bg-pitch/20 text-pitch"
                : "border-edge bg-panel text-dim hover:border-pitch/50 hover:text-white",
            ].join(" ")}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

// ─── match card ─────────────────────────────────────────────────────────────

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2" aria-hidden>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
    </span>
  );
}

function MatchCard({ match }: { match: Match }) {
  const kind = statusKind(match.status);
  const home = match.homeTeam;
  const away = match.awayTeam;
  const homeCode = home?.code ?? "?";
  const awayCode = away?.code ?? "?";
  const homeName = home?.name ?? match.homeLabel ?? "TBD";
  const awayName = away?.name ?? match.awayLabel ?? "TBD";

  const scoreHome = match.score.home;
  const scoreAway = match.score.away;
  const hasScore = scoreHome !== null && scoreAway !== null;

  // Determine winner for highlighting
  const winner = match.score.winner;

  return (
    <article
      className="flex flex-col rounded-xl border border-edge bg-panel transition-colors hover:border-pitch/40"
      aria-label={`${homeName} vs ${awayName}`}
    >
      {/* top bar: group/stage + status badge */}
      <div className="flex items-center justify-between border-b border-edge/60 px-3 py-2">
        <span className="font-display text-[10px] font-semibold uppercase tracking-wider text-dim">
          {stageLabel(match.stage, match.group)}
        </span>

        {kind === "live" && (
          <span className="flex items-center gap-1.5">
            <LiveDot />
            <span className="font-display text-[10px] font-bold uppercase tracking-wider text-live">
              Live
            </span>
          </span>
        )}
        {kind === "finished" && (
          <span className="font-display text-[10px] font-semibold uppercase tracking-wider text-dim/60">
            FT
          </span>
        )}
        {kind === "upcoming" && (
          <span className="font-display text-[10px] text-dim">
            <LocalTime iso={match.utcDate} style="time" />
          </span>
        )}
      </div>

      {/* main content: teams + score */}
      <div className="flex items-center gap-2 px-3 py-3">
        {/* Home team */}
        <div
          className={[
            "flex min-w-0 flex-1 flex-col items-center gap-1",
            kind === "finished" && winner === "AWAY_TEAM" ? "opacity-50" : "",
          ].join(" ")}
        >
          {home?.code ? (
            <Flag code={home.code} name={homeName} width={32} />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-panel2 font-display text-xs text-dim">
              ?
            </span>
          )}
          <span className="w-full truncate text-center font-display text-[11px] font-semibold uppercase tracking-wide text-white">
            {homeCode !== "?" ? homeCode : homeName.slice(0, 3).toUpperCase()}
          </span>
        </div>

        {/* Score / separator */}
        <div className="flex shrink-0 flex-col items-center">
          {kind === "finished" || kind === "live" ? (
            <span
              className={[
                "font-display text-lg font-bold tabular-nums",
                kind === "live" ? "text-live" : "text-white",
              ].join(" ")}
            >
              {hasScore ? `${scoreHome} – ${scoreAway}` : "– –"}
            </span>
          ) : (
            <span className="font-display text-sm font-semibold text-dim">
              vs
            </span>
          )}
        </div>

        {/* Away team */}
        <div
          className={[
            "flex min-w-0 flex-1 flex-col items-center gap-1",
            kind === "finished" && winner === "HOME_TEAM" ? "opacity-50" : "",
          ].join(" ")}
        >
          {away?.code ? (
            <Flag code={away.code} name={awayName} width={32} />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-panel2 font-display text-xs text-dim">
              ?
            </span>
          )}
          <span className="w-full truncate text-center font-display text-[11px] font-semibold uppercase tracking-wide text-white">
            {awayCode !== "?" ? awayCode : awayName.slice(0, 3).toUpperCase()}
          </span>
        </div>
      </div>

      {/* footer: venue */}
      {match.venue && (
        <div className="border-t border-edge/60 px-3 py-1.5">
          <p className="truncate text-center font-body text-[10px] text-dim/70">
            {match.venue}
          </p>
        </div>
      )}
    </article>
  );
}

// ─── date group ─────────────────────────────────────────────────────────────

function DateGroup({ matches }: { dateKey: string; matches: Match[] }) {
  // Use the first match's utcDate to format the heading
  const heading = formatDateHeading(matches[0].utcDate);
  return (
    <section aria-label={heading}>
      {/* Sticky date heading */}
      <div className="sticky top-16 z-10 -mx-4 px-4 py-2 backdrop-blur-sm bg-navy/90">
        <h2 className="font-display text-base font-bold uppercase tracking-widest text-gold">
          {heading}
        </h2>
      </div>

      <div className="mt-3 mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>
    </section>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: { stage?: string };
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const { data: allMatches } = await getAllMatches();

  const stageFilter = searchParams.stage ?? "";

  // Filter matches
  const filtered = allMatches.filter((m) => {
    if (stageFilter === "group") return m.stage === "GROUP_STAGE";
    if (stageFilter === "knockout") return isKnockout(m.stage);
    return true;
  });

  // Sort by UTC date ascending
  const sorted = [...filtered].sort(
    (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
  );

  // Group by date bucket
  const byDate = new Map<string, Match[]>();
  for (const m of sorted) {
    const key = dateBucket(m.utcDate);
    const existing = byDate.get(key);
    if (existing) {
      existing.push(m);
    } else {
      byDate.set(key, [m]);
    }
  }

  const dateEntries = Array.from(byDate.entries());

  return (
    <div className="mx-auto max-w-shell px-4 py-8">
      <h1 className="mb-2 font-display text-2xl font-bold uppercase tracking-wide md:text-3xl">
        Match <span className="text-pitch">Calendar</span>
      </h1>
      <p className="mb-6 font-body text-sm text-dim">
        {filtered.length} matches &middot; WC 2026
      </p>

      <FilterBar active={stageFilter} />

      {dateEntries.length === 0 ? (
        <p className="py-16 text-center font-body text-sm text-dim">
          No matches found for this filter.
        </p>
      ) : (
        <div>
          {dateEntries.map(([key, matches]) => (
            <DateGroup key={key} dateKey={key} matches={matches} />
          ))}
        </div>
      )}
    </div>
  );
}
