"use client";

import { useState } from "react";
import { SectionHeader } from "@/components/SectionHeader";
import { getTeamColors } from "@/lib/team-meta";

export interface SquadAgePyramidProps {
  players: { name: string; age: number | null; positionAbbr: string | null }[];
  teamCode: string;
}

type AgeBucket = {
  label: string;
  min: number;
  max: number;
};

const AGE_BUCKETS: AgeBucket[] = [
  { label: "U21", min: 0, max: 20 },
  { label: "21–23", min: 21, max: 23 },
  { label: "24–26", min: 24, max: 26 },
  { label: "27–29", min: 27, max: 29 },
  { label: "30–32", min: 30, max: 32 },
  { label: "33+", min: 33, max: 999 },
];

type PosGroup = "GK" | "DEF" | "MID" | "FWD" | "UNK";

const POS_COLOR: Record<PosGroup, string> = {
  GK: "bg-orange-500",
  DEF: "bg-blue-500",
  MID: "bg-green-500",
  FWD: "bg-red-500",
  UNK: "bg-[#6b7a99]",
};

const POS_LABEL: Record<PosGroup, string> = {
  GK: "GK",
  DEF: "DEF",
  MID: "MID",
  FWD: "FWD",
  UNK: "—",
};

function normalizePosition(abbr: string | null): PosGroup {
  if (!abbr) return "UNK";
  const a = abbr.toUpperCase().trim();
  if (a === "GK") return "GK";
  if (["CB", "LB", "RB", "LWB", "RWB", "SW", "DF"].includes(a)) return "DEF";
  if (["CM", "DM", "AM", "MF"].includes(a)) return "MID";
  if (["LW", "RW", "CF", "ST", "FW", "SS"].includes(a)) return "FWD";
  return "UNK";
}

function bucketIndex(age: number | null): number {
  if (age === null) return -1;
  return AGE_BUCKETS.findIndex((b) => age >= b.min && age <= b.max);
}

export function SquadAgePyramid({ players, teamCode }: SquadAgePyramidProps) {
  const [hoveredBucket, setHoveredBucket] = useState<number | null>(null);

  const colors = getTeamColors(teamCode);
  const barColor = colors.primary;

  // Group players into buckets
  const buckets: { name: string; age: number }[][] = AGE_BUCKETS.map(() => []);
  for (const p of players) {
    const idx = bucketIndex(p.age);
    if (idx >= 0 && p.age !== null) {
      buckets[idx].push({ name: p.name, age: p.age });
    }
  }

  const maxCount = Math.max(...buckets.map((b) => b.length), 1);

  // Stats
  const withAge = players.filter((p): p is typeof p & { age: number } => p.age !== null);
  const avgAge = withAge.length > 0
    ? withAge.reduce((sum, p) => sum + p.age, 0) / withAge.length
    : null;
  const youngest = withAge.length > 0
    ? withAge.reduce((a, b) => (a.age < b.age ? a : b))
    : null;
  const oldest = withAge.length > 0
    ? withAge.reduce((a, b) => (a.age > b.age ? a : b))
    : null;

  // Position breakdown counts
  const posCounts: Record<PosGroup, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0, UNK: 0 };
  for (const p of players) {
    posCounts[normalizePosition(p.positionAbbr)]++;
  }
  const posGroups: PosGroup[] = ["GK", "DEF", "MID", "FWD"];

  return (
    <div className="rounded-xl border border-[#1e2a3d] bg-[#0f1523] p-5">
      <SectionHeader title="Squad Age Distribution" />

      {/* Bars */}
      <div className="flex flex-col gap-2" role="list" aria-label="Age distribution chart">
        {AGE_BUCKETS.map((bucket, idx) => {
          const group = buckets[idx];
          const count = group.length;
          const widthPct = maxCount > 0 ? Math.max((count / maxCount) * 100, count > 0 ? 4 : 0) : 0;
          const isHovered = hoveredBucket === idx;

          return (
            <div
              key={bucket.label}
              role="listitem"
              className="relative"
              onMouseEnter={() => count > 0 && setHoveredBucket(idx)}
              onMouseLeave={() => setHoveredBucket(null)}
            >
              <div className="flex items-center gap-3">
                {/* Label */}
                <span className="w-12 shrink-0 text-right font-mono text-xs text-[#6b7a99]">
                  {bucket.label}
                </span>

                {/* Bar track */}
                <div className="relative h-7 flex-1 rounded bg-[#151c2e]">
                  {/* Filled bar */}
                  <div
                    className="flex h-full items-center justify-end rounded pr-2 transition-all duration-300"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: barColor,
                      opacity: count > 0 ? (isHovered ? 1 : 0.85) : 0.15,
                    }}
                  />
                  {/* Count badge */}
                  {count > 0 && (
                    <span
                      className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold text-white"
                      style={{ textShadow: "0 1px 2px rgba(0,0,0,.7)" }}
                    >
                      {count}
                    </span>
                  )}
                </div>
              </div>

              {/* Popover — player names on hover */}
              {isHovered && count > 0 && (
                <div
                  className="absolute left-16 top-full z-20 mt-1 max-w-xs rounded-lg border border-[#1e2a3d] bg-[#0a0e1a] px-3 py-2 shadow-xl"
                  role="tooltip"
                >
                  <p className="mb-1 font-display text-[10px] font-semibold uppercase tracking-widest text-[#6b7a99]">
                    {bucket.label}
                  </p>
                  <ul className="space-y-0.5">
                    {group
                      .slice()
                      .sort((a, b) => a.age - b.age)
                      .map((p) => (
                        <li key={p.name} className="flex items-baseline gap-2 font-sans text-xs text-white">
                          <span>{p.name}</span>
                          <span className="font-mono text-[10px] text-[#6b7a99]">{p.age}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stats row */}
      <div className="mt-5 grid grid-cols-3 gap-3 rounded-lg border border-[#1e2a3d] bg-[#151c2e] px-4 py-3">
        <div className="text-center">
          <p className="font-mono text-lg font-semibold text-white">
            {avgAge !== null ? avgAge.toFixed(1) : "—"}
          </p>
          <p className="font-display text-[10px] uppercase tracking-widest text-[#6b7a99]">Avg Age</p>
        </div>
        <div className="text-center">
          <p className="truncate font-sans text-sm font-semibold text-[#00d45e]">
            {youngest ? youngest.name.split(" ").pop() : "—"}
          </p>
          {youngest && (
            <p className="font-mono text-xs text-[#6b7a99]">{youngest.age}</p>
          )}
          <p className="font-display text-[10px] uppercase tracking-widest text-[#6b7a99]">Youngest</p>
        </div>
        <div className="text-center">
          <p className="truncate font-sans text-sm font-semibold text-[#ffd700]">
            {oldest ? oldest.name.split(" ").pop() : "—"}
          </p>
          {oldest && (
            <p className="font-mono text-xs text-[#6b7a99]">{oldest.age}</p>
          )}
          <p className="font-display text-[10px] uppercase tracking-widest text-[#6b7a99]">Oldest</p>
        </div>
      </div>

      {/* Position breakdown */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="font-display text-[10px] uppercase tracking-widest text-[#6b7a99]">
          Positions:
        </span>
        {posGroups.map((pos) => {
          const count = posCounts[pos];
          if (count === 0) return null;
          return (
            <span
              key={pos}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-display text-xs font-semibold uppercase tracking-wide text-white ${POS_COLOR[pos]}`}
            >
              {POS_LABEL[pos]}
              <span className="font-mono text-[10px] opacity-90">{count}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
