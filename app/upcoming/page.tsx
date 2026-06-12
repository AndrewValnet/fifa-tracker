import type { Metadata } from "next";
import { UpcomingClient } from "@/components/UpcomingClient";
import { getAllMatches } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Matches & Schedule",
  description: "All 104 World Cup 2026 fixtures — filter by group, team, host country and date.",
};

export default async function UpcomingPage() {
  const all = await getAllMatches();
  return (
    <div className="mx-auto max-w-shell px-4 py-8">
      <h1 className="mb-6 font-display text-2xl font-bold uppercase tracking-wide md:text-3xl">
        Matches <span className="text-pitch">&amp; Schedule</span>
      </h1>
      <UpcomingClient initial={all} />
    </div>
  );
}
