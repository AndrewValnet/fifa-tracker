// All-time head-to-head bar for the two sides. Server component; renders
// nothing when the pairing isn't in the curated dataset.

import { headToHead } from "@/lib/h2h";

export function HeadToHead({
  homeCode,
  awayCode,
  homeName,
  awayName,
}: {
  homeCode: string | null | undefined;
  awayCode: string | null | undefined;
  homeName: string;
  awayName: string;
}) {
  const h = headToHead(homeCode, awayCode);
  if (!h || !h.played) return null;
  const total = h.homeWins + h.draws + h.awayWins || 1;
  const pct = (n: number) => `${(n / total) * 100}%`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between text-sm font-semibold">
        <span style={{ color: "var(--home-color)" }}>{h.homeWins}</span>
        <span className="text-[11px] uppercase tracking-wider text-dim">{h.played} meetings · {h.draws} draws</span>
        <span style={{ color: "var(--away-color)" }}>{h.awayWins}</span>
      </div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-panel2">
        <span style={{ width: pct(h.homeWins), background: "var(--home-color)" }} title={`${homeName} ${h.homeWins} wins`} />
        <span style={{ width: pct(h.draws), background: "var(--border)" }} title={`${h.draws} draws`} />
        <span style={{ width: pct(h.awayWins), background: "var(--away-color)" }} title={`${awayName} ${h.awayWins} wins`} />
      </div>
      <div className="flex justify-between text-[10px] text-dim">
        <span>{homeName} wins</span>
        <span>{awayName} wins</span>
      </div>
      {h.lastMeeting ? <p className="text-[11px] text-dim">Last: {h.lastMeeting}</p> : null}
      {h.note ? <p className="text-[11px] italic text-dim">{h.note}</p> : null}
      <p className="text-[10px] text-dim">All-time, all competitions · approximate (sources vary).</p>
    </div>
  );
}
