"use client";

// Match card used on home strip, upcoming grid and team pages (PRD §7.1/7.3).

import Link from "next/link";
import type { CSSProperties } from "react";
import clsx from "clsx";
import { Flag } from "@/components/Flag";
import { LiveBadge } from "@/components/LiveBadge";
import { LocalTime } from "@/components/LocalTime";
import { MatchClock } from "@/components/MatchClock";
import { OddsBar } from "@/components/OddsBar";
import { useMatchOdds } from "@/hooks/useMatchOdds";
import { stageLabel, statusKind } from "@/lib/format";
import { getStadium } from "@/lib/schedule";
import { getAccentColor } from "@/lib/team-meta";
import type { Match } from "@/lib/types";

function SideLabel({ name, code, align }: { name: string; code: string | null; align: "left" | "right" }) {
  return (
    <div className={clsx("min-w-0 flex-1", align === "right" && "text-right")}>
      <p className="truncate text-sm font-semibold leading-tight">{name}</p>
      {code ? <p className="font-mono text-[10px] uppercase text-dim">{code}</p> : null}
    </div>
  );
}

export function MatchCard({
  match,
  withOdds = false,
  className = "",
}: {
  match: Match;
  withOdds?: boolean;
  className?: string;
}) {
  const kind = statusKind(match.status);
  const { odds } = useMatchOdds(withOdds ? match.id : null, withOdds);

  const homeName = match.homeTeam?.name ?? match.homeLabel ?? "TBD";
  const awayName = match.awayTeam?.name ?? match.awayLabel ?? "TBD";
  const stadium = getStadium(match.stadiumId);

  const style = {
    "--home-color": getAccentColor(match.homeTeam?.code),
    "--away-color": getAccentColor(match.awayTeam?.code),
  } as CSSProperties;

  return (
    <Link
      href={`/match/${match.id}`}
      prefetch={false}
      style={style}
      className={clsx(
        "match-card-hover block rounded-xl border border-edge bg-panel p-4",
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-dim">
        <span className="truncate">{stageLabel(match.stage, match.group)}</span>
        {kind === "live" ? (
          <span className="flex items-center gap-2">
            <MatchClock match={match} className="text-xs" />
            <LiveBadge tiny />
          </span>
        ) : kind === "finished" ? (
          <span className="font-mono font-semibold text-dim">FT</span>
        ) : (
          <LocalTime iso={match.utcDate} style="weekday" className="font-mono" />
        )}
      </div>

      <div className="flex items-center gap-3">
        <Flag code={match.homeTeam?.code} name={homeName} width={40} />
        <SideLabel name={homeName} code={match.homeTeam?.code ?? null} align="left" />

        <div className="px-1 text-center">
          {kind === "upcoming" ? (
            <LocalTime iso={match.utcDate} style="time" className="font-display text-lg font-semibold" />
          ) : (
            <p className="whitespace-nowrap font-display text-2xl font-bold tabular-nums">
              {match.score.home ?? "–"}
              <span className="px-1 text-dim">:</span>
              {match.score.away ?? "–"}
            </p>
          )}
        </div>

        <SideLabel name={awayName} code={match.awayTeam?.code ?? null} align="right" />
        <Flag code={match.awayTeam?.code} name={awayName} width={40} />
      </div>

      {stadium ? (
        <p className="mt-2 truncate text-[11px] text-dim">
          {stadium.name} · {stadium.city}
        </p>
      ) : null}

      {withOdds && odds && odds.kind === "match" ? (
        <div className="mt-3">
          <OddsBar
            home={odds.home}
            draw={odds.draw}
            away={odds.away}
            homeLabel={match.homeTeam?.code ?? "Home"}
            awayLabel={match.awayTeam?.code ?? "Away"}
            compact
          />
        </div>
      ) : null}
    </Link>
  );
}
