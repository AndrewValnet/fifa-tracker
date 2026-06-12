"use client";

import { useState } from "react";
import { flagUrl, getTeamColors, type FlagSize } from "@/lib/team-meta";

const SIZE_TO_CDN: Record<number, FlagSize> = { 24: "w40", 32: "w40", 40: "w80", 56: "w80", 80: "w160", 120: "w320", 160: "w320", 240: "w640" };

function cdnSize(width: number): FlagSize {
  const keys = Object.keys(SIZE_TO_CDN).map(Number).sort((a, b) => a - b);
  for (const k of keys) if (width <= k) return SIZE_TO_CDN[k];
  return "w640";
}

/**
 * Country flag with graceful fallback: if FlagCDN is unreachable (or the code
 * is unknown) we render a team-colored placeholder with the FIFA code.
 */
export function Flag({
  code,
  name,
  width = 40,
  className = "",
  rounded = true,
}: {
  code: string | null | undefined;
  name?: string | null;
  width?: number;
  className?: string;
  rounded?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const src = flagUrl(code, cdnSize(width));
  const height = Math.round(width * 0.75);
  const radius = rounded ? "rounded" : "";

  if (!src || failed) {
    const { primary, secondary } = getTeamColors(code);
    return (
      <span
        role="img"
        aria-label={name ?? code ?? "Unknown team"}
        className={`inline-flex items-center justify-center font-display font-semibold uppercase text-ink/90 ${radius} ${className}`}
        style={{
          width,
          height,
          background: `linear-gradient(135deg, ${primary}, ${secondary})`,
          fontSize: Math.max(10, width / 4),
          textShadow: "0 1px 2px rgba(0,0,0,.6)",
        }}
      >
        {code ?? "?"}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name ? `${name} flag` : `${code} flag`}
      width={width}
      height={height}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`inline-block object-cover shadow-md ring-1 ring-black/40 ${radius} ${className}`}
      style={{ width, height }}
    />
  );
}
