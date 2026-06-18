import type { ReactNode } from "react";

export function SectionHeader({
  title,
  right,
  className = "",
}: {
  title: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-3 flex items-end justify-between gap-3 ${className}`}>
      <h2 className="flex min-w-0 items-center gap-3 font-display text-lg font-semibold uppercase tracking-wider md:text-xl">
        <span aria-hidden className="h-5 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-gold via-pitch to-sky shadow-lg shadow-pitch/20" />
        <span className="truncate">{title}</span>
      </h2>
      {right ? <div className="shrink-0 text-right text-xs text-dim">{right}</div> : null}
    </div>
  );
}
