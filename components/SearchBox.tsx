"use client";

// Instant search over the 48 teams (static) + recent matches (fetched once).
// Links straight to a team page; match results show home/away scores.

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { Flag } from "@/components/Flag";
import { TEAMS } from "@/lib/team-meta";
import { jsonFetcher } from "@/hooks/fetcher";
import { statusKind, fmtKickoff } from "@/lib/format";
import type { Match, Sourced } from "@/lib/types";

export function SearchBox() {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  // One-time fetch of all matches for search
  const { data: matchesData } = useSWR<Sourced<Match[]>>("/api/matches", jsonFetcher, {
    revalidateOnFocus: false,
    refreshInterval: 0,
  });

  const teamResults = query
    ? TEAMS.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.code.toLowerCase().includes(query) ||
          `group ${t.group}`.toLowerCase().includes(query),
      ).slice(0, 5)
    : [];

  const matchResults: Match[] = query
    ? (matchesData?.data ?? [])
        .filter((m) => {
          const home = (m.homeTeam?.name ?? "").toLowerCase();
          const away = (m.awayTeam?.name ?? "").toLowerCase();
          const homeCode = (m.homeTeam?.code ?? "").toLowerCase();
          const awayCode = (m.awayTeam?.code ?? "").toLowerCase();
          return (
            home.includes(query) ||
            away.includes(query) ||
            homeCode.includes(query) ||
            awayCode.includes(query)
          );
        })
        .slice(0, 4)
    : [];

  const hasTeams = teamResults.length > 0;
  const hasMatches = matchResults.length > 0;
  const hasResults = hasTeams || hasMatches;

  return (
    <div className="px-3 pb-1">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search teams or matches…"
        aria-label="Search teams and matches"
        className="w-full rounded-lg border border-edge bg-panel2 px-3 py-2 text-sm text-ink placeholder:text-dim"
      />
      {hasResults ? (
        <ul className="mt-1 overflow-hidden rounded-lg border border-edge bg-panel">
          {/* Teams section */}
          {hasTeams && (
            <>
              {teamResults.map((t) => (
                <li key={t.code}>
                  <Link
                    href={`/teams/${t.code}`}
                    onClick={() => setQ("")}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-panel2/70"
                  >
                    <Flag code={t.code} name={t.name} width={18} />
                    <span className="min-w-0 flex-1 truncate">{t.name}</span>
                    <span className="text-[10px] text-dim">Grp {t.group}</span>
                  </Link>
                </li>
              ))}
            </>
          )}

          {/* Divider between sections */}
          {hasTeams && hasMatches && (
            <li
              className="border-t border-edge px-3 py-1"
              aria-hidden
            >
              <span className="text-[10px] font-display uppercase tracking-wider text-dim">
                Matches
              </span>
            </li>
          )}

          {/* Matches section */}
          {hasMatches &&
            matchResults.map((m) => {
              const kind = statusKind(m.status);
              const isLive = kind === "live";
              const isFinished = kind === "finished";
              const homeScore = m.score.home;
              const awayScore = m.score.away;
              const hasScore = homeScore !== null && awayScore !== null;

              return (
                <li key={m.id}>
                  <Link
                    href={`/match/${m.id}`}
                    onClick={() => setQ("")}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-panel2/70"
                  >
                    <Flag code={m.homeTeam?.code} name={m.homeTeam?.name} width={16} />
                    <span className="min-w-0 shrink truncate text-xs text-ink/80 max-w-[60px]">
                      {m.homeTeam?.code ?? "?"}
                    </span>

                    <span className={`font-mono text-xs font-semibold tabular-nums shrink-0 ${isLive ? "text-pitch" : "text-ink"}`}>
                      {hasScore && (isFinished || isLive)
                        ? `${homeScore}-${awayScore}`
                        : "vs"}
                    </span>

                    <span className="min-w-0 shrink truncate text-xs text-ink/80 max-w-[60px]">
                      {m.awayTeam?.code ?? "?"}
                    </span>
                    <Flag code={m.awayTeam?.code} name={m.awayTeam?.name} width={16} />

                    <span className="ml-auto shrink-0 text-[10px] text-dim">
                      {isLive ? (
                        <span className="text-live font-semibold">LIVE {m.minute ? `${m.minute}'` : ""}</span>
                      ) : (
                        fmtKickoff(m.utcDate, "date")
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
        </ul>
      ) : null}
    </div>
  );
}
