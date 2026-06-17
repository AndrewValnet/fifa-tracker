import type { Metadata } from "next";
import type { Match, Stage } from "@/lib/types";
import { getAllMatches } from "@/lib/data";
import { statusKind, stageLabel } from "@/lib/format";
import { Flag } from "@/components/Flag";
import { LocalTime } from "@/components/LocalTime";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tournament Timeline",
  description: "Every World Cup 2026 match day by day — group stage through the Final.",
};

// ── Phase definitions ────────────────────────────────────────────────────────

const PHASES: { id: Stage | "GROUP_STAGE"; label: string; stages: Stage[] }[] = [
  { id: "GROUP_STAGE", label: "Group Stage", stages: ["GROUP_STAGE"] },
  { id: "LAST_32", label: "R32", stages: ["LAST_32"] },
  { id: "LAST_16", label: "R16", stages: ["LAST_16"] },
  { id: "QUARTER_FINALS", label: "QF", stages: ["QUARTER_FINALS"] },
  { id: "SEMI_FINALS", label: "SF", stages: ["SEMI_FINALS", "THIRD_PLACE"] },
  { id: "FINAL", label: "Final", stages: ["FINAL"] },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** "2026-06-17" bucket from ISO string, UTC */
function utcDateBucket(iso: string): string {
  return iso.slice(0, 10);
}

/** "Tue 17 Jun" from a YYYY-MM-DD bucket, rendered server-side in UTC */
function formatDayHeading(bucket: string): string {
  const d = new Date(`${bucket}T12:00:00Z`);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** Determine which phase a match belongs to for progress-bar colouring */
function phaseIndex(stage: Stage): number {
  for (let i = 0; i < PHASES.length; i++) {
    if (PHASES[i].stages.includes(stage)) return i;
  }
  return 0;
}

// ── Phase Progress Bar ───────────────────────────────────────────────────────

function PhaseProgressBar({
  matches,
}: {
  matches: Match[];
}) {
  // Determine the current phase: the phase of the earliest upcoming / live match
  const current = matches.find(
    (m) => statusKind(m.status) !== "finished",
  );
  const activePhaseIdx = current ? phaseIndex(current.stage as Stage) : PHASES.length - 1;

  // Count finished / total per phase
  const phaseCounts = PHASES.map((p) => {
    const phaseMatches = matches.filter((m) => p.stages.includes(m.stage as Stage));
    const done = phaseMatches.filter((m) => statusKind(m.status) === "finished").length;
    return { total: phaseMatches.length, done };
  });

  return (
    <div
      className="mb-8 rounded-xl border border-edge bg-panel px-4 py-4"
      aria-label="Tournament phase progress"
    >
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-dim">
        Tournament Progress
      </p>
      <div className="flex items-stretch gap-1">
        {PHASES.map((phase, i) => {
          const isActive = i === activePhaseIdx;
          const isDone = i < activePhaseIdx;
          const { total, done } = phaseCounts[i];
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;

          return (
            <div key={phase.id} className="flex flex-1 flex-col items-center gap-1">
              {/* Bar segment */}
              <div
                className={`relative h-2 w-full overflow-hidden rounded-full ${
                  isDone
                    ? "bg-pitch"
                    : isActive
                    ? "bg-edge"
                    : "bg-edge/40"
                }`}
                aria-label={`${phase.label}: ${pct}% complete`}
              >
                {isActive && pct > 0 && (
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gold transition-all"
                    style={{ width: `${pct}%` }}
                  />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] font-semibold leading-none tracking-wide ${
                  isDone
                    ? "text-pitch"
                    : isActive
                    ? "text-gold"
                    : "text-dim/60"
                }`}
              >
                {phase.label}
              </span>

              {/* Match count */}
              {total > 0 && (
                <span className="text-[9px] leading-none text-dim/50">
                  {done}/{total}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Match Card ───────────────────────────────────────────────────────────────

function MatchCard({ match }: { match: Match }) {
  const kind = statusKind(match.status);
  const hasScore =
    match.score.home !== null && match.score.away !== null;

  const homeTeam = match.homeTeam;
  const awayTeam = match.awayTeam;
  const homeLabel = match.homeLabel ?? homeTeam?.name ?? "TBD";
  const awayLabel = match.awayLabel ?? awayTeam?.name ?? "TBD";

  return (
    <article
      className="flex flex-col gap-2 rounded-xl border border-edge bg-panel p-3 transition-colors hover:border-edge/80 hover:bg-panel2"
      aria-label={`${homeLabel} vs ${awayLabel}`}
    >
      {/* Stage + status badge row */}
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-dim">
          {stageLabel(match.stage as Stage, match.group)}
        </span>

        {/* Status badge */}
        {kind === "live" && (
          <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase text-live">
            <span
              className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-live"
              aria-hidden
            />
            Live
          </span>
        )}
        {kind === "finished" && (
          <span className="shrink-0 text-[10px] font-semibold uppercase text-dim">
            FT
          </span>
        )}
        {kind === "upcoming" && (
          <LocalTime iso={match.utcDate} style="time" className="shrink-0 text-[10px] text-dim" />
        )}
        {kind === "other" && (
          <span className="shrink-0 text-[10px] text-dim uppercase">
            {match.status.toLowerCase()}
          </span>
        )}
      </div>

      {/* Teams + score row */}
      <div className="flex items-center justify-between gap-2">
        {/* Home */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Flag
            code={homeTeam?.code}
            name={homeTeam?.name}
            width={24}
            className="shrink-0"
          />
          <span className="truncate text-xs font-semibold text-ink">
            {homeLabel}
          </span>
        </div>

        {/* Score / vs */}
        <div className="shrink-0 px-2 text-center">
          {kind === "finished" && hasScore ? (
            <span className="font-display text-base font-bold text-ink tabular-nums">
              {match.score.home}&nbsp;–&nbsp;{match.score.away}
            </span>
          ) : kind === "live" && hasScore ? (
            <span className="font-display text-base font-bold text-live tabular-nums">
              {match.score.home}&nbsp;–&nbsp;{match.score.away}
            </span>
          ) : (
            <span className="font-display text-sm font-semibold text-dim">
              vs
            </span>
          )}
        </div>

        {/* Away */}
        <div className="flex min-w-0 flex-1 flex-row-reverse items-center gap-2">
          <Flag
            code={awayTeam?.code}
            name={awayTeam?.name}
            width={24}
            className="shrink-0"
          />
          <span className="truncate text-right text-xs font-semibold text-ink">
            {awayLabel}
          </span>
        </div>
      </div>

      {/* Venue */}
      {match.venue && (
        <p className="truncate text-[10px] text-dim/70">{match.venue}</p>
      )}
    </article>
  );
}

// ── Day Section ──────────────────────────────────────────────────────────────

function DaySection({
  bucket,
  matches,
  isToday,
}: {
  bucket: string;
  matches: Match[];
  isToday: boolean;
}) {
  const heading = formatDayHeading(bucket);

  return (
    <section
      id={`day-${bucket}`}
      aria-label={heading}
      className={`scroll-mt-20 rounded-2xl p-4 ${
        isToday
          ? "border border-gold/40 bg-gold/5 ring-1 ring-gold/20"
          : "border border-transparent"
      }`}
    >
      {/* Sticky date heading */}
      <div
        className={`sticky top-16 z-10 -mx-4 mb-4 flex items-center gap-3 px-4 py-2 backdrop-blur ${
          isToday ? "bg-gold/10" : "bg-navy/80"
        }`}
      >
        <h2
          className={`font-display text-sm font-bold uppercase tracking-widest ${
            isToday ? "text-gold" : "text-ink"
          }`}
        >
          {heading}
        </h2>
        {isToday && (
          <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy">
            Today
          </span>
        )}
        <span className="ml-auto text-[10px] text-dim">
          {matches.length} match{matches.length !== 1 ? "es" : ""}
        </span>
      </div>

      {/* Match grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>
    </section>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function TimelinePage() {
  const { data: matches } = await getAllMatches();

  // Sort all matches chronologically
  const sorted = [...matches].sort(
    (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime(),
  );

  // Group by day bucket
  const dayMap = new Map<string, Match[]>();
  for (const m of sorted) {
    const bucket = utcDateBucket(m.utcDate);
    const list = dayMap.get(bucket);
    if (list) {
      list.push(m);
    } else {
      dayMap.set(bucket, [m]);
    }
  }

  const days = Array.from(dayMap.entries()); // already ordered insertion order = sorted

  // Today's bucket
  const todayBucket = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-shell px-4 py-8">
      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide md:text-3xl">
            Tournament{" "}
            <span className="text-pitch">Timeline</span>
          </h1>
          <p className="mt-1 text-sm text-dim">
            {sorted.length} match{sorted.length !== 1 ? "es" : ""} across{" "}
            {days.length} match day{days.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Jump to today */}
        {dayMap.has(todayBucket) && (
          <a
            href={`#day-${todayBucket}`}
            className="rounded-lg border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold transition-colors hover:bg-gold/20"
          >
            Jump to Today
          </a>
        )}
      </div>

      {/* Phase progress bar */}
      <PhaseProgressBar matches={sorted} />

      {/* Day sections */}
      <div className="flex flex-col gap-6">
        {days.map(([bucket, dayMatches]) => (
          <DaySection
            key={bucket}
            bucket={bucket}
            matches={dayMatches}
            isToday={bucket === todayBucket}
          />
        ))}
      </div>
    </div>
  );
}
