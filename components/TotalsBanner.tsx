"use client";

// War-room money strip: tournament-wide prediction-market totals.

import { useWcTotals } from "@/hooks/useWcTotals";
import { fmtUsdCompact } from "@/lib/format";

function Tile({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex min-w-[130px] flex-1 flex-col items-center gap-0.5 px-3 py-2">
      <span className={`font-display text-xl font-bold tabular-nums md:text-2xl ${accent ? "text-gold" : ""}`}>
        {value}
      </span>
      <span className="text-center text-[10px] uppercase tracking-widest text-dim">{label}</span>
    </div>
  );
}

export function TotalsBanner() {
  const { totals, isLoading } = useWcTotals();

  if (isLoading && !totals) {
    return (
      <section aria-label="Betting totals" className="mx-auto max-w-shell px-4 pt-6">
        <div className="skeleton h-20 w-full" aria-hidden />
      </section>
    );
  }
  if (!totals) return null;

  return (
    <section aria-label="Betting totals" className="mx-auto max-w-shell px-4 pt-6">
      <div className="rounded-xl border border-gold/25 bg-gradient-to-r from-panel via-panel2/70 to-panel">
        <div className="flex flex-wrap items-stretch divide-x divide-edge/50">
          <Tile label="Traded on WC26 markets" value={fmtUsdCompact(totals.traded)} accent />
          <Tile label="On match markets" value={fmtUsdCompact(totals.matchTraded)} />
          <Tile label="On futures (winner, groups…)" value={fmtUsdCompact(totals.futuresTraded)} />
          <Tile label="At stake right now" value={fmtUsdCompact(totals.atStake)} />
          <Tile label="Settled pools (paid out)" value={fmtUsdCompact(totals.settled)} />
        </div>
        <p className="border-t border-edge/50 px-4 py-1.5 text-[10px] text-dim">
          Across {totals.openEvents} open and {totals.closedEvents} settled World Cup markets on Polymarket — the
          platform with free public betting data. Settled pools pay the winning side in full; individual profit and
          loss are not published.
        </p>
      </div>
    </section>
  );
}
