"use client";

import { useState, useEffect, useCallback } from "react";
import { Flag } from "@/components/Flag";
import { SectionHeader } from "@/components/SectionHeader";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Position = "GK" | "DEF" | "MID" | "FWD";

interface Player {
  name: string;
  teamCode: string;
  position: Position;
  rating: number;
}

interface PlayerPick {
  player: Player;
}

type Formation = "4-3-3" | "4-4-2" | "3-5-2" | "4-2-3-1";

interface Slot {
  id: string;
  position: Position;
  label: string;
  /** 0–100 percent across pitch width */
  x: number;
  /** 0–100 percent down pitch height (0 = attack end, 100 = GK end) */
  y: number;
}

// ---------------------------------------------------------------------------
// Player data (50 star players)
// ---------------------------------------------------------------------------

const PLAYERS: Player[] = [
  { name: "Mbappe",            teamCode: "FRA", position: "FWD", rating: 92 },
  { name: "Vinicius Jr",       teamCode: "BRA", position: "FWD", rating: 91 },
  { name: "Bellingham",        teamCode: "ENG", position: "MID", rating: 90 },
  { name: "Messi",             teamCode: "ARG", position: "FWD", rating: 91 },
  { name: "Ronaldo",           teamCode: "POR", position: "FWD", rating: 89 },
  { name: "Rodri",             teamCode: "ESP", position: "MID", rating: 90 },
  { name: "Yamal",             teamCode: "ESP", position: "FWD", rating: 87 },
  { name: "Wirtz",             teamCode: "GER", position: "MID", rating: 88 },
  { name: "Musiala",           teamCode: "GER", position: "MID", rating: 87 },
  { name: "Saka",              teamCode: "ENG", position: "FWD", rating: 87 },
  { name: "Kane",              teamCode: "ENG", position: "FWD", rating: 89 },
  { name: "Foden",             teamCode: "ENG", position: "MID", rating: 87 },
  { name: "Haaland",           teamCode: "NOR", position: "FWD", rating: 91 },
  { name: "Salah",             teamCode: "EGY", position: "FWD", rating: 89 },
  { name: "De Bruyne",         teamCode: "BEL", position: "MID", rating: 90 },
  { name: "Alisson",           teamCode: "BRA", position: "GK",  rating: 89 },
  { name: "Ederson",           teamCode: "BRA", position: "GK",  rating: 87 },
  { name: "Ter Stegen",        teamCode: "GER", position: "GK",  rating: 87 },
  { name: "Courtois",          teamCode: "BEL", position: "GK",  rating: 89 },
  { name: "Szczesny",          teamCode: "POL", position: "GK",  rating: 83 },
  { name: "Van Dijk",          teamCode: "NED", position: "DEF", rating: 88 },
  { name: "Ruben Dias",        teamCode: "POR", position: "DEF", rating: 88 },
  { name: "Upamecano",         teamCode: "FRA", position: "DEF", rating: 85 },
  { name: "Militao",           teamCode: "BRA", position: "DEF", rating: 86 },
  { name: "Acuna",             teamCode: "ARG", position: "DEF", rating: 83 },
  { name: "Theo Hernandez",    teamCode: "FRA", position: "DEF", rating: 85 },
  { name: "Cancelo",           teamCode: "POR", position: "DEF", rating: 84 },
  { name: "Alexander-Arnold",  teamCode: "ENG", position: "DEF", rating: 86 },
  { name: "Modric",            teamCode: "CRO", position: "MID", rating: 85 },
  { name: "Pedri",             teamCode: "ESP", position: "MID", rating: 88 },
  { name: "Guler",             teamCode: "TUR", position: "MID", rating: 84 },
  { name: "Thuram",            teamCode: "FRA", position: "FWD", rating: 85 },
  { name: "Osimhen",           teamCode: "NGA", position: "FWD", rating: 88 },
  { name: "Vlahovic",          teamCode: "SRB", position: "FWD", rating: 84 },
  { name: "Lautaro",           teamCode: "ARG", position: "FWD", rating: 87 },
  { name: "Son",               teamCode: "KOR", position: "FWD", rating: 86 },
  { name: "Zaire-Emery",       teamCode: "FRA", position: "MID", rating: 83 },
  { name: "Camacho",           teamCode: "MEX", position: "MID", rating: 82 },
  { name: "Pulisic",           teamCode: "USA", position: "MID", rating: 84 },
  { name: "Adams",             teamCode: "USA", position: "MID", rating: 82 },
  { name: "Gavi",              teamCode: "ESP", position: "MID", rating: 86 },
  { name: "Mikel Merino",      teamCode: "ESP", position: "MID", rating: 83 },
  { name: "Griezmann",         teamCode: "FRA", position: "MID", rating: 85 },
  { name: "Dembele",           teamCode: "FRA", position: "FWD", rating: 85 },
  { name: "Raphinha",          teamCode: "BRA", position: "FWD", rating: 85 },
  { name: "Neymar",            teamCode: "BRA", position: "FWD", rating: 89 },
  { name: "Bruno Fernandes",   teamCode: "POR", position: "MID", rating: 87 },
  { name: "Bernardo Silva",    teamCode: "POR", position: "MID", rating: 87 },
  { name: "Kvara",             teamCode: "GEO", position: "FWD", rating: 85 },
  { name: "Dorgu",             teamCode: "DEN", position: "DEF", rating: 82 },
];

