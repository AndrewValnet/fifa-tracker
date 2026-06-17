"use client";

import { useMemo, useState } from "react";
import { SectionHeader } from "@/components/SectionHeader";

export interface GoalMinuteHeatmapProps {
  events: { minute: string; type: string }[];
}

function parseMinute(minuteStr: string): number {
  // "45+2" -> 45, "90+3" -> 90, "67" -> 67
  const base = parseInt(minuteStr.split("+")[0], 10);
  return isNaN(base) ? -1 : base;
}

function getBucketIndex(minute: number): number {
  // Buckets 0-89 => minutes 1-90, bucket 90 => "90+" (extra time / >90)
  if (minute <= 0) return -1;
  if (minute > 90) return 90;
  return minute - 1; // 0-indexed: minute 1 -> index 0, minute 90 -> index 89
}

function getCellColor(count: number): string {
  if (count === 0) return "bg-panel/30";
  if (count === 1) return "bg-pitch/20";
  if (count <= 3) return "bg-pitch/50";
  return "bg-pitch";
}

const PERIODS = [
  { label: "1–15", start: 1, end: 15 },
  { label: "16–30", start: 16, end: 30 },
  { label: "31–45+", start: 31, end: 45 },
  { label: "46–60", start: 46, end: 60 },
  { label: "61–75", start: 61, end: 75 },
  { label: "76–90+", start: 76, end: 91 }, // 91 = bucket index 90 = "90+"
] as const;

export function GoalMinuteHeatmap({ events }: GoalMinuteHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ bucketIdx: number; x: number; y: number } | null>(null);

  const { buckets, totalGoals, peakBucketIdx } = useMemo(() => {
    // 91 buckets: indices 0-89 = minutes 1-90, index 90 = "90+" extra time
    const buckets = new Array<number>(91).fill(0);

    for (const ev of events) {
      // Skip own goals — check if type contains "OG" or similar markers
      if (ev.type === "OG" || ev.type.toUpperCase().includes("OWN")) continue;
      if (ev.type !== "GOAL") continue;

      const minute = parseMinute(ev.minute);
      const idx = getBucketIndex(minute);
      if (idx >= 0 && idx < 91) {
        buckets[idx]++;
      }
    }

    const totalGoals = buckets.reduce((sum, n) => sum + n, 0);
    let peakBucketIdx = 0;
    for (let i = 1; i < 91; i++) {
      if (buckets[i] > buckets[peakBucketIdx]) peakBucketIdx = i;
    }

    return { buckets, totalGoals, peakBucketIdx };
  }, [events]);

  const peakLabel = peakBucketIdx === 90 ? "90+" : `${peakBucketIdx + 1}`;
  const peakCount = buckets[peakBucketIdx];

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-edge bg-panel p-5">
        <SectionHeader title="Goal Minute Heatmap" />
        <p className="text-sm text-dim">No match events available yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-edge bg-panel p-5">
      <SectionHeader
        title="Goal Minute Heatmap"
        right={
          <span className="font-mono text-xs text-dim">
            {totalGoals} goals &middot; peak min {peakLabel}{peakCount > 0 ? ` (${peakCount})` : ""}
          </span>
        }
      />

      {/* Legend */}
      <div className="mb-4 flex items-center gap-3 text-xs text-dim">
        <span>Goals per minute:</span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-panel/30 border border-edge" />
          0
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-pitch/20" />
          1
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-pitch/50" />
          2–3
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-pitch" />
          4+
        </span>
      </div>

      {/* Heatmap periods */}
      <div className="relative flex flex-wrap gap-x-3 gap-y-4">
        {PERIODS.map((period) => {
          // Compute bucket indices for this period
          const bucketStart = period.start - 1; // minute N -> index N-1
          const bucketEnd = period.end === 91 ? 90 : period.end - 1;

          const cells: { idx: number; count: number; label: string }[] = [];
          for (let idx = bucketStart; idx <= bucketEnd; idx++) {
            const minuteLabel = idx === 90 ? "90+" : `${idx + 1}`;
            cells.push({ idx, count: buckets[idx], label: minuteLabel });
          }

          return (
            <div key={period.label} className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-widest text-dim">
                {period.label}
              </span>
              <div className="flex flex-wrap gap-[3px]">
                {cells.map(({ idx, count, label }) => (
                  <div
                    key={idx}
                    className={`
                      relative h-5 w-5 cursor-default rounded-sm border border-edge/50
                      transition-all duration-100 hover:scale-110 hover:border-pitch/60
                      ${getCellColor(count)}
                    `}
                    onMouseEnter={(e) => {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setTooltip({ bucketIdx: idx, x: rect.left + rect.width / 2, y: rect.top });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    aria-label={`Minute ${label}: ${count} goal${count !== 1 ? "s" : ""}`}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Tooltip */}
        {tooltip !== null && (
          <div
            className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded bg-panel2 border border-edge px-2 py-1 font-mono text-xs text-white shadow-lg"
            style={{
              left: tooltip.x,
              top: tooltip.y - 6,
            }}
          >
            {`Minute ${tooltip.bucketIdx === 90 ? "90+" : tooltip.bucketIdx + 1}: ${buckets[tooltip.bucketIdx]} goal${buckets[tooltip.bucketIdx] !== 1 ? "s" : ""}`}
          </div>
        )}
      </div>
    </div>
  );
}
