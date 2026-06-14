// Two-column "biggest bets" + "weirdest bets" list. Pure presentational (server-
// or client-renderable). Volumes are live Polymarket figures, labeled as traded.

import { fmtPct, fmtUsdCompact } from "@/lib/format";
import type { BetRow } from "@/lib/types";

function Row({ b }: { b: BetRow }) {
  return (
    <li className="flex items-center gap-2 border-t border-edge/50 py-1.5 text-sm first:border-t-0">
      <a href={b.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate hover:text-gold">
        {b.label}
      </a>
      {b.price !== null ? <span className="shrink-0 font-mono text-[11px] text-dim">{fmtPct(b.price)}</span> : null}
      <span className="w-14 shrink-0 text-right font-mono text-xs text-gold">{fmtUsdCompact(b.volume)}</span>
    </li>
  );
}

export function BetsLists({ top, weird }: { top: BetRow[]; weird: BetRow[] }) {
  return (
    <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      <div>
        <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-dim">💰 Biggest bets</h4>
        {top.length ? (
          <ul>{top.map((b) => <Row key={b.url + b.label} b={b} />)}</ul>
        ) : (
          <p className="py-2 text-xs text-dim">No markets yet.</p>
        )}
      </div>
      <div>
        <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-dim">🤪 Weirdest bets</h4>
        {weird.length ? (
          <ul>{weird.map((b) => <Row key={b.url + b.label} b={b} />)}</ul>
        ) : (
          <p className="py-2 text-xs text-dim">No novelty markets yet.</p>
        )}
      </div>
    </div>
  );
}
