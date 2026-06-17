import type { Metadata } from "next";
import Link from "next/link";
import { CompareClient } from "@/components/CompareClientLazy";
import { Flag } from "@/components/Flag";
import { PlayerHeadshot } from "@/components/PlayerHeadshot";
import { PlayerRadarChart } from "@/components/PlayerRadarChart";
import { getPlayerData, type PlayerData } from "@/lib/data";
import { fmtNumber, fmtPct } from "@/lib/format";
import { getAccentColor, getTeamColors, resolveTeamCode, teamName } from "@/lib/team-meta";
import { AllTimeH2HPanel } from "@/components/AllTimeH2HPanel";
import { SQUAD_VALUES } from "@/data/squad-market-values";

export const metadata: Metadata = {
  title: "Compare Players — WC26 Live",
  description: "Head-to-head player stat comparison for the 2026 World Cup.",
};

interface Props {
  searchParams: { a?: string; teamA?: string; b?: string; teamB?: string };
}

interface Metric {
  label: string;
  icon: string;
  value: (d: PlayerData) => number | null;
  goodHigh: boolean;
  pct?: boolean;
  category: "attack" | "discipline" | "general";
}

const METRICS: Metric[] = [
  { label: "Goals", icon: "⚽", value: (d) => d.totals.goals, goodHigh: true, category: "attack" },
  { label: "Assists", icon: "🎯", value: (d) => d.totals.assists, goodHigh: true, category: "attack" },
  { label: "Shots", icon: "💥", value: (d) => d.totals.shots, goodHigh: true, category: "attack" },
  { label: "On Target", icon: "🎳", value: (d) => d.totals.shotsOnTarget, goodHigh: true, category: "attack" },
  { label: "Shot Accuracy", icon: "📐", value: (d) => (d.totals.shots > 0 ? d.totals.shotsOnTarget / d.totals.shots : null), goodHigh: true, pct: true, category: "attack" },
  { label: "Fouls Drawn", icon: "🤸", value: (d) => d.totals.foulsDrawn, goodHigh: true, category: "discipline" },
  { label: "Fouls", icon: "⚠️", value: (d) => d.totals.fouls, goodHigh: false, category: "discipline" },
  { label: "Yellow Cards", icon: "🟨", value: (d) => d.totals.yellow, goodHigh: false, category: "discipline" },
  { label: "Red Cards", icon: "🟥", value: (d) => d.totals.red, goodHigh: false, category: "discipline" },
  { label: "Appearances", icon: "📋", value: (d) => d.totals.appearances, goodHigh: true, category: "general" },
  { label: "Starts", icon: "🏁", value: (d) => d.starts, goodHigh: true, category: "general" },
  { label: "Minutes", icon: "⏱️", value: (d) => d.minutesTotal, goodHigh: true, category: "general" },
];

function fmtVal(v: number | null, pct?: boolean): string {
  if (v === null) return "—";
  return pct ? fmtPct(v) : fmtNumber(v);
}

function StatBar({
  va,
  vb,
  colorA,
  colorB,
  goodHigh,
  metric,
}: {
  va: number | null;
  vb: number | null;
  colorA: string;
  colorB: string;
  goodHigh: boolean;
  metric: Metric;
}) {
  const numA = va ?? 0;
  const numB = vb ?? 0;
  const total = numA + numB;
  const pctA = total > 0 ? (numA / total) * 100 : 50;
  const pctB = total > 0 ? (numB / total) * 100 : 50;

  let aWins = false;
  let bWins = false;
  if (va !== null && vb !== null && va !== vb) {
    const aBigger = va > vb;
    aWins = goodHigh ? aBigger : !aBigger;
    bWins = !aWins;
  }

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-t border-edge/40 py-2.5">
      {/* Player A value */}
      <div className="flex items-center justify-end gap-2">
        <span
          className={`font-mono text-base tabular-nums ${aWins ? "font-bold text-ink" : "text-dim"}`}
        >
          {fmtVal(va, metric.pct)}
        </span>
        {/* Bar going right to left */}
        <div className="relative h-2 w-24 overflow-hidden rounded-full bg-panel2">
          <div
            className="absolute right-0 h-full rounded-full transition-all duration-700"
            style={{ width: `${pctA}%`, background: colorA, opacity: aWins ? 1 : 0.4 }}
          />
        </div>
      </div>

      {/* Label */}
      <div className="flex w-28 flex-col items-center">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-dim">{metric.label}</span>
      </div>

      {/* Player B value */}
      <div className="flex items-center gap-2">
        {/* Bar going left to right */}
        <div className="relative h-2 w-24 overflow-hidden rounded-full bg-panel2">
          <div
            className="absolute left-0 h-full rounded-full transition-all duration-700"
            style={{ width: `${pctB}%`, background: colorB, opacity: bWins ? 1 : 0.4 }}
          />
        </div>
        <span
          className={`font-mono text-base tabular-nums ${bWins ? "font-bold text-ink" : "text-dim"}`}
        >
          {fmtVal(vb, metric.pct)}
        </span>
      </div>
    </div>
  );
}

