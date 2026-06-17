"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BINGO_MOMENTS, FREE_CELL, type BingoMoment } from "@/data/bingo-moments";

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = "wc26-bingo";
const GRID_SIZE = 5;
const FREE_INDEX = 12; // center of 5×5

// ─── Build the 25-cell board (FREE at index 12) ───────────────────────────────
function buildBoard(): BingoMoment[] {
  const pool = [...BINGO_MOMENTS];
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const board = pool.slice(0, 24);
  board.splice(FREE_INDEX, 0, FREE_CELL);
  return board;
}

// ─── Bingo detection ─────────────────────────────────────────────────────────
function getWinningIndices(marked: boolean[]): number[] {
  const winning = new Set<number>();

  // Rows
  for (let r = 0; r < GRID_SIZE; r++) {
    const row = Array.from({ length: GRID_SIZE }, (_, c) => r * GRID_SIZE + c);
    if (row.every((i) => marked[i])) row.forEach((i) => winning.add(i));
  }

  // Columns
  for (let c = 0; c < GRID_SIZE; c++) {
    const col = Array.from({ length: GRID_SIZE }, (_, r) => r * GRID_SIZE + c);
    if (col.every((i) => marked[i])) col.forEach((i) => winning.add(i));
  }

  // Diagonal TL→BR
  const diag1 = Array.from({ length: GRID_SIZE }, (_, i) => i * GRID_SIZE + i);
  if (diag1.every((i) => marked[i])) diag1.forEach((i) => winning.add(i));

  // Diagonal TR→BL
  const diag2 = Array.from({ length: GRID_SIZE }, (_, i) => i * GRID_SIZE + (GRID_SIZE - 1 - i));
  if (diag2.every((i) => marked[i])) diag2.forEach((i) => winning.add(i));

  return Array.from(winning);
}

// ─── Category accent colours ──────────────────────────────────────────────────
const CATEGORY_DOT: Record<BingoMoment["category"], string> = {
  goals: "bg-pitch",
  drama: "bg-live",
  cards: "bg-gold",
  records: "bg-sky-400",
  fan: "bg-purple-400",
};

// ─── Storage helpers ──────────────────────────────────────────────────────────
interface SavedState {
  boardIds: string[];
  marked: boolean[];
}

function loadSaved(): SavedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedState;
  } catch {
    return null;
  }
}

