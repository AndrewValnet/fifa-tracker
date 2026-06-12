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
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold uppercase tracking-wider">
        <span aria-hidden className="inline-block h-4 w-1 rounded bg-gold" />
        {title}
      </h2>
      {right ? <div className="text-xs text-dim">{right}</div> : null}
    </div>
  );
}
