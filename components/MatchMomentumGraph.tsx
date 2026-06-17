"use client";

import { useState, useMemo } from "react";
import { MatchEvent, MatchEventType } from "@/lib/types";
import { getTeamColors } from "@/lib/team-meta";

export interface MatchMomentumGraphProps {
  events: MatchEvent[];
  homeCode: string | null;
  awayCode: string | null;
  homeScore: number | null;
  awayScore: number | null;
  isLive?: boolean;
}

// Bucket boundaries in actual match minutes
const BUCKETS = [
  { label: "0-5", min: 0, max: 5 },
  { label: "5-10", min: 5, max: 10 },
  { label: "10-15", min: 10, max: 15 },
  { label: "15-20", min: 15, max: 20 },
  { label: "20-25", min: 20, max: 25 },
  { label: "25-30", min: 25, max: 30 },
  { label: "30-35", min: 30, max: 35 },
  { label: "35-40", min: 35, max: 40 },
  { label: "40-45", min: 40, max: 45 },
  { label: "45+", min: 45, max: 50 },
  { label: "45-50", min: 50, max: 55 },
  { label: "50-55", min: 55, max: 60 },
  { label: "55-60", min: 60, max: 65 },
  { label: "60-65", min: 65, max: 70 },
  { label: "65-70", min: 70, max: 75 },
  { label: "70-75", min: 75, max: 80 },
  { label: "75-80", min: 80, max: 85 },
  { label: "80-85", min: 85, max: 90 },
  { label: "85-90", min: 90, max: 95 },
  { label: "90+", min: 95, max: 100 },
];

const SVG_W = 600;
const SVG_H = 160;
const CENTER_Y = SVG_H / 2; // 80
const MAX_AMPLITUDE = 70; // px from center to max spike
const PAD_LEFT = 30;
const PAD_RIGHT = 10;
const CHART_W = SVG_W - PAD_LEFT - PAD_RIGHT;

function parseMinute(minuteStr: string): number {
  // handles "45+2", "90+3", "67" etc.
  const parts = minuteStr.split("+");
  const base = parseInt(parts[0], 10) || 0;
  const added = parts[1] ? parseInt(parts[1], 10) : 0;
  return base + added;
}

type BucketData = {
  bucketIdx: number;
  home: number;
  away: number;
  homeEvents: MatchEvent[];
  awayEvents: MatchEvent[];
};

function buildBuckets(events: MatchEvent[]): BucketData[] {
  return BUCKETS.map((b, idx) => {
    const homeEvts = events.filter((e) => {
      const m = parseMinute(e.minute);
      return e.side === "HOME" && m >= b.min && m < b.max;
    });
    const awayEvts = events.filter((e) => {
      const m = parseMinute(e.minute);
      return e.side === "AWAY" && m >= b.min && m < b.max;
    });
    // Count only impactful event types for momentum
    const countImpact = (evts: MatchEvent[]) =>
      evts.filter((e) => e.type === "GOAL" || e.type === "YELLOW" || e.type === "RED").length;
    return {
      bucketIdx: idx,
      home: countImpact(homeEvts),
      away: countImpact(awayEvts),
      homeEvents: homeEvts,
      awayEvents: awayEvts,
    };
  });
}

function bucketX(idx: number): number {
  return PAD_LEFT + (idx / (BUCKETS.length - 1)) * CHART_W;
}

