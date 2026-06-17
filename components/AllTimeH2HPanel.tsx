import { findH2H } from "@/data/historical-h2h";
import { Flag } from "@/components/Flag";
import { SectionHeader } from "@/components/SectionHeader";
import { getTeamColors, teamName } from "@/lib/team-meta";

export interface AllTimeH2HPanelProps {
  codeA: string | null;
  codeB: string | null;
}

export function AllTimeH2HPanel({ codeA, codeB }: AllTimeH2HPanelProps) {
  if (!codeA || !codeB) {
    return (
      <div className="rounded-lg border border-edge bg-panel p-4 text-sm text-dim">
        Select two teams to view their head-to-head record.
      </div>
    );
  }

  const record = findH2H(codeA, codeB);

  if (!record) {
    return (
      <div className="rounded-lg border border-edge bg-panel p-4">
        <SectionHeader title="All-time Record" />
        <p className="text-sm text-dim">No historical data for this matchup.</p>
      </div>
    );
  }

  const nameA = teamName(codeA) ?? codeA;
  const nameB = teamName(codeB) ?? codeB;
  const colorsA = getTeamColors(codeA);
  const colorsB = getTeamColors(codeB);

  const totalGoals = `${record.goalsA} – ${record.goalsB}`;

  return (
    <div className="rounded-lg border border-edge bg-panel p-4">
      <SectionHeader title="All-time Record" />

      {/* Team banners */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Flag code={codeA} name={nameA} width={40} />
          <span className="font-display text-base font-semibold uppercase tracking-wider">
            {codeA}
          </span>
        </div>
        <span className="font-mono text-xs text-dim">vs</span>
        <div className="flex items-center gap-2">
          <span className="font-display text-base font-semibold uppercase tracking-wider">
            {codeB}
          </span>
          <Flag code={codeB} name={nameB} width={40} />
        </div>
      </div>

      {/* Win / Draw / Win boxes */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        {/* Team A wins */}
        <div
          className="flex flex-col items-center rounded-md border py-3"
          style={{
            borderColor: colorsA.primary,
            background: `${colorsA.primary}18`,
          }}
        >
          <span
            className="font-display text-2xl font-bold"
            style={{ color: colorsA.primary }}
          >
            {record.winsA}
          </span>
          <span className="mt-0.5 font-display text-[10px] uppercase tracking-widest text-dim">
            {codeA}
          </span>
        </div>

        {/* Draws */}
        <div className="flex flex-col items-center rounded-md border border-edge bg-panel2 py-3">
          <span className="font-display text-2xl font-bold text-dim">
            {record.draws}
          </span>
          <span className="mt-0.5 font-display text-[10px] uppercase tracking-widest text-dim">
            Draws
          </span>
        </div>

        {/* Team B wins */}
        <div
          className="flex flex-col items-center rounded-md border py-3"
          style={{
            borderColor: colorsB.primary,
            background: `${colorsB.primary}18`,
          }}
        >
          <span
            className="font-display text-2xl font-bold"
            style={{ color: colorsB.primary }}
          >
            {record.winsB}
          </span>
          <span className="mt-0.5 font-display text-[10px] uppercase tracking-widest text-dim">
            {codeB}
          </span>
        </div>
      </div>

      {/* Goals */}
      <div className="mb-3 flex items-center justify-between rounded-md border border-edge bg-panel2 px-4 py-2">
        <span className="text-xs text-dim">Goals</span>
        <span className="font-mono text-sm font-semibold">{totalGoals}</span>
      </div>

      {/* Last meeting */}
      <div className="mb-2 rounded-md border border-edge bg-panel2 px-4 py-2">
        <div className="mb-1 text-[10px] uppercase tracking-widest text-dim">
          Last meeting
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-white/90">{record.lastMeeting}</span>
          <span className="font-mono text-sm font-semibold text-gold">
            {record.lastResultA}&nbsp;–&nbsp;{record.lastResultB}
          </span>
        </div>
      </div>

      {/* Most memorable match */}
      <div className="mb-3 rounded-md border border-edge bg-panel2 px-4 py-2">
        <div className="mb-1 text-[10px] uppercase tracking-widest text-dim">
          Most memorable
        </div>
        <p className="text-sm italic text-white/70">{record.mostMemorable}</p>
      </div>

      {/* Footnote */}
      <p className="text-right text-[10px] text-dim">
        {record.played} matches played all-time
      </p>
    </div>
  );
}
