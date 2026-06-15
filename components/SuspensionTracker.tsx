"use client";

import Link from "next/link";
import useSWR from "swr";
import { Flag } from "@/components/Flag";
import { jsonFetcher } from "@/hooks/fetcher";
import type { PlayerSuspension } from "@/lib/suspensions";

function PlayerRow({ p }: { p: PlayerSuspension }) {
  return (
    <li className="flex items-center gap-2.5 border-t border-edge/50 py-1.5 text-sm first:border-t-0">
      {p.teamCode ? (
        <Link href={`/teams/${p.teamCode}`} prefetch={false} className="contents">
          <Flag code={p.teamCode} name={p.teamName} width={20} />
        </Link>
      ) : (
        <Flag code={p.teamCode} name={p.teamName} width={20} />
      )}
      <span className="min-w-0 flex-1 truncate">{p.player}</span>
      <span className="shrink-0 font-mono text-xs text-dim">
        {p.teamName}
      </span>
      <span className="flex shrink-0 items-center gap-0.5">
        {Array.from({ length: p.yellows }).map((_, i) => (
          <span key={i} aria-hidden className="text-sm">🟨</span>
        ))}
      </span>
    </li>
  );
}

export function SuspensionTracker() {
  const { data, isLoading } = useSWR<{ suspensions: PlayerSuspension[] }>(
    "/api/suspensions",
    jsonFetcher,
    { refreshInterval: 5 * 60_000, revalidateOnFocus: false },
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-8 w-full rounded" aria-hidden />
        ))}
      </div>
    );
  }

  const all = data?.suspensions ?? [];
  const suspended = all.filter((p) => p.suspended);
  const atRisk = all.filter((p) => p.atRisk);

  if (!all.length) {
    return (
      <p className="py-4 text-center text-sm text-dim">No yellow cards recorded yet.</p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {suspended.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-live">
            🚫 Suspended for next match
          </p>
          <ul>
            {suspended.map((p) => (
              <PlayerRow key={`${p.player}|${p.teamCode}`} p={p} />
            ))}
          </ul>
        </div>
      )}
      {atRisk.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gold">
            ⚠️ One yellow from a ban
          </p>
          <ul>
            {atRisk.slice(0, 14).map((p) => (
              <PlayerRow key={`${p.player}|${p.teamCode}`} p={p} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