function buildAreaPath(
  buckets: BucketData[],
  side: "home" | "away",
  maxCount: number
): string {
  if (maxCount === 0) {
    // flat line along center
    const first = bucketX(0);
    const last = bucketX(buckets.length - 1);
    return `M${first},${CENTER_Y} L${last},${CENTER_Y} L${last},${CENTER_Y} L${first},${CENTER_Y} Z`;
  }

  const points = buckets.map((b, i) => {
    const count = side === "home" ? b.home : b.away;
    const amplitude = (count / maxCount) * MAX_AMPLITUDE;
    const y = side === "home" ? CENTER_Y - amplitude : CENTER_Y + amplitude;
    return { x: bucketX(i), y };
  });

  const firstX = points[0].x;
  const lastX = points[points.length - 1].x;

  let d = `M${firstX},${CENTER_Y}`;
  // Smooth curve through points using quadratic bezier
  for (let i = 0; i < points.length; i++) {
    if (i === 0) {
      d += ` L${points[0].x},${points[0].y}`;
    } else {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX = (prev.x + curr.x) / 2;
      d += ` Q${cpX},${prev.y} ${curr.x},${curr.y}`;
    }
  }
  d += ` L${lastX},${CENTER_Y} Z`;
  return d;
}

function eventLabel(type: MatchEventType): string {
  switch (type) {
    case "GOAL": return "Goal";
    case "YELLOW": return "Yellow Card";
    case "RED": return "Red Card";
    case "SUB": return "Substitution";
    case "BREAK": return "Break";
    default: return type;
  }
}

interface TooltipData {
  bucketIdx: number;
  x: number;
  y: number;
  bucket: BucketData;
}

