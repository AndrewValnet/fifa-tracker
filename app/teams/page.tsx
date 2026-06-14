import type { Metadata } from "next";
import Link from "next/link";
import { Flag } from "@/components/Flag";
import { TEAMS } from "@/lib/team-meta";

// The 48-team grid is fixed reference data — statically generated, CDN-served.
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Teams",
  description: "All 48 nations at the 2026 FIFA World Cup.",
};

export default function TeamsPage() {
  const sorted = [...TEAMS].sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-shell px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide md:text-3xl">
          The <span className="text-pitch">48</span> Nations
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {sorted.map((t) => (
          <Link
            key={t.code}
            href={`/teams/${t.code}`}
            className="match-card-hover flex flex-col items-center gap-2 rounded-xl border border-edge bg-panel px-3 py-5 text-center"
          >
            <Flag code={t.code} name={t.name} width={64} />
            <span className="text-sm font-semibold leading-tight">{t.name}</span>
            <span className="rounded-full border border-edge px-2 py-0.5 font-mono text-[10px] text-dim">
              Group {t.group}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
