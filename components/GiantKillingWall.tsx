import { Flag } from "@/components/Flag";
import { SectionHeader } from "@/components/SectionHeader";
import { statusKind, stageLabel } from "@/lib/format";
import { FIFA_RANKINGS } from "@/data/fifa-rankings";
import type { Match } from "@/lib/types";

export interface GiantKillingWallProps {
  matches: Match[];
}

interface UpsetCard {
  matchId: string;
  winnerCode: string | null;
  winnerName: string;
  loserCode: string | null;
  loserName: string;
  scoreHome: number;
  scoreAway: number;
  homeIsWinner: boolean;
  upsetMagnitude: number;
  /** Human-readable upset context */
  context: string;
  stageDisplay: string;
}

const RANK_BY_CODE = new Map<string, number>(FIFA_RANKINGS.map((r) => [r.code, r.rank]));

/** Resolve FIFA ranking for a team code. Returns null when unknown. */
function rankOf(code: string | null | undefined): number | null {
  if (!code) return null;
  return RANK_BY_CODE.get(code) ?? null;
}

function buildUpsetCards(matches: Match[]): UpsetCard[] {
  const cards: UpsetCard[] = [];

  for (const m of matches) {
    if (statusKind(m.status) !== "finished") continue;
    if (m.score.home === null || m.score.away === null) continue;
    if (!m.homeTeam || !m.awayTeam) continue;

    const { home: homeScore, away: awayScore, winner } = m.score;

    // Determine winner side — skip draws (no "giant killing" in a draw)
    let homeIsWinner: boolean;
    if (winner === "HOME_TEAM") {
      homeIsWinner = true;
    } else if (winner === "AWAY_TEAM") {
      homeIsWinner = false;
    } else if (homeScore! > awayScore!) {
      homeIsWinner = true;
    } else if (awayScore! > homeScore!) {
      homeIsWinner = false;
    } else {
      // Draw — skip
      continue;
    }

    const winnerTeam = homeIsWinner ? m.homeTeam : m.awayTeam;
    const loserTeam = homeIsWinner ? m.awayTeam : m.homeTeam;

    const winnerRank = rankOf(winnerTeam.code);
    const loserRank = rankOf(loserTeam.code);

    let upsetMagnitude = 0;
    let context = "";

    if (winnerRank !== null && loserRank !== null) {
      // Lower rank number = better team. Upset = winner had HIGHER rank number (worse position)
      const rankDiff = winnerRank - loserRank;
      if (rankDiff <= 0) {
        // Favourite won — not an upset
        continue;
      }
      upsetMagnitude = rankDiff;
      context = `Rank #${winnerRank} beat Rank #${loserRank}`;
    } else if (winnerRank !== null && loserRank === null) {
      // Winner is ranked, loser is unranked — minor upset potential, skip
      continue;
    } else if (winnerRank === null && loserRank !== null) {
      // Unranked team beat a ranked one — treat as moderate upset
      upsetMagnitude = 15; // fixed moderate magnitude
      context = `Unranked side beat Rank #${loserRank}`;
    } else {
      // Neither ranked — skip
      continue;
    }

    // Only include genuine upsets (at least 5 ranks difference, or unranked winner)
    if (winnerRank !== null && loserRank !== null && upsetMagnitude < 5) continue;

    cards.push({
      matchId: m.id,
      winnerCode: winnerTeam.code,
      winnerName: winnerTeam.name,
      loserCode: loserTeam.code,
      loserName: loserTeam.name,
      scoreHome: homeScore!,
      scoreAway: awayScore!,
      homeIsWinner,
      upsetMagnitude,
      context,
      stageDisplay: stageLabel(m.stage, m.group),
    });
  }

  // Sort by magnitude descending, take top 8
  cards.sort((a, b) => b.upsetMagnitude - a.upsetMagnitude);
  return cards.slice(0, 8);
}

