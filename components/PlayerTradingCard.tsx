"use client";

import { Flag } from "@/components/Flag";

export interface PlayerTradingCardProps {
  player: {
    name: string;
    position: string; // "GK" | "DEF" | "MID" | "FWD"
    teamCode: string;
    teamName: string;
    rating: number; // 0-99
    stats: { label: string; value: number | string }[]; // exactly 3 stats shown on front
  };
  size?: "sm" | "md" | "lg"; // default "md"
}

// ── Rating tier helpers ──────────────────────────────────────────────────────

type RatingTier = "elite" | "gold" | "silver" | "bronze" | "normal" | "dim";

function getRatingTier(rating: number): RatingTier {
  if (rating >= 90) return "elite";
  if (rating >= 80) return "gold";
  if (rating >= 70) return "silver";
  if (rating >= 60) return "bronze";
  if (rating >= 50) return "normal";
  return "dim";
}

// Tailwind gradient classes cannot be fully dynamic (purge-safe), so we map
// tier → known class strings. The "elite" and "gold" gradients are inlined via
// style= because they require hex values not in the design system palette.
const TIER_BG: Record<RatingTier, string> = {
  elite: "bg-[#0a0e1a]",   // overridden by inline style
  gold: "bg-[#0a0e1a]",    // overridden by inline style
  silver: "bg-[#0a0e1a]",  // overridden by inline style
  bronze: "bg-[#0a0e1a]",  // overridden by inline style
  normal: "bg-panel2",
  dim: "bg-panel",
};

// Gradient backgrounds per tier (applied via inline style for exact hex colours)
const TIER_GRADIENT: Record<RatingTier, string | null> = {
  elite: "linear-gradient(160deg, #ffd700 0%, #c8860a 100%)",
  gold: "linear-gradient(160deg, #c0c0c0 0%, #888888 100%)",
  silver: "linear-gradient(160deg, #cd7f32 0%, #8b5513 100%)",
  bronze: "linear-gradient(160deg, #1e2a3d 0%, #151c2e 100%)",
  normal: null,
  dim: null,
};

// Text colour for overlaid content on each tier background
const TIER_TEXT: Record<RatingTier, string> = {
  elite: "text-[#3d1e00]",
  gold: "text-[#222]",
  silver: "text-[#2a1200]",
  bronze: "text-white",
  normal: "text-white",
  dim: "text-white/70",
};

// Border accent ring
const TIER_RING: Record<RatingTier, string> = {
  elite: "ring-2 ring-[#ffd700]/80",
  gold: "ring-2 ring-[#c0c0c0]/60",
  silver: "ring-2 ring-[#cd7f32]/70",
  bronze: "ring-1 ring-[#00d45e]/50",
  normal: "ring-1 ring-[#1e2a3d]",
  dim: "ring-1 ring-[#1e2a3d]/60",
};

// Rating badge bg
const TIER_BADGE_BG: Record<RatingTier, string> = {
  elite: "bg-black/20",
  gold: "bg-black/20",
  silver: "bg-black/20",
  bronze: "bg-black/25",
  normal: "bg-black/30",
  dim: "bg-black/20",
};

// ── Size map ─────────────────────────────────────────────────────────────────

const SIZE_WIDTH: Record<NonNullable<PlayerTradingCardProps["size"]>, number> = {
  sm: 120,
  md: 160,
  lg: 200,
};

// ── Component ────────────────────────────────────────────────────────────────

