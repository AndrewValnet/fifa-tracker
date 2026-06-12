"use client";

import { useCountdown } from "@/hooks/useCountdown";

function Cell({ value, unit }: { value: number; unit: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-edge bg-panel2/80 px-3 py-2">
      <span className="font-display text-3xl font-bold tabular-nums md:text-4xl">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] uppercase tracking-widest text-dim">{unit}</span>
    </div>
  );
}

/** DD:HH:MM:SS countdown to kickoff (PRD §7.2 pre-match). */
export function CountdownTimer({ targetIso }: { targetIso: string }) {
  const cd = useCountdown(targetIso);
  if (!cd) {
    return <div className="skeleton h-16 w-64" aria-hidden />;
  }
  if (cd.past) {
    return <p className="font-display text-2xl text-pitch">Kicking off…</p>;
  }
  return (
    <div aria-label={`Kickoff in ${cd.days} days ${cd.hours} hours ${cd.minutes} minutes`} className="flex items-center gap-2">
      <Cell value={cd.days} unit="days" />
      <span className="text-xl text-dim">:</span>
      <Cell value={cd.hours} unit="hrs" />
      <span className="text-xl text-dim">:</span>
      <Cell value={cd.minutes} unit="min" />
      <span className="text-xl text-dim">:</span>
      <Cell value={cd.seconds} unit="sec" />
    </div>
  );
}
