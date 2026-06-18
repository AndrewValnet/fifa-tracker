"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Flag } from "@/components/Flag";
import { PlayerHeadshot } from "@/components/PlayerHeadshot";
import type { PlayerDirectoryRow, PlayerPositionGroup } from "@/lib/data";
import { getTeamColors } from "@/lib/team-meta";

type PositionFilter = "ALL" | PlayerPositionGroup;
type SortMode = "team" | "name" | "number" | "age-young" | "age-old";

const INITIAL_LIMIT = 72;
const PAGE_SIZE = 72;

const POSITION_FILTERS: { value: PositionFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "GK", label: "GK" },
  { value: "DEF", label: "DEF" },
  { value: "MID", label: "MID" },
  { value: "FWD", label: "FWD" },
  { value: "OTHER", label: "Other" },
];

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "team", label: "Team order" },
  { value: "name", label: "Name A-Z" },
  { value: "number", label: "Shirt number" },
  { value: "age-young", label: "Youngest first" },
  { value: "age-old", label: "Oldest first" },
];

const POSITION_RANK: Record<PlayerPositionGroup, number> = {
  GK: 0,
  DEF: 1,
  MID: 2,
  FWD: 3,
  OTHER: 4,
};

const POSITION_LABEL: Record<PlayerPositionGroup, string> = {
  GK: "Goalkeeper",
  DEF: "Defender",
  MID: "Midfielder",
  FWD: "Forward",
  OTHER: "Squad",
};

function clean(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "Unknown";
  return String(value);
}

function compareByTeam(a: PlayerDirectoryRow, b: PlayerDirectoryRow): number {
  return (
    a.group.localeCompare(b.group) ||
    a.teamName.localeCompare(b.teamName) ||
    POSITION_RANK[a.positionGroup] - POSITION_RANK[b.positionGroup] ||
    (a.jersey ?? 999) - (b.jersey ?? 999) ||
    a.name.localeCompare(b.name)
  );
}

function sortPlayers(players: PlayerDirectoryRow[], mode: SortMode): PlayerDirectoryRow[] {
  const copy = [...players];
  copy.sort((a, b) => {
    if (mode === "name") return a.name.localeCompare(b.name) || compareByTeam(a, b);
    if (mode === "number") {
      return (
        (a.jersey ?? 999) - (b.jersey ?? 999) ||
        a.teamName.localeCompare(b.teamName) ||
        a.name.localeCompare(b.name)
      );
    }
    if (mode === "age-young") return (a.age ?? 999) - (b.age ?? 999) || a.name.localeCompare(b.name);
    if (mode === "age-old") return (b.age ?? -1) - (a.age ?? -1) || a.name.localeCompare(b.name);
    return compareByTeam(a, b);
  });
  return copy;
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 md:px-4">
      <p className="font-display text-2xl font-bold tabular-nums text-ink">{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-dim">{label}</p>
    </div>
  );
}

