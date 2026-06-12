// Three-segment Polymarket implied-probability bar (PRD §7.2).
// Colors come from the surrounding --home-color/--away-color CSS vars so the
// bar automatically picks up match theming.

import { fmtPct } from "@/lib/format";

export function OddsBar({
  home,
  draw,
  away,
  homeLabel = "Home",
  awayLabel = "Away",
  compact = false,
}: {
  home: number | null;
  draw: number | null;
  away: number | null;
  homeLabel?: string;
  awayLabel?: string;
  compact?: boolean;
}) {
  const h = home ?? 0;
  const d = draw ?? 0;
  const a = away ?? 0;
  const total = h + d + a;
  if (total <= 0) return null;

  // Normalize and enforce a minimum visible sliver per present outcome.
  const seg = (v: number) => Math.max(v / total, v > 0 ? 0.04 : 0);
  const widths = [seg(h), seg(d), seg(a)];
  const wSum = widths.reduce((x, y) => x + y, 0);
  const [wh, wd, wa] = widths.map((w) => (w / wSum) * 100);

  const label = `${homeLabel} win ${fmtPct(home)}, draw ${fmtPct(draw)}, ${awayLabel} win ${fmtPct(away)} (Polymarket)`;

  return (
    <div aria-label={label} role="img" className="w-full">
      <div className={`flex w-full overflow-hidden rounded-full ${compact ? "h-1.5" : "h-2.5"}`}>
        <div style={{ width: `${wh}%`, background: "var(--home-color)" }} />
        <div style={{ width: `${wd}%`, background: "#4A5578" }} />
        <div style={{ width: `${wa}%`, background: "var(--away-color)" }} />
      </div>
      <div className={`mt-1 flex justify-between font-mono ${compact ? "text-[10px]" : "text-xs"} text-dim`}>
        <span>
          <span className="font-semibold" style={{ color: "var(--home-color)" }}>
            {fmtPct(home)}
          </span>{" "}
          {!compact && homeLabel}
        </span>
        <span>{draw !== null ? `${fmtPct(draw)} draw` : ""}</span>
        <span>
          {!compact && awayLabel}{" "}
          <span className="font-semibold" style={{ color: "var(--away-color)" }}>
            {fmtPct(away)}
          </span>
        </span>
      </div>
    </div>
  );
}
