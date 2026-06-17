"use client"

import { useState } from "react"
import { FIFA_RANKINGS } from "@/data/fifa-rankings"
import { Flag } from "@/components/Flag"
import { SectionHeader } from "@/components/SectionHeader"

const CONFEDERATIONS = ["All", "UEFA", "CONMEBOL", "CONCACAF", "CAF", "AFC"] as const
type ConfederationFilter = (typeof CONFEDERATIONS)[number]

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded font-display text-sm font-bold"
        style={{ background: "rgba(255,215,0,0.15)", color: "#ffd700" }}
      >
        {rank}
      </span>
    )
  }
  if (rank === 2) {
    return (
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded font-display text-sm font-bold"
        style={{ background: "rgba(192,192,192,0.15)", color: "#c0c0c0" }}
      >
        {rank}
      </span>
    )
  }
  if (rank === 3) {
    return (
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded font-display text-sm font-bold"
        style={{ background: "rgba(205,127,50,0.15)", color: "#cd7f32" }}
      >
        {rank}
      </span>
    )
  }
  if (rank <= 10) {
    return (
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded font-display text-sm font-bold"
        style={{ background: "rgba(192,192,192,0.08)", color: "#c0c0c0" }}
      >
        {rank}
      </span>
    )
  }
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center font-mono text-sm text-dim">
      {rank}
    </span>
  )
}

function ChangeIndicator({ change }: { change: number }) {
  if (change > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 font-mono text-xs font-semibold" style={{ color: "#00d45e" }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
          <path d="M5 1 L9 7 L1 7 Z" />
        </svg>
        {change}
      </span>
    )
  }
  if (change < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 font-mono text-xs font-semibold" style={{ color: "#ff3b30" }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
          <path d="M5 9 L9 3 L1 3 Z" />
        </svg>
        {Math.abs(change)}
      </span>
    )
  }
  return <span className="font-mono text-xs text-dim">—</span>
}

export function FifaRankingsTable() {
  const [activeConf, setActiveConf] = useState<ConfederationFilter>("All")

  const filtered =
    activeConf === "All"
      ? FIFA_RANKINGS
      : FIFA_RANKINGS.filter((t) => t.confederation === activeConf)

  return (
    <section className="rounded-xl border p-4 sm:p-5" style={{ background: "#0f1523", borderColor: "#1e2a3d" }}>
      <SectionHeader
        title="FIFA World Rankings"
        right={`WC 2026 — ${filtered.length} teams`}
      />

      {/* Confederation filter tabs */}
      <div className="mb-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by confederation">
        {CONFEDERATIONS.map((conf) => {
          const active = activeConf === conf
          return (
            <button
              key={conf}
              role="tab"
              aria-selected={active}
              onClick={() => setActiveConf(conf)}
              className="rounded px-3 py-1 font-display text-xs font-semibold uppercase tracking-wide transition-colors"
              style={
                active
                  ? { background: "#00d45e", color: "#0a0e1a" }
                  : { background: "#151c2e", color: "#6b7a99", borderColor: "#1e2a3d" }
              }
            >
              {conf}
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[400px] border-collapse text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "#1e2a3d" }}>
              <th className="w-10 pb-2 text-left font-display text-xs font-semibold uppercase tracking-wider text-dim">
                #
              </th>
              <th className="pb-2 text-left font-display text-xs font-semibold uppercase tracking-wider text-dim">
                Team
              </th>
              <th className="pb-2 pr-2 text-right font-display text-xs font-semibold uppercase tracking-wider text-dim">
                Pts
              </th>
              <th className="w-14 pb-2 text-right font-display text-xs font-semibold uppercase tracking-wider text-dim">
                Chg
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((team) => (
              <tr
                key={team.code}
                className="group border-b transition-colors"
                style={{ borderColor: "#1e2a3d" }}
              >
                <td className="py-2 pr-2">
                  <RankBadge rank={team.rank} />
                </td>
                <td className="py-2">
                  <div className="flex items-center gap-2.5">
                    <Flag code={team.code} name={team.name} width={28} />
                    <div className="flex flex-col leading-tight">
                      <span
                        className="font-sans text-sm font-medium text-white transition-colors group-hover:text-[#00d45e]"
                      >
                        {team.name}
                      </span>
                      <span className="font-mono text-[10px] text-dim">{team.confederation}</span>
                    </div>
                  </div>
                </td>
                <td className="py-2 pr-2 text-right font-mono text-sm font-semibold text-white">
                  {team.points.toLocaleString()}
                </td>
                <td className="py-2 text-right">
                  <ChangeIndicator change={team.change} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
