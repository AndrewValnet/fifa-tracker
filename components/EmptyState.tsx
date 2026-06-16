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
    <div className="rounded-lg border border-dashed border-edge bg-panel2/30 px-4 py-6 text-center">
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description ? <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-dim">{description}</p> : null}
      {action ? <div className="mt-3 text-sm">{action}</div> : null}
    </div>
  );
}
