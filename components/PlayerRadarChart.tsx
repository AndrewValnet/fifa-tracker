"use client";

import { useState } from "react";

export interface PlayerRadarChartProps {
  stats?: { label: string; value: number; max?: number }[];
  color?: string;
  size?: number;
  label?: string;
}

const DEFAULT_STATS = [
  { label: "Goals", value: 7, max: 10 },
  { label: "Assists", value: 5, max: 10 },
  { label: "Shots", value: 8, max: 10 },
  { label: "Passes", value: 6, max: 10 },
  { label: "Dribbles", value: 4, max: 10 },
  { label: "Tackles", value: 3, max: 10 },
];

/** Convert polar coords (angle in radians, radius) to Cartesian x,y from a given center. */
function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleRad: number
): [number, number] {
  return [cx + r * Math.cos(angleRad), cy + r * Math.sin(angleRad)];
}

/** Build a polygon points string from an array of [x, y] tuples. */
function pointsStr(pts: [number, number][]): string {
  return pts.map(([x, y]) => `${x},${y}`).join(" ");
}

export function PlayerRadarChart({
  stats = DEFAULT_STATS,
  color = "#00d45e",
  size = 240,
  label,
}: PlayerRadarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Clamp axis count to 3–6
  const axes = stats.slice(0, 6);
  const n = Math.max(3, axes.length);

  const cx = size / 2;
  const cy = size / 2;
  // Leave ~28px padding for axis labels on each side
  const padding = 28;
  const maxR = size / 2 - padding;

  // Angles: start at top (−π/2), go clockwise
  const angleStep = (2 * Math.PI) / n;
  const angles = Array.from({ length: n }, (_, i) => -Math.PI / 2 + i * angleStep);

  // ── grid rings (33%, 66%, 100%) ──────────────────────────────────────────
  const gridLevels = [0.33, 0.66, 1.0];
  const gridRings = gridLevels.map((lvl) => {
    const pts = angles.map((a) => polarToCartesian(cx, cy, maxR * lvl, a) as [number, number]);
    return { lvl, pts };
  });

  // ── data polygon ────────────────────────────────────────────────────────
  const dataPoints: [number, number][] = axes.map(({ value, max = 10 }, i) => {
    const clamped = Math.min(Math.max(value, 0), max);
    const ratio = clamped / max;
    return polarToCartesian(cx, cy, maxR * ratio, angles[i]);
  });

  // ── axis tip positions for labels ────────────────────────────────────────
  const labelOffset = 8; // extra px beyond maxR so labels don't overlap the outer ring
  const tipPositions = angles.map((a) => polarToCartesian(cx, cy, maxR + labelOffset, a));

  // Decide text-anchor per tip based on horizontal position relative to center
  function textAnchor(x: number): "start" | "middle" | "end" {
    if (x > cx + 4) return "start";
    if (x < cx - 4) return "end";
    return "middle";
  }
  // Decide dominant-baseline per tip based on vertical position relative to center
  function dominantBaseline(y: number): "auto" | "hanging" | "middle" {
    if (y < cy - 4) return "auto"; // tip is above center → text hangs below
    if (y > cy + 4) return "hanging"; // tip is below center → text sits above
    return "middle";
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label={label ? `Radar chart for ${label}` : "Player radar chart"}
        role="img"
      >
        {/* ── background grid rings ── */}
        {gridRings.map(({ lvl, pts }) => (
          <polygon
            key={lvl}
            points={pointsStr(pts)}
            fill="none"
            stroke="#1e2a3d"
            strokeWidth={1}
          />
        ))}

        {/* ── axis spokes ── */}
        {angles.map((a, i) => {
          const [x, y] = polarToCartesian(cx, cy, maxR, a);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="#1e2a3d"
              strokeWidth={1}
            />
          );
        })}

        {/* ── data polygon ── */}
        <polygon
          points={pointsStr(dataPoints)}
          fill={color}
          fillOpacity={0.3}
          stroke={color}
          strokeOpacity={0.8}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />

        {/* ── data vertex dots ── */}
        {dataPoints.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={3}
            fill={color}
            fillOpacity={0.9}
          />
        ))}

        {/* ── axis labels ── */}
        {axes.map(({ label: axisLabel, value, max = 10 }, i) => {
          const [lx, ly] = tipPositions[i];
          const isHovered = hoveredIndex === i;
          return (
            <text
              key={i}
              x={lx}
              y={ly}
              textAnchor={textAnchor(lx)}
              dominantBaseline={dominantBaseline(ly)}
              fontSize={11}
              fontFamily="'Roboto Mono', monospace"
              fill={isHovered ? color : "#6b7a99"}
              style={{ cursor: "default", userSelect: "none" }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <title>{`${axisLabel}: ${value} / ${max}`}</title>
              {axisLabel}
            </text>
          );
        })}

        {/* ── center dot ── */}
        <circle cx={cx} cy={cy} r={2} fill="#1e2a3d" />
      </svg>

      {label && (
        <p className="font-display text-sm font-semibold uppercase tracking-wider text-ink">
          {label}
        </p>
      )}
    </div>
  );
}
