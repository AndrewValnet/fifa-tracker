// Collapsible per-group standings (PRD §7.1) — native <details> elements keep
// it accessible with zero client JS.

import { GroupStandingsTable } from "@/components/GroupStandingsTable";
import type { GroupStanding } from "@/lib/types";

export function StandingsAccordion({ standings }: { standings: GroupStanding[] }) {
  return (
    <div className="flex flex-col gap-2">
      {standings.map((g, i) => (
        <details
          key={g.group}
          open={i === 0}
          className="group rounded-xl border border-edge bg-panel open:bg-panel"
        >
          <summary className="flex cursor-pointer select-none items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold hover:bg-panel2/50">
            <span className="font-display tracking-wide">
              GROUP <span className="text-gold">{g.group}</span>
            </span>
            <span className="flex items-center gap-2 text-xs text-dim">
              {g.rows
                .slice(0, 2)
                .map((r) => r.team.code ?? r.team.name)
                .join(" · ")}
              <span aria-hidden className="transition-transform group-open:rotate-180">▾</span>
            </span>
          </summary>
          <div className="overflow-x-auto px-2 pb-3">
            <GroupStandingsTable standing={g} compact />
          </div>
        </details>
      ))}
    </div>
  );
}
