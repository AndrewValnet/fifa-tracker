import { Flag } from "@/components/Flag";
import { SectionHeader } from "@/components/SectionHeader";
import { INJURIES, type InjuryRecord } from "@/data/injury-tracker";

// Map FIFA team codes to full display names
const TEAM_NAMES: Record<string, string> = {
  ARG: "Argentina",
  BRA: "Brazil",
  ENG: "England",
  ESP: "Spain",
  FRA: "France",
  GER: "Germany",
  ITA: "Italy",
  JPN: "Japan",
  MAR: "Morocco",
  MEX: "Mexico",
  NED: "Netherlands",
  POR: "Portugal",
  USA: "United States",
};

function teamDisplayName(code: string): string {
  return TEAM_NAMES[code] ?? code;
}

const POSITION_COLORS: Record<InjuryRecord["position"], string> = {
  GK: "bg-[#1a3a6b] text-[#7eb3ff]",
  DEF: "bg-[#1a3b2a] text-pitch",
  MID: "bg-[#2a2a1a] text-gold",
  FWD: "bg-[#3b1a1a] text-live",
};

const STATUS_PILL: Record<
  InjuryRecord["status"],
  { label: string; classes: string }
> = {
  out: {
    label: "OUT",
    classes: "bg-live/20 text-live border border-live/30",
  },
  doubt: {
    label: "DOUBT",
    classes: "bg-gold/20 text-gold border border-gold/30",
  },
  returned: {
    label: "FIT",
    classes: "bg-pitch/20 text-pitch border border-pitch/30",
  },
};

function InjuryRow({ record }: { record: InjuryRecord }) {
  const pill = STATUS_PILL[record.status];
  const posCls = POSITION_COLORS[record.position];

  return (
    <li className="flex items-start gap-3 py-2.5 border-b border-edge/50 last:border-0">
      {/* Position badge */}
      <span
        className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 font-display text-[10px] font-semibold uppercase tracking-wider ${posCls}`}
        aria-label={`Position: ${record.position}`}
      >
        {record.position}
      </span>

      {/* Player info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-display text-sm font-semibold text-white">
            {record.player}
          </span>
          <span className="text-xs text-dim">{record.injury}</span>
        </div>
        <p className="mt-0.5 text-[11px] leading-relaxed text-dim/80">
          {record.note}
        </p>
      </div>

      {/* Status pill */}
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider ${pill.classes}`}
        aria-label={`Status: ${pill.label}`}
      >
        {pill.label}
      </span>
    </li>
  );
}

export function InjuryTrackerPanel() {
  // Group by team, sorted alphabetically by display name
  const grouped = new Map<string, InjuryRecord[]>();
  for (const rec of INJURIES) {
    const existing = grouped.get(rec.teamCode);
    if (existing) {
      existing.push(rec);
    } else {
      grouped.set(rec.teamCode, [rec]);
    }
  }

  const sortedTeams = Array.from(grouped.entries()).sort(([a], [b]) =>
    teamDisplayName(a).localeCompare(teamDisplayName(b))
  );

  const totalOut = INJURIES.filter((r) => r.status === "out").length;
  const totalDoubt = INJURIES.filter((r) => r.status === "doubt").length;
  const totalFit = INJURIES.filter((r) => r.status === "returned").length;

  return (
    <section aria-label="Injury tracker">
      <SectionHeader
        title="Injury Tracker"
        right={
          <span className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-live" />
              <span className="text-dim">{totalOut} out</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-gold" />
              <span className="text-dim">{totalDoubt} doubt</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-pitch" />
              <span className="text-dim">{totalFit} fit</span>
            </span>
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedTeams.map(([code, records]) => (
          <div
            key={code}
            className="rounded-xl border border-edge bg-panel p-4"
          >
            {/* Team header */}
            <div className="mb-3 flex items-center gap-2.5">
              <Flag code={code} name={teamDisplayName(code)} width={32} />
              <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-white">
                {teamDisplayName(code)}
              </h3>
              <span className="ml-auto text-[11px] text-dim">
                {records.length} player{records.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Injury list */}
            <ul aria-label={`${teamDisplayName(code)} injuries`}>
              {records.map((rec) => (
                <InjuryRow key={`${rec.teamCode}-${rec.player}`} record={rec} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
