// Prediction-market money picture for one team (Polymarket pool framing).

import { fmtPct, fmtUsdCompact } from "@/lib/format";
import type { TeamFinance } from "@/lib/types";

function Tile({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" | "gold" }) {
  const color = tone === "up" ? "text-pitch" : tone === "down" ? "text-live" : tone === "gold" ? "text-gold" : "";
  return (
    <div className="rounded-lg border border-edge bg-panel2/60 px-3 py-2.5 text-center">
      <p className={`font-display text-xl font-bold tabular-nums ${color}`}>{value}</p>
      <p className="mt-0.5 text-[10px] uppercase leading-tight tracking-wider text-dim">{label}</p>
    </div>
  );
}

export function TeamFinancePanel({ finance, teamName }: { finance: TeamFinance; teamName: string }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Tile label={`Bet on ${teamName} to win matches`} value={fmtUsdCompact(finance.backedVolume)} tone="gold" />
        <Tile label="Traded on their matches (all outcomes)" value={fmtUsdCompact(finance.matchVolume)} />
        <Tile label="At stake on open markets" value={fmtUsdCompact(finance.atStake)} />
        <Tile label="Pools won by their backers" value={fmtUsdCompact(finance.settledWonPools)} tone="up" />
        <Tile label="Pools lost by their backers" value={fmtUsdCompact(finance.settledLostPools)} tone="down" />
        {finance.outright ? (
          <Tile
            label={`To win the World Cup (${fmtUsdCompact(finance.outright.volume)} traded)`}
            value={fmtPct(finance.outright.price, 1)}
            tone="gold"
          />
        ) : null}
      </div>

      {finance.rows.length ? (
        <table className="mt-3 w-full text-xs">
          <caption className="sr-only">Per-match market breakdown</caption>
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-dim">
              <th className="py-1 font-medium">Market</th>
              <th className="py-1 text-right font-medium">Traded</th>
              <th className="py-1 text-right font-medium">On them</th>
              <th className="py-1 text-right font-medium">Result</th>
            </tr>
          </thead>
          <tbody>
            {finance.rows.map((r) => (
              <tr key={r.eventSlug} className="border-t border-edge/50">
                <td className="py-1.5">
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="hover:text-gold">
                    {r.label} ↗
                  </a>
                </td>
                <td className="py-1.5 text-right font-mono">{fmtUsdCompact(r.volume)}</td>
                <td className="py-1.5 text-right font-mono">{fmtUsdCompact(r.teamMarketVolume)}</td>
                <td className="py-1.5 text-right">
                  {r.outcome === "open" ? (
                    <span className="text-dim">open</span>
                  ) : r.outcome === "won" ? (
                    <span className="font-semibold text-pitch">backers won</span>
                  ) : (
                    <span className="font-semibold text-live">backers lost</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      <p className="mt-3 text-[10px] leading-relaxed text-dim">
        Polymarket public data. “Pools” = open interest of a settled market, paid in full to the winning side;
        per-bettor profit and loss are not published. Prediction-market odds, not bookmaker odds.
      </p>
    </div>
  );
}