function saveToBrowser(boardIds: string[], marked: boolean[]) {
  try {
    const payload: SavedState = { boardIds, marked };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

// ─── BingoCard component ──────────────────────────────────────────────────────
function BingoCard() {
  const [board, setBoard] = useState<BingoMoment[]>([]);
  const [marked, setMarked] = useState<boolean[]>(Array(25).fill(false));
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage or build fresh
  useEffect(() => {
    const saved = loadSaved();
    if (saved && saved.boardIds.length === 25 && saved.marked.length === 25) {
      // Rebuild board in saved order
      const momentMap = new Map(
        [...BINGO_MOMENTS, FREE_CELL].map((m) => [m.id, m])
      );
      const restoredBoard = saved.boardIds.map(
        (id) => momentMap.get(id) ?? FREE_CELL
      );
      setBoard(restoredBoard);
      setMarked(saved.marked);
    } else {
      const fresh = buildBoard();
      setBoard(fresh);
      const initMarked = fresh.map((_, i) => i === FREE_INDEX);
      setMarked(initMarked);
    }
    setHydrated(true);
  }, []);

  // Persist on every change (after hydration)
  useEffect(() => {
    if (!hydrated || board.length === 0) return;
    saveToBrowser(board.map((m) => m.id), marked);
  }, [hydrated, board, marked]);

  const winningIndices = useMemo(() => getWinningIndices(marked), [marked]);
  const hasBingo = winningIndices.length > 0;
  const markedCount = marked.filter(Boolean).length;

  const toggleCell = useCallback((index: number) => {
    if (index === FREE_INDEX) return; // FREE cell cannot be toggled
    setMarked((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }, []);

  function handleNewCard() {
    const fresh = buildBoard();
    setBoard(fresh);
    const initMarked = fresh.map((_, i) => i === FREE_INDEX);
    setMarked(initMarked);
  }

  if (!hydrated || board.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="font-display text-sm uppercase tracking-widest text-dim animate-pulse">
          Loading card…
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Bingo celebration banner */}
      {hasBingo && (
        <div className="w-full max-w-2xl rounded-2xl border-2 border-gold bg-gold/10 px-6 py-4 text-center shadow-lg shadow-gold/20">
          <p className="font-display text-2xl font-black uppercase tracking-widest text-gold md:text-3xl">
            🎉 BINGO! 🎉
          </p>
          <p className="mt-1 font-body text-sm text-ink/70">
            You completed a row, column, or diagonal!
          </p>
        </div>
      )}

      {/* 5×5 Grid */}
      <div
        className="w-full max-w-2xl"
        style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}
        role="grid"
        aria-label="World Cup 2026 Bingo Card"
      >
        {board.map((moment, index) => {
          const isMarked = marked[index];
          const isFree = index === FREE_INDEX;
          const isWinning = winningIndices.includes(index);

          return (
            <button
              key={moment.id + index}
              onClick={() => toggleCell(index)}
              disabled={isFree}
              role="gridcell"
              aria-pressed={isMarked}
              aria-label={moment.text}
              className={[
                "relative flex flex-col items-center justify-center rounded-xl border p-1.5 transition-all duration-200 select-none",
                "min-h-[80px] sm:min-h-[96px]",
                // Base border & bg
                isWinning
                  ? "border-2 border-gold bg-gold/10 shadow-md shadow-gold/30"
                  : isMarked
                  ? "border-pitch/50 bg-pitch/10"
                  : "border-edge bg-panel hover:border-pitch/40 hover:bg-panel2 active:scale-95",
                isFree ? "cursor-default" : "cursor-pointer",
              ].join(" ")}
            >
              {/* Category dot */}
              {!isFree && (
                <span
                  className={`absolute left-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${CATEGORY_DOT[moment.category]}`}
                />
              )}

              {/* Emoji */}
              <span
                className={[
                  "text-xl leading-none sm:text-2xl",
                  isMarked && !isFree ? "opacity-40" : "opacity-100",
                ].join(" ")}
              >
                {moment.emoji}
              </span>

              {/* Text */}
              <span
                className={[
                  "mt-1 text-center font-display text-[9px] font-semibold uppercase leading-tight tracking-wide sm:text-[10px]",
                  isFree
                    ? "text-gold"
                    : isMarked
                    ? "text-dim line-through"
                    : "text-ink",
                ].join(" ")}
              >
                {moment.text}
              </span>

              {/* Check overlay */}
              {isMarked && !isFree && (
                <span
                  className="absolute inset-0 flex items-center justify-center rounded-xl text-lg font-black text-pitch opacity-60"
                  aria-hidden="true"
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Status bar */}
      <div className="flex w-full max-w-2xl items-center justify-between rounded-xl border border-edge bg-panel px-4 py-3">
        <div className="font-body text-sm text-dim">
          <span className="font-semibold text-ink">{markedCount}</span>
          <span className="mx-1">/</span>
          <span>25</span>
          <span className="ml-1">cells marked</span>
        </div>

        <div className="flex items-center gap-3">
          {hasBingo && (
            <span className="font-display text-xs font-semibold uppercase tracking-wider text-gold">
              BINGO achieved!
            </span>
          )}
          <button
            onClick={handleNewCard}
            className="rounded-lg border border-edge bg-navy px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-wider text-ink transition hover:border-pitch/60 hover:text-pitch active:scale-95"
          >
            New Card
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex w-full max-w-2xl flex-wrap gap-3">
        {(
          [
            ["goals", "Goals"],
            ["drama", "Drama"],
            ["cards", "Cards"],
            ["records", "Records"],
            ["fan", "Fan moments"],
          ] as [BingoMoment["category"], string][]
        ).map(([cat, label]) => (
          <div key={cat} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${CATEGORY_DOT[cat]}`} />
            <span className="font-body text-xs text-dim">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BingoPage() {
  return (
    <div className="mx-auto max-w-shell px-4 py-8">
      <h1 className="mb-1 font-display text-2xl font-black uppercase tracking-tight text-ink md:text-3xl">
        WC 2026 <span className="text-pitch">Bingo</span>
      </h1>
      <p className="mb-6 font-body text-sm text-dim">
        Mark cells as World Cup moments happen. Get 5 in a row, column, or diagonal to win!
      </p>
      <BingoCard />
    </div>
  );
}
