"use client";

import { useState, useEffect } from "react";

interface MatchRatingWidgetProps {
  matchId: string;
  status: string;
}

const STORAGE_KEY_PREFIX = "wc26-rating-";

export function MatchRatingWidget({ matchId, status }: MatchRatingWidgetProps) {
  const [hovered, setHovered] = useState<number>(0);
  const [rated, setRated] = useState<number>(0);
  const [submitted, setSubmitted] = useState(false);

  const storageKey = `${STORAGE_KEY_PREFIX}${matchId}`;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (parsed >= 1 && parsed <= 5) {
          setRated(parsed);
          setSubmitted(true);
        }
      }
    } catch {
      // localStorage not available
    }
  }, [storageKey]);

  // Only show for finished matches
  const isFinished =
    status === "FT" ||
    status === "finished" ||
    status === "FINISHED" ||
    status === "full-time" ||
    status === "complete" ||
    status === "AET" ||
    status === "PEN";

  if (!isFinished) return null;

  function handleRate(star: number) {
    if (submitted) return;

    setRated(star);
    setSubmitted(true);

    try {
      localStorage.setItem(storageKey, String(star));
    } catch {
      // localStorage not available
    }

    // Fire-and-forget POST — do not block UI
    fetch(`/api/match-rating/${matchId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: star }),
    }).catch(() => {
      // Silently ignore network errors
    });
  }

  const displayValue = submitted ? rated : hovered;

  return (
    <div className="bg-[#0f1523] rounded-xl p-4 border border-[#1e2a3a] flex flex-col items-center gap-2">
      <p className="text-xs font-body uppercase tracking-widest text-gray-400">
        {submitted ? `You rated: ${rated}/5` : "Rate this match"}
      </p>

      <div
        className="flex gap-1"
        onMouseLeave={() => !submitted && setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= displayValue;
          return (
            <button
              key={star}
              type="button"
              aria-label={`Rate ${star} out of 5 stars`}
              disabled={submitted}
              onClick={() => handleRate(star)}
              onMouseEnter={() => !submitted && setHovered(star)}
              className={[
                "transition-all duration-150 focus:outline-none",
                submitted ? "cursor-default" : "cursor-pointer hover:scale-110",
                filled ? "text-[#ffd700]" : "text-gray-600",
              ].join(" ")}
              style={{ fontSize: "28px", lineHeight: 1 }}
            >
              ★
            </button>
          );
        })}
      </div>
    </div>
  );
}