// ---------------------------------------------------------------------------
// Formation layouts
// ---------------------------------------------------------------------------

/**
 * Build the 11 slot descriptors for a given formation.
 * Coordinates are percentages: x = left→right, y = top(attack)→bottom(GK).
 */
function buildSlots(formation: Formation): Slot[] {
  const slots: Slot[] = [];

  // GK sits at the bottom
  slots.push({ id: "gk-0", position: "GK", label: "GK", x: 50, y: 88 });

  type FormationConfig = {
    rows: Array<{ pos: Position; count: number; label: string; y: number }>;
  };

  const configs: Record<Formation, FormationConfig> = {
    "4-3-3": {
      rows: [
        { pos: "DEF", count: 4, label: "DEF", y: 70 },
        { pos: "MID", count: 3, label: "MID", y: 45 },
        { pos: "FWD", count: 3, label: "FWD", y: 18 },
      ],
    },
    "4-4-2": {
      rows: [
        { pos: "DEF", count: 4, label: "DEF", y: 70 },
        { pos: "MID", count: 4, label: "MID", y: 45 },
        { pos: "FWD", count: 2, label: "FWD", y: 18 },
      ],
    },
    "3-5-2": {
      rows: [
        { pos: "DEF", count: 3, label: "DEF", y: 70 },
        { pos: "MID", count: 5, label: "MID", y: 45 },
        { pos: "FWD", count: 2, label: "FWD", y: 18 },
      ],
    },
    "4-2-3-1": {
      rows: [
        { pos: "DEF", count: 4, label: "DEF", y: 72 },
        { pos: "MID", count: 2, label: "CDM", y: 56 },
        { pos: "MID", count: 3, label: "CAM", y: 37 },
        { pos: "FWD", count: 1, label: "FWD", y: 18 },
      ],
    },
  };

  const config = configs[formation];
  let rowIndex = 0;
  for (const row of config.rows) {
    for (let i = 0; i < row.count; i++) {
      // spread evenly: positions at 1/(n+1), 2/(n+1), ... n/(n+1) of width
      const x = ((i + 1) / (row.count + 1)) * 100;
      slots.push({
        id: `${row.pos.toLowerCase()}-${rowIndex}-${i}`,
        position: row.pos,
        label: row.label,
        x,
        y: row.y,
      });
    }
    rowIndex++;
  }

  return slots;
}

// ---------------------------------------------------------------------------
// Helper: player initials
// ---------------------------------------------------------------------------

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

// ---------------------------------------------------------------------------
// Rating badge color
// ---------------------------------------------------------------------------

function ratingColor(rating: number): string {
  if (rating >= 90) return "bg-gold text-navy";
  if (rating >= 87) return "bg-pitch text-navy";
  return "bg-panel2 text-ink";
}

// ---------------------------------------------------------------------------
// Position badge color
// ---------------------------------------------------------------------------

function positionColor(pos: Position): string {
  switch (pos) {
    case "GK":  return "bg-gold/20 text-gold border border-gold/30";
    case "DEF": return "bg-blue-900/40 text-blue-300 border border-blue-500/30";
    case "MID": return "bg-pitch/20 text-pitch border border-pitch/30";
    case "FWD": return "bg-live/20 text-live border border-live/30";
  }
}

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = "dreamxi-v1";

type StoredState = Record<string, { name: string; teamCode: string; position: Position; rating: number } | null>;

function loadFromStorage(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StoredState;
  } catch {}
  return {};
}

