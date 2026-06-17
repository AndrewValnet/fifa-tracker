"use client";

import { useCallback, useEffect, useState } from "react";
import { SectionHeader } from "@/components/SectionHeader";

const STORAGE_KEY = "wc26-bracket";

// ─── WC 2026 Round of 32 bracket structure ────────────────────────────────
// 48 teams, 12 groups (A-L) of 4 → top 2 each group + 8 best 3rd-place = 32

const R32_MATCHES: { id: string; label1: string; label2: string }[] = [
  { id: "m49",  label1: "Winner A",     label2: "Runner-up B"  },
  { id: "m50",  label1: "Winner C",     label2: "Runner-up D"  },
  { id: "m51",  label1: "Winner E",     label2: "Runner-up F"  },
  { id: "m52",  label1: "Winner G",     label2: "Runner-up H"  },
  { id: "m53",  label1: "Winner I",     label2: "Runner-up J"  },
  { id: "m54",  label1: "Winner K",     label2: "Runner-up L"  },
  { id: "m55",  label1: "3rd (A/B/C/D)", label2: "3rd (E/F/G/H)" },
  { id: "m56",  label1: "3rd (I/J/K/L)", label2: "Runner-up A"  },
  { id: "m57",  label1: "Winner B",     label2: "Runner-up C"  },
  { id: "m58",  label1: "Winner D",     label2: "Runner-up E"  },
  { id: "m59",  label1: "Winner F",     label2: "Runner-up G"  },
  { id: "m60",  label1: "Winner H",     label2: "Runner-up I"  },
  { id: "m61",  label1: "Winner J",     label2: "Runner-up K"  },
  { id: "m62",  label1: "Winner L",     label2: "3rd (best 1)" },
  { id: "m63",  label1: "3rd (best 2)", label2: "3rd (best 3)" },
  { id: "m64",  label1: "3rd (best 4)", label2: "3rd (best 5)" },
];

// Each round: array of match slot pairs (indices into the previous round's winners)
// R16 = winners of R32 matches 0-15, paired consecutively
// QF = winners of R16
// SF = winners of QF
// F = winners of SF

type RoundName = "Round of 32" | "Round of 16" | "Quarter-Finals" | "Semi-Finals" | "Final";

type Picks = Record<string, string>; // matchId → winner name

interface BracketState {
  picks: Picks;
  r32: string[];   // 16 winner names (one per R32 match)
  r16: string[];   // 8 winners
  qf: string[];    // 4 winners
  sf: string[];    // 2 winners
  final: string;   // 1 winner
}

function emptyState(): BracketState {
  return {
    picks: {},
    r32: Array(16).fill(""),
    r16: Array(8).fill(""),
    qf: Array(4).fill(""),
    sf: Array(2).fill(""),
    final: "",
  };
}

function loadFromStorage(): BracketState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return { ...emptyState(), ...parsed };
  } catch {
    return emptyState();
  }
}

