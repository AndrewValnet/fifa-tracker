// Client-safe display formatters.

import type { Match, MatchStatus, Stage } from "@/lib/types";

export function fmtPct(p: number | null | undefined, digits = 0): string {
  if (p === null || p === undefined || !Number.isFinite(p)) return "-";
  return `${(p * 100).toFixed(digits)}%`;
}

/** "$13.8M", "$825K", "$950" */
export function fmtUsdCompact(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "-";
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return `$${Math.round(v)}`;
}

export function fmtNumber(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "-";
  return v.toLocaleString("en-US");
}

const STAGE_LABELS: Record<Stage, string> = {
  GROUP_STAGE: "Group Stage",
  LAST_32: "Round of 32",
  LAST_16: "Round of 16",
  QUARTER_FINALS: "Quarter-finals",
  SEMI_FINALS: "Semi-finals",
  THIRD_PLACE: "Third place",
  FINAL: "Final",
};

export function stageLabel(stage: Stage, group?: string | null): string {
  if (stage === "GROUP_STAGE" && group) return `Group ${group}`;
  return STAGE_LABELS[stage] ?? stage;
}

export function statusKind(status: MatchStatus): "live" | "upcoming" | "finished" | "other" {
  if (status === "IN_PLAY" || status === "PAUSED") return "live";
  if (status === "SCHEDULED" || status === "TIMED") return "upcoming";
  if (status === "FINISHED" || status === "AWARDED") return "finished";
  return "other";
}

export function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

/** Local-timezone kickoff formats (client only - see <LocalTime/>). */
export function fmtKickoff(iso: string, style: "time" | "datetime" | "date" | "weekday" = "datetime"): string {
  const d = new Date(iso);
  switch (style) {
    case "time":
      return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    case "date":
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    case "weekday":
      return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    default:
      return d.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
  }
}

/**
 * Approximate live clock for a match.
 * Prefers the provider-reported minute; otherwise derives from kickoff time
 * assuming a 15-minute half-time break.
 */
export function liveClock(m: Match, now: number = Date.now()): string {
  const reportedMinute =
    typeof m.minute === "number" && m.minute > 0
      ? m.minute > 90
        ? `90+${m.minute - 90}'`
        : `${m.minute}'`
      : null;

  if (m.status === "PAUSED") {
    const halftimeScoreKnown = m.score.halfTimeHome !== null && m.score.halfTimeHome !== undefined;
    if (reportedMinute && (!halftimeScoreKnown || m.minute! < 45 || m.minute! > 60)) return reportedMinute;
    return "HT";
  }
  if (m.status !== "IN_PLAY") return "";
  if (reportedMinute) return reportedMinute;

  const elapsed = Math.floor((now - new Date(m.utcDate).getTime()) / 60_000) + 1;
  if (elapsed < 1) return "1'";
  if (elapsed <= 45) return `${elapsed}'`;
  if (elapsed <= 49) return `45+${elapsed - 45}'`;
  if (elapsed <= 60) return "HT";
  const second = elapsed - 15;
  if (second <= 90) return `${second}'`;
  if (second <= 99) return `90+${second - 90}'`;
  return "90+'";
}

export function matchSlugTitle(m: Match): string {
  const home = m.homeTeam?.name ?? m.homeLabel ?? "TBD";
  const away = m.awayTeam?.name ?? m.awayLabel ?? "TBD";
  return `${home} vs ${away}`;
}
