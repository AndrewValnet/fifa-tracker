// Group standings table (PRD §7.1/§7.4) with qualification color-coding:
// top two advance (green), third in contention for best-thirds (yellow),
// fourth eliminated once all games are played (red).

import Link from "next/link";
import clsx from "clsx";
import { Flag } from "@/components/Flag";
import type { GroupStanding } from "@/lib/types";

function qualClass(position: number, played: number): string {
  if (position <= 2) return "border-l-2 border-l-pitch/80";
  if (position === 3) return "border-l-2 border-l-gold/70";
  if (played >= 3) return "border-l-2 border-l-live/70 opacity-75";
  return "border-l-2 border-l-transparent";
}

function FormDots({ form }: { form: ("W" | "D" | "L")[] }) {
  if (!form.length) return <span className="text-dim">—</span>;
  return (
    <span className="flex items-center justify-end gap-1" aria-label={`Form: ${form.join(", ")}`}>
      {form.slice(-3).map((f, i) => (
        <span
          key={i}
          aria-hidden
          className={clsx(
            "inline-block h-2 w-2 rounded-full",
            f === "W" && "bg-pitch",
            f === "D" && "bg-dim/60",
            f === "L" && "bg-live",
          )}
        />
      ))}
    </span>
  );
}

export function GroupStandingsTable({
  standing,
  compact = false,
}: {
  standing: GroupStanding;
  compact?: boolean;
}) {
  return (
    <table className="w-full border-collapse text-sm">
      <caption className="sr-only">Group {standing.group} standings</caption>
      <thead>
        <tr className="text-[10px] uppercase tracking-wider text-dim">
          <th scope="col" className="py-1.5 pl-2 text-left font-medium">#</th>
          <th scope="col" className="py-1.5 text-left font-medium">Team</th>
          <th scope="col" className="py-1.5 text-right font-medium">P</th>
          {!compact ? (
            <>
              <th scope="col" className="py-1.5 text-right font-medium">W</th>
              <th scope="col" className="py-1.5 text-right font-medium">D</th>
              <th scope="col" className="py-1.5 text-right font-medium">L</th>
              <th scope="col" className="py-1.5 text-right font-medium">GF</th>
              <th scope="col" className="py-1.5 text-right font-medium">GA</th>
            </>
          ) : null}
          <th scope="col" className="py-1.5 text-right font-medium">GD</th>
          <th scope="col" className="py-1.5 text-right font-medium">Pts</th>
          <th scope="col" className="py-1.5 pr-2 text-right font-medium">Form</th>
        </tr>
      </thead>
      <tbody>
        {standing.rows.map((r) => (
          <tr
            key={r.team.id}
            className={clsx("border-t border-edge/60 hover:bg-panel2/40", qualClass(r.position, r.played))}
          >
            <td className="py-1.5 pl-2 font-mono text-xs text-dim">{r.position}</td>
            <td className="py-1.5">
              <Link
                href={r.team.code ? `/teams/${r.team.code}` : "/teams"}
                prefetch={false}
                className="flex items-center gap-2 hover:text-gold"
              >
                <Flag code={r.team.code} name={r.team.name} width={24} />
                <span className="truncate">{r.team.name}</span>
              </Link>
            </td>
            <td className="py-1.5 text-right font-mono text-xs">{r.played}</td>
            {!compact ? (
              <>
                <td className="py-1.5 text-right font-mono text-xs">{r.won}</td>
                <td className="py-1.5 text-right font-mono text-xs">{r.draw}</td>
                <td className="py-1.5 text-right font-mono text-xs">{r.lost}</td>
                <td className="py-1.5 text-right font-mono text-xs">{r.gf}</td>
                <td className="py-1.5 text-right font-mono text-xs">{r.ga}</td>
              </>
            ) : null}
            <td className="py-1.5 text-right font-mono text-xs">
              {r.gd > 0 ? `+${r.gd}` : r.gd}
            </td>
            <td className="py-1.5 text-right font-mono text-sm font-bold text-gold">{r.points}</td>
            <td className="py-1.5 pr-2">
              <FormDots form={r.form} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