function saveToStorage(state: BracketState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

// ─── Match slot component ─────────────────────────────────────────────────
function MatchSlot({
  top,
  bottom,
  winner,
  onPick,
  roundIndex,
  matchIndex,
}: {
  top: string;
  bottom: string;
  winner: string;
  onPick: (name: string) => void;
  roundIndex: number;
  matchIndex: number;
}) {
  const topLabel = top || "TBD";
  const bottomLabel = bottom || "TBD";
  const topClickable = top.trim().length > 0;
  const bottomClickable = bottom.trim().length > 0;

  return (
    <div
      className="flex flex-col rounded-xl border border-edge bg-panel overflow-hidden shadow-sm"
      aria-label={`Match ${matchIndex + 1} of round ${roundIndex + 1}`}
    >
      <button
        className={`flex items-center gap-2 px-3 py-2.5 text-left transition-all ${
          winner === top
            ? "bg-pitch/15 ring-inset ring-1 ring-pitch"
            : topClickable
            ? "hover:bg-pitch/5 cursor-pointer"
            : "cursor-default opacity-40"
        }`}
        onClick={() => topClickable && onPick(top)}
        disabled={!topClickable}
        aria-pressed={winner === top}
        title={topClickable ? `Pick ${topLabel} to advance` : "Team not yet determined"}
      >
        <span
          className={`flex-1 font-body text-xs leading-tight ${
            winner === top ? "font-semibold text-pitch" : "text-ink"
          }`}
        >
          {topLabel}
        </span>
        {winner === top && (
          <span className="h-2 w-2 rounded-full bg-pitch flex-shrink-0" aria-hidden />
        )}
      </button>

      <div className="h-px bg-edge" aria-hidden />

      <button
        className={`flex items-center gap-2 px-3 py-2.5 text-left transition-all ${
          winner === bottom
            ? "bg-pitch/15 ring-inset ring-1 ring-pitch"
            : bottomClickable
            ? "hover:bg-pitch/5 cursor-pointer"
            : "cursor-default opacity-40"
        }`}
        onClick={() => bottomClickable && onPick(bottom)}
        disabled={!bottomClickable}
        aria-pressed={winner === bottom}
        title={bottomClickable ? `Pick ${bottomLabel} to advance` : "Team not yet determined"}
      >
        <span
          className={`flex-1 font-body text-xs leading-tight ${
            winner === bottom ? "font-semibold text-pitch" : "text-ink"
          }`}
        >
          {bottomLabel}
        </span>
        {winner === bottom && (
          <span className="h-2 w-2 rounded-full bg-pitch flex-shrink-0" aria-hidden />
        )}
      </button>
    </div>
  );
}

// ─── Round column ─────────────────────────────────────────────────────────
function RoundColumn({
  name,
  matches,
  onPick,
  roundIndex,
}: {
  name: RoundName | "Champion";
  matches: { top: string; bottom: string; winner: string }[];
  onPick: (matchIndex: number, name: string) => void;
  roundIndex: number;
}) {
  return (
    <div className="flex flex-col gap-2 min-w-[140px]">
      <div className="mb-1 text-center font-display text-[10px] font-semibold uppercase tracking-widest text-dim">
        {name}
      </div>
      <div
        className="flex flex-col gap-3"
        style={{
          // Spread matches evenly with vertical centering per bracket level
          justifyContent: matches.length === 1 ? "center" : "space-around",
          minHeight: `${Math.max(matches.length, 1) * 80}px`,
        }}
      >
        {matches.map((m, i) => (
          <MatchSlot
            key={i}
            top={m.top}
            bottom={m.bottom}
            winner={m.winner}
            onPick={(name) => onPick(i, name)}
            roundIndex={roundIndex}
            matchIndex={i}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Champion display ─────────────────────────────────────────────────────
function ChampionDisplay({ name }: { name: string }) {
  return (
    <div className="flex min-w-[140px] flex-col items-center justify-center gap-2 rounded-2xl border border-gold/40 bg-gold/5 px-4 py-6">
      <div className="font-display text-3xl" aria-hidden>
        🏆
      </div>
      <div className="text-center font-display text-[10px] font-semibold uppercase tracking-widest text-gold">
        Champion
      </div>
      <div
        className={`text-center font-display text-sm font-bold ${
          name ? "text-gold" : "text-dim"
        }`}
      >
        {name || "TBD"}
      </div>
    </div>
  );
}

// ─── Copy picks as text ───────────────────────────────────────────────────
function buildClipboardText(state: BracketState): string {
  const lines: string[] = ["=== WC 2026 Bracket Picks ===", ""];

  lines.push("Round of 32:");
  R32_MATCHES.forEach((m, i) => {
    const winner = state.r32[i];
    lines.push(`  ${m.label1} vs ${m.label2} → ${winner || "??"}`);
  });

  lines.push("", "Round of 16:");
  for (let i = 0; i < 8; i++) {
    const t = state.r32[i * 2] || "??";
    const b = state.r32[i * 2 + 1] || "??";
    lines.push(`  ${t} vs ${b} → ${state.r16[i] || "??"}`);
  }

  lines.push("", "Quarter-Finals:");
  for (let i = 0; i < 4; i++) {
    const t = state.r16[i * 2] || "??";
    const b = state.r16[i * 2 + 1] || "??";
    lines.push(`  ${t} vs ${b} → ${state.qf[i] || "??"}`);
  }

  lines.push("", "Semi-Finals:");
  for (let i = 0; i < 2; i++) {
    const t = state.qf[i * 2] || "??";
    const b = state.qf[i * 2 + 1] || "??";
    lines.push(`  ${t} vs ${b} → ${state.sf[i] || "??"}`);
  }

  lines.push("", "Final:");
  lines.push(`  ${state.sf[0] || "??"} vs ${state.sf[1] || "??"} → ${state.final || "??"}`);
  lines.push("", `Champion: ${state.final || "TBD"}`);

  return lines.join("\n");
}

// ─── Main bracket component ───────────────────────────────────────────────
function BracketPredictor() {
  const [state, setState] = useState<BracketState>(emptyState);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setState(loadFromStorage());
  }, []);

  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  // Pick a winner in R32
  const pickR32 = useCallback((matchIndex: number, winnerName: string) => {
    setState((prev) => {
      const next = { ...prev, r32: [...prev.r32] };
      next.r32[matchIndex] = winnerName;
      // Cascade: clear downstream picks that are now invalid
      // R16 slot = Math.floor(matchIndex / 2); position = matchIndex % 2
      const r16Slot = Math.floor(matchIndex / 2);
      const r16Pos = matchIndex % 2;
      const r16Current = next.r16[r16Slot];
      // If the slot in r16 was the other half of this match, it's still valid
      const currentR32Top = next.r32[r16Slot * 2];
      const currentR32Bot = next.r32[r16Slot * 2 + 1];
      if (r16Current && r16Current !== currentR32Top && r16Current !== currentR32Bot) {
        next.r16 = [...next.r16];
        next.r16[r16Slot] = "";
        // cascade QF
        const qfSlot = Math.floor(r16Slot / 2);
        const qfCurrent = next.qf[qfSlot];
        const r16Top = next.r16[qfSlot * 2];
        const r16Bot = next.r16[qfSlot * 2 + 1];
        if (qfCurrent && qfCurrent !== r16Top && qfCurrent !== r16Bot) {
          next.qf = [...next.qf];
          next.qf[qfSlot] = "";
          // cascade SF
          const sfSlot = Math.floor(qfSlot / 2);
          const sfCurrent = next.sf[sfSlot];
          const qfTop = next.qf[sfSlot * 2];
          const qfBot = next.qf[sfSlot * 2 + 1];
          if (sfCurrent && sfCurrent !== qfTop && sfCurrent !== qfBot) {
            next.sf = [...next.sf];
            next.sf[sfSlot] = "";
            if (next.final && next.final !== next.sf[0] && next.final !== next.sf[1]) {
              next.final = "";
            }
          }
        }
      }
      void r16Pos; // used implicitly
      return next;
    });
  }, []);

  const pickR16 = useCallback((matchIndex: number, winnerName: string) => {
    setState((prev) => {
      const next = { ...prev, r16: [...prev.r16] };
      next.r16[matchIndex] = winnerName;
      const qfSlot = Math.floor(matchIndex / 2);
      const qfTop = next.r16[qfSlot * 2];
      const qfBot = next.r16[qfSlot * 2 + 1];
      if (next.qf[qfSlot] && next.qf[qfSlot] !== qfTop && next.qf[qfSlot] !== qfBot) {
        next.qf = [...next.qf];
        next.qf[qfSlot] = "";
        const sfSlot = Math.floor(qfSlot / 2);
        const sfTop = next.qf[sfSlot * 2];
        const sfBot = next.qf[sfSlot * 2 + 1];
        if (next.sf[sfSlot] && next.sf[sfSlot] !== sfTop && next.sf[sfSlot] !== sfBot) {
          next.sf = [...next.sf];
          next.sf[sfSlot] = "";
          if (next.final && next.final !== next.sf[0] && next.final !== next.sf[1]) {
            next.final = "";
          }
        }
      }
      return next;
    });
  }, []);

  const pickQF = useCallback((matchIndex: number, winnerName: string) => {
    setState((prev) => {
      const next = { ...prev, qf: [...prev.qf] };
      next.qf[matchIndex] = winnerName;
      const sfSlot = Math.floor(matchIndex / 2);
      const sfTop = next.qf[sfSlot * 2];
      const sfBot = next.qf[sfSlot * 2 + 1];
      if (next.sf[sfSlot] && next.sf[sfSlot] !== sfTop && next.sf[sfSlot] !== sfBot) {
        next.sf = [...next.sf];
        next.sf[sfSlot] = "";
        if (next.final && next.final !== next.sf[0] && next.final !== next.sf[1]) {
          next.final = "";
        }
      }
      return next;
    });
  }, []);

  const pickSF = useCallback((matchIndex: number, winnerName: string) => {
    setState((prev) => {
      const next = { ...prev, sf: [...prev.sf] };
      next.sf[matchIndex] = winnerName;
      if (next.final && next.final !== next.sf[0] && next.final !== next.sf[1]) {
        next.final = "";
      }
      return next;
    });
  }, []);

  const pickFinal = useCallback((winnerName: string) => {
    setState((prev) => ({ ...prev, final: winnerName }));
  }, []);

  function handleReset() {
    setState(emptyState());
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildClipboardText(state));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  // Build match arrays for each round
  const r32Matches = R32_MATCHES.map((m, i) => ({
    top: m.label1,
    bottom: m.label2,
    winner: state.r32[i],
  }));

  const r16Matches = Array.from({ length: 8 }, (_, i) => ({
    top: state.r32[i * 2] || "",
    bottom: state.r32[i * 2 + 1] || "",
    winner: state.r16[i],
  }));

  const qfMatches = Array.from({ length: 4 }, (_, i) => ({
    top: state.r16[i * 2] || "",
    bottom: state.r16[i * 2 + 1] || "",
    winner: state.qf[i],
  }));

  const sfMatches = Array.from({ length: 2 }, (_, i) => ({
    top: state.qf[i * 2] || "",
    bottom: state.qf[i * 2 + 1] || "",
    winner: state.sf[i],
  }));

  const finalMatch = {
    top: state.sf[0] || "",
    bottom: state.sf[1] || "",
    winner: state.final,
  };

  return (
    <div>
      {/* Controls */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <p className="flex-1 font-body text-xs text-dim">
          Click a team name to advance them. Picks are saved automatically.
        </p>
        <button
          onClick={handleCopy}
          className="rounded-lg border border-edge bg-panel px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-wide text-ink transition hover:border-pitch/60 hover:text-pitch active:scale-[0.98]"
        >
          {copied ? "Copied!" : "Copy picks"}
        </button>
        <button
          onClick={handleReset}
          className="rounded-lg border border-edge bg-panel px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-wide text-dim transition hover:border-live/60 hover:text-live active:scale-[0.98]"
        >
          Reset
        </button>
      </div>

      {/* Scrollable bracket */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4" style={{ minWidth: "860px" }}>
          <RoundColumn
            name="Round of 32"
            matches={r32Matches}
            onPick={pickR32}
            roundIndex={0}
          />
          <RoundColumn
            name="Round of 16"
            matches={r16Matches}
            onPick={pickR16}
            roundIndex={1}
          />
          <RoundColumn
            name="Quarter-Finals"
            matches={qfMatches}
            onPick={pickQF}
            roundIndex={2}
          />
          <RoundColumn
            name="Semi-Finals"
            matches={sfMatches}
            onPick={pickSF}
            roundIndex={3}
          />
          <RoundColumn
            name="Final"
            matches={[finalMatch]}
            onPick={(_, name) => pickFinal(name)}
            roundIndex={4}
          />
          <ChampionDisplay name={state.final} />
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-edge bg-panel px-4 py-3">
        <div className="flex items-center gap-2 font-body text-xs text-dim">
          <span className="inline-block h-2 w-2 rounded-full bg-pitch" aria-hidden />
          Picked to advance
        </div>
        <div className="flex items-center gap-2 font-body text-xs text-dim">
          <span className="inline-block h-2 w-2 rounded-full bg-edge" aria-hidden />
          Not yet decided
        </div>
        <div className="ml-auto font-body text-xs text-dim">
          Picks saved locally · WC 2026 · Jul 2026
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default function BracketPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8">
      <h1 className="mb-1 font-display text-2xl font-black uppercase tracking-tight text-ink md:text-3xl">
        Bracket <span className="text-pitch">Predictor</span>
      </h1>
      <p className="mb-6 font-body text-sm text-dim">
        Build your WC 2026 knockout bracket. 32 → 16 → 8 → 4 → 2 → Champion.
      </p>
      <SectionHeader
        title="WC 2026 Knockout Bracket"
        right="48 teams · 12 groups · MetLife Stadium Final · Jul 19"
      />
      <BracketPredictor />
    </div>
  );
}
