// Injects per-match team colors as CSS custom properties (PRD §8.1).
// Children (odds bars, cards, gradients) consume --home-color/--away-color.

import type { CSSProperties, ReactNode } from "react";
import { getAccentColor } from "@/lib/team-meta";

export function TeamColorProvider({
  homeCode,
  awayCode,
  className = "",
  children,
}: {
  homeCode: string | null | undefined;
  awayCode: string | null | undefined;
  className?: string;
  children: ReactNode;
}) {
  const style = {
    "--home-color": getAccentColor(homeCode),
    "--away-color": getAccentColor(awayCode),
  } as CSSProperties;
  return (
    <div style={style} className={className}>
      {children}
    </div>
  );
}
