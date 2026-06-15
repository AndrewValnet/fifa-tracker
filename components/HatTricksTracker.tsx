"use client";

import Link from "next/link";
import useSWR from "swr";
import { Flag } from "@/components/Flag";
import { jsonFetcher } from "@/hooks/fetcher";
import type { TournamentRecords, HatTrick } from "@/app/api/tournament-records/route";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function HatTricksTracker() {
  const { data, isLoading } = useSWR<TournamentRecords>("/api/tournament-records", jsonFetcher, {
    refreshInterval: 5 * 60_000,
    revalidateOnFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-10 w-full rounded" aria-hidden />
        ))}
      </div>
    );
  }

  const hattricks: HatTrick[] = data?.hatTricks ?? [];

  if (!hattricks.length) {
    return <p className="py-4 text-center text-sm text-dim">No hat-tricks yet this tournament.</p>;
  }

  return (
    <ul>
      {hattricks.map((h, i) => (
        <li
          key={`${h.matchId}-${h.player}`}
          className="flex items-center gap-3 border-t border-edge/50 py-2.5 text-sm first:border-t-0"
        >
          <span className="w-5 shrink-0 text-right font-mono text-xs text-dim">{i + 1}</span>
          <Flag code={h.teamCode} name={h.teamName} width={22} />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold leading-tight">{h.player}</span>
            <span className="text-[11px] text-dim">vs {h.opponent} · {fmtDate(h.date)}</span>
          </span>
          <span className="shrink-0 text-base">
            {Array.from({ length: Math.min(h.goals, 5) }).map((_, j) => (
              <span key={j} aria-hidden>⚽</span>
            ))}
            {h.goals > 3 && (
              <span className="ml-1 font-mono text-xs font-bold text-gold">×{h.goals}</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
