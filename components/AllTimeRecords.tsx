// Static component — displays all-time WC records from wc-legends.ts
import { Flag } from "@/components/Flag";
import {
  ALL_TIME_SCORERS,
  MOST_TOURNAMENTS,
  MOST_GAMES,
  TOURNAMENT_RECORDS,
  TEAM_RECORDS,
} from "@/lib/wc-legends";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-dim">
      {children}
    </h3>
  );
}

function PlayerTable({ rows, valueLabel }: { rows: { name: string; nation: string; value: number; detail?: string }[]; valueLabel: string }) {
  return (
    <table className="w-full">
      <thead>
        <tr className="text-[10px] uppercase tracking-wider text-dim/60">
          <th className="pb-1 text-left font-normal w-5"></th>
          <th className="pb-1 text-left font-normal">Player</th>
          <th className="pb-1 text-center font-normal">{valueLabel}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.name} className="border-t border-edge/30 text-sm">
            <td className="py-1.5 pr-1 font-mono text-xs text-dim">{i + 1}</td>
            <td className="py-1.5 pr-2">
              <div className="flex items-center gap-2">
                <Flag code={r.nation} name={r.nation} width={18} />
                <div>
                  <div className="font-semibold leading-tight">{r.name}</div>
                  {r.detail && (
                    <div className="text-[10px] text-dim">{r.detail}</div>
                  )}
                </div>
              </div>
            </td>
            <td className="py-1.5 text-center font-mono font-bold text-pitch">{r.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function AllTimeRecords() {
  return (
    <div className="flex flex-col gap-10">
      {/* Top scorers */}
      <section>
        <SectionTitle>All-time top goalscorers</SectionTitle>
        <PlayerTable rows={ALL_TIME_SCORERS} valueLabel="Goals" />
      </section>

      {/* Most tournaments */}
      <section>
        <SectionTitle>Most World Cup tournaments played</SectionTitle>
        <PlayerTable rows={MOST_TOURNAMENTS} valueLabel="WCs" />
      </section>

      {/* Most games */}
      <section>
        <SectionTitle>Most games played</SectionTitle>
        <PlayerTable rows={MOST_GAMES} valueLabel="Games" />
      </section>

      {/* Single-tournament records */}
      <section>
        <SectionTitle>Single-tournament records</SectionTitle>
        <table className="w-full">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-dim/60">
              <th className="pb-1 text-left font-normal">Record</th>
              <th className="pb-1 text-center font-normal">Value</th>
              <th className="pb-1 text-left font-normal pl-2">Holder</th>
            </tr>
          </thead>
          <tbody>
            {TOURNAMENT_RECORDS.map((r) => (
              <tr key={r.category} className="border-t border-edge/30 text-sm">
                <td className="py-1.5 pr-2 text-[11px] text-dim leading-tight">{r.category}</td>
                <td className="py-1.5 text-center font-mono font-bold text-pitch whitespace-nowrap">{r.value}</td>
                <td className="py-1.5 pl-2">
                  <div className="flex items-center gap-1.5">
                    <Flag code={r.nation} name={r.nation} width={16} />
                    <div>
                      <div className="font-semibold leading-tight text-xs">{r.holder}</div>
                      {r.detail && <div className="text-[10px] text-dim">{r.detail}</div>}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Team records */}
      <section>
        <SectionTitle>Team records</SectionTitle>
        <table className="w-full">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-dim/60">
              <th className="pb-1 text-left font-normal">Record</th>
              <th className="pb-1 text-center font-normal">Value</th>
              <th className="pb-1 text-left font-normal pl-2">Team</th>
            </tr>
          </thead>
          <tbody>
            {TEAM_RECORDS.map((r) => (
              <tr key={r.category} className="border-t border-edge/30 text-sm">
                <td className="py-1.5 pr-2 text-[11px] text-dim leading-tight">{r.category}</td>
                <td className="py-1.5 text-center font-mono font-bold text-pitch whitespace-nowrap">{r.value}</td>
                <td className="py-1.5 pl-2">
                  <div className="flex items-center gap-1.5">
                    <Flag code={r.nation} name={r.nation} width={16} />
                    <div>
                      <div className="font-semibold leading-tight text-xs">{r.team}</div>
                      {r.detail && <div className="text-[10px] text-dim">{r.detail}</div>}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
