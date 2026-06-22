import { Flag } from "@/components/Flag";
import { MatchClock } from "@/components/MatchClock";
import { contrastText, getTeamColors, resolveTeamCode } from "@/lib/team-meta";
import { stageLabel, statusKind } from "@/lib/format";
import type { Match, TeamDetail } from "@/lib/types";

interface MatchFaceoffBannerProps {
  match: Match;
  homeDetail: TeamDetail | null;
  awayDetail: TeamDetail | null;
  liveClock?: string | null;
  highlightsHref?: string | null;
}

function formatMatchDate(utcDate: string): string {
  const d = new Date(utcDate);
  const month = d.toLocaleString("en-US", { month: "short", timeZone: "America/New_York" });
  const day = d.toLocaleString("en-US", { day: "numeric", timeZone: "America/New_York" });
  const time = d.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    hour12: true,
  });
  return `${month} ${day} · ${time} ET`;
}

export function MatchFaceoffBanner({ match, liveClock, highlightsHref }: MatchFaceoffBannerProps) {
  const homeCode = resolveTeamCode(match.homeTeam?.code, match.homeTeam?.name);
  const awayCode = resolveTeamCode(match.awayTeam?.code, match.awayTeam?.name);

  const homeColors = getTeamColors(homeCode);
  const awayColors = getTeamColors(awayCode);

  const homeTextColor = contrastText(homeColors.primary);
  const awayTextColor = contrastText(awayColors.primary);

  const kind = statusKind(match.status);
  const isLive = kind === "live";
  const isFinished = kind === "finished";
  const isUpcoming = kind === "upcoming";

  const homeScore = match.score.home;
  const awayScore = match.score.away;
  const hasScore = homeScore !== null && awayScore !== null;

  const stageLbl = stageLabel(match.stage, match.group);

  const gradientStyle = {
    background: `linear-gradient(to right, ${homeColors.primary} 0%, ${homeColors.primary} 45%, ${awayColors.primary} 55%, ${awayColors.primary} 100%)`,
  };

  const homeName = match.homeTeam?.name ?? match.homeLabel ?? "TBD";
  const awayName = match.awayTeam?.name ?? match.awayLabel ?? "TBD";

  return (
    <div className="relative w-full overflow-hidden rounded-xl" style={gradientStyle}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(
            105deg,
            transparent 0%,
            transparent 44%,
            rgba(0,0,0,0.35) 44%,
            rgba(0,0,0,0.35) 56%,
            transparent 56%,
            transparent 100%
          )`,
        }}
      />

      <div className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-8 md:py-10">
        <div className="flex flex-col items-center gap-3 text-center" style={{ color: homeTextColor }}>
          <Flag code={homeCode} name={homeName} width={64} className="shadow-xl" />
          <div>
            <p className="font-display text-2xl font-bold uppercase leading-tight tracking-widest md:text-3xl">
              {match.homeTeam?.code ?? homeCode ?? homeName}
            </p>
            <p className="mt-1 font-mono text-xs uppercase tracking-wider opacity-80 md:text-sm">{homeName}</p>
          </div>
        </div>

        <div className="flex min-w-[140px] flex-col items-center gap-2 md:min-w-[200px]">
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-0.5 font-mono text-xs uppercase tracking-widest text-white/70 shadow-inner shadow-black/20">
            {stageLbl}
          </span>

          {isFinished && hasScore ? (
            <div className="flex items-center gap-3">
              <span className="font-display text-5xl font-black text-white drop-shadow-lg md:text-6xl">{homeScore}</span>
              <span className="font-display text-3xl font-bold text-white/60">–</span>
              <span className="font-display text-5xl font-black text-white drop-shadow-lg md:text-6xl">{awayScore}</span>
            </div>
          ) : isLive && hasScore ? (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-3">
                <span className="font-display text-5xl font-black text-white drop-shadow-lg md:text-6xl">{homeScore}</span>
                <span className="font-display text-3xl font-bold text-white/60">–</span>
                <span className="font-display text-5xl font-black text-white drop-shadow-lg md:text-6xl">{awayScore}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff3b30] opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#ff3b30]" />
                </span>
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#ff3b30]">
                  {match.status === "PAUSED" ? "HT" : "Live"}
                  <span className="ml-1">
                    <MatchClock
                      match={match}
                      accurate={liveClock ?? (match.minute ? String(match.minute) : null)}
                      className="text-xs font-bold"
                    />
                  </span>
                </span>
              </div>
            </div>
          ) : isUpcoming ? (
            <div className="flex flex-col items-center gap-1">
              <span className="font-display text-2xl font-bold tracking-wide text-white md:text-3xl">VS</span>
              <span className="font-mono text-center text-xs text-white/80 md:text-sm">{formatMatchDate(match.utcDate)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {hasScore ? (
                <>
                  <span className="font-display text-5xl font-black text-white drop-shadow-lg md:text-6xl">{homeScore}</span>
                  <span className="font-display text-3xl font-bold text-white/60">–</span>
                  <span className="font-display text-5xl font-black text-white drop-shadow-lg md:text-6xl">{awayScore}</span>
                </>
              ) : (
                <span className="font-display text-2xl font-bold tracking-wide text-white">VS</span>
              )}
            </div>
          )}

          {isFinished ? <span className="font-mono text-xs uppercase tracking-widest text-white/60">Full Time</span> : null}

          {match.venue ? (
            <span className="max-w-[160px] text-center font-mono text-xs leading-snug text-white/50">{match.venue}</span>
          ) : null}

          {isFinished ? (
            <a
              href={highlightsHref ?? `https://www.youtube.com/results?search_query=${encodeURIComponent(`${homeName} vs ${awayName} highlights ${new Date(match.utcDate).getFullYear()}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/90 transition hover:border-pitch/60 hover:text-pitch"
            >
              Highlights
              <span aria-hidden>↗</span>
            </a>
          ) : null}
        </div>

        <div className="flex flex-col items-center gap-3 text-center" style={{ color: awayTextColor }}>
          <Flag code={awayCode} name={awayName} width={64} className="shadow-xl" />
          <div>
            <p className="font-display text-2xl font-bold uppercase leading-tight tracking-widest md:text-3xl">
              {match.awayTeam?.code ?? awayCode ?? awayName}
            </p>
            <p className="mt-1 font-mono text-xs uppercase tracking-wider opacity-80 md:text-sm">{awayName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MatchFaceoffBanner;
