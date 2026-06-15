"use client";

import { useState, useEffect } from "react";
import { Flag } from "@/components/Flag";

// 32 slots: R32 → R16 → QF → SF → Final + 3rd place
type Bracket = Record<string, string>;  // slotId → team code/name

const STORAGE_KEY = "wc26-bracket-v1";

// Creates a slot hierarchy for a 32-team single-elimination bracket
// R32: slots 1-32, R16: 33-48, QF: 49-56, SF: 57-60, 3rd: 61, Final: 62, Winner: 63
const ROUNDS = [
  { id: "r32", label: "Round of 32", slots: 32 },
  { id: "r16", label: "Round of 16", slots: 16 },
  { id: "qf",  label: "Quarter-finals", slots: 8 },
  { id: "sf",  label: "Semi-finals", slots: 4 },
  { id: "f",   label: "Final & 3rd", slots: 2 },
];

function slotKey(round: string, index: number) {
  return `${round}-${index}`;
}

export function BracketPredictor() {
  const [bracket, setBracket] = useState<Bracket>({});
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [inputVal, setInputVal] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setBracket(JSON.parse(saved));
    } catch {}
  }, []);

  function save(next: Bracket) {
    setBracket(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }

  function pick(slot: string, value: string) {
    save({ ...bracket, [slot]: value.trim().toUpperCase().slice(0, 3) || value.trim().slice(0, 20) });
    setEditingSlot(null);
    setInputVal("");
  }

  function clear() {
    save({});
    setEditingSlot(null);
  }

  return (
    <div className="overflow-x-auto">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] text-dim">
          Click any slot to fill in your prediction. Saved locally in your browser.
        </p>
        <button
          onClick={clear}
          className="rounded border border-edge px-2 py-1 text-[10px] text-dim hover:border-live hover:text-live transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="flex gap-4 min-w-[600px]">
        {ROUNDS.map((round) => (
          <div key={round.id} className="flex flex-col gap-1 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-dim mb-1">
              {round.label}
            </p>
            {Array.from({ length: round.slots }).map((_, i) => {
              const key = slotKey(round.id, i);
              const val = bracket[key] ?? "";
              const isEditing = editingSlot === key;

              return (
                <div key={key} className="relative">
                  {isEditing ? (
                    <input
                      autoFocus
                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") pick(key, inputVal);
                        if (e.key === "Escape") { setEditingSlot(null); setInputVal(""); }
                      }}
                      onBlur={() => { if (inputVal) pick(key, inputVal); else { setEditingSlot(null); setInputVal(""); } }}
                      placeholder="e.g. BRA"
                      className="w-full rounded border border-gold bg-gold/5 px-2 py-1 text-xs font-mono text-gold outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => { setEditingSlot(key); setInputVal(val); }}
                      className={`w-full rounded border px-2 py-1 text-left text-xs transition-colors ${
                        val
                          ? "border-edge/60 bg-panel font-mono font-semibold text-white hover:border-gold/40"
                          : "border-dashed border-edge/30 bg-transparent text-dim/30 hover:border-gold/30 hover:text-dim"
                      }`}
                    >
                      {val ? (
                        <span className="flex items-center gap-1.5">
                          <Flag code={val.length === 3 ? val : null} name={val} width={16} />
                          {val}
                        </span>
                      ) : (
                        <span>—</span>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