export default async function ComparePage({ searchParams }: Props) {
  const teamA = searchParams.teamA ? resolveTeamCode(searchParams.teamA, searchParams.teamA) : null;
  const teamB = searchParams.teamB ? resolveTeamCode(searchParams.teamB, searchParams.teamB) : null;
  const idA = searchParams.a ?? "";
  const idB = searchParams.b ?? "";
  const ready = idA && idB && teamA && teamB;

  const [da, db] = ready
    ? await Promise.all([getPlayerData(idA, teamA), getPlayerData(idB, teamB)])
    : [null, null];

  const colorsA = getTeamColors(teamA);
  const colorsB = getTeamColors(teamB);
  const accentA = getAccentColor(teamA);
  const accentB = getAccentColor(teamB);

  // Count category wins
  let aWins = 0;
  let bWins = 0;
  if (da && db) {
    for (const m of METRICS) {
      const va = m.value(da);
      const vb = m.value(db);
      if (va !== null && vb !== null && va !== vb) {
        const aBigger = va > vb;
        if (m.goodHigh ? aBigger : !aBigger) aWins++;
        else bWins++;
      }
    }
  }

  const nameA = da?.bio?.name ?? "Player A";
  const nameB = db?.bio?.name ?? "Player B";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/teams" className="text-xs text-dim hover:text-ink">
        ← Teams
      </Link>

      {/* Page title */}
      <h1 className="mt-3 font-display text-3xl font-black uppercase tracking-wide">
        Compare <span className="text-gold">Players</span>
      </h1>
      <p className="mt-1 text-sm text-dim">Pick two players to put their 2026 World Cup numbers side by side.</p>

      {/* Player picker */}
      <div className="mt-5">
        <CompareClient initial={{ a: idA, teamA: teamA ?? "", b: idB, teamB: teamB ?? "" }} />
      </div>

      {da?.bio && db?.bio ? (
        <section className="mt-8 space-y-6" aria-label="Comparison">

          {/* ── Hero: diagonal split with team colors ──────────────────── */}
          <div
            className="relative overflow-hidden rounded-2xl"
            style={{
              background: `linear-gradient(105deg, ${colorsA.primary}22 0%, ${colorsA.primary}11 45%, ${colorsB.primary}11 55%, ${colorsB.primary}22 100%)`,
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: "#1e2a3d",
            }}
          >
            {/* Diagonal color stripe */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `linear-gradient(105deg, ${colorsA.primary}18 0%, transparent 48%, ${colorsB.primary}18 100%)`,
              }}
            />
            {/* Top accent bar */}
            <div
              className="absolute left-0 right-0 top-0 h-[3px]"
              style={{ background: `linear-gradient(90deg, ${colorsA.primary}, ${colorsB.primary})` }}
            />

            <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-8">
              {/* Player A */}
              <div className="flex flex-col items-center gap-3 text-center">
                <div
                  className="rounded-full p-1"
                  style={{ background: `${colorsA.primary}33`, boxShadow: `0 0 24px ${colorsA.primary}44` }}
                >
                  <PlayerHeadshot
                    src={da.bio?.headshot}
                    name={da.bio?.name ?? "?"}
                    size={88}
                    colors={colorsA}
                    className="ring-2 ring-white/20"
                  />
                </div>
                <div>
                  <p className="font-display text-xl font-black uppercase leading-tight tracking-wide" style={{ color: colorsA.primary }}>
                    {nameA}
                  </p>
                  <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-dim">
                    <Flag code={teamA} name={teamName(teamA ?? "")} width={16} />
                    {da.bio?.position}
                  </p>
                </div>
                {aWins > 0 && (
                  <div
                    className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
                    style={{ background: `${colorsA.primary}22`, color: colorsA.primary }}
                  >
                    Leads {aWins} of {aWins + bWins} stats
                  </div>
                )}
              </div>

              {/* VS divider */}
              <div className="flex flex-col items-center gap-1">
                <div className="h-16 w-px" style={{ background: `linear-gradient(to bottom, ${colorsA.primary}66, ${colorsB.primary}66)` }} />
                <span className="font-display text-xs font-black uppercase tracking-[0.3em] text-dim">vs</span>
                <div className="h-16 w-px" style={{ background: `linear-gradient(to bottom, ${colorsA.primary}66, ${colorsB.primary}66)` }} />
              </div>

              {/* Player B */}
              <div className="flex flex-col items-center gap-3 text-center">
                <div
                  className="rounded-full p-1"
                  style={{ background: `${colorsB.primary}33`, boxShadow: `0 0 24px ${colorsB.primary}44` }}
                >
                  <PlayerHeadshot
                    src={db.bio?.headshot}
                    name={db.bio?.name ?? "?"}
                    size={88}
                    colors={colorsB}
                    className="ring-2"
                  />
                </div>
                <div>
                  <p className="font-display text-xl font-black uppercase leading-tight tracking-wide" style={{ color: colorsB.primary }}>
                    {nameB}
                  </p>
                  <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-dim">
                    <Flag code={teamB} name={teamName(teamB ?? "")} width={16} />
                    {db.bio?.position}
                  </p>
                </div>
                {bWins > 0 && (
                  <div
                    className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
                    style={{ background: `${colorsB.primary}22`, color: colorsB.primary }}
                  >
                    Leads {bWins} of {aWins + bWins} stats
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Stat comparison bars ───────────────────────────────────── */}
          {(["attack", "general", "discipline"] as const).map((cat) => {
            const catMetrics = METRICS.filter((m) => m.category === cat);
            const catLabel = cat === "attack" ? "⚽ Attack" : cat === "general" ? "📋 Availability" : "⚠️ Discipline";
            return (
              <div key={cat} className="rounded-xl border border-edge bg-panel px-5 py-4">
                <p className="mb-1 font-display text-[11px] font-bold uppercase tracking-[0.25em] text-dim">{catLabel}</p>
                {/* Column headers */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 pb-1">
                  <p className="truncate text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: accentA }}>
                    {nameA.split(" ").at(-1)}
                  </p>
                  <div className="w-28" />
                  <p className="truncate text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: accentB }}>
                    {nameB.split(" ").at(-1)}
                  </p>
                </div>
                {catMetrics.map((m) => (
                  <StatBar
                    key={m.label}
                    metric={m}
                    va={m.value(da)}
                    vb={m.value(db)}
                    colorA={accentA}
                    colorB={accentB}
                    goodHigh={m.goodHigh}
                  />
                ))}
              </div>
            );
          })}

          {/* ── Radar charts ──────────────────────────────────────────── */}
          <div className="rounded-xl border border-edge bg-panel px-5 py-4">
            <p className="mb-4 font-display text-[11px] font-bold uppercase tracking-[0.25em] text-dim">🕸️ Radar</p>
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
              <PlayerRadarChart
                label={da.bio?.name ?? undefined}
                color={accentA}
                size={220}
                stats={[
                  { label: "Goals", value: da.totals.goals ?? 0, max: 10 },
                  { label: "Assists", value: da.totals.assists ?? 0, max: 8 },
                  { label: "Shots", value: da.totals.shots ?? 0, max: 20 },
                  { label: "On Target", value: da.totals.shotsOnTarget ?? 0, max: 15 },
                  { label: "Fouls Drawn", value: da.totals.foulsDrawn ?? 0, max: 10 },
                  { label: "Apps", value: da.totals.appearances ?? 0, max: 7 },
                ]}
              />
              <PlayerRadarChart
                label={db.bio?.name ?? undefined}
                color={accentB}
                size={220}
                stats={[
                  { label: "Goals", value: db.totals.goals ?? 0, max: 10 },
                  { label: "Assists", value: db.totals.assists ?? 0, max: 8 },
                  { label: "Shots", value: db.totals.shots ?? 0, max: 20 },
                  { label: "On Target", value: db.totals.shotsOnTarget ?? 0, max: 15 },
                  { label: "Fouls Drawn", value: db.totals.foulsDrawn ?? 0, max: 10 },
                  { label: "Apps", value: db.totals.appearances ?? 0, max: 7 },
                ]}
              />
            </div>
          </div>

          {/* ── All-time H2H ──────────────────────────────────────────── */}
          <div className="rounded-xl border border-edge bg-panel px-5 py-4">
            <p className="mb-4 font-display text-[11px] font-bold uppercase tracking-[0.25em] text-dim">⚔️ All-time head to head</p>
            <AllTimeH2HPanel codeA={teamA} codeB={teamB} />
          </div>

          {/* ── Squad market values ───────────────────────────────────── */}
          {(() => {
            const valueA = SQUAD_VALUES.find((v) => v.code === teamA);
            const valueB = SQUAD_VALUES.find((v) => v.code === teamB);
            return (
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-edge bg-panel px-5 py-4">
                <div>
                  <p className="mb-1 font-display text-[11px] font-bold uppercase tracking-[0.25em] text-dim">💰 Squad value</p>
                  <p className="font-mono text-lg font-bold text-ink">€{valueA?.totalValueM ?? "?"}M</p>
                  <p className="text-xs text-dim">{teamName(teamA ?? "")}</p>
                </div>
                <div>
                  <p className="mb-1 font-display text-[11px] font-bold uppercase tracking-[0.25em] text-dim">💰 Squad value</p>
                  <p className="font-mono text-lg font-bold text-ink">€{valueB?.totalValueM ?? "?"}M</p>
                  <p className="text-xs text-dim">{teamName(teamB ?? "")}</p>
                </div>
              </div>
            );
          })()}

          <p className="text-center text-[10px] text-dim">
            Tournament totals from ESPN match data · minutes estimated · lower is better for fouls and cards
          </p>
        </section>
      ) : ready ? (
        <p className="mt-8 rounded-xl border border-dashed border-edge px-4 py-10 text-center text-sm text-dim">
          Couldn&apos;t load one of those players. Try another pick.
        </p>
      ) : (
        <div className="mt-10 rounded-xl border border-dashed border-edge px-4 py-12 text-center">
          <p className="font-display text-lg font-bold uppercase tracking-wide text-dim">Pick two players above</p>
          <p className="mt-2 text-sm text-dim">Select a team and player on each side, then hit Compare →</p>
        </div>
      )}
    </div>
  );
}
