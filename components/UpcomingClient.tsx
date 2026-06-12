"use client";

// Filterable fixtures browser (PRD §7.3): group / team / host country / date
// filters, chronological or group ordering, optional finished matches.

import { useMemo, useState } from "react";
import clsx from "clsx";
import { MatchCard } from "@/components/MatchCard";
import { SourceTag } from "@/components/SourceTag";
import { useAllMatches } from "@/hooks/useFixtures";
import { useMounted } from "@/hooks/useMounted";
import { statusKind } from "@/lib/format";
import { getStadium } from "@/lib/schedule";
import { TEAMS } from "@/lib/team-meta";
import type { Match, Sourced } from "@/lib/types";

const STATUS_TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "live", label: "Live" },
  { key: "finished", label: "Results" },
  { key: "all", label: "All" },
] as const;
type StatusTab = (typeof STATUS_TABS)[number]["key"];

const GROUPS = "ABCDEFGHIJKL".split("");
const COUNTRIES = ["United States", "Canada", "Mexico"];

const selectCls =
  "rounded-lg border border-edge bg-panel px-2.5 py-1.5 text-xs text-ink focus:border-pitch focus:outline-none";

export function UpcomingClient({ initial }: { initial?: Sourced<Match[]> }) {
  const { matches, source } = useAllMatches(initial);
  const mounted = useMounted();

  const [tab, setTab] = useState<StatusTab>("upcoming");
  const [group, setGroup] = useState("");
  const [team, setTeam] = useState("");
  const [country, setCountry] = useState("");
  const [date, setDate] = useState("");
  const [sort, setSort] = useState<"time" | "group">("time");

  const filtered = useMemo(() => {
    let list = matches;
    if (tab !== "all") list = list.filter((m) => statusKind(m.status) === tab);
    if (group === "KO") list = list.filter((m) => m.stage !== "GROUP_STAGE");
    else if (group) list = list.filter((m) => m.group === group);
    if (team) list = list.filter((m) => m.homeTeam?.code === team || m.awayTeam?.code === team);
    if (country) {
      list = list.filter((m) => getStadium(m.stadiumId)?.country === country);
    }
    if (date && mounted) {
      list = list.filter((m) => {
        const local = new Date(m.utcDate);
        const y = local.getFullYear();
        const mo = String(local.getMonth() + 1).padStart(2, "0");
        const d = String(local.getDate()).padStart(2, "0");
        return `${y}-${mo}-${d}` === date;
      });
    }
    if (sort === "group") {
      list = [...list].sort(
        (a, b) =>
          (a.group ?? "Z").localeCompare(b.group ?? "Z") ||
          new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime(),
      );
    }
    return list;
  }, [matches, tab, group, team, country, date, sort, mounted]);

  const oddsCutoff = Date.now() + 48 * 3600_000;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Match status" className="flex rounded-lg border border-edge bg-panel p-0.5">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={clsx(
                "rounded-md px-3 py-1.5 text-xs transition-colors",
                tab === t.key ? "bg-panel2 font-semibold text-ink" : "text-dim hover:text-ink",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <label className="sr-only" htmlFor="f-group">Group</label>
        <select id="f-group" value={group} onChange={(e) => setGroup(e.target.value)} className={selectCls}>
          <option value="">All groups</option>
          {GROUPS.map((g) => (
            <option key={g} value={g}>
              Group {g}
            </option>
          ))}
          <option value="KO">Knockout</option>
        </select>

        <label className="sr-only" htmlFor="f-team">Team</label>
        <select id="f-team" value={team} onChange={(e) => setTeam(e.target.value)} className={selectCls}>
          <option value="">All teams</option>
          {TEAMS.map((t) => (
            <option key={t.code} value={t.code}>
              {t.name}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="f-country">Host country</label>
        <select id="f-country" value={country} onChange={(e) => setCountry(e.target.value)} className={selectCls}>
          <option value="">All host countries</option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="f-date">Date</label>
        <input
          id="f-date"
          type="date"
          value={date}
          min="2026-06-11"
          max="2026-07-19"
          onChange={(e) => setDate(e.target.value)}
          className={selectCls}
        />

        <label className="sr-only" htmlFor="f-sort">Sort</label>
        <select id="f-sort" value={sort} onChange={(e) => setSort(e.target.value as "time" | "group")} className={clsx(selectCls, "ml-auto")}>
          <option value="time">By kickoff</option>
          <option value="group">By group</option>
        </select>

        <SourceTag source={source} />
      </div>

      <p className="mb-3 text-xs text-dim">
        {filtered.length} {filtered.length === 1 ? "match" : "matches"}
      </p>

      {filtered.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              withOdds={
                statusKind(m.status) !== "finished" && new Date(m.utcDate).getTime() < oddsCutoff
              }
            />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-edge px-4 py-10 text-center text-sm text-dim">
          Nothing matches those filters.
        </p>
      )}
    </div>
  );
}