function PlayerCard({ player }: { player: PlayerDirectoryRow }) {
  const colors = getTeamColors(player.teamCode);
  const profileHref = `/players/${encodeURIComponent(player.espnId)}?team=${encodeURIComponent(player.teamCode)}`;
  const facts = [
    ["Age", clean(player.age)],
    ["Height", clean(player.height)],
    ["Born", clean(player.birthPlace)],
    ["Nationality", clean(player.citizenship)],
  ];

  return (
    <article className="match-card-hover surface-card group relative flex min-h-[320px] flex-col overflow-hidden rounded-2xl">
      <div
        className="h-24 border-b border-white/10"
        style={{
          background:
            `linear-gradient(135deg, ${colors.primary} 0%, rgba(8,12,24,0.84) 52%, ${colors.secondary} 100%)`,
        }}
      />
      <div className="relative flex flex-1 flex-col px-4 pb-4">
        <div className="-mt-11 flex items-end justify-between gap-3">
          <PlayerHeadshot
            src={player.headshot}
            name={player.name}
            size={88}
            colors={colors}
            className="ring-4 ring-navy"
          />
          <div className="mb-2 flex flex-col items-end gap-1">
            <span className="rounded-full border border-white/15 bg-black/25 px-2.5 py-1 font-display text-xs font-bold uppercase tracking-wider text-white">
              {player.positionAbbr ?? player.positionGroup}
            </span>
            <span className="rounded-full border border-white/15 bg-black/25 px-2.5 py-1 font-mono text-xs text-white/85">
              #{player.jersey ?? "--"}
            </span>
          </div>
        </div>

        <div className="mt-4 min-w-0">
          <Link
            href={profileHref}
            prefetch={false}
            className="block font-display text-2xl font-black uppercase leading-tight tracking-wide text-ink transition hover:text-gold"
          >
            {player.name}
          </Link>
          <Link
            href={`/teams/${player.teamCode}`}
            className="mt-2 inline-flex min-w-0 items-center gap-2 text-sm text-dim transition hover:text-ink"
          >
            <Flag code={player.teamCode} name={player.teamName} width={24} />
            <span className="truncate">{player.teamName}</span>
            <span className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] text-dim">
              Group {player.group}
            </span>
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {facts.map(([label, value]) => (
            <div key={label} className="min-w-0 rounded-lg border border-white/10 bg-black/15 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-dim">{label}</p>
              <p className="mt-0.5 truncate font-medium text-ink" title={value}>
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <span className="text-xs text-dim">{POSITION_LABEL[player.positionGroup]}</span>
          <Link
            href={profileHref}
            prefetch={false}
            className="rounded-full bg-gradient-to-r from-pitch via-sky to-gold px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-navy shadow-lg shadow-pitch/10 transition hover:brightness-110"
          >
            Profile
          </Link>
        </div>
      </div>
    </article>
  );
}

export function PlayersDirectoryClient({ players }: { players: PlayerDirectoryRow[] }) {
  const [query, setQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState("ALL");
  const [groupFilter, setGroupFilter] = useState("ALL");
  const [positionFilter, setPositionFilter] = useState<PositionFilter>("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("team");
  const [visibleCount, setVisibleCount] = useState(INITIAL_LIMIT);

  const teams = useMemo(() => {
    const byCode = new Map<string, string>();
    for (const player of players) byCode.set(player.teamCode, player.teamName);
    return [...byCode.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [players]);

  const groups = useMemo(() => [...new Set(players.map((player) => player.group))].sort(), [players]);

  const stats = useMemo(() => {
    const ages = players.map((player) => player.age).filter((age): age is number => age !== null);
    const avgAge = ages.length ? Math.round((ages.reduce((sum, age) => sum + age, 0) / ages.length) * 10) / 10 : null;
    const teamsCount = new Set(players.map((player) => player.teamCode)).size;
    const completeRows = players.filter((player) => player.age || player.height || player.birthPlace || player.citizenship).length;
    return {
      players: players.length,
      teams: teamsCount,
      avgAge: avgAge ?? "--",
      coverage: players.length ? `${Math.round((completeRows / players.length) * 100)}%` : "--",
    };
  }, [players]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = players.filter((player) => {
      if (teamFilter !== "ALL" && player.teamCode !== teamFilter) return false;
      if (groupFilter !== "ALL" && player.group !== groupFilter) return false;
      if (positionFilter !== "ALL" && player.positionGroup !== positionFilter) return false;
      if (!needle) return true;
      const haystack = [
        player.name,
        player.teamName,
        player.teamCode,
        player.group,
        player.positionAbbr,
        player.positionGroup,
        player.jersey,
        player.age,
        player.height,
        player.citizenship,
        player.birthPlace,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
    return sortPlayers(rows, sortMode);
  }, [players, query, teamFilter, groupFilter, positionFilter, sortMode]);

  useEffect(() => {
    setVisibleCount(INITIAL_LIMIT);
  }, [query, teamFilter, groupFilter, positionFilter, sortMode]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatPill label="Players" value={stats.players} />
        <StatPill label="Teams" value={stats.teams} />
        <StatPill label="Avg age" value={stats.avgAge} />
        <StatPill label="Bio coverage" value={stats.coverage} />
      </div>

      <div className="surface-glass sticky top-0 z-20 -mx-4 mt-5 flex flex-col gap-3 border-x-0 px-4 py-3 md:static md:mx-0 md:rounded-2xl md:border md:p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1.4fr)_repeat(3,minmax(150px,0.7fr))]">
          <label className="min-w-0">
            <span className="sr-only">Search players</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search player, country, position, birthplace..."
              className="h-11 w-full rounded-xl border border-edge bg-navy/80 px-4 text-sm text-ink outline-none transition placeholder:text-dim/70 focus:border-pitch"
            />
          </label>

          <label>
            <span className="sr-only">Filter by team</span>
            <select
              value={teamFilter}
              onChange={(event) => setTeamFilter(event.target.value)}
              className="h-11 w-full rounded-xl border border-edge bg-navy/80 px-3 text-sm text-ink outline-none focus:border-pitch"
            >
              <option value="ALL">All teams</option>
              {teams.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">Filter by group</span>
            <select
              value={groupFilter}
              onChange={(event) => setGroupFilter(event.target.value)}
              className="h-11 w-full rounded-xl border border-edge bg-navy/80 px-3 text-sm text-ink outline-none focus:border-pitch"
            >
              <option value="ALL">All groups</option>
              {groups.map((group) => (
                <option key={group} value={group}>
                  Group {group}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">Sort players</span>
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="h-11 w-full rounded-xl border border-edge bg-navy/80 px-3 text-sm text-ink outline-none focus:border-pitch"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {POSITION_FILTERS.map((option) => {
            const active = positionFilter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => setPositionFilter(option.value)}
                className={`shrink-0 rounded-full px-4 py-2 font-display text-xs font-bold uppercase tracking-wider transition ${
                  active
                    ? "bg-pitch text-navy shadow-lg shadow-pitch/20"
                    : "border border-edge bg-panel2/70 text-dim hover:border-pitch/50 hover:text-ink"
                }`}
              >
                {option.label}
              </button>
            );
          })}

          {(query || teamFilter !== "ALL" || groupFilter !== "ALL" || positionFilter !== "ALL" || sortMode !== "team") && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setTeamFilter("ALL");
                setGroupFilter("ALL");
                setPositionFilter("ALL");
                setSortMode("team");
              }}
              className="ml-auto shrink-0 rounded-full border border-edge px-4 py-2 text-xs text-dim transition hover:border-live/60 hover:text-live"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 text-sm text-dim">
        <p>
          Showing <span className="font-mono text-ink">{visible.length}</span> of{" "}
          <span className="font-mono text-ink">{filtered.length}</span>
        </p>
      </div>

      {visible.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((player) => (
            <PlayerCard key={`${player.teamCode}-${player.espnId}`} player={player} />
          ))}
        </div>
      ) : (
        <div className="surface-card mt-4 rounded-2xl border-dashed border-white/15 px-4 py-12 text-center">
          <p className="font-display text-xl font-bold uppercase tracking-wide text-ink">No players found</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-dim">
            No rostered player matches those filters yet. ESPN roster data may also still be filling in for some
            qualified teams.
          </p>
        </div>
      )}

      {filtered.length > visible.length ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="rounded-full border border-pitch/40 bg-pitch/10 px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-pitch transition hover:bg-pitch hover:text-navy"
          >
            Show more players
          </button>
        </div>
      ) : null}
    </div>
  );
}
