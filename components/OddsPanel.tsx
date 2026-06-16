"use client";

// Polymarket prediction-market panel (PRD §7.2): outcome probability bars,
// traded volume, win-probability trend sparkline, and the required disclaimer.

import { EmptyState } from "@/components/EmptyState";
import { OddsPanelSkeleton } from "@/components/LoadingSkeletons";
import { OddsBar } from "@/components/OddsBar";
import { useMatchOdds } from "@/hooks/useMatchOdds";
import { fmtUsdCompact } from "@/lib/format";
import type { Match, OddsHistoryPoint } from "@/lib/types";

function Sparkline({
  home,
  away,
}: {
  home?: OddsHistoryPoint[];
  away?: OddsHistoryPoint[];
}) {
  const series = [home, away].filter((s): s is OddsHistoryPoint[] => !!s && s.length > 1);
  if (!series.length) return null;

  const all = series.flat();
  const t0 = Math.min(...all.map((p) => p.t));
  const t1 = Math.max(...all.map((p) => p.t));
  if (t1 <= t0) return null;

  const W = 560;
  const H = 96;
  const path = (pts: OddsHistoryPoint[]) =>
    pts
      .map((p, i) => {
        const x = ((p.t - t0) / (t1 - t0)) * (W - 8) + 4;
        const y = H - 6 - p.p * (H - 16);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  const colors = ["var(--home-color)", "var(--away-color)"];
  const labels = ["home", "away"];
  return (
    <figure className="mt-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-24 w-full"
        role="img"
        aria-label="Win probability trend from Polymarket trade history"
      >
        {[0.25, 0.5, 0.75].map((g) => (
          <line
            key={g}
            x1="4"
            x2={W - 4}
            y1={H - 6 - g * (H - 16)}
            y2={H - 6 - g * (H - 16)}
            stroke="var(--border)"
            strokeWidth="1"
            strokeDasharray="3 5"
          />
        ))}
        {series.map((s, i) => (
          <path key={labels[i]} d={path(s)} fill="none" stroke={colors[i]} strokeWidth="2.2" strokeLinejoin="round" />
        ))}
      </svg>
      <figcaption className="mt-1 text-[10px] text-dim">
        Win-probability trend (last 7 days) — <span style={{ color: "var(--home-color)" }}>home</span> /{" "}
        <span style={{ color: "var(--away-color)" }}>away</span>
      </figcaption>
    </figure>
  );
}

export function OddsPanel({ match }: { match: Match }) {
  const { odds, isLoading } = useMatchOdds(match.id);
  const homeLabel = match.homeTeam?.name ?? "Home";
  const awayLabel = match.awayTeam?.name ?? "Away";

  if (isLoading && !odds) {
    return <OddsPanelSkeleton />;
  }

  if (!odds) {
    return (
      <EmptyState
        title="No Polymarket market found for this fixture yet."
        description="Odds will appear here once a matching Polymarket event is available."
        action={
          <a
            href="https://polymarket.com/sports"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pitch underline-offset-2 hover:underline"
          >
            Browse Polymarket sports
          </a>
        }
      />
    );
  }

  return (
    <div>
      {odds.kind === "tournament" ? (
        <p className="mb-3 rounded bg-panel2/70 px-3 py-2 text-xs text-dim">
          No per-match market yet — showing <span className="text-ink">tournament winner</span> odds instead.
        </p>
      ) : null}

      <OddsBar
        home={odds.home}
        draw={odds.draw}
        away={odds.away}
        homeLabel={homeLabel}
        awayLabel={awayLabel}
      />

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-panel2/70 px-2 py-2">
          <dt className="text-[10px] uppercase tracking-wider text-dim">💰 Total traded</dt>
          <dd className="font-mono text-sm font-semibold text-gold">{fmtUsdCompact(odds.volume)}</dd>
        </div>
        <div className="rounded-lg bg-panel2/70 px-2 py-2">
          <dt className="text-[10px] uppercase tracking-wider text-dim">24h volume</dt>
          <dd className="font-mono text-sm font-semibold">{fmtUsdCompact(odds.volume24h)}</dd>
        </div>
        <div className="rounded-lg bg-panel2/70 px-2 py-2">
          <dt className="text-[10px] uppercase tracking-wider text-dim">Liquidity</dt>
          <dd className="font-mono text-sm font-semibold">{fmtUsdCompact(odds.liquidity)}</dd>
        </div>
      </dl>

      <Sparkline home={odds.homeHistory} away={odds.awayHistory} />

      <p className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-dim">
        <span>
          Polymarket prediction-market odds — crowd-implied probabilities, not bookmaker odds.
        </span>
        {odds.url ? (
          <a
            href={odds.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-pitch underline-offset-2 hover:underline"
          >
            {odds.title} ↗
          </a>
        ) : null}
      </p>
    </div>
  );
}
