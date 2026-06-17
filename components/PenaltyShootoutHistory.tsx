import { PENALTY_RECORDS, type PenaltyRecord } from "@/data/penalty-history";
import { Flag } from "@/components/Flag";
import { SectionHeader } from "@/components/SectionHeader";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function winRate(r: PenaltyRecord): number {
  if (r.shootouts === 0) return 0;
  return r.wins / r.shootouts;
}

function ringColor(rate: number): { stroke: string; text: string } {
  if (rate > 0.6) return { stroke: "#00d45e", text: "text-pitch" };
  if (rate >= 0.4) return { stroke: "#ffd700", text: "text-gold" };
  return { stroke: "#ff3b30", text: "text-live" };
}

// ---------------------------------------------------------------------------
// SVG progress ring (server-safe — no state/effects)
// ---------------------------------------------------------------------------

function WinRing({ record }: { record: PenaltyRecord }) {
  const size = 40;
  const strokeWidth = 4;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const rate = winRate(record);
  const offset = circumference * (1 - rate);
  const { stroke, text } = ringColor(rate);
  const pct = record.shootouts === 0 ? "–" : `${Math.round(rate * 100)}%`;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        {/* track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#1e2a3d"
          strokeWidth={strokeWidth}
        />
        {/* arc */}
        {record.shootouts > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        )}
      </svg>
      <span
        className={`absolute font-mono text-[9px] font-bold ${record.shootouts === 0 ? "text-dim" : text}`}
      >
        {pct}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

function PenaltyRow({
  record,
  rank,
}: {
  record: PenaltyRecord;
  rank: number;
}) {
  const isEng = record.code === "ENG";
  const isGer = record.code === "GER";
  const total = record.penaltiesScored + record.penaltiesMissed;
  const scoreRatio =
    total > 0
      ? `${record.penaltiesScored}/${total}`
      : "–";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-edge bg-panel2 px-3 py-2.5 transition-colors hover:border-edge/80 hover:bg-panel">
      {/* rank */}
      <span className="w-5 text-center font-mono text-xs text-dim">{rank}</span>

      {/* ring */}
      <WinRing record={record} />

      {/* flag + name */}
      <Flag code={record.code} name={record.name} width={24} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-display text-sm font-semibold uppercase tracking-wide">
            {record.name}
          </span>
          {isGer && (
            <span
              title="Famously composed under pressure"
              className="rounded bg-pitch/15 px-1.5 py-0.5 font-sans text-[10px] text-pitch ring-1 ring-pitch/30"
            >
              🎯 Nervenstärke
            </span>
          )}
          {isEng && (
            <span
              title="England have lost 5 of 8 World Cup shootouts"
              className="rounded bg-live/10 px-1.5 py-0.5 font-sans text-[10px] text-live ring-1 ring-live/30"
            >
              😬 Notoriously unlucky
            </span>
          )}
        </div>
        {record.mostFamousMiss && (
          <p className="mt-0.5 truncate text-[10px] text-dim" title={record.mostFamousMiss}>
            ✗ {record.mostFamousMiss}
          </p>
        )}
      </div>

      {/* stats */}
      <div className="flex shrink-0 items-center gap-3 text-right">
        <div className="hidden sm:block">
          <div className="font-mono text-xs text-dim">Pens</div>
          <div className="font-mono text-sm font-semibold">{scoreRatio}</div>
        </div>
        <div>
          <div className="font-mono text-xs text-dim">W–L</div>
          <div className="font-mono text-sm font-semibold">
            <span className="text-pitch">{record.wins}</span>
            <span className="text-dim">–</span>
            <span className="text-live">{record.losses}</span>
          </div>
        </div>
        <div>
          <div className="font-mono text-xs text-dim">Played</div>
          <div className="font-mono text-sm font-semibold">{record.shootouts}</div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component (server component — no "use client")
// ---------------------------------------------------------------------------

export function PenaltyShootoutHistory() {
  const tested = PENALTY_RECORDS.filter((r) => r.shootouts >= 2).sort((a, b) => {
    const diff = winRate(b) - winRate(a);
    if (diff !== 0) return diff;
    return b.shootouts - a.shootouts; // tiebreak: more experience first
  });

  const onceOrMore = PENALTY_RECORDS.filter((r) => r.shootouts === 1).sort(
    (a, b) => b.wins - a.wins,
  );

  const untested = PENALTY_RECORDS.filter((r) => r.shootouts === 0).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return (
    <section className="flex flex-col gap-6">
      <SectionHeader title={<>⚽ Penalty Shootout Records</>} />

      {/* Hall of fame — 2+ shootouts */}
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-dim">
          Hall of fame — teams with 2+ shootouts · sorted by win rate
        </p>
        {tested.map((r, i) => (
          <PenaltyRow key={r.code} record={r} rank={i + 1} />
        ))}
      </div>

      {/* One appearance */}
      {onceOrMore.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-dim">
            One appearance
          </p>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {onceOrMore.map((r) => (
              <div
                key={r.code}
                className="flex items-center gap-2 rounded-lg border border-edge bg-panel2 px-3 py-2"
              >
                <Flag code={r.code} name={r.name} width={20} />
                <span className="flex-1 font-display text-xs font-semibold uppercase tracking-wide">
                  {r.name}
                </span>
                <span className="font-mono text-xs">
                  {r.wins > 0 ? (
                    <span className="text-pitch">Won</span>
                  ) : (
                    <span className="text-live">Lost</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Never been tested */}
      {untested.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-dim">
            Never been tested — no WC shootout yet
          </p>
          <div className="flex flex-wrap gap-1.5">
            {untested.map((r) => (
              <div
                key={r.code}
                className="flex items-center gap-1.5 rounded border border-edge bg-panel2 px-2 py-1"
              >
                <Flag code={r.code} name={r.name} width={16} />
                <span className="font-mono text-[10px] text-dim">{r.code}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