export function PlayerTradingCard({ player, size = "md" }: PlayerTradingCardProps) {
  const cardWidth = SIZE_WIDTH[size];
  // 2:3 aspect ratio
  const cardHeight = Math.round(cardWidth * 1.5);

  const tier = getRatingTier(player.rating);
  const gradient = TIER_GRADIENT[tier];
  const textColor = TIER_TEXT[tier];
  const ringClass = TIER_RING[tier];
  const bgClass = TIER_BG[tier];
  const badgeBg = TIER_BADGE_BG[tier];

  // Scale font sizes relative to card width (baseline = 160px "md")
  const scale = cardWidth / 160;
  const ratingSize = Math.round(28 * scale);
  const nameSize = Math.round(11 * scale);
  const statValueSize = Math.round(14 * scale);
  const statLabelSize = Math.round(8 * scale);
  const flagWidth = Math.round(32 * scale);
  const posBadgeFont = Math.round(9 * scale);

  // Front stats — show first 3
  const frontStats = player.stats.slice(0, 3);

  return (
    // Perspective wrapper — enables 3D depth for children
    <div
      className="group cursor-pointer"
      style={{ perspective: "600px", width: cardWidth, height: cardHeight }}
    >
      {/* Flip container */}
      <div
        className="relative w-full h-full transition-transform duration-500 group-hover:[transform:rotateY(180deg)]"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* ── FRONT FACE ──────────────────────────────────────────────────── */}
        <div
          className={`absolute inset-0 rounded-xl overflow-hidden ${bgClass} ${ringClass} backface-hidden`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            background: gradient ?? undefined,
          }}
        >
          {/* Texture overlay — subtle radial dots */}
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: `${Math.round(8 * scale)}px ${Math.round(8 * scale)}px`,
            }}
          />

          {/* Shine sheen */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 60%)",
            }}
          />

          <div className="relative flex flex-col h-full px-2 py-2 gap-1">
            {/* Top row: rating + position badge + flag */}
            <div className="flex items-start justify-between">
              {/* Left: rating + position */}
              <div className={`flex flex-col items-center leading-none ${badgeBg} rounded-md px-1 py-0.5`}>
                <span
                  className={`font-display font-bold leading-none ${textColor}`}
                  style={{ fontSize: ratingSize }}
                >
                  {player.rating}
                </span>
                <span
                  className={`font-display font-semibold uppercase tracking-widest ${textColor} opacity-80`}
                  style={{ fontSize: posBadgeFont }}
                >
                  {player.position}
                </span>
              </div>

              {/* Right: flag */}
              <Flag
                code={player.teamCode}
                name={player.teamName}
                width={flagWidth}
                rounded
              />
            </div>

            {/* Player silhouette placeholder — mid section */}
            <div className="flex-1 flex items-center justify-center">
              <div
                className={`rounded-full flex items-center justify-center font-display font-bold ${textColor} opacity-60`}
                style={{
                  width: Math.round(64 * scale),
                  height: Math.round(64 * scale),
                  background: "rgba(0,0,0,0.15)",
                  fontSize: Math.round(22 * scale),
                }}
              >
                {player.name
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase() ?? "")
                  .join("")}
              </div>
            </div>

            {/* Player name */}
            <div
              className={`font-display font-bold uppercase tracking-wide text-center truncate ${textColor}`}
              style={{ fontSize: nameSize }}
              title={player.name}
            >
              {player.name}
            </div>

            {/* Divider */}
            <div className={`w-full border-t ${tier === "dim" || tier === "normal" ? "border-white/10" : "border-black/20"}`} />

            {/* Stats row */}
            <div className="flex justify-around w-full pb-0.5">
              {frontStats.map((stat, i) => (
                <div key={i} className="flex flex-col items-center leading-none gap-px">
                  <span
                    className={`font-display font-bold ${textColor}`}
                    style={{ fontSize: statValueSize }}
                  >
                    {stat.value}
                  </span>
                  <span
                    className={`font-mono uppercase ${textColor} opacity-60`}
                    style={{ fontSize: statLabelSize }}
                  >
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── BACK FACE ───────────────────────────────────────────────────── */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden bg-navy ring-1 ring-[#1e2a3d] backface-hidden"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: "#0a0e1a",
          }}
        >
          {/* Shine sheen on back */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 55%)",
            }}
          />

          <div className="relative flex flex-col items-center h-full px-3 py-3 gap-2">
            {/* Large flag */}
            <Flag
              code={player.teamCode}
              name={player.teamName}
              width={Math.round(56 * scale)}
              rounded
            />

            {/* Team name */}
            <span
              className="font-display font-semibold uppercase text-white/90 tracking-wide text-center leading-tight"
              style={{ fontSize: Math.round(10 * scale) }}
            >
              {player.teamName}
            </span>

            {/* Player name */}
            <span
              className="font-display font-bold uppercase text-white tracking-wide text-center truncate w-full"
              style={{ fontSize: Math.round(12 * scale) }}
              title={player.name}
            >
              {player.name}
            </span>

            {/* Divider */}
            <div className="w-full border-t border-[#1e2a3d]" />

            {/* All stats vertical list */}
            <div className="flex-1 flex flex-col w-full gap-1 overflow-hidden">
              {player.stats.map((stat, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between w-full"
                >
                  <span
                    className="font-mono uppercase text-white/50"
                    style={{ fontSize: Math.round(8 * scale) }}
                  >
                    {stat.label}
                  </span>
                  <span
                    className="font-display font-bold text-white"
                    style={{ fontSize: Math.round(11 * scale) }}
                  >
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>

            {/* WC 2026 branding */}
            <div className="flex flex-col items-center leading-none mt-auto">
              <span
                className="font-display font-bold uppercase text-[#ffd700] tracking-widest"
                style={{ fontSize: Math.round(10 * scale) }}
              >
                WC 2026
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
