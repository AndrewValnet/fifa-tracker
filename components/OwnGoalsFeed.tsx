"use client";

import useSWR from "swr";
import { Flag } from "@/components/Flag";
import { jsonFetcher } from "@/hooks/fetcher";
import type { TournamentRecords, OwnGoal } from "@/app/api/tournament-records/route";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function OwnGoalsFeed() {
  const { data, isLoading } = useSWR<TournamentRecords>("/api/tournament-records", jsonFetcher, {
    refreshInterval: 5 * 60_000,
    revalidateOnFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-9 w-full rounded" aria-hidden />
        ))}
      </div>
    );
  }

  const ogs: OwnGoal[] = data?.ownGoals ?? [];

  if (!ogs.length) {
    return <p className="py-4 text-center text-sm text-dim">No own goals this tournament.</p>;
  }

  return (
    <ul>
      {ogs.map((og) => (
        <li
          key={`${og.matchId}-${og.player}-${og.minute}`}
          className="flex items-center gap-3 border-t border-edge/50 py-2 text-sm first:border-t-0"
        >
          <Flag code={og.teamCode} name={og.teamName} width={22} />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold leading-tight">{og.player}</span>
            <span className="text-[11px] text-dim">{og.matchLabel} · {fmtDate(og.date)}</span>
          </span>
          <span className="shrink-0 rounded bg-live/10 px-1.5 py-0.5 font-mono text-xs font-bold text-live">
            OG {og.minute}&apos;
          </span>
        </li>
      ))}
    </ul>
  );
}
