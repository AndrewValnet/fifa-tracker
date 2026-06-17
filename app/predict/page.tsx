import type { Metadata } from "next";
import Link from "next/link";
import { BracketPredictor } from "@/components/BracketPredictor";
import { PickemClient } from "@/components/PickemClientLazy";
import { SectionHeader } from "@/components/SectionHeader";

export const metadata: Metadata = {
  title: "Prediction Pool — WC26 Live",
  description:
    "Create an account, predict every scoreline, pick the World Cup champion, call the Ballon d'Or winner, and climb the office leaderboard.",
};

export default function PredictPage() {
  return (
    <div className="mx-auto max-w-shell px-4 py-8">
      <Link href="/" className="text-xs text-dim hover:text-ink">
        &larr; War Room
      </Link>

      {/* Hero */}
      <div className="mt-4 overflow-hidden rounded-xl border border-edge pitch-horizontal bg-[linear-gradient(135deg,rgba(11,18,32,0.98),rgba(58,9,28,0.72))]">
        <div className="grid gap-6 p-5 md:grid-cols-[1fr_280px] md:items-end md:p-7">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-gold">⚽ World Cup Office Pool</p>
            <h1 className="mt-2 max-w-4xl font-display text-4xl font-bold uppercase leading-tight tracking-wide md:text-6xl">
              Predict. Compete. Own the table.
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-dim">
              Call every scoreline, pick the World Cup champion, and predict the Ballon d&apos;Or winner.
              Picks lock at kickoff — the leaderboard stays honest.
            </p>
          </div>

          {/* Scoring breakdown */}
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 md:grid-cols-2">
            <div className="rounded-lg border border-pitch/30 bg-pitch/5 px-3 py-3">
              <p className="font-display text-3xl font-bold text-pitch">6</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-wider text-dim">Exact score</p>
            </div>
            <div className="rounded-lg border border-gold/30 bg-gold/5 px-3 py-3">
              <p className="font-display text-3xl font-bold text-gold">4</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-wider text-dim">+Goal diff</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-3">
              <p className="font-display text-3xl font-bold text-ink">+25</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-wider text-dim">Champion</p>
            </div>
            <div className="rounded-lg border border-[#9333ea]/30 bg-[#9333ea]/5 px-3 py-3">
              <p className="font-display text-3xl font-bold text-[#c084fc]">+15</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-wider text-dim">Ballon d&apos;Or</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <PickemClient />
      </div>

      <section className="mt-12" aria-label="Bracket predictor">
        <SectionHeader title="Bracket Predictor" right="local sandbox — not scored" />
        <div className="rounded-xl border border-edge bg-panel px-4 py-5">
          <BracketPredictor />
        </div>
      </section>
    </div>
  );
}
