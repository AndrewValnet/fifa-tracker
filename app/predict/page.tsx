import type { Metadata } from "next";
import Link from "next/link";
import { BracketPredictor } from "@/components/BracketPredictor";
import { PickemClient } from "@/components/PickemClientLazy";
import { SectionHeader } from "@/components/SectionHeader";

// Pure static shell; all data loads client-side in PickemClient.
export const metadata: Metadata = {
  title: "Office Prediction Pool - WC26 Live",
  description: "Create an account, predict scorelines, pick the champion, and climb the office leaderboard.",
};

export default function PredictPage() {
  return (
    <div className="mx-auto max-w-shell px-4 py-8">
      <Link href="/" className="text-xs text-dim hover:text-ink">
        &larr; War Room
      </Link>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-gold">World Cup office pool</p>
          <h1 className="mt-2 font-display text-3xl font-bold uppercase tracking-wide md:text-5xl">
            Predict &amp; <span className="text-gold">Pick&apos;em</span>
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-dim">
            Coworkers can create accounts, predict every scoreline, pick a champion, and follow a live leaderboard.
            Picks lock at kickoff, so the table stays fair once matches start.
          </p>
        </div>
        <div className="rounded-xl border border-edge bg-panel px-4 py-3 text-xs text-dim">
          <p className="font-display text-xl font-bold text-ink">6 / 4 / 3</p>
          <p>exact score / goal diff / result</p>
        </div>
      </div>

      <div className="mt-6">
        <PickemClient />
      </div>

      <section className="mt-12" aria-label="Bracket predictor">
        <SectionHeader title="Bracket Predictor" right="local sandbox" />
        <div className="rounded-xl border border-edge bg-panel px-4 py-5">
          <BracketPredictor />
        </div>
      </section>
    </div>
  );
}
