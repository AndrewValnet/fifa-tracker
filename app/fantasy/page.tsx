"use client";

import { useEffect, useState } from "react";
import { FANTASY_PLAYERS, type FantasyPlayer } from "@/data/fantasy-players";
import { Flag } from "@/components/Flag";

// ── Squad constraints ────────────────────────────────────────────────────────
const SQUAD_LIMITS: Record<FantasyPlayer["position"], number> = {
  GK: 1,
  DEF: 4,
  MID: 4,
  FWD: 2,
};
const TOTAL_SLOTS = 11;
const STORAGE_KEY = "wc26-fantasy";

type PositionTab = "ALL" | FantasyPlayer["position"];

const POSITION_ORDER: FantasyPlayer["position"][] = ["GK", "DEF", "MID", "FWD"];

const POSITION_COLORS: Record<FantasyPlayer["position"], string> = {
  GK: "bg-yellow-600/20 text-yellow-400 border border-yellow-600/40",
  DEF: "bg-blue-600/20 text-blue-400 border border-blue-600/40",
  MID: "bg-purple-600/20 text-purple-400 border border-purple-600/40",
  FWD: "bg-red-600/20 text-red-400 border border-red-600/40",
};

// ── LocalStorage helpers ─────────────────────────────────────────────────────
function loadSquad(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveSquad(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function countByPosition(
  ids: string[],
  pos: FantasyPlayer["position"]
): number {
  return ids.filter((id) => {
    const p = FANTASY_PLAYERS.find((pl) => pl.id === id);
    return p?.position === pos;
  }).length;
}

function playersByPosition(
  ids: string[],
  pos: FantasyPlayer["position"]
): FantasyPlayer[] {
  return ids
    .map((id) => FANTASY_PLAYERS.find((pl) => pl.id === id))
    .filter((p): p is FantasyPlayer => p?.position === pos);
}

function totalPoints(ids: string[]): number {
  return ids.reduce((sum, id) => {
    const p = FANTASY_PLAYERS.find((pl) => pl.id === id);
    return sum + (p?.points ?? 0);
  }, 0);
}

// ── Component ────────────────────────────────────────────────────────────────
export default function FantasyPage() {
  const [squadIds, setSquadIds] = useState<string[]>([]);
  const [tab, setTab] = useState<PositionTab>("ALL");
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after mount
  useEffect(() => {
    setSquadIds(loadSquad());
    setHydrated(true);
  }, []);

  // Persist on every change
  useEffect(() => {
    if (hydrated) saveSquad(squadIds);
  }, [squadIds, hydrated]);

  function handleToggle(player: FantasyPlayer) {
    if (squadIds.includes(player.id)) {
      // Remove
      setSquadIds((prev) => prev.filter((id) => id !== player.id));
    } else {
      // Add — check limits
      if (squadIds.length >= TOTAL_SLOTS) return;
      if (
        countByPosition(squadIds, player.position) >=
        SQUAD_LIMITS[player.position]
      )
        return;
      setSquadIds((prev) => [...prev, player.id]);
    }
  }

  function canAdd(player: FantasyPlayer): boolean {
    if (squadIds.includes(player.id)) return true; // already selected
    if (squadIds.length >= TOTAL_SLOTS) return false;
    return (
      countByPosition(squadIds, player.position) <
      SQUAD_LIMITS[player.position]
    );
  }

  const filteredPlayers =
    tab === "ALL"
      ? FANTASY_PLAYERS
      : FANTASY_PLAYERS.filter((p) => p.position === tab);

  const pts = totalPoints(squadIds);

  return (
    <main className="min-h-screen bg-[#0a0e1a] text-white px-4 py-6">
      {/* ── Page header ── */}
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-widest text-white">
          Fantasy Draft
        </h1>
        <p className="text-sm text-[#6b7280] mt-1">
          Pick your WC 2026 squad — 1 GK · 4 DEF · 4 MID · 2 FWD
        </p>
        <p className="text-xs text-[#6b7280] mt-0.5">
          Scoring: Goals = 5 pts &nbsp;·&nbsp; Assists = 3 pts
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* ══════════════════════════════════════════════════════════════════
            LEFT PANEL — player browser
        ══════════════════════════════════════════════════════════════════ */}
        <section className="flex-1 min-w-0">
          <div className="rounded-xl border border-[#1e2a3a] bg-[#0d1424] overflow-hidden">
            {/* Position tabs */}
            <div className="flex border-b border-[#1e2a3a]">
              {(["ALL", "GK", "DEF", "MID", "FWD"] as PositionTab[]).map(
                (t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex-1 py-2.5 text-xs font-display font-bold uppercase tracking-wider transition-colors ${
                      tab === t
                        ? "text-[#00d45e] border-b-2 border-[#00d45e] bg-[#00d45e]/5"
                        : "text-[#6b7280] hover:text-white"
                    }`}
                  >
                    {t}
                    {t !== "ALL" && (
                      <span className="ml-1 text-[10px] opacity-60">
                        {countByPosition(squadIds, t)}/{SQUAD_LIMITS[t]}
                      </span>
                    )}
                  </button>
                )
              )}
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-2 text-[10px] uppercase tracking-wider text-[#6b7280] border-b border-[#1e2a3a]">
              <span>Player</span>
              <span className="text-right">G</span>
              <span className="text-right">A</span>
              <span className="text-right w-10">PTS</span>
            </div>

            {/* Player list */}
            <div className="max-h-[520px] overflow-y-auto divide-y divide-[#1e2a3a]/60">
              {filteredPlayers.map((player) => {
                const selected = squadIds.includes(player.id);
                const addable = canAdd(player);
                const disabled = !addable;

                return (
                  <button
                    key={player.id}
                    onClick={() => !disabled && handleToggle(player)}
                    disabled={disabled}
                    className={`w-full grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center px-4 py-3 text-left transition-all ${
                      selected
                        ? "bg-[#00d45e]/10 border-l-2 border-[#00d45e]"
                        : disabled
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:bg-white/5 cursor-pointer border-l-2 border-transparent"
                    }`}
                  >
                    {/* Player info */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Flag
                        code={player.teamCode}
                        name={player.teamName}
                        width={20}
                      />
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${
                            selected ? "text-[#00d45e]" : "text-white"
                          }`}
                        >
                          {player.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              POSITION_COLORS[player.position]
                            }`}
                          >
                            {player.position}
                          </span>
                          <span className="text-[11px] text-[#6b7280]">
                            {player.teamCode}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <span className="text-sm text-[#6b7280] text-right w-5">
                      {player.goals}
                    </span>
                    <span className="text-sm text-[#6b7280] text-right w-5">
                      {player.assists}
                    </span>
                    <span
                      className={`text-sm font-bold text-right w-10 ${
                        selected ? "text-[#00d45e]" : "text-[#ffd700]"
                      }`}
                    >
                      {player.points}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            RIGHT PANEL — My Squad
        ══════════════════════════════════════════════════════════════════ */}
        <aside className="w-full lg:w-80 shrink-0">
          <div className="rounded-xl border border-[#1e2a3a] bg-[#0d1424] overflow-hidden sticky top-4">
            {/* Squad header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2a3a]">
              <div>
                <h2 className="font-display text-sm font-bold uppercase tracking-widest text-white">
                  My Squad
                </h2>
                <p className="text-xs text-[#6b7280] mt-0.5">
                  {squadIds.length}/{TOTAL_SLOTS} players
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-[#ffd700]">{pts}</p>
                <p className="text-[10px] text-[#6b7280] uppercase tracking-wider">
                  Total pts
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-[#1e2a3a]">
              <div
                className="h-full bg-[#00d45e] transition-all duration-300"
                style={{ width: `${(squadIds.length / TOTAL_SLOTS) * 100}%` }}
              />
            </div>

            {/* Squad slots by position */}
            <div className="p-4 space-y-4">
              {POSITION_ORDER.map((pos) => {
                const limit = SQUAD_LIMITS[pos];
                const picked = playersByPosition(squadIds, pos);
                const empty = limit - picked.length;

                return (
                  <div key={pos}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${POSITION_COLORS[pos]}`}
                      >
                        {pos}
                      </span>
                      <span className="text-[10px] text-[#6b7280]">
                        {picked.length}/{limit}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {/* Filled slots */}
                      {picked.map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between bg-[#00d45e]/10 border border-[#00d45e]/30 rounded-lg px-3 py-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Flag
                              code={player.teamCode}
                              name={player.teamName}
                              width={18}
                            />
                            <span className="text-sm text-[#00d45e] font-medium truncate">
                              {player.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-xs font-bold text-[#ffd700]">
                              {player.points}
                            </span>
                            <button
                              onClick={() => handleToggle(player)}
                              className="text-[#6b7280] hover:text-[#ff3b30] transition-colors text-lg leading-none"
                              aria-label={`Remove ${player.name}`}
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Empty slots */}
                      {Array.from({ length: empty }).map((_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="flex items-center gap-2 border border-dashed border-[#1e2a3a] rounded-lg px-3 py-2"
                        >
                          <div className="w-4.5 h-3.5 rounded-sm bg-[#1e2a3a]" />
                          <span className="text-xs text-[#3a4a5a]">
                            Empty slot
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Clear button */}
            <div className="px-4 pb-4">
              <button
                onClick={() => setSquadIds([])}
                disabled={squadIds.length === 0}
                className="w-full py-2.5 rounded-lg border border-[#ff3b30]/40 text-[#ff3b30] text-sm font-display font-bold uppercase tracking-wider transition-all hover:bg-[#ff3b30]/10 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Clear Squad
              </button>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
