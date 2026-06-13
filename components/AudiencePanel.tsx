"use client";

// Two distinct, never-merged numbers (per the app's provenance ethos):
//   1. REAL — concurrent + cumulative visitors on THIS dashboard (Upstash;
//      hidden unless configured). Honest, first-party, small.
//   2. ESTIMATE — modeled global TV audience, always tagged "est." Big, labeled.

import { useEffect, useState } from "react";
import reachData from "@/data/team-reach.json";
import { usePresence } from "@/hooks/usePresence";
import { estimateAudience, fmtAudience, type ReachLookup } from "@/lib/audience";
import { fmtNumber } from "@/lib/format";
import type { Match } from "@/lib/types";

const REACH = reachData as unknown as ReachLookup;

const DISCLAIMER =
  "FIFA and broadcasters don't publish live viewer counts through any free API. " +
  "This is a transparent model from match stage, the teams' reach and kickoff time, " +
  "anchored to Qatar 2022 (avg 175M/match, final ~571M/min). " +
  "The only real number here is people on WC26 Live right now.";

export function AudiencePanel({ match }: { match: Match }) {
  const presence = usePresence(match.id, true);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  const est = estimateAudience(match, REACH, now ?? new Date(match.utcDate).getTime());
  const live = est.phase === "live";

  const headline = live
    ? fmtAudience(est.watchingNowM)
    : fmtAudience(est.phase === "pre" ? est.avgLiveMinuteM : est.projectedTotalReachM);
  const headlineLabel = live ? "watching worldwide" : est.phase === "pre" ? "projected avg / min" : "estimated total reach";
  const subline = live
    ? `≈ ${fmtAudience(est.totalWatchedM)} reached so far · peak est. ${fmtAudience(est.avgLiveMinuteM)}/min`
    : est.phase === "pre"
      ? `≈ ${fmtAudience(est.projectedTotalReachM)} projected total reach`
      : `peak est. ${fmtAudience(est.avgLiveMinuteM)}/min`;

  return (
    <div className="flex flex-col gap-3">
      {/* REAL first-party presence (only when Upstash is configured) */}
      {presence?.enabled ? (
        <div className="rounded-lg border border-pitch/30 bg-pitch/5 px-3 py-2">
          <p className="flex items-center gap-2 text-sm">
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pitch opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-pitch" />
            </span>
            <span className="font-display text-xl font-bold tabular-nums">{fmtNumber(presence.watching ?? 0)}</span>
            <span className="text-dim">watching on WC26 Live now</span>
          </p>
          {presence.total != null ? (
            <p className="mt-0.5 text-[11px] text-dim">
              {fmtNumber(presence.total)} have opened this match here · real first-party count
            </p>
          ) : null}
        </div>
      ) : null}

      {/* ESTIMATED global audience (always labeled) */}
      <div>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-display text-2xl font-bold tabular-nums text-gold">{headline}</span>
          <span className="text-xs text-dim">{headlineLabel}</span>
          <span
            className="rounded border border-edge px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-dim"
            title={DISCLAIMER}
          >
            est.
          </span>
        </div>
        <p className="mt-1 text-[11px] text-dim">{subline}</p>
      </div>

      <p className="text-[10px] leading-snug text-dim" title={DISCLAIMER}>
        Modeled estimate — not a live TV count. Anchored to FIFA 2022 audience data. ⓘ
      </p>
    </div>
  );
}
