import type { Metadata } from "next";
import Link from "next/link";
import { CompareClient } from "@/components/CompareClient";
import { Flag } from "@/components/Flag";
import { PlayerHeadshot } from "@/components/PlayerHeadshot";
import { SectionHeader } from "@/components/SectionHeader";
import { getPlayerData, type PlayerData } from "@/lib/data";
import { fmtNumber, fmtPct } from "@/lib/format";
import { getTeamColors, resolveTeamCode, teamName } from "@/lib/team-meta";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compare Players — WC26 Live",
  description: "Head-to-head player stat comparison for the 2026 World Cup.",
};

interface Props {
  searchParams: { a?: string; teamA?: string; b?: string; teamB?: string };
}

interface Metric {
  label: string;
  value: (d: PlayerData) => number | null;
  goodHigh: boolean;
  pct?: boolean;
}

const METRICS: Metric[] = [
  { label: "Appearances", value: (d) => d.totals.appearances, goodHigh: true },
  { label: "Starts", value: (d) => d.starts, goodHigh: true },
  { label: "Minutes (est)", value: (d) => d.minutesTotal, goodHigh: true },
  { label: "Goals", value: (d) => d.totals.goals, goodHigh: true },
  { label: "Assists", value: (d) => d.totals.assists, goodHigh: true },
  { label: "Shots", value: (d) => d.totals.shots, goodHigh: true },
  { label: "On target", value: (d) => d.totals.shotsOnTarget, goodHigh: true },
  { label: "Shot accuracy", value: (d) => (d.totals.shots > 0 ? d.totals.shotsOnTarget / d.totals.shots : null), goodHigh: true, pct: true },
  { label: "Fouls drawn", value: (d) => d.totals.foulsDrawn, goodHigh: true },
  { label: "Fouls committed", value: (d) => d.totals.fouls, goodHigh: false },
  { label: "Yellow cards", value: (d) => d.totals.yellow, goodHigh: false },
  { label: "Red cards", value: (d) => d.totals.red, goodHigh: false },
];

function PlayerCard({ data, teamCode }: { data: PlayerData; teamCode: string | null }) {
  const colors = getTeamColors(teamCode);
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <PlayerHeadshot src={data.bio?.headshot} name={data.bio?.name ?? "?"} size={96} colors={colors} className="ring-2 ring-edge" />
      <p className="font-display text-lg font-bold leading-tight">{data.bio?.name}</p>
      <p className="flex items-center gap-1.5 text-xs text-dim">
        {teamCode ? <Flag code={teamCode} name={teamName(teamCode)} width={18} /> : null}
        {data.bio?.position ?? ""}
      </p>
    </div>
  );
}

function fmtVal(v: number | null, pct?: boolean): string {
  if (v === null) return "—";
  return pct ? fmtPct(v) : fmtNumber(v);
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/teams" className="text-xs text-dim hover:text-ink">
        ← Teams
      </Link>
      <h1 className="mt-3 font-display text-3xl font-bold uppercase tracking-wide">
        Compare <span className="text-gold">Players</span>
      </h1>
      <p className="mt-2 text-sm text-dim">Pick two players to put their 2026 World Cup numbers side by side.</p>

      <div className="mt-5">
        <CompareClient initial={{ a: idA, teamA: teamA ?? "", b: idB, teamB: teamB ?? "" }} />
      </div>

      {da?.bio && db?.bio ? (
        <section className="mt-8" aria-label="Comparison">
          <SectionHeader title="Head to Head" />
          <div className="rounded-xl border border-edge bg-panel p-4">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <PlayerCard data={da} teamCode={teamA} />
              <span className="text-xs text-dim">vs</span>
              <PlayerCard data={db} teamCode={teamB} />
            </div>

            <table className="mt-5 w-full text-sm">
              <tbody>
                {METRICS.map((m) => {
                  const va = m.value(da);
                  const vb = m.value(db);
                  let aWins = false;
                  let bWins = false;
                  if (va !== null && vb !== null && va !== vb) {
                    const aBigger = va > vb;
                    aWins = m.goodHigh ? aBigger : !aBigger;
                    bWins = !aWins;
                  }
                  return (
                    <tr key={m.label} className="border-t border-edge/50">
                      <td className={`py-2 text-right font-mono text-base tabular-nums ${aWins ? "font-bold text-gold" : "text-dim"}`}>
                        {fmtVal(va, m.pct)}
                      </td>
                      <td className="px-3 py-2 text-center text-[11px] uppercase tracking-wider text-dim">{m.label}</td>
                      <td className={`py-2 text-left font-mono text-base tabular-nums ${bWins ? "font-bold text-gold" : "text-dim"}`}>
                        {fmtVal(vb, m.pct)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-3 text-[10px] text-dim">
              Tournament totals from ESPN match data; minutes estimated. Higher value highlighted (lower is better for
              fouls and cards).
            </p>
          </div>
        </section>
      ) : ready ? (
        <p className="mt-8 rounded-lg border border-dashed border-edge px-4 py-8 text-center text-sm text-dim">
          Couldn&apos;t load one of those players. Try another pick.
        </p>
      ) : null}
    </div>
  );
}
