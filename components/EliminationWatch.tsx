"use client";

import Link from "next/link";
import useSWR from "swr";
import { Flag } from "@/components/Flag";
import { jsonFetcher } from "@/hooks/fetcher";
import type { GroupQualProb } from "@/lib/monte-carlo";

interface EliminatedTeam {
  code: string | null;
  name: string;
  group: string;
  advanceChance: number;
  points: number;
  status: "eliminated" | "critical" | "danger";
}

export function EliminationWatch() {
  const { data, isLoading } = useSWR<GroupQualProb[]>("/api/monte-carlo", jsonFetcher, {
    refreshInterval: 10 * 60_000,
    revalidateOnFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-10 w-full rounded" aria-hidden />
        ))}
      </div>
    );
  }

  const teams: EliminatedTeam[] = [];
  for (const g of data ?? []) {
    for (const t of g.teams) {
      if (t.advance < 0.01) {
        teams.push({ ...t, group: g.group, advanceChance: t.advance, status: "eliminated" });
      } else if (t.advance < 0.10) {
        teams.push({ ...t, group: g.group, advanceChance: t.advance, status: "critical" });
      } else if (t.advance < 0.30) {
        teams.push({ ...t, group: g.group, advanceChance: t.advance, status: "danger" });
      }
    }
  }

  teams.sort((a, b) => a.advanceChance - b.advanceChance);

  if (!teams.length) {
    return <p className="py-4 text-center text-sm text-dim">No teams near elimination yet.</p>;
  }

  const statusColor: Record<EliminatedTeam["status"], string> = {
    eliminated: "text-live bg-live/10",
    critical: "text-[#f97316] bg-orange-500/10",
    danger: "text-gold bg-gold/10",
  };

  return (
    <ul className="flex flex-col gap-0">
      {teams.map((t) => (
        <li
          key={t.code ?? t.name}
          className="flex items-center gap-3 border-t border-edge/50 py-2 text-sm first:border-t-0"
        >
          <Flag code={t.code} name={t.name} width={22} />
          <span className="min-w-0 flex-1 truncate">
            {t.code ? (
              <Link
                href={`/teams/${t.code}`}
                prefetch={false}
                className="hover:text-gold hover:underline underline-offset-2"
              >
                {t.name}
              </Link>
            ) : (
              t.name
            )}
            <span className="ml-1 text-[11px] text-dim">Grp {t.group}</span>
          </span>
          <span className="font-mono text-xs text-dim">{t.points} pts</span>
          <span
            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusColor[t.status]}`}
          >
            {t.status === "eliminated" ? "Out" : `${Math.round(t.advanceChance * 100)}%`}
          </span>
        </li>
      ))}
    </ul>
  );
}