export function MatchMomentumGraph({
  events,
  homeCode,
  awayCode,
  homeScore,
  awayScore,
  isLive = false,
}: MatchMomentumGraphProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const homeColors = getTeamColors(homeCode);
  const awayColors = getTeamColors(awayCode);

  const buckets = useMemo(() => buildBuckets(events), [events]);

  const maxCount = useMemo(
    () =>
      Math.max(
        1,
        ...buckets.map((b) => Math.max(b.home, b.away))
      ),
    [buckets]
  );

  const homeAreaPath = useMemo(
    () => buildAreaPath(buckets, "home", maxCount),
    [buckets, maxCount]
  );
  const awayAreaPath = useMemo(
    () => buildAreaPath(buckets, "away", maxCount),
    [buckets, maxCount]
  );

  // Collect goal and card events for markers
  const markerEvents = useMemo(
    () =>
      events.filter(
        (e) => e.type === "GOAL" || e.type === "YELLOW" || e.type === "RED"
      ),
    [events]
  );

  // minute -> x coordinate (0..90+ maps to PAD_LEFT..PAD_LEFT+CHART_W)
  function minuteToX(minuteStr: string): number {
    const m = parseMinute(minuteStr);
    // Clamp to 0-100 range then map to BUCKETS range
    const clamped = Math.min(m, 99);
    return PAD_LEFT + (clamped / 99) * CHART_W;
  }

  const noData = events.length === 0;

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const scaleX = SVG_W / rect.width;
    const rawX = (e.clientX - rect.left) * scaleX;
    const relX = rawX - PAD_LEFT;
    const fraction = Math.max(0, Math.min(1, relX / CHART_W));
    const idx = Math.round(fraction * (BUCKETS.length - 1));
    const bx = bucketX(idx);
    setTooltip({
      bucketIdx: idx,
      x: bx,
      y: CENTER_Y,
      bucket: buckets[idx],
    });
  }

  function handleMouseLeave() {
    setTooltip(null);
  }

  // Build tooltip content
  const tooltipEvents = tooltip
    ? [...tooltip.bucket.homeEvents, ...tooltip.bucket.awayEvents]
    : [];

  const tooltipBucket = tooltip ? BUCKETS[tooltip.bucketIdx] : null;

  return (
    <div className="relative w-full">
      {/* Period labels */}
      <div className="flex justify-between mb-1 px-[30px]">
        <span className="font-display text-[10px] uppercase tracking-widest text-[#6b7a99]">
          1st Half
        </span>
        <span className="font-display text-[10px] uppercase tracking-widest text-[#6b7a99]">
          2nd Half
        </span>
      </div>

      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          width="100%"
          className="overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Background grid lines */}
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1={PAD_LEFT + f * CHART_W}
              y1={10}
              x2={PAD_LEFT + f * CHART_W}
              y2={SVG_H - 10}
              stroke="#1e2a3d"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
          ))}

          {noData ? (
            <text
              x={SVG_W / 2}
              y={SVG_H / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#6b7a99"
              fontSize="13"
              fontFamily="Inter, sans-serif"
            >
              No event data available
            </text>
          ) : (
            <>
              {/* Home area (upward) */}
              <path
                d={homeAreaPath}
                fill={homeColors.primary}
                fillOpacity="0.5"
                stroke={homeColors.primary}
                strokeWidth="1.5"
                strokeOpacity="0.8"
              />

              {/* Away area (downward) */}
              <path
                d={awayAreaPath}
                fill={awayColors.primary}
                fillOpacity="0.5"
                stroke={awayColors.primary}
                strokeWidth="1.5"
                strokeOpacity="0.8"
              />

              {/* Goal and card markers */}
              {markerEvents.map((evt, i) => {
                const mx = minuteToX(evt.minute);
                const isHome = evt.side === "HOME";
                const isGoal = evt.type === "GOAL";
                const isYellow = evt.type === "YELLOW";
                const isRed = evt.type === "RED";

                // Vertical tick on center line
                const tickTop = CENTER_Y - 6;
                const tickBottom = CENTER_Y + 6;

                return (
                  <g key={i}>
                    {/* Vertical marker line */}
                    <line
                      x1={mx}
                      y1={tickTop}
                      x2={mx}
                      y2={tickBottom}
                      stroke={isGoal ? "#ffd700" : isYellow ? "#ffd700" : "#ff3b30"}
                      strokeWidth="1.5"
                      opacity="0.7"
                    />
                    {/* Goal: soccer ball emoji via text */}
                    {isGoal && (
                      <text
                        x={mx}
                        y={isHome ? CENTER_Y - 14 : CENTER_Y + 18}
                        textAnchor="middle"
                        fontSize="11"
                      >
                        ⚽
                      </text>
                    )}
                    {/* Yellow card: small yellow square */}
                    {isYellow && (
                      <rect
                        x={mx - 3}
                        y={isHome ? CENTER_Y - 14 : CENTER_Y + 8}
                        width={6}
                        height={8}
                        rx="1"
                        fill="#ffd700"
                        opacity="0.9"
                      />
                    )}
                    {/* Red card: small red square */}
                    {isRed && (
                      <rect
                        x={mx - 3}
                        y={isHome ? CENTER_Y - 14 : CENTER_Y + 8}
                        width={6}
                        height={8}
                        rx="1"
                        fill="#ff3b30"
                        opacity="0.9"
                      />
                    )}
                  </g>
                );
              })}
            </>
          )}

          {/* Center dashed line */}
          <line
            x1={PAD_LEFT}
            y1={CENTER_Y}
            x2={PAD_LEFT + CHART_W}
            y2={CENTER_Y}
            stroke="#1e2a3d"
            strokeWidth="1.5"
            strokeDasharray="4,4"
          />

          {/* 45' label on center line */}
          <text
            x={PAD_LEFT + CHART_W * (45 / 99)}
            y={CENTER_Y - 4}
            textAnchor="middle"
            fontSize="9"
            fill="#6b7a99"
            fontFamily="'Roboto Mono', monospace"
          >
            45&apos;
          </text>

          {/* 90' label on center line */}
          <text
            x={PAD_LEFT + CHART_W * (90 / 99)}
            y={CENTER_Y - 4}
            textAnchor="middle"
            fontSize="9"
            fill="#6b7a99"
            fontFamily="'Roboto Mono', monospace"
          >
            90&apos;
          </text>

          {/* Minute axis labels */}
          {["0", "45", "90+"].map((label, i) => {
            const fraction = i === 0 ? 0 : i === 1 ? 45 / 99 : 1;
            return (
              <text
                key={label}
                x={PAD_LEFT + fraction * CHART_W}
                y={SVG_H - 2}
                textAnchor="middle"
                fontSize="8"
                fill="#6b7a99"
                fontFamily="'Roboto Mono', monospace"
              >
                {label}
              </text>
            );
          })}

          {/* Hover bucket highlight */}
          {tooltip && (
            <rect
              x={bucketX(tooltip.bucketIdx) - CHART_W / (BUCKETS.length * 2)}
              y={10}
              width={CHART_W / BUCKETS.length}
              height={SVG_H - 20}
              fill="white"
              fillOpacity="0.04"
              rx="2"
              pointerEvents="none"
            />
          )}

          {/* Hover vertical line */}
          {tooltip && (
            <line
              x1={bucketX(tooltip.bucketIdx)}
              y1={10}
              x2={bucketX(tooltip.bucketIdx)}
              y2={SVG_H - 10}
              stroke="#6b7a99"
              strokeWidth="1"
              strokeDasharray="2,2"
              pointerEvents="none"
            />
          )}

          {/* Live indicator dot */}
          {isLive && (
            <circle
              cx={PAD_LEFT + CHART_W - 6}
              cy={12}
              r={4}
              fill="#ff3b30"
            >
              <animate
                attributeName="opacity"
                values="1;0.3;1"
                dur="1.4s"
                repeatCount="indefinite"
              />
            </circle>
          )}
        </svg>

        {/* Team labels on sides */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 flex flex-col items-center">
          <span
            className="font-display text-[9px] uppercase tracking-wider"
            style={{ color: homeColors.primary, writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            {homeCode ?? "HOME"}
          </span>
        </div>
      </div>

      {/* Team score legend below chart */}
      <div className="flex justify-between items-center mt-2 px-[30px]">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-2 rounded-sm opacity-60"
            style={{ background: homeColors.primary }}
          />
          <span className="font-display text-[10px] uppercase tracking-wide text-[#6b7a99]">
            {homeCode ?? "Home"}
            {homeScore !== null && (
              <span className="ml-1 text-white font-mono">{homeScore}</span>
            )}
          </span>
        </div>
        {isLive && (
          <span className="font-display text-[9px] uppercase tracking-widest text-[#ff3b30] animate-pulse">
            Live
          </span>
        )}
        <div className="flex items-center gap-1.5">
          <span className="font-display text-[10px] uppercase tracking-wide text-[#6b7a99]">
            {awayCode ?? "Away"}
            {awayScore !== null && (
              <span className="ml-1 text-white font-mono">{awayScore}</span>
            )}
          </span>
          <span
            className="inline-block w-3 h-2 rounded-sm opacity-60"
            style={{ background: awayColors.primary }}
          />
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && tooltipBucket && (
        <div
          className="pointer-events-none absolute z-20 min-w-[140px] max-w-[200px] rounded border border-[#1e2a3d] bg-[#0f1523] px-3 py-2 text-xs shadow-xl"
          style={{
            // Position tooltip above the chart, horizontally clamped
            bottom: "calc(100% - 20px)",
            left: `clamp(0px, calc(${(bucketX(tooltip.bucketIdx) / SVG_W) * 100}% - 70px), calc(100% - 200px))`,
          }}
        >
          <div className="mb-1 font-display text-[10px] uppercase tracking-wider text-[#6b7a99]">
            {tooltipBucket.min}&apos;–{tooltipBucket.max}&apos;
          </div>
          {tooltipEvents.length === 0 ? (
            <div className="text-[#6b7a99]">No key events</div>
          ) : (
            <ul className="space-y-0.5">
              {tooltipEvents.map((evt, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <span
                    className="font-mono text-[9px]"
                    style={{ color: evt.side === "HOME" ? homeColors.primary : awayColors.primary }}
                  >
                    {evt.minute}&apos;
                  </span>
                  <span className="text-[#6b7a99]">{eventLabel(evt.type)}</span>
                  <span className="truncate text-white">{evt.player}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
