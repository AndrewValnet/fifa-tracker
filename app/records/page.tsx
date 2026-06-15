import type { Metadata } from "next";
import { SectionHeader } from "@/components/SectionHeader";
import { AllTimeRecords } from "@/components/AllTimeRecords";
import { TvSchedule } from "@/components/TvSchedule";
import { DebutWatch } from "@/components/DebutWatch";

export const metadata: Metadata = {
  title: "Records & History | WC 2026",
  description: "All-time World Cup records, debut nations, TV broadcast schedule and historical stats.",
};

export default function RecordsPage() {
  return (
    <main className="mx-auto max-w-shell px-4 py-8">
      <h1 className="font-display text-2xl font-black uppercase tracking-tight mb-2">
        Records & History
      </h1>
      <p className="mb-10 text-sm text-dim">
        All-time World Cup records 1930–2022, WC 2026 debut nations, and where to watch.
      </p>

      {/* All-time Records */}
      <section className="mb-12" aria-label="All-time records">
        <SectionHeader title="All-Time Records" right="1930 – 2022 · 22 tournaments" />
        <div className="rounded-xl border border-edge bg-panel px-4 py-5">
          <AllTimeRecords />
        </div>
      </section>

      {/* WC Debut Nations */}
      <section className="mb-12 max-w-2xl" aria-label="Debut nations">
        <SectionHeader title="WC Debuts in 2026" right="first World Cup appearance" />
        <div className="rounded-xl border border-edge bg-panel px-4 py-4">
          <DebutWatch />
        </div>
      </section>

      {/* Where to Watch */}
      <section aria-label="TV broadcast schedule">
        <SectionHeader title="Where to Watch" right="broadcast rights by country" />
        <div className="rounded-xl border border-edge bg-panel px-4 py-5">
          <TvSchedule />
        </div>
      </section>
    </main>
  );
}
