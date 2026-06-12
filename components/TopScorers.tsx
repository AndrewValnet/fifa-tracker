// Top scorers widget (PRD §7.1). Free data tiers rarely include player
// photos, so we render initials avatars tinted in team colors.

import { Flag } from "@/components/Flag";
import { getTeamColors } from "@/lib/team-meta";
import type { Scorer } from "@/lib/types";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function TopScorers({ scorers }: { scorers: Scorer[] }) {
  if (!scorers.length) {
    return <p className="py-4 text-center text-sm text-dim">No goals scored yet — give it a matchday.</p>;
  }
  return (
    <ol className="flex flex-col">
      {scorers.map((s, i) => {
        const colors = getTeamColors(s.team.code);
        return (
          <li
            key={`${s.player}-${s.team.id}`}
            className="flex items-center gap-3 border-t border-edge/60 py-2 first:border-t-0"
          >
            <span className="w-5 text-right font-mono text-xs text-dim">{i + 1}</span>
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-ink/90"
              style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`, textShadow: "0 1px 2px rgba(0,0,0,.55)" }}
            >
              {initials(s.player)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{s.player}</span>
              <span className="flex items-center gap-1.5 text-[11px] text-dim">
                <Flag code={s.team.code} name={s.team.name} width={16} rounded={false} />
                {s.team.name}
              </span>
            </span>
            <span className="font-display text-xl font-bold text-gold">{s.goals}</span>
            {s.assists !== null ? (
              <span className="w-10 text-right font-mono text-[11px] text-dim">{s.assists} ast</span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
