import { Flag } from "@/components/Flag";
import { getTeamColors, resolveTeamCode, contrastText } from "@/lib/team-meta";
import { stageLabel, statusKind } from "@/lib/format";
import type { Match, TeamDetail } from "@/lib/types";

interface MatchFaceoffBannerProps {
  match: Match;
  homeDetail: TeamDetail | null;
  awayDetail: TeamDetail | null;
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

export function MatchFaceoffBanner({ match }: MatchFaceoffBannerProps) {
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
    <div className="relative w-full rounded-xl overflow-hidden" style={gradientStyle}>
      {/* Diagonal skew overlay for split effect */}
      <div
        className="absolute inset-0 pointer-events-none"
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

      {/* Main content grid */}
      <div className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-8 md:py-10">

        {/* Home team — left side */}
        <div
          className="flex flex-col items-center gap-3 text-center"
          style={{ color: homeTextColor }}
        >
          <Flag code={homeCode} name={homeName} width={64} className="shadow-xl" />
          <div>
            <p className="font-display text-2xl md:text-3xl font-bold uppercase tracking-widest leading-tight">
              {match.homeTeam?.code ?? homeCode ?? homeName}
            </p>
            <p className="font-mono text-xs md:text-sm mt-1 opacity-80 uppercase tracking-wider">
              {homeName}
            </p>
          </div>
        </div>

        {/* Center — status, score, stage */}
        <div className="flex flex-col items-center gap-2 min-w-[140px] md:min-w-[200px]">
          {/* Stage / group label */}
          <span className="font-mono text-xs uppercase tracking-widest text-white/70 bg-black/30 rounded-full px-3 py-0.5">
            {stageLbl}
          </span>

          {/* Score or time */}
          {isFinished && hasScore ? (
            <div className="flex items-center gap-3">
              <span className="font-display text-5xl md:text-6xl font-black text-white drop-shadow-lg">
                {homeScore}
              </span>
              <span className="font-display text-3xl text-white/60 font-bold">–</span>
              <span className="font-display text-5xl md:text-6xl font-black text-white drop-shadow-lg">
                {awayScore}
              </span>
            </div>
          ) : isLive && hasScore ? (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-3">
                <span className="font-display text-5xl md:text-6xl font-black text-white drop-shadow-lg">
                  {homeScore}
                </span>
                <span className="font-display text-3xl text-white/60 font-bold">–</span>
                <span className="font-display text-5xl md:text-6xl font-black text-white drop-shadow-lg">
                  {awayScore}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff3b30] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ff3b30]" />
                </span>
                <span className="font-mono text-xs text-[#ff3b30] uppercase font-bold tracking-widest">
                  {match.status === "PAUSED" ? "HT" : "Live"}
                  {match.minute ? ` · ${match.minute}'` : ""}
                </span>
              </div>
            </div>
          ) : isUpcoming ? (
            <div className="flex flex-col items-center gap-1">
              <span className="font-display text-2xl md:text-3xl text-white font-bold tracking-wide">
                VS
              </span>
              <span className="font-mono text-xs md:text-sm text-white/80 text-center">
                {formatMatchDate(match.utcDate)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {hasScore ? (
                <>
                  <span className="font-display text-5xl md:text-6xl font-black text-white drop-shadow-lg">
                    {homeScore}
                  </span>
                  <span className="font-display text-3xl text-white/60 font-bold">–</span>
                  <span className="font-display text-5xl md:text-6xl font-black text-white drop-shadow-lg">
                    {awayScore}
                  </span>
                </>
              ) : (
                <span className="font-display text-2xl text-white font-bold tracking-wide">VS</span>
              )}
            </div>
          )}

          {/* Finished label */}
          {isFinished && (
            <span className="font-mono text-xs uppercase tracking-widest text-white/60">
              Full Time
            </span>
          )}

          {/* Venue */}
          {match.venue && (
            <span className="font-mono text-xs text-white/50 text-center max-w-[160px] leading-snug">
              {match.venue}
            </span>
          )}
        </div>

        {/* Away team — right side */}
        <div
          className="flex flex-col items-center gap-3 text-center"
          style={{ color: awayTextColor }}
        >
          <Flag code={awayCode} name={awayName} width={64} className="shadow-xl" />
          <div>
            <p className="font-display text-2xl md:text-3xl font-bold uppercase tracking-widest leading-tight">
              {match.awayTeam?.code ?? awayCode ?? awayName}
            </p>
            <p className="font-mono text-xs md:text-sm mt-1 opacity-80 uppercase tracking-wider">
              {awayName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MatchFaceoffBanner;
