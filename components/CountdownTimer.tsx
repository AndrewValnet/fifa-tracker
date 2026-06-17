"use client";

import { useEffect, useRef, useState } from "react";
import { useCountdown } from "@/hooks/useCountdown";

function Cell({ value, unit }: { value: number; unit: string }) {
  const prevRef = useRef<number>(value);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (prevRef.current !== value) {
      prevRef.current = value;
      setAnimating(true);
      const t = setTimeout(() => setAnimating(false), 300);
      return () => clearTimeout(t);
    }
  }, [value]);

  const display = String(value).padStart(2, "0");

  return (
    <div className="relative flex min-w-[52px] flex-col items-center overflow-hidden rounded-xl border border-gold/20 bg-navy px-3 py-2 shadow-lg shadow-black/30 md:min-w-[64px] md:px-4 md:py-3">
      {/* Horizontal mid-line divider — mimics flip-clock hinge */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-black/40"
      />
      <span
        className={`font-display text-5xl font-black tabular-nums text-ink md:text-6xl${animating ? " animate-slide-up" : ""}`}
      >
        {display}
      </span>
      <span className="mt-1 font-display text-[9px] uppercase tracking-[0.3em] text-gold">
        {unit}
      </span>
    </div>
  );
}

/** DD:HH:MM:SS flip-clock countdown to kickoff (PRD §7.2 pre-match). */
export function CountdownTimer({ targetIso }: { targetIso: string }) {
  const cd = useCountdown(targetIso);

  if (!cd) {
    return <div className="skeleton h-16 w-64" aria-hidden />;
  }
  if (cd.past) {
    return <p className="font-display text-2xl text-pitch">Kicking off…</p>;
  }

  const imminent = cd.days === 0 && cd.hours < 2;
  const separatorClass = `font-bold text-2xl${cd.days === 0 ? " animate-pulse text-gold/60" : " text-gold/40"}`;

  return (
    <div className="flex flex-col items-center gap-2">
      {imminent && (
        <span className="animate-pulse font-display text-xs uppercase tracking-[0.3em] text-live">
          Kickoff
        </span>
      )}
      <div
        aria-label={`Kickoff in ${cd.days} days ${cd.hours} hours ${cd.minutes} minutes`}
        className="flex items-center gap-1.5 md:gap-2"
      >
        <Cell value={cd.days} unit="days" />
        <span className={separatorClass} aria-hidden>:</span>
        <Cell value={cd.hours} unit="hrs" />
        <span className={separatorClass} aria-hidden>:</span>
        <Cell value={cd.minutes} unit="min" />
        <span className={separatorClass} aria-hidden>:</span>
        <Cell value={cd.seconds} unit="sec" />
      </div>
    </div>
  );
}
