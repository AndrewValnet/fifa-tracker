import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface-card rounded-2xl border-dashed border-white/15 px-4 py-7 text-center">
      <span aria-hidden className="mx-auto mb-3 block h-1 w-16 rounded-full bg-gradient-to-r from-pitch via-sky to-gold" />
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description ? <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-dim">{description}</p> : null}
      {action ? <div className="mt-3 text-sm">{action}</div> : null}
    </div>
  );
}
