// Match events timeline (PRD §7.2): goals, cards, substitutions and drinks
// breaks — home events on the left, away on the right, breaks centered.
// Scorer names link to clip searches (no free API serves per-goal video URLs).

import clsx from "clsx";
import { ClipLink } from "@/components/ClipLink";
import type { Match, MatchEvent } from "@/lib/types";

const ICONS: Record<MatchEvent["type"], string> = {
  GOAL: "⚽",
  YELLOW: "🟨",
  RED: "🟥",
  SUB: "🔁",
  BREAK: "🥤",
};

function EventText({ e, match }: { e: MatchEvent; match: Match }) {
  if (e.type === "GOAL") {
    const extra = e.note === "pen" ? " (pen)" : e.note === "og" ? " (og)" : "";
    return (
      <>
        <ClipLink
          player={e.player}
          home={match.homeTeam?.name ?? "Home"}
          away={match.awayTeam?.name ?? "Away"}
        />
        <span className="text-dim">
          {extra}
          {e.secondary ? ` (${e.secondary})` : ""}
        </span>
      </>
    );
  }
  if (e.type === "SUB") {
    return (
      <span className="truncate">
        {e.secondary ?? "?"} ↔ {e.player}
      </span>
    );
  }
  return <span className="truncate">{e.player}</span>;
}

export function EventTimeline({ events, match }: { events: MatchEvent[]; match: Match }) {
  if (!events.length) {
    return <p className="py-4 text-center text-sm text-dim">No match events yet.</p>;
  }
  return (
    <ol className="flex flex-col gap-1.5">
      {events.map((e, i) => {
        // Drinks/cooling breaks are match-wide → centered, neutral.
        if (e.type === "BREAK") {
          return (
            <li key={`break-${e.minute}-${i}`} className="flex justify-center py-0.5">
              <span className="rounded-full border border-edge bg-panel2/60 px-3 py-1 text-xs text-dim">
                🥤 Drinks break{e.minute ? ` · ${e.minute}’` : ""}
              </span>
            </li>
          );
        }
        const home = e.side === "HOME";
        return (
          <li
            key={`${e.minute}-${e.player}-${i}`}
            className={clsx("flex items-center gap-3", home ? "flex-row" : "flex-row-reverse")}
          >
            <span
              className={clsx(
                "flex min-w-0 max-w-[60%] items-center gap-2 rounded-lg border border-edge bg-panel px-3 py-1.5 text-sm sm:max-w-[44%]",
                home ? "justify-start" : "flex-row-reverse text-right",
              )}
              style={{
                borderLeft: home ? `3px solid var(--home-color)` : undefined,
                borderRight: home ? undefined : `3px solid var(--away-color)`,
              }}
            >
              <span aria-hidden className="shrink-0">{ICONS[e.type]}</span>
              <EventText e={e} match={match} />
            </span>
            <span className="shrink-0 font-mono text-xs text-dim">{e.minute ? `${e.minute}’` : ""}</span>
            <span className="min-w-0 flex-1" aria-hidden />
          </li>
        );
      })}
    </ol>
  );
}
