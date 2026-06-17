"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Flag } from "@/components/Flag";

const STORAGE_KEY = "wc26-alert-prefs";

// All 48 WC 2026 teams
const ALL_TEAMS: { code: string; name: string }[] = [
  // Group A
  { code: "USA", name: "United States" },
  { code: "MEX", name: "Mexico" },
  { code: "CAN", name: "Canada" },
  { code: "URU", name: "Uruguay" },
  // Group B
  { code: "ARG", name: "Argentina" },
  { code: "CHI", name: "Chile" },
  { code: "PER", name: "Peru" },
  { code: "AUS", name: "Australia" },
  // Group C
  { code: "BRA", name: "Brazil" },
  { code: "COL", name: "Colombia" },
  { code: "PAR", name: "Paraguay" },
  { code: "MAR", name: "Morocco" },
  // Group D
  { code: "FRA", name: "France" },
  { code: "BEL", name: "Belgium" },
  { code: "CRO", name: "Croatia" },
  { code: "TUN", name: "Tunisia" },
  // Group E
  { code: "ESP", name: "Spain" },
  { code: "POR", name: "Portugal" },
  { code: "SUI", name: "Switzerland" },
  { code: "SEN", name: "Senegal" },
  // Group F
  { code: "GER", name: "Germany" },
  { code: "NED", name: "Netherlands" },
  { code: "AUT", name: "Austria" },
  { code: "CMR", name: "Cameroon" },
  // Group G
  { code: "ENG", name: "England" },
  { code: "DEN", name: "Denmark" },
  { code: "SRB", name: "Serbia" },
  { code: "NGA", name: "Nigeria" },
  // Group H
  { code: "ITA", name: "Italy" },
  { code: "TUR", name: "Turkey" },
  { code: "UKR", name: "Ukraine" },
  { code: "CIV", name: "Ivory Coast" },
  // Group I
  { code: "JPN", name: "Japan" },
  { code: "KOR", name: "South Korea" },
  { code: "IRN", name: "Iran" },
  { code: "IRQ", name: "Iraq" },
  // Group J
  { code: "SAU", name: "Saudi Arabia" },
  { code: "QAT", name: "Qatar" },
  { code: "EGY", name: "Egypt" },
  { code: "ALG", name: "Algeria" },
  // Group K
  { code: "ECU", name: "Ecuador" },
  { code: "BOL", name: "Bolivia" },
  { code: "VEN", name: "Venezuela" },
  { code: "NZL", name: "New Zealand" },
  // Group L
  { code: "MEX", name: "Mexico" },
  { code: "CRC", name: "Costa Rica" },
  { code: "PAN", name: "Panama" },
  { code: "HON", name: "Honduras" },
];

// Deduplicate by code (Mexico appears twice in original draw)
const TEAMS = Array.from(
  new Map(ALL_TEAMS.map((t) => [t.code, t])).values()
);

type AlertPrefs = Record<string, boolean>;

export function TeamAlertPreferences() {
  const [prefs, setPrefs] = useState<AlertPrefs>({});
  const [search, setSearch] = useState("");

  // SSR-safe load
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          setPrefs(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignore
    }
  }, [prefs]);

  const toggleTeam = useCallback((code: string) => {
    setPrefs((prev) => ({ ...prev, [code]: !prev[code] }));
  }, []);

  const enableAll = useCallback(() => {
    setPrefs(Object.fromEntries(TEAMS.map((t) => [t.code, true])));
  }, []);

  const disableAll = useCallback(() => {
    setPrefs(Object.fromEntries(TEAMS.map((t) => [t.code, false])));
  }, []);

  const filteredTeams = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return TEAMS;
    return TEAMS.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q)
    );
  }, [search]);

  const enabledCount = TEAMS.filter((t) => prefs[t.code]).length;

  return (
    <div className="flex flex-col gap-4 w-full max-w-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg text-ink">Match Alerts</h2>
          <p className="text-dim text-sm mt-0.5">
            {enabledCount} of {TEAMS.length} teams enabled
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={enableAll}
            className="px-3 py-1.5 text-xs font-body font-semibold rounded-md bg-pitch/15 text-pitch hover:bg-pitch/25 border border-pitch/30 transition-colors duration-150"
          >
            Enable all
          </button>
          <button
            type="button"
            onClick={disableAll}
            className="px-3 py-1.5 text-xs font-body font-semibold rounded-md bg-panel text-dim hover:text-ink border border-edge transition-colors duration-150"
          >
            Disable all
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-dim pointer-events-none"
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="search"
          placeholder="Search teams…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg bg-panel border border-edge text-ink text-sm placeholder:text-dim focus:outline-none focus:ring-2 focus:ring-pitch/50 transition-shadow"
        />
      </div>

      {/* Team list */}
      <div className="rounded-xl border border-edge bg-panel overflow-hidden">
        <div className="max-h-[420px] overflow-y-auto overscroll-contain divide-y divide-edge">
          {filteredTeams.length === 0 ? (
            <p className="py-8 text-center text-dim text-sm">
              No teams match &ldquo;{search}&rdquo;
            </p>
          ) : (
            filteredTeams.map((team) => {
              const enabled = !!prefs[team.code];
              const toggleId = `alert-toggle-${team.code}`;
              return (
                <label
                  key={team.code}
                  htmlFor={toggleId}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-panel2 transition-colors duration-100 select-none"
                >
                  <Flag code={team.code} name={team.name} width={24} />
                  <span className="flex-1 font-body text-sm text-ink">
                    {team.name}
                  </span>
                  <span className="text-xs font-mono text-dim w-8 text-right">
                    {team.code}
                  </span>
                  {/* Toggle switch */}
                  <div className="relative flex-shrink-0">
                    <input
                      id={toggleId}
                      type="checkbox"
                      checked={enabled}
                      onChange={() => toggleTeam(team.code)}
                      className="sr-only"
                      aria-label={`Alert for ${team.name}`}
                    />
                    <div
                      className={[
                        "w-10 h-5 rounded-full transition-colors duration-200",
                        enabled ? "bg-pitch" : "bg-edge",
                      ].join(" ")}
                    />
                    <div
                      className={[
                        "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200",
                        enabled ? "translate-x-5" : "translate-x-0",
                      ].join(" ")}
                    />
                  </div>
                </label>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
