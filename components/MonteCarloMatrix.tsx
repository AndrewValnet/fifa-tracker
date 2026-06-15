"use client";

import Link from "next/link";
import useSWR from "swr";
import { Flag } from "@/components/Flag";
import { jsonFetcher } from "@/hooks/fetcher";
import type { GroupQualProb, TeamQualProb } from "@/lib/monte-carlo";

function pct(v: number) {
  return `${Math.round(v * 100)}%`;
}

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-edge/30">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.round(value * 100)}%`, background: color }}
      />
    </div>
  );
}

function TeamRow({ t }: { t: TeamQualProb }) {
  const advancePct = Math.round(t.advance * 100);
  const barColor =
    advancePct >= 80
      ? "var(--color-pitch)"
      : advancePct >= 50
        ? "var(--color-gold)"
        : "var(--color-live)";

  return (
    <tr className="border-t border-edge/30 text-sm">
      <td className="py-1.5 pr-2">
        <div className="flex items-center gap-2">
          <Flag code={t.code} name={t.name} width={18} />
          {t.code ? (
            <Link
              href={`/teams/${t.code}`}
              prefetch={false}
              className="hover:text-gold hover:underline underline-offset-2 truncate"
            >
              {t.name}
            </Link>
          ) : (
            <span className="truncate">{t.name}</span>
          )}
        </div>
      </td>
      <td className="px-2 text-center font-mono text-xs text-dim">{t.points}</td>
      <td className="px-2">
        <div className="flex items-center gap-1.5">
          <span className="w-8 shrink-0 text-right font-mono text-xs font-semibold" style={{ color: barColor }}>
            {pct(t.advance)}
          </span>
          <div className="w-16">
            <Bar value={t.advance} color={barColor} />
          </div>
        </div>
      </td>
      <td className="px-2 text-right font-mono text-xs text-dim">{pct(t.first)}</td>
      <td className="px-2 text-right font-mono text-xs text-dim">{pct(t.second)}</td>
      <td className="pl-2 text-right font-mono text-xs text-dim/60">{pct(t.third)}</td>
    </tr>
  );
}

function GroupMatrix({ g }: { g: GroupQualProb }) {
  return (
    <div className="mb-6 last:mb-0">
      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-dim">Group {g.group}</h3>
      <table className="w-full">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-dim/60">
            <th className="pb-1 text-left font-normal">Team</th>
            <th className="pb-1 text-center font-normal">Pts</th>
            <th className="pb-1 text-left font-normal pl-2">Advance</th>
            <th className="pb-1 text-right font-normal">1st</th>
            <th className="pb-1 text-right font-normal">2nd</th>
            <th className="pb-1 text-right font-normal pl-2">3rd</th>
          </tr>
        </thead>
        <tbody>
          {g.teams.map((t) => (
            <TeamRow key={t.code ?? t.name} t={t} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MonteCarloMatrix() {
  const { data, isLoading } = useSWR<GroupQualProb[]>("/api/monte-carlo", jsonFetcher, {
    refreshInterval: 10 * 60_000,
    revalidateOnFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-32 w-full rounded-lg" aria-hidden />
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return <p className="py-6 text-center text-sm text-dim">Qualification data unavailable.</p>;
  }

  return (
    <div>
      <p className="mb-4 text-[11px] text-dim">
        Based on 8,000 Monte Carlo simulations of remaining group matches. 1st + 2nd = guaranteed advance.
      </p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((g) => (
          <div key={g.group} className="rounded-xl border border-edge bg-panel px-4 py-3">
            <GroupMatrix g={g} />
          </div>
        ))}
      </div>
    </div>
  );
}
