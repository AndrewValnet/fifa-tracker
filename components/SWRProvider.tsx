"use client";

// Global SWR defaults: a longer dedupe window so mount/focus bursts collapse,
// throttled focus revalidation, and no polling while the tab is hidden. Per-hook
// refreshInterval/revalidateOnFocus overrides (the freshness contract) still win.

import { SWRConfig } from "swr";
import type { ReactNode } from "react";

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        dedupingInterval: 5000,
        focusThrottleInterval: 30000,
        keepPreviousData: true,
        refreshWhenHidden: false,
        revalidateOnReconnect: true,
      }}
    >
      {children}
    </SWRConfig>
  );
}
