import type { Metadata } from "next";
import Link from "next/link";
import { PickemClient } from "@/components/PickemClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Predict & Pick'em — WC26 Live",
  description: "Predict scorelines and the champion, then climb the leaderboard.",
};

export default function PredictPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/" className="text-xs text-dim hover:text-ink">
        ← War Room
      </Link>
      <h1 className="mt-3 font-display text-3xl font-bold uppercase tracking-wide md:text-4xl">
        Predict &amp; <span className="text-gold">Pick&apos;em</span>
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-dim">
        Call the scorelines, pick your champion, and see how you stack up. Come back to update picks before kickoff.
      </p>
      <div className="mt-6">
        <PickemClient />
      </div>
    </div>
  );
}
