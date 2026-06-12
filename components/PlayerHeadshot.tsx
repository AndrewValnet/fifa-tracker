"use client";

import { useState } from "react";

/** ESPN headshot with initials fallback (not every player has a photo). */
export function PlayerHeadshot({
  src,
  name,
  size = 28,
  colors,
  className = "",
}: {
  src: string | null | undefined;
  name: string;
  size?: number;
  colors?: { primary: string; secondary: string };
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  if (!src || failed) {
    return (
      <span
        aria-hidden
        className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-ink/90 ${className}`}
        style={{
          width: size,
          height: size,
          fontSize: Math.max(9, size * 0.36),
          background: colors
            ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
            : "var(--surface-2)",
          textShadow: "0 1px 2px rgba(0,0,0,.55)",
        }}
      >
        {initials}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`inline-block shrink-0 rounded-full bg-panel2 object-cover ring-1 ring-black/30 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
