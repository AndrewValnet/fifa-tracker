"use client";

import { useEffect, useState } from "react";

/**
 * ESPN headshot with a keyless name-based fallback (Wikidata/Wikipedia via
 * /api/player-image) and an initials avatar as the last resort. The fallback
 * is fetched only when the ESPN image fails or no ESPN photo exists, so the
 * common case stays a single direct <img> with zero extra requests.
 */
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
  const [resolvedSrc, setResolvedSrc] = useState<string | null | undefined>(src);
  const [triedFallback, setTriedFallback] = useState(false);
  const [failed, setFailed] = useState(false);

  // Reset when the player (src) changes within a reused component instance.
  useEffect(() => {
    setResolvedSrc(src);
    setTriedFallback(false);
    setFailed(false);
  }, [src]);

  async function tryFallback() {
    if (triedFallback) {
      setFailed(true);
      return;
    }
    setTriedFallback(true);
    if (!name) {
      setFailed(true);
      return;
    }
    try {
      const res = await fetch(`/api/player-image?name=${encodeURIComponent(name)}`);
      const json = (await res.json()) as { url?: string | null };
      if (json?.url) {
        setResolvedSrc(json.url);
        return;
      }
    } catch {
      /* fall through to initials */
    }
    setFailed(true);
  }

  // No ESPN photo at all (unmatched player) → try the name-based fallback
  // before settling on initials.
  useEffect(() => {
    if (!src && name && !triedFallback) void tryFallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, name]);

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  if (failed || !resolvedSrc) {
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
      src={resolvedSrc}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => void tryFallback()}
      className={`inline-block shrink-0 rounded-full bg-panel2 object-cover ring-1 ring-black/30 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
