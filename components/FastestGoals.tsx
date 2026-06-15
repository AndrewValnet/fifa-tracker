"use client";

import Link from "next/link";
import useSWR from "swr";
import { Flag } from "@/components/Flag";
import { jsonFetcher } from "@/hooks/fetcher";
import type { TournamentRecords, FastGoal } from "@/app/api/tournament-records/route";

export function FastestGoals() {
  const { data, isLoading } = useSWR<TournamentRecords>("/api/tournament-records", jsonFetcher, {
    refreshInterval: 5 * 60_000,
    revalidateOnFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-9 w-full rounded" aria-hidden />
        ))}
      </div>
    );
  }

  const goals: FastGoal[] = data?.fastestGoals ?? [];

  if (!goals.length) {
    return <p className="py-4 text-center text-sm text-dim">No goals in the first 5 minutes recorded yet.</p>;
  }

  return (
    <ol>
      {goals.map((g, i) => (
        <li
          key={`${g.matchId}-${g.player}-${i}`}
          className="flex items-center gap-3 border-t border-edge/50 py-2 text-sm first:border-t-0"
        >
          <span className="w-5 shrink-0 text-right font-mono text-xs text-dim">{i + 1}</span>
          <Flag code={g.teamCode} name={g.teamName} width={22} />
          <span className="min-w-0 flex-1 truncate">
            {g.teamCode ? (
              <Link
                href={`/teams/${g.teamCode}`}
                prefetch={false}
                className="hover:text-gold hover:underline underline-offset-2"
              >
                {g.player}
              </Link>
            ) : (
              g.player
            )}
          </span>
          <span className="shrink-0 font-mono text-xs text-dim truncate max-w-[120px]">{g.matchLabel}</span>
          <span className="shrink-0 rounded bg-pitch/20 px-1.5 py-0.5 font-mono text-xs font-bold text-pitch">
            {g.minuteRaw}&apos;
          </span>
        </li>
      ))}
    </ol>
  );
}
