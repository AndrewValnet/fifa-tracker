import type { Metadata } from "next";
import Link from "next/link";
import { Flag } from "@/components/Flag";
import { SourceTag } from "@/components/SourceTag";
import { getTeams } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Teams",
  description: "All 48 nations at the 2026 FIFA World Cup.",
};

export default async function TeamsPage() {
  const teams = await getTeams();
  const sorted = [...teams.data].sort(
    (a, b) => (a.group ?? "Z").localeCompare(b.group ?? "Z") || a.name.localeCompare(b.name),
  );

  return (
    <div className="mx-auto max-w-shell px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide md:text-3xl">
          The <span className="text-pitch">48</span> Nations
        </h1>
        <SourceTag source={teams.source} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {sorted.map((t) => (
          <Link
            key={t.id}
            href={`/teams/${t.code ?? t.id}`}
            className="match-card-hover flex flex-col items-center gap-2 rounded-xl border border-edge bg-panel px-3 py-5 text-center"
          >
            <Flag code={t.code} name={t.name} width={64} />
            <span className="text-sm font-semibold leading-tight">{t.name}</span>
            <span className="rounded-full border border-edge px-2 py-0.5 font-mono text-[10px] text-dim">
              Group {t.group ?? "?"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
