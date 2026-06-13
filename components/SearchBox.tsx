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
        className="w-full rounded-lg border border-edge bg-panel2 px-3 py-2 text-sm text-ink placeholder:text-dim"
      />
      {results.length ? (
        <ul className="mt-1 overflow-hidden rounded-lg border border-edge bg-panel">
          {results.map((t) => (
            <li key={t.code}>
              <Link
                href={`/teams/${t.code}`}
                onClick={() => setQ("")}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-panel2/70"
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
