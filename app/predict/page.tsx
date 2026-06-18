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

      <div className="premium-border surface-glass mt-4 overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(255,209,102,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(0,229,139,0.16),transparent_32%)] p-5 md:p-8">
        <div className="grid gap-6 md:grid-cols-[1fr_300px] md:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-gold">World Cup office pool</p>
          <h1 className="hero-copy-gradient mt-2 max-w-4xl font-display text-4xl font-bold uppercase leading-tight tracking-wide md:text-6xl">
            Predict. Talk. Climb the table.
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-dim">
            Coworkers can create accounts, predict every scoreline, pick a champion, and follow a live leaderboard.
            Picks lock at kickoff, so the table stays fair once matches start.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-xs text-dim shadow-inner shadow-black/20">
          <p className="font-display text-4xl font-bold text-gold">6 / 4 / 3</p>
          <p className="mt-1">exact score / goal diff / result</p>
          <p className="mt-3 border-t border-white/10 pt-3">Champion pick adds 25 points at the end.</p>
        </div>
        </div>
      </div>

      <div className="mt-6">
        <PickemClient />
      </div>

      <section className="mt-12" aria-label="Bracket predictor">
        <SectionHeader title="Bracket Predictor" right="local sandbox" />
        <div className="surface-card rounded-2xl px-4 py-5">
          <BracketPredictor />
        </div>
      </section>
    </div>
  );
}