function saveToStorage(state: StoredState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

// ---------------------------------------------------------------------------
// Share helpers
// ---------------------------------------------------------------------------

function encodeShare(picks: Record<string, PlayerPick | null>): string {
  const payload: Record<string, { n: string; t: string; pos: Position; r: number }> = {};
  for (const [id, pick] of Object.entries(picks)) {
    if (pick) {
      payload[id] = {
        n: pick.player.name,
        t: pick.player.teamCode,
        pos: pick.player.position,
        r: pick.player.rating,
      };
    }
  }
  return btoa(encodeURIComponent(JSON.stringify(payload)));
}

function decodeShare(encoded: string): Record<string, PlayerPick | null> {
  try {
    const parsed = JSON.parse(decodeURIComponent(atob(encoded))) as Record<
      string,
      { n: string; t: string; pos: Position; r: number }
    >;
    const out: Record<string, PlayerPick | null> = {};
    for (const [id, val] of Object.entries(parsed)) {
      out[id] = {
        player: { name: val.n, teamCode: val.t, position: val.pos, rating: val.r },
      };
    }
    return out;
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PlayerResultRow({
  player,
  onSelect,
}: {
  player: Player;
  onSelect: (p: Player) => void;
}) {
  return (
    <button
      onClick={() => onSelect(player)}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-panel2 focus:outline-none focus:ring-1 focus:ring-pitch/50"
    >
      <Flag code={player.teamCode} width={24} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">{player.name}</span>
        <span className="text-xs text-dim">{player.teamCode}</span>
      </span>
      <span className={`rounded px-1.5 py-0.5 text-[11px] font-mono font-bold ${positionColor(player.position)}`}>
        {player.position}
      </span>
      <span className={`rounded px-1.5 py-0.5 text-[11px] font-mono font-bold ${ratingColor(player.rating)}`}>
        {player.rating}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Pitch slot button
// ---------------------------------------------------------------------------

function SlotButton({
  slot,
  pick,
  isSelected,
  onClick,
}: {
  slot: Slot;
  pick: PlayerPick | null;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={pick ? `${pick.player.name} — click to change` : `Empty ${slot.label} slot — click to pick`}
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 group focus:outline-none"
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
    >
      {/* Circle */}
      <div
        className={`
          flex h-11 w-11 items-center justify-center rounded-full border-2 text-xs font-bold transition-all
          ${isSelected
            ? "border-gold bg-gold/20 shadow-[0_0_12px_rgba(255,215,0,0.5)]"
            : pick
              ? "border-pitch bg-pitch/20 shadow-[0_0_8px_rgba(0,212,94,0.3)] group-hover:border-gold group-hover:bg-gold/10"
              : "border-white/40 bg-black/30 text-white/60 hover:border-pitch/80 hover:bg-pitch/10 hover:text-white"
          }
        `}
      >
        {pick ? (
          <Flag code={pick.player.teamCode} width={28} rounded />
        ) : (
          <span className="text-lg leading-none">+</span>
        )}
      </div>
      {/* Label below */}
      <div className="flex flex-col items-center">
        {pick ? (
          <>
            <span className="max-w-[72px] truncate rounded bg-black/60 px-1 text-[10px] font-semibold text-white leading-tight text-center">
              {pick.player.name.split(" ").slice(-1)[0]}
            </span>
            <span className={`mt-0.5 rounded px-1 text-[9px] font-bold leading-tight ${positionColor(pick.player.position)}`}>
              {slot.label}
            </span>
          </>
        ) : (
          <span className="rounded bg-black/50 px-1 text-[10px] text-white/50 leading-tight">
            {slot.label}
          </span>
        )}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DreamXIBuilder() {
  const [formation, setFormation] = useState<Formation>("4-3-3");
  const [picks, setPicks] = useState<Record<string, PlayerPick | null>>({});
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const slots = buildSlots(formation);

  // Load from localStorage or URL param on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const xi = params.get("xi");
    if (xi) {
      const decoded = decodeShare(xi);
      setPicks(decoded);
      return;
    }

    const stored = loadFromStorage();
    const hydrated: Record<string, PlayerPick | null> = {};
    for (const [id, val] of Object.entries(stored)) {
      if (val) {
        hydrated[id] = { player: val };
      } else {
        hydrated[id] = null;
      }
    }
    setPicks(hydrated);
  }, []);

  // Persist to localStorage whenever picks change
  useEffect(() => {
    if (typeof window === "undefined") return;
    const toStore: StoredState = {};
    for (const [id, pick] of Object.entries(picks)) {
      toStore[id] = pick ? pick.player : null;
    }
    saveToStorage(toStore);
  }, [picks]);

  const handleSlotClick = useCallback((slotId: string) => {
    setSelectedSlot((prev) => (prev === slotId ? null : slotId));
    setSearch("");
  }, []);

  const handlePlayerSelect = useCallback(
    (player: Player) => {
      if (!selectedSlot) return;
      setPicks((prev) => ({ ...prev, [selectedSlot]: { player } }));
      setSelectedSlot(null);
      setSearch("");
    },
    [selectedSlot]
  );

  const handleClearSlot = useCallback(
    (slotId: string) => {
      setPicks((prev) => ({ ...prev, [slotId]: null }));
    },
    []
  );

  const handleClear = useCallback(() => {
    setPicks({});
    setSelectedSlot(null);
  }, []);

  const handleShare = useCallback(() => {
    if (typeof window === "undefined") return;
    const encoded = encodeShare(picks);
    const url = new URL(window.location.href);
    url.searchParams.set("xi", encoded);
    void navigator.clipboard.writeText(url.toString()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [picks]);

  // Filter players for picker
  const selectedSlotObj = slots.find((s) => s.id === selectedSlot);
  const filteredPlayers = PLAYERS.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.teamCode.toLowerCase().includes(q);
    return matchesSearch;
  }).sort((a, b) => b.rating - a.rating);

  const filledCount = slots.filter((s) => picks[s.id]).length;

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Left: pitch + controls */}
      <div className="flex flex-col gap-4 lg:flex-1">
        {/* Controls bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Formation selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-dim">Formation</span>
            <div className="flex gap-1">
              {(["4-3-3", "4-4-2", "3-5-2", "4-2-3-1"] as Formation[]).map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setFormation(f);
                    setSelectedSlot(null);
                  }}
                  className={`rounded px-2.5 py-1 text-xs font-mono font-semibold transition-colors ${
                    formation === f
                      ? "bg-pitch text-navy"
                      : "border border-edge text-dim hover:border-pitch/50 hover:text-ink"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Filled count */}
          <span className="font-mono text-xs text-dim">
            <span className={filledCount === 11 ? "text-pitch font-bold" : "text-ink"}>{filledCount}</span>
            /11
          </span>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="rounded border border-edge px-3 py-1 text-xs font-semibold transition-colors hover:border-pitch/60 hover:text-pitch"
          >
            {copied ? "Copied!" : "Share"}
          </button>

          {/* Clear button */}
          <button
            onClick={handleClear}
            className="rounded border border-edge px-3 py-1 text-xs font-semibold text-dim transition-colors hover:border-live/60 hover:text-live"
          >
            Clear
          </button>
        </div>

        {/* Pitch */}
        <div
          className="relative w-full overflow-hidden rounded-2xl border border-edge pitch-horizontal"
          style={{ paddingBottom: "140%" }}
          aria-label="Dream XI pitch"
        >
          {/* Actual pitch content sits inside absolutely-positioned container */}
          <div className="absolute inset-0">
            {/* Turf base */}
            <div className="absolute inset-0 bg-[#0d2b18]" />

            {/* Pitch markings (SVG overlay) */}
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 400 560"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              {/* Grass stripes */}
              {Array.from({ length: 8 }).map((_, i) => (
                <rect key={i} x="0" y={i * 70} width="400" height="35" fill="#0f3320" />
              ))}
              {/* Outer boundary */}
              <rect x="14" y="14" width="372" height="532" fill="none" stroke="rgba(232,245,238,0.45)" strokeWidth="2" />
              {/* Halfway line */}
              <line x1="14" y1="280" x2="386" y2="280" stroke="rgba(232,245,238,0.35)" strokeWidth="1.5" />
              {/* Centre circle */}
              <circle cx="200" cy="280" r="52" fill="none" stroke="rgba(232,245,238,0.35)" strokeWidth="1.5" />
              <circle cx="200" cy="280" r="2.5" fill="rgba(232,245,238,0.45)" />
              {/* Top penalty area */}
              <rect x="88" y="14" width="224" height="90" fill="none" stroke="rgba(232,245,238,0.3)" strokeWidth="1.5" />
              <rect x="140" y="14" width="120" height="34" fill="none" stroke="rgba(232,245,238,0.25)" strokeWidth="1.5" />
              <circle cx="200" cy="80" r="2.5" fill="rgba(232,245,238,0.35)" />
              {/* Bottom penalty area */}
              <rect x="88" y="456" width="224" height="90" fill="none" stroke="rgba(232,245,238,0.3)" strokeWidth="1.5" />
              <rect x="140" y="512" width="120" height="34" fill="none" stroke="rgba(232,245,238,0.25)" strokeWidth="1.5" />
              <circle cx="200" cy="480" r="2.5" fill="rgba(232,245,238,0.35)" />
            </svg>

            {/* Player slot buttons */}
            {slots.map((slot) => (
              <SlotButton
                key={slot.id}
                slot={slot}
                pick={picks[slot.id] ?? null}
                isSelected={selectedSlot === slot.id}
                onClick={() => handleSlotClick(slot.id)}
              />
            ))}

            {/* Formation label */}
            <div className="absolute bottom-2 right-3 font-mono text-[10px] font-semibold text-white/30">
              {formation}
            </div>
          </div>
        </div>

        {/* Filled roster summary (compact list below pitch) */}
        {filledCount > 0 && (
          <div className="rounded-xl border border-edge bg-panel p-3">
            <SectionHeader title="Your XI" right={`${filledCount}/11 players`} className="mb-2" />
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {slots
                .filter((s) => picks[s.id])
                .map((slot) => {
                  const pick = picks[slot.id]!;
                  return (
                    <div
                      key={slot.id}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-panel2 group"
                    >
                      <Flag code={pick.player.teamCode} width={20} />
                      <span className="flex-1 truncate text-xs font-semibold text-ink">
                        {pick.player.name}
                      </span>
                      <span className={`rounded px-1 text-[9px] font-bold ${positionColor(pick.player.position)}`}>
                        {slot.label}
                      </span>
                      <span className={`rounded px-1 text-[9px] font-mono font-bold ${ratingColor(pick.player.rating)}`}>
                        {pick.player.rating}
                      </span>
                      <button
                        onClick={() => handleClearSlot(slot.id)}
                        aria-label={`Remove ${pick.player.name}`}
                        className="ml-1 text-dim/40 opacity-0 transition-opacity hover:text-live group-hover:opacity-100"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Right: Player picker */}
      <div
        className={`w-full lg:w-80 rounded-xl border transition-colors ${
          selectedSlot
            ? "border-pitch/50 bg-panel shadow-[0_0_20px_rgba(0,212,94,0.08)]"
            : "border-edge bg-panel"
        }`}
      >
        <div className="p-4">
          <SectionHeader
            title={
              selectedSlot
                ? `Pick ${selectedSlotObj?.label ?? "Player"}`
                : "Player Picker"
            }
            right={
              selectedSlot ? (
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="text-dim hover:text-live transition-colors"
                  aria-label="Close picker"
                >
                  Close
                </button>
              ) : undefined
            }
          />

          {!selectedSlot ? (
            <p className="text-xs text-dim">
              Click a slot on the pitch to pick a player.
            </p>
          ) : (
            <>
              {/* Search */}
              <div className="relative mb-3">
                <input
                  autoFocus
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or team..."
                  className="w-full rounded-lg border border-edge bg-panel2 px-3 py-2 text-sm text-ink placeholder:text-dim/60 focus:border-pitch/60 focus:outline-none focus:ring-1 focus:ring-pitch/30"
                />
              </div>

              {/* Results */}
              <div className="max-h-96 overflow-y-auto space-y-0.5 -mx-1 px-1">
                {filteredPlayers.length === 0 ? (
                  <p className="py-6 text-center text-xs text-dim">No players found.</p>
                ) : (
                  filteredPlayers.map((p) => (
                    <PlayerResultRow
                      key={`${p.name}-${p.teamCode}`}
                      player={p}
                      onSelect={handlePlayerSelect}
                    />
                  ))
                )}
              </div>

              {/* Currently picked player info */}
              {picks[selectedSlot] && (
                <div className="mt-3 flex items-center justify-between rounded-lg border border-pitch/30 bg-pitch/5 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Flag code={picks[selectedSlot]!.player.teamCode} width={20} />
                    <span className="text-xs font-semibold text-pitch">
                      {picks[selectedSlot]!.player.name}
                    </span>
                  </div>
                  <button
                    onClick={() => handleClearSlot(selectedSlot)}
                    className="text-xs text-dim hover:text-live transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Stats footer */}
        {filledCount > 0 && (
          <div className="border-t border-edge px-4 py-3">
            <div className="grid grid-cols-4 gap-2 text-center">
              {(["GK", "DEF", "MID", "FWD"] as Position[]).map((pos) => {
                const count = slots.filter(
                  (s) => s.position === pos && picks[s.id]
                ).length;
                const total = slots.filter((s) => s.position === pos).length;
                return (
                  <div key={pos}>
                    <div className={`font-mono text-lg font-bold leading-tight ${count === total ? "text-pitch" : "text-ink"}`}>
                      {count}
                    </div>
                    <div className={`text-[10px] font-semibold uppercase tracking-wide ${positionColor(pos).split(" ")[1]}`}>
                      {pos}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
