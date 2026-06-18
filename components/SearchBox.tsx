"use client";

// Lightweight instant search over the 48 teams (static, no fetch). Links straight
// to a team page; type a code, name, or "group x".

import Link from "next/link";
import { useState } from "react";
import { Flag } from "@/components/Flag";
import { TEAMS } from "@/lib/team-meta";

export function SearchBox() {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const results = query
    ? TEAMS.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.code.toLowerCase().includes(query) ||
          `group ${t.group}`.toLowerCase().includes(query),
      ).slice(0, 8)
    : [];

  return (
    <div className="px-3 pb-1">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search teams…"
        aria-label="Search teams"
        className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-ink outline-none placeholder:text-dim transition focus:border-pitch focus:ring-2 focus:ring-pitch/20"
      />
      {results.length ? (
        <ul className="surface-card mt-2 overflow-hidden rounded-xl">
          {results.map((t) => (
            <li key={t.code}>
              <Link
                href={`/teams/${t.code}`}
                onClick={() => setQ("")}
                className="flex items-center gap-2 px-3 py-2 text-sm transition hover:bg-white/5"
              >
                <Flag code={t.code} name={t.name} width={18} />
                <span className="min-w-0 flex-1 truncate">{t.name}</span>
                <span className="text-[10px] text-dim">Grp {t.group}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
