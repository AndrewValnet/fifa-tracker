"use client";

// Full win-probability timeline from Polymarket trade history, with goal
// markers overlaid from the match's own events. Self-contained card; renders
// nothing until there are at least two history points.

import { useMatchOdds } from "@/hooks/useMatchOdds";
import { fmtPct } from "@/lib/format";
import { parseMinute } from "@/lib/schedule";
import type { Match, OddsHistoryPoint } from "@/lib/types";

const W = 720;
const H = 200;
const PAD = { l: 6, r: 6, t: 14, b: 18 };

function buildPath(pts: OddsHistoryPoint[], t0: number, t1: number, fill: boolean): string {
  const x = (t: number) => PAD.l + ((t - t0) / (t1 - t0)) * (W - PAD.l - PAD.r);
  const y = (p: number) => PAD.t + (1 - p) * (H - PAD.t - PAD.b);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.t).toFixed(1)},${y(p.p).toFixed(1)}`).join(" ");
  if (!fill) return line;
  return `${line} L${x(pts[pts.length - 1].t).toFixed(1)},${(H - PAD.b).toFixed(1)} L${x(pts[0].t).toFixed(1)},${(H - PAD.b).toFixed(1)} Z`;
}

export function WinProbGraph({ match }: { match: Match }) {
  const { odds } = useMatchOdds(match.id);
  const home = odds?.homeHistory;
  const away = odds?.awayHistory;
  const series = [home, away].filter((s): s is OddsHistoryPoint[] => !!s && s.length > 1);
  if (!series.length) return null;

  const all = series.flat();
  const t0 = Math.min(...all.map((p) => p.t));
  const t1 = Math.max(...all.map((p) => p.t));
  if (t1 <= t0) return null;

  const x = (t: number) => PAD.l + ((t - t0) / (t1 - t0)) * (W - PAD.l - PAD.r);
  const kickoffSec = Math.floor(new Date(match.utcDate).getTime() / 1000);
  const goals = match.events
    .filter((e) => e.type === "GOAL")
    .map((e) => ({ t: kickoffSec + parseMinute(e.minute) * 60, side: e.side, player: e.player, minute: e.minute }))
    .filter((g) => g.t >= t0 && g.t <= t1);

  const homeNow = home?.length ? home[home.length - 1].p : odds?.home ?? null;
  const awayNow = away?.length ? away[away.length - 1].p : odds?.away ?? null;

  return (
    <section className="surface-card rounded-2xl p-4 md:p-5">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold uppercase tracking-wider">
          <span aria-hidden className="inline-block h-4 w-1 rounded bg-gold" />
          Win Probability
        </h2>
        <div className="flex items-center gap-3 font-mono text-xs">
          <span style={{ color: "var(--home-color)" }}>{match.homeTeam?.code ?? "H"} {fmtPct(homeNow)}</span>
          <span style={{ color: "var(--away-color)" }}>{match.awayTeam?.code ?? "A"} {fmtPct(awayNow)}</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Win probability over time with goal markers">
        <defs>
          <linearGradient id="wp-home" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--home-color)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--home-color)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => {
          const y = PAD.t + (1 - g) * (H - PAD.t - PAD.b);
          return (
            <g key={g}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 5" />
              <text x={PAD.l + 2} y={y - 2} fontSize="9" fill="var(--text-dim, #8a93a6)">
                {g * 100}%
              </text>
            </g>
          );
        })}

        {home && home.length > 1 ? <path d={buildPath(home, t0, t1, true)} fill="url(#wp-home)" stroke="none" /> : null}
        {home && home.length > 1 ? (
          <path d={buildPath(home, t0, t1, false)} fill="none" stroke="var(--home-color)" strokeWidth="2.4" strokeLinejoin="round" />
        ) : null}
        {away && away.length > 1 ? (
          <path d={buildPath(away, t0, t1, false)} fill="none" stroke="var(--away-color)" strokeWidth="2.4" strokeLinejoin="round" strokeDasharray="5 3" />
        ) : null}

        {goals.map((g, i) => {
          const gx = x(g.t);
          return (
            <g key={i}>
              <line x1={gx} x2={gx} y1={PAD.t} y2={H - PAD.b} stroke="var(--text, #f0f4ff)" strokeOpacity="0.25" strokeWidth="1" />
              <text x={gx} y={PAD.t - 3} textAnchor="middle" fontSize="11">
                ⚽
              </text>
            </g>
          );
        })}
      </svg>

      <p className="mt-2 text-[10px] text-dim">
        Crowd-implied win probability from Polymarket trade history (≈7-day window){goals.length ? " · ⚽ = goal" : ""}.{" "}
        <span style={{ color: "var(--home-color)" }}>{match.homeTeam?.code ?? "home"}</span> solid /{" "}
        <span style={{ color: "var(--away-color)" }}>{match.awayTeam?.code ?? "away"}</span> dashed.
      </p>
    </section>
  );
}
