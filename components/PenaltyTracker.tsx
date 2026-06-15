"use client";

import useSWR from "swr";
import { Flag } from "@/components/Flag";
import { jsonFetcher } from "@/hooks/fetcher";
import type { TournamentRecords, PenaltyShootout } from "@/app/api/tournament-records/route";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function PenaltyTracker() {
  const { data, isLoading } = useSWR<TournamentRecords>("/api/tournament-records", jsonFetcher, {
    refreshInterval: 5 * 60_000,
    revalidateOnFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-12 w-full rounded" aria-hidden />
        ))}
      </div>
    );
  }

  const shootouts: PenaltyShootout[] = data?.penaltyShootouts ?? [];

  if (!shootouts.length) {
    return <p className="py-4 text-center text-sm text-dim">No penalty shootouts yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {shootouts.map((ps) => (
        <li
          key={ps.matchId}
          className="rounded-lg border border-edge bg-surface p-3"
        >
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-dim">
              Penalty Shootout · {fmtDate(ps.date)}
            </span>
            <span className="font-mono text-sm font-bold text-pitch">{ps.score}</span>
          </div>
          <div className="flex items-center gap-2">
            <Flag code={ps.winnerCode} name={ps.winner} width={22} />
            <span className="font-semibold">{ps.winner}</span>
            <span className="ml-auto text-[10px] text-dim">def.</span>
            <span className="text-dim">{ps.loser}</span>
            <Flag code={ps.loserCode} name={ps.loser} width={22} />
          </div>
        </li>
      ))}
    </ul>
  );
}
