"use client";

import Link from "next/link";
import useSWR from "swr";
import { Flag } from "@/components/Flag";
import { jsonFetcher } from "@/hooks/fetcher";
import type { TournamentRecords, CleanSheet } from "@/app/api/tournament-records/route";

export function CleanSheetsBoard() {
  const { data, isLoading } = useSWR<TournamentRecords>("/api/tournament-records", jsonFetcher, {
    refreshInterval: 5 * 60_000,
    revalidateOnFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-8 w-full rounded" aria-hidden />
        ))}
      </div>
    );
  }

  const sheets: CleanSheet[] = data?.cleanSheets ?? [];

  if (!sheets.length) {
    return <p className="py-4 text-center text-sm text-dim">No clean sheets yet.</p>;
  }

  return (
    <ol>
      {sheets.map((cs, i) => (
        <li
          key={cs.teamCode ?? cs.teamName}
          className="flex items-center gap-3 border-t border-edge/50 py-2 text-sm first:border-t-0"
        >
          <span className="w-5 shrink-0 text-right font-mono text-xs text-dim">{i + 1}</span>
          <Flag code={cs.teamCode} name={cs.teamName} width={22} />
          <span className="min-w-0 flex-1 truncate">
            {cs.teamCode ? (
              <Link
                href={`/teams/${cs.teamCode}`}
                prefetch={false}
                className="hover:text-gold hover:underline underline-offset-2"
              >
                {cs.teamName}
              </Link>
            ) : (
              cs.teamName
            )}
          </span>
          <span className="font-mono text-sm font-semibold tabular-nums text-pitch">
            {cs.count}
            <span className="ml-1 text-[10px] font-normal text-dim">clean sheet{cs.count !== 1 ? "s" : ""}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
