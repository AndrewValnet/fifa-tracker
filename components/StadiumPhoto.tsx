"use client";

import { useState } from "react";

/** Stadium image with a styled fallback if the Wikimedia URL ever breaks. */
export function StadiumPhoto({
  src,
  alt,
  className = "h-44 w-full object-cover",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div aria-hidden className={`pitch-bg flex items-center justify-center text-4xl ${className}`}>
        🏟️
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={1600}
      height={900}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
