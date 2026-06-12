"use client";

// Renders kickoff times in the *viewer's* timezone. Client-mounted only, so
// the server-rendered HTML never disagrees with the hydrated output.

import { useMounted } from "@/hooks/useMounted";
import { fmtKickoff } from "@/lib/format";

export function LocalTime({
  iso,
  style = "datetime",
  className,
}: {
  iso: string;
  style?: "time" | "datetime" | "date" | "weekday";
  className?: string;
}) {
  const mounted = useMounted();
  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {mounted ? fmtKickoff(iso, style) : "…"}
    </time>
  );
}
