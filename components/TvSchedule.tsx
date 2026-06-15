// Static component — displays TV broadcast rights from tv-rights.ts
import { TV_MARKETS } from "@/lib/tv-rights";

export function TvSchedule() {
  const freeMarkets = TV_MARKETS.filter((m) => m.free);
  const paidMarkets = TV_MARKETS.filter((m) => !m.free);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-pitch">
          Free-to-air coverage
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {freeMarkets.map((m) => (
            <MarketCard key={m.region} market={m} />
          ))}
        </div>
      </div>
      {paidMarkets.length > 0 && (
        <div>
          <h3 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-dim">
            Paid / subscription only
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {paidMarkets.map((m) => (
              <MarketCard key={m.region} market={m} />
            ))}
          </div>
        </div>
      )}
      <p className="text-[11px] text-dim">
        Rights data as of tournament start June 2026. Subject to change. Check local listings.
      </p>
    </div>
  );
}

function MarketCard({ market }: { market: (typeof TV_MARKETS)[number] }) {
  return (
    <div className="rounded-lg border border-edge bg-panel p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xl" aria-hidden>{market.flag}</span>
        <span className="font-semibold leading-tight">{market.region}</span>
      </div>
      <div className="mb-1 flex flex-wrap gap-1">
        {market.channels.map((ch) => (
          <span key={ch} className="rounded bg-edge/30 px-1.5 py-0.5 text-[10px] font-medium text-dim">
            {ch}
          </span>
        ))}
      </div>
      {market.streaming && market.streaming.length > 0 && (
        <div className="mb-1 flex flex-wrap gap-1">
          {market.streaming.map((s) => (
            <span
              key={s}
              className="rounded bg-pitch/10 px-1.5 py-0.5 text-[10px] font-medium text-pitch"
            >
              📱 {s}
            </span>
          ))}
        </div>
      )}
      {market.note && (
        <p className="mt-1.5 text-[10px] leading-relaxed text-dim">{market.note}</p>
      )}
    </div>
  );
}