function dramaticLabel(index: number, magnitude: number): string {
  if (index === 0 && magnitude >= 20) return "UPSET OF THE TOURNAMENT";
  if (magnitude >= 30) return "GIANT SLAIN";
  if (magnitude >= 15) return "SHOCK RESULT";
  return "GIANT SLAIN";
}

function labelColor(index: number, magnitude: number): string {
  if (index === 0 && magnitude >= 20) return "bg-live/20 text-live border border-live/40";
  if (magnitude >= 30) return "bg-gold/20 text-gold border border-gold/40";
  return "bg-pitch/15 text-pitch border border-pitch/40";
}

export function GiantKillingWall({ matches }: GiantKillingWallProps) {
  const upsets = buildUpsetCards(matches);

  return (
    <section
      className="rounded-xl border border-edge overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, rgba(255,60,30,0.06) 0%, rgba(10,14,26,1) 30%, rgba(255,215,0,0.04) 100%)",
      }}
    >
      {/* Inner panel padding */}
      <div className="px-4 pt-4 pb-5">
        <SectionHeader
          title={
            <span className="flex items-center gap-2">
              <span className="text-live">&#9888;</span>
              Giant Killings
            </span>
          }
          right={upsets.length > 0 ? `${upsets.length} upset${upsets.length !== 1 ? "s" : ""}` : undefined}
        />

        {upsets.length < 3 ? (
          <div className="mt-6 flex flex-col items-center justify-center gap-2 py-10 text-center">
            <span className="text-3xl opacity-30" aria-hidden>
              &#128239;
            </span>
            <p className="font-display text-sm uppercase tracking-widest text-dim">
              Tournament upsets will appear here as matches are played
            </p>
            <p className="text-xs text-dim/60">Check back after more matches are complete</p>
          </div>
        ) : (
          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {upsets.map((card, idx) => (
              <UpsetCardItem key={card.matchId} card={card} index={idx} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function UpsetCardItem({ card, index }: { card: UpsetCard; index: number }) {
  const label = dramaticLabel(index, card.upsetMagnitude);
  const labelCls = labelColor(index, card.upsetMagnitude);
  const isTopUpset = index === 0 && card.upsetMagnitude >= 20;

  return (
    <li
      className="relative flex flex-col gap-2 rounded-lg border border-edge bg-panel2 p-3 transition-colors hover:border-gold/30"
      style={
        isTopUpset
          ? {
              boxShadow: "0 0 0 1px rgba(255,60,30,0.25), inset 0 0 24px rgba(255,60,30,0.04)",
            }
          : undefined
      }
    >
      {/* Dramatic label */}
      <span
        className={`self-start rounded px-2 py-0.5 text-[10px] font-display font-semibold uppercase tracking-widest ${labelCls}`}
      >
        {label}
      </span>

      {/* Winner row */}
      <div className="flex items-center gap-2">
        <Flag code={card.winnerCode} name={card.winnerName} width={28} />
        <span className="font-display text-sm font-semibold uppercase tracking-wide text-gold leading-tight">
          {card.winnerName}
        </span>
      </div>

      {/* Score badge */}
      <div className="flex items-center gap-2">
        <span className="rounded bg-panel px-2 py-0.5 font-mono text-sm font-bold text-white tabular-nums">
          {card.homeIsWinner
            ? `${card.scoreHome}–${card.scoreAway}`
            : `${card.scoreAway}–${card.scoreHome}`}
        </span>
        <span className="text-[10px] font-mono text-dim">vs</span>
      </div>

      {/* Loser row */}
      <div className="flex items-center gap-2">
        <Flag code={card.loserCode} name={card.loserName} width={22} />
        <span className="font-sans text-xs text-dim leading-tight truncate">{card.loserName}</span>
      </div>

      {/* Divider */}
      <div className="mt-auto border-t border-edge/50 pt-2">
        {/* Context line */}
        <p className="font-mono text-[10px] text-dim/80">{card.context}</p>
        {/* Stage */}
        <p className="mt-0.5 text-[10px] uppercase tracking-wider text-dim/60 font-display">
          {card.stageDisplay}
        </p>
      </div>
    </li>
  );
}
