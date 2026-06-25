"use client";

// Horizontal scrolling ticker bar showing live + recently finished matches.
// Polls /api/live-matches every 30s; fetches /api/matches once for recents.

import useSWR from "swr";
import { jsonFetcher } from "@/hooks/fetcher";
import { Flag } from "@/components/Flag";
import { effectiveStatusKind, statusKind } from "@/lib/format";
import type { Match, Sourced } from "@/lib/types";

export function LiveScoresTicker() {
  const { data: liveData } = useSWR<Sourced<Match[]>>("/api/live-matches", jsonFetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  });

  const { data: allData } = useSWR<Sourced<Match[]>>("/api/matches", jsonFetcher, {
    revalidateOnFocus: false,
    refreshInterval: 0,
  });

  const liveMatches = liveData?.data ?? [];

  const recentFinished = (allData?.data ?? [])
    .filter((m) => statusKind(m.status) === "finished")
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
    .slice(0, 6);

  const allItems = [...liveMatches, ...recentFinished];

  if (allItems.length === 0) return null;

  // Duplicate items so the loop looks seamless
  const items = [...allItems, ...allItems];

  return (
    <div
      className="bg-panel border-b border-edge overflow-hidden"
      style={{ height: 40 }}
    >
      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          display: flex;
          align-items: center;
          animation: ticker ${Math.max(20, allItems.length * 8)}s linear infinite;
          will-change: transform;
          width: max-content;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        .live-dot {
          animation: pulse-dot 1.2s ease-in-out infinite;
        }
      `}</style>

      <div className="ticker-track h-full">
        {items.map((match, i) => {
          const isLive = effectiveStatusKind(match) === "live";
          const homeScore = match.score.home ?? 0;
          const awayScore = match.score.away ?? 0;
          const scoreStr = `${homeScore}-${awayScore}`;

          return (
            <div
              key={`${match.id}-${i}`}
              className="flex items-center gap-1.5 px-4 h-full font-mono text-xs text-ink shrink-0"
              style={{ borderRight: "1px solid rgba(255,255,255,0.07)" }}
            >
              {isLive && (
                <span
                  className="live-dot inline-block w-1.5 h-1.5 rounded-full bg-live shrink-0"
                  aria-label="Live"
                />
              )}

              <Flag
                code={match.homeTeam?.code}
                name={match.homeTeam?.name}
                width={16}
              />

              <span className={`font-semibold tabular-nums ${isLive ? "text-pitch" : "text-ink"}`}>
                {scoreStr}
              </span>

              <Flag
                code={match.awayTeam?.code}
                name={match.awayTeam?.name}
                width={16}
              />

              {isLive && match.minute !== null && (
                <span className="text-dim ml-0.5">{match.minute}&apos;</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
