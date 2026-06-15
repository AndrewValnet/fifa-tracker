"use client";

import Link from "next/link";
import useSWR from "swr";
import { Flag } from "@/components/Flag";
import { jsonFetcher } from "@/hooks/fetcher";
import type { Scorer, Sourced } from "@/lib/types";

export function AssistsLeaderboard() {
  const { data } = useSWR<Sourced<Scorer[]>>("/api/scorers?limit=30", jsonFetcher, {
    refreshInterval: 5 * 60_000,
    revalidateOnFocus: false,
  });
  const scorers = data?.data ?? [];
  const withAssists = scorers
    .filter((s) => (s.assists ?? 0) > 0)
    .sort((a, b) => (b.assists ?? 0) - (a.assists ?? 0) || b.goals - a.goals)
    .slice(0, 15);

  if (!withAssists.length) {
    return <p className="py-4 text-center text-sm text-dim">No assists recorded yet.</p>;
  }

  return (
    <ol>
      {withAssists.map((s, i) => (
        <li
          key={`${s.player}-${s.team.code ?? i}`}
          className="flex items-center gap-3 border-t border-edge/50 py-2 text-sm first:border-t-0"
        >
          <span className="w-5 shrink-0 text-right font-mono text-xs text-dim">{i + 1}</span>
          <Flag code={s.team.code} name={s.team.name} width={22} />
          <span className="min-w-0 flex-1 truncate">
            {s.team.code ? (
              <Link
                href={`/teams/${s.team.code}`}
                prefetch={false}
                className="hover:text-gold hover:underline underline-offset-2"
              >
                {s.player}
              </Link>
            ) : (
              s.player
            )}
          </span>
          <span className="font-mono text-sm font-semibold tabular-nums text-pitch">
            {s.assists} <span className="text-[10px] font-normal text-dim">ast</span>
          </span>
          {s.goals > 0 ? (
            <span className="w-10 shrink-0 text-right font-mono text-[11px] text-dim">
              {s.goals} ⚽
            </span>
          ) : (
            <span className="w-10" />
          )}
        </li>
      ))}
    </ol>
  );
}
