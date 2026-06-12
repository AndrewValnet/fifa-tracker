"use client";

// Transparent data-provenance banner. Shown only when the app is running on
// fallback sources so live mode stays clean.

import { useTodayMatches } from "@/hooks/useFixtures";

export function OfflineNotice() {
  const { source } = useTodayMatches();
  if (!source || source === "football-data") return null;

  if (source === "demo") {
    return (
      <div role="status" className="border-b border-gold/30 bg-gold/10 px-4 py-2 text-center text-xs text-gold">
        Offline mode — showing the bundled tournament schedule. Add{" "}
        <code className="rounded bg-navy/60 px-1">FOOTBALL_DATA_API_KEY</code> to{" "}
        <code className="rounded bg-navy/60 px-1">.env.local</code> (see README) for live data.
      </div>
    );
  }

  return (
    <div role="status" className="border-b border-edge bg-panel px-4 py-1.5 text-center text-[11px] text-dim">
      Live scores via worldcup26.ir (keyless community source) — add a football-data.org key for the primary feed.
    </div>
  );
}
