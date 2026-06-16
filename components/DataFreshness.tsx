"use client";

import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/format";
import type { DataSource } from "@/lib/types";

const SOURCE_LABELS: Record<DataSource, string> = {
  "football-data": "football-data",
  worldcup26: "worldcup26.ir",
  gnews: "GNews",
  demo: "offline data",
};

export function DataFreshness({
  source,
  sourceName,
  fetchedAt,
  prefix = "Source",
  separator = ":",
  cached = true,
  className = "",
}: {
  source?: DataSource | null;
  sourceName?: string | null;
  fetchedAt?: string | null;
  prefix?: string;
  separator?: ":" | "";
  cached?: boolean;
  className?: string;
}) {
  const [, tick] = useState(0);

  useEffect(() => {
    if (!fetchedAt) return;
    const id = setInterval(() => tick((n) => n + 1), 15_000);
    return () => clearInterval(id);
  }, [fetchedAt]);

  const label = sourceName ?? (source ? SOURCE_LABELS[source] : null);
  if (!label && !fetchedAt && !cached) return null;

  return (
    <span className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-tight text-dim ${className}`}>
      {label ? (
        <span>
          {prefix}
          {separator ? `${separator} ` : " "}
          <span className="font-semibold text-ink">{label}</span>
        </span>
      ) : null}
      {fetchedAt ? <span>Updated {timeAgo(fetchedAt)}</span> : null}
      {cached ? (
        <span className="rounded-full border border-edge bg-panel2 px-2 py-0.5 font-mono uppercase tracking-wider">
          Cached
        </span>
      ) : null}
    </span>
  );
}
