"use client";

import { useEffect, useState } from "react";

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  past: boolean;
}

function compute(targetMs: number): Countdown {
  const diff = targetMs - Date.now();
  const clamped = Math.max(0, diff);
  return {
    days: Math.floor(clamped / 86_400_000),
    hours: Math.floor((clamped / 3_600_000) % 24),
    minutes: Math.floor((clamped / 60_000) % 60),
    seconds: Math.floor((clamped / 1000) % 60),
    totalMs: diff,
    past: diff <= 0,
  };
}

/** Ticks every second until the target instant passes. */
export function useCountdown(targetIso: string | null | undefined): Countdown | null {
  const targetMs = targetIso ? new Date(targetIso).getTime() : null;
  const [value, setValue] = useState<Countdown | null>(null);

  useEffect(() => {
    if (!targetMs || Number.isNaN(targetMs)) {
      setValue(null);
      return;
    }
    setValue(compute(targetMs));
    const id = setInterval(() => {
      const next = compute(targetMs);
      setValue(next);
      if (next.past) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  return value;
}
