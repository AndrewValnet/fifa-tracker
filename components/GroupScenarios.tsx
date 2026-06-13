// "What needs to happen to advance" — renders the group scenario calculator
// output. Server component (pure data in). No client JS.

import { Flag } from "@/components/Flag";
import type { GroupScenario } from "@/lib/qualification";

const STATUS_STYLE: Record<string, { dot: string; label: string }> = {
  through: { dot: "bg-pitch", label: "Through" },
  hunt: { dot: "bg-gold", label: "In the hunt" },
  out: { dot: "bg-live", label: "Out" },
};

function GroupCard({ g }: { g: GroupScenario }) {
  return (
    <section className="rounded-xl border border-edge bg-panel p-4" aria-label={`Group ${g.group} scenarios`}>
      <h3 className="mb-2 flex items-baseline justify-between font-display text-base font-semibold tracking-wide">
        <span>
          GROUP <span className="text-gold">{g.group}</span>
        </span>
        <span className="text-[10px] font-normal uppercase tracking-wider text-dim">
          {g.decided ? "decided" : `${g.remaining} match${g.remaining === 1 ? "" : "es"} left`}
        </span>
      </h3>
      <ul className="flex flex-col">
        {g.teams.map((t) => {
          const s = STATUS_STYLE[t.status];
          return (
            <li key={t.code} className="flex items-center gap-2.5 border-t border-edge/50 py-1.5 text-sm first:border-t-0">
              <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`} title={s.label} />
              <Flag code={t.code} name={t.name} width={20} />
              <span className="w-7 shrink-0 font-mono text-xs text-dim">{t.points}p</span>
              <span className="min-w-0 flex-1 truncate text-[12px] text-dim">{t.hint}</span>
              {t.status === "hunt" && t.qualifyPct > 0 && t.qualifyPct < 1 ? (
                <span className="shrink-0 font-mono text-[10px] text-gold" title="Share of remaining results that put them in the top 2">
                  {Math.round(t.qualifyPct * 100)}%
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function GroupScenarios({ groups }: { groups: GroupScenario[] }) {
  const live = groups.filter((g) => !g.decided);
  const shown = live.length ? live : groups;
  if (!shown.length) return null;
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {shown.map((g) => (
        <GroupCard key={g.group} g={g} />
      ))}
    </div>
  );
}
