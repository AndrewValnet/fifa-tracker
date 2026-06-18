"use client";

import Link from "next/link";
import useSWR from "swr";
import { Flag } from "@/components/Flag";
import { LocalTime } from "@/components/LocalTime";
import { jsonFetcher } from "@/hooks/fetcher";
import type { MustWatchMatch } from "@/app/api/must-watch/route";

function ExcitementBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? "bg-live" : pct >= 55 ? "bg-gold" : "bg-pitch";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-edge/40">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-9 text-right font-mono text-[10px] text-dim">{pct}%</span>
    </div>
  );
}

export function MustWatchPanel() {
  const { data, isLoading } = useSWR<{ matches: MustWatchMatch[] }>(
    "/api/must-watch",
    jsonFetcher,
    { refreshInterval: 10 * 60_000, revalidateOnFocus: false },
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-16 w-full rounded-lg" aria-hidden />
        ))}
      </div>
    );
  }

  const matches = data?.matches ?? [];
  if (!matches.length) {
    return (
      <p className="surface-card rounded-2xl px-4 py-6 text-center text-sm text-dim">
        No upcoming matches with market data yet — check back closer to kickoff.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {matches.map((m, i) => (
        <li key={m.matchId}>
          <Link
            href={`/match/${m.matchId}`}
            prefetch={false}
            className="surface-card flex flex-col gap-1.5 rounded-2xl px-4 py-3 transition hover:border-pitch/35"
          >
            <div className="flex items-center gap-2">
              {i === 0 && (
                <span className="rounded-full bg-live/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-live">
                  🔥 Best match
                </span>
              )}
              <span className="ml-auto text-[10px] text-dim">
                <LocalTime iso={m.utcDate} style="datetime" />
              </span>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                <Flag code={m.homeCode} name={m.homeName} width={18} />
                <span className="truncate">{m.homeName}</span>
                {m.homeOdds !== null ? (
                  <span className="ml-auto font-mono text-[10px] font-normal text-dim">
                    {Math.round(m.homeOdds * 100)}%
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 text-xs text-dim">vs</span>
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                {m.awayOdds !== null ? (
                  <span className="mr-auto font-mono text-[10px] font-normal text-dim">
                    {Math.round(m.awayOdds * 100)}%
                  </span>
                ) : null}
                <span className="truncate text-right">{m.awayName}</span>
                <Flag code={m.awayCode} name={m.awayName} width={18} />
              </span>
            </div>

            <ExcitementBar score={m.excitementScore} />
          </Link>
        </li>
      ))}
    </ol>
  );
}
