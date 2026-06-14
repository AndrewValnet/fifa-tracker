// Two-column "biggest bets" + "weirdest bets" lists. Each row stacks the market
// label over three stats — implied chance, money traded, and payout-if-it-hits
// (1/price) — so it stays readable in both the wide home section and the narrow
// match-page panel. Volumes/prices are live Polymarket figures.

import { fmtPct, fmtUsdCompact } from "@/lib/format";
import type { BetRow } from "@/lib/types";

function chanceLabel(p: number | null): string {
  if (p === null) return "—";
  return p < 0.1 ? fmtPct(p, 1) : fmtPct(p, 0);
}

function payoutLabel(p: number | null): string | null {
  if (p === null || p <= 0) return null;
  const x = 1 / p; // gross return per $1 staked if the outcome hits
  if (x >= 100) return `${Math.round(x)}×`;
  if (x >= 10) return `${x.toFixed(0)}×`;
  return `${x.toFixed(1)}×`;
}

function Row({ b }: { b: BetRow }) {
  const payout = payoutLabel(b.price);
  return (
    <li className="border-t border-edge/50 py-2 first:border-t-0">
      <a
        href={b.url}
        target="_blank"
        rel="noopener noreferrer"
        className="line-clamp-2 block text-sm font-medium leading-snug hover:text-gold"
      >
        {b.label}
      </a>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-dim">
        <span title="Implied chance of happening">
          <span className="font-mono text-ink">{chanceLabel(b.price)}</span> chance
        </span>
        <span title="Total money traded on this market">
          <span className="font-mono text-ink">{fmtUsdCompact(b.volume)}</span> bet
        </span>
        {payout ? (
          <span title="Payout per $1 staked if it hits">
            <span className="font-mono text-gold">{payout}</span> if it hits
          </span>
        ) : null}
      </div>
    </li>
  );
}

export function BetsLists({ top, weird }: { top: BetRow[]; weird: BetRow[] }) {
  return (
    <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
      <div>
        <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-dim">💰 Biggest bets</h4>
        {top.length ? (
          <ul>{top.map((b) => <Row key={b.url + b.label} b={b} />)}</ul>
        ) : (
          <p className="py-2 text-xs text-dim">No markets yet.</p>
        )}
      </div>
      <div>
        <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-dim">🤪 Weirdest bets</h4>
        {weird.length ? (
          <ul>{weird.map((b) => <Row key={b.url + b.label} b={b} />)}</ul>
        ) : (
          <p className="py-2 text-xs text-dim">No novelty markets yet.</p>
        )}
      </div>
    </div>
  );
}
