import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Flag } from "@/components/Flag";
import { SectionHeader } from "@/components/SectionHeader";
import { HatTricksTracker } from "@/components/HatTricksTracker";
import { OwnGoalsFeed } from "@/components/OwnGoalsFeed";
import { FastestGoals } from "@/components/FastestGoals";
import { PenaltyTracker } from "@/components/PenaltyTracker";
import { getInsights } from "@/lib/insights";
import { getAllMatches, getScorers, getStandings } from "@/lib/data";
import { UnderdogStats } from "@/components/UnderdogStats";
import { GoalkeeperRatings } from "@/components/GoalkeeperRatings";
import { PenaltyShootoutHistory } from "@/components/PenaltyShootoutHistory";
import { fmtNumber, fmtPct, fmtUsdCompact } from "@/lib/format";
import { GoalMinuteHeatmap } from "@/components/GoalMinuteHeatmap";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tournament Insights — WC26 Live",
  description: "Cheeky aggregate analytics: money on the losing side, biggest bottle jobs, dirtiest teams, carbon footprint and more.",
};

function Empty({ children = "Appears as more matches are played." }: { children?: string }) {
  return <p className="rounded-lg border border-dashed border-edge px-4 py-6 text-center text-xs text-dim">{children}</p>;
}

function Tile({ value, label, sub, accent = true }: { value: string; label: string; sub?: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-edge bg-panel px-4 py-3">
      <p className={`font-display text-3xl font-bold tabular-nums ${accent ? "text-gold" : ""}`}>{value}</p>
      <p className="mt-0.5 text-[11px] uppercase tracking-wider text-dim">{label}</p>
      {sub ? <p className="mt-1 text-[11px] text-dim">{sub}</p> : null}
    </div>
  );
}

function Card({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-edge bg-panel/80 p-4">
      <SectionHeader title={title} />
      {children}
      {note ? <p className="mt-2 text-[10px] leading-snug text-dim">{note}</p> : null}
    </section>
  );
}

function Row({
  code,
  name,
  primary,
  secondary,
  href,
}: {
  code: string | null;
  name: string;
  primary: string;
  secondary?: string;
  href?: string | null;
}) {
  const inner = (
    <>
      <Flag code={code} name={name} width={22} />
      <span className="min-w-0 flex-1 truncate">{name}</span>
      <span className="font-mono text-sm font-semibold text-gold tabular-nums">{primary}</span>
      {secondary ? <span className="w-24 shrink-0 text-right font-mono text-[11px] text-dim">{secondary}</span> : null}
    </>
  );
  return (
    <li className="flex items-center gap-2.5 border-t border-edge/50 py-2 text-sm first:border-t-0">
      {href ? (
        <Link href={href} prefetch={false} className="flex flex-1 items-center gap-2.5 hover:text-ink">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </li>
  );
}

async function InsightsBody() {
  const ins = await getInsights();
  const acc = ins.upsets.marketAccuracy;

  return (
    <>
      <p className="mt-2 max-w-2xl text-sm text-dim">
        The mischievous numbers: where the smart money went wrong, who bottled big leads, the dirtiest teams, and some
        cheeky back-of-the-napkin estimates. Measured stats are unlabeled; modeled ones carry an{" "}
        <span className="rounded border border-edge px-1 py-0.5 text-[9px] uppercase tracking-wider">est.</span> tag.
        Based on {ins.finishedCount} completed match{ins.finishedCount === 1 ? "" : "es"} so far.
      </p>

      {/* ---- Money & Mischief ---- */}
      <h2 className="mt-10 font-display text-xl font-semibold uppercase tracking-wider text-dim">💸 Money &amp; Mischief</h2>
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <Card
          title="Bookmaker's Nightmare"
          note="Money that backed the pre-kickoff favorite in matches the favorite didn't win ≈ each market's open interest × the favorite's pre-match win probability (Polymarket). The honest read: pool size on the favored, ultimately-disappointed side."
        >
          <div className="mb-3">
            <Tile value={fmtUsdCompact(ins.money.onLosingSideTotal)} label="backed the team that didn't win" />
          </div>
          {ins.money.losingSide.length ? (
            <ul>
              {ins.money.losingSide.map((r) => (
                <Row
                  key={r.matchId ?? r.label}
                  code={r.favCode}
                  name={`${r.label}`}
                  primary={fmtUsdCompact(r.amount)}
                  secondary={`${fmtPct(r.favProb)} fav · ${r.result}`}
                  href={r.matchId ? `/match/${r.matchId}` : null}
                />
              ))}
            </ul>
          ) : (
            <Empty>{ins.oddsAvailable ? "No favorites have been upset yet — the chalk is holding." : "Appears once matches finish with market data."}</Empty>
          )}
        </Card>

        <Card
          title="Per-Capita Faith"
          note="Money traded on each nation's Polymarket 'win the World Cup' market ÷ its population. Population is static reference data; an estimate of national fervor, not official."
        >
          {ins.money.perCapita.length ? (
            <ul>
              {ins.money.perCapita.map((r) => (
                <Row
                  key={r.code}
                  code={r.code}
                  name={r.name}
                  primary={`$${r.perCapita.toFixed(2)}`}
                  secondary={`${fmtUsdCompact(r.volume)} total`}
                  href={`/teams/${r.code}`}
                />
              ))}
            </ul>
          ) : (
            <Empty>Appears once the outright winner market has volume.</Empty>
          )}
        </Card>
      </div>

      {/* ---- Upsets & Market accuracy ---- */}
      <h2 className="mt-10 font-display text-xl font-semibold uppercase tracking-wider text-dim">🎲 Upsets &amp; the Crowd</h2>
      <div className="mt-3 grid gap-4 lg:grid-cols-3">
        <Card title="Biggest Upsets" note="Ranked by the winner's market-implied win probability just before kickoff (Polymarket). Lower = bigger shock.">
          {ins.upsets.biggest.length ? (
            <ul>
              {ins.upsets.biggest.map((r) => (
                <Row
                  key={r.matchId ?? r.label}
                  code={r.winnerCode}
                  name={r.label}
                  primary={fmtPct(r.winnerProb)}
                  secondary="win prob"
                  href={r.matchId ? `/match/${r.matchId}` : null}
                />
              ))}
            </ul>
          ) : (
            <Empty />
          )}
        </Card>

        <Card title="Was the Crowd Sharp?" note="Share of decisive matches won by the pre-kickoff betting favorite.">
          <Tile
            value={acc.pct != null ? fmtPct(acc.pct) : "—"}
            label="favorites delivered"
            sub={acc.decided ? `${acc.favoriteWon} of ${acc.decided} decisive matches` : "no decisive matches yet"}
          />
        </Card>

        <Card title="Biggest Bottle Job" note="Largest in-match collapse from a side's peak win probability to its final, when it didn't win (Polymarket odds history).">
          {ins.upsets.bottleJobs.length ? (
            <ul>
              {ins.upsets.bottleJobs.map((r) => (
                <Row
                  key={(r.matchId ?? r.label) + (r.teamCode ?? "")}
                  code={r.teamCode}
                  name={r.label}
                  primary={`−${fmtPct(r.drop)}`}
                  secondary={`${fmtPct(r.peak)}→${fmtPct(r.final)}`}
                  href={r.matchId ? `/match/${r.matchId}` : null}
                />
              ))}
            </ul>
          ) : (
            <Empty />
          )}
        </Card>
      </div>

      {/* ---- On the pitch ---- */}
      <h2 className="mt-10 font-display text-xl font-semibold uppercase tracking-wider text-dim">⚔️ On the Pitch</h2>
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <Card title="Dirtiest Teams" note="Cards and fouls per game from ESPN match stats. Measured.">
          {ins.pitch.dirtiest.length ? (
            <ul>
              {ins.pitch.dirtiest.map((r) => (
                <Row
                  key={r.code}
                  code={r.code}
                  name={r.name}
                  primary={`${r.yellow}🟨 ${r.red}🟥`}
                  secondary={`${r.foulsPerGame.toFixed(1)} fouls/gm`}
                  href={`/teams/${r.code}`}
                />
              ))}
            </ul>
          ) : (
            <Empty />
          )}
        </Card>

        <Card title="Theatrics Index" note="Fouls drawn per foul committed — the most fouled (or most theatrical) sides. ESPN data, measured.">
          {ins.pitch.theatrics.length ? (
            <ul>
              {ins.pitch.theatrics.map((r) => (
                <Row
                  key={r.code}
                  code={r.code}
                  name={r.name}
                  primary={r.ratio.toFixed(2)}
                  secondary={`${r.foulsDrawn} drawn / ${r.foulsCommitted}`}
                  href={`/teams/${r.code}`}
                />
              ))}
            </ul>
          ) : (
            <Empty />
          )}
        </Card>

        <Card title="Clutch Index" note="Share of a team's goals scored in the 75th minute or later. Measured.">
          {ins.pitch.clutch.length ? (
            <ul>
              {ins.pitch.clutch.map((r) => (
                <Row
                  key={r.code}
                  code={r.code}
                  name={r.name}
                  primary={fmtPct(r.pct)}
                  secondary={`${r.lateGoals}/${r.goals} late`}
                  href={`/teams/${r.code}`}
                />
              ))}
            </ul>
          ) : (
            <Empty>Appears once teams have scored a few goals.</Empty>
          )}
        </Card>

        <Card title="Crowds: Fullest & Emptiest" note="Attendance (ESPN) vs stadium capacity. Measured.">
          {ins.pitch.fillFullest.length ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-[10px] uppercase tracking-widest text-dim">Packed</p>
                <ul>
                  {ins.pitch.fillFullest.map((r) => (
                    <Row key={"f" + r.label} code={null} name={r.label} primary={fmtPct(r.pct)} secondary={fmtNumber(r.attendance)} />
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1 text-[10px] uppercase tracking-widest text-dim">Echoey</p>
                <ul>
                  {ins.pitch.fillEmptiest.map((r) => (
                    <Row key={"e" + r.label} code={null} name={r.label} primary={fmtPct(r.pct)} secondary={fmtNumber(r.attendance)} />
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <Empty />
          )}
        </Card>
      </div>

      {/* ---- Fan Stats ---- */}
      <h2 className="mt-10 font-display text-xl font-semibold uppercase tracking-wider text-dim">📊 Fan Stats</h2>
      <div className="mt-3">
        <Suspense fallback={<div className="skeleton h-48 rounded-xl" />}>
          <UnderdogSection />
        </Suspense>
      </div>

      {/* ---- Golden Glove Race ---- */}
      <h2 className="mt-10 font-display text-xl font-semibold uppercase tracking-wider text-dim">🧤 Golden Glove Race</h2>
      <div className="mt-3">
        <Suspense fallback={<div className="skeleton h-48 rounded-xl" />}>
          <GoalkeeperSection />
        </Suspense>
      </div>

      {/* ---- Cheeky estimates ---- */}
      <h2 className="mt-10 font-display text-xl font-semibold uppercase tracking-wider text-dim">
        🌶️ Cheeky Estimates{" "}
        <span className="rounded border border-edge px-1.5 py-0.5 align-middle text-[9px] uppercase tracking-wider text-dim">all est.</span>
      </h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          value={`${fmtNumber(Math.round(ins.cheeky.carbonTotalTonnes))} t`}
          label="CO₂e from match-going fans (est.)"
          sub="≈0.9 t/spectator travel+ops, a flat published factor"
        />
        <Tile value={`${ins.cheeky.cardiacMultiplier}×`} label="fan cardiac emergencies on big match days (est.)" sub="per NEJM 2008 — not medical advice" />
        <Tile value={fmtUsdCompact(ins.cheeky.productivityLostUsd)} label="global output 'skived' watching (est.)" sub="modeled audience × work-hours × GDP/hr" />
        <Tile value={ins.cheeky.babyBoomWindow} label="World Cup baby-boom watch (folklore)" sub="~40 weeks on — evidence is mixed" accent={false} />
      </div>
      {ins.cheeky.carbonRows.length ? (
        <Card title="Heaviest Carbon Footprints" note="Per-match estimate = attendance × a flat published per-spectator travel+ops factor (~0.9 tCO₂e). Real per-fan origins aren't published; this is a labeled estimate.">
          <ul>
            {ins.cheeky.carbonRows.map((r) => (
              <Row key={r.label} code={null} name={r.label} primary={`${fmtNumber(Math.round(r.tonnes))} t`} secondary={fmtNumber(r.attendance)} />
            ))}
          </ul>
        </Card>
      ) : null}

      {/* ---- Match Events ---- */}
      <h2 className="mt-10 font-display text-xl font-semibold uppercase tracking-wider text-dim">⚡ Match Events</h2>
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-edge bg-panel/80 p-4">
          <SectionHeader title="Hat-Tricks" />
          <HatTricksTracker />
        </section>
        <section className="rounded-xl border border-edge bg-panel/80 p-4">
          <SectionHeader title="Fastest Goals" right="scored in the first 5 minutes" />
          <FastestGoals />
        </section>
        <section className="rounded-xl border border-edge bg-panel/80 p-4">
          <SectionHeader title="Own Goals" />
          <OwnGoalsFeed />
        </section>
        <section className="rounded-xl border border-edge bg-panel/80 p-4">
          <SectionHeader title="Penalty Shootouts" />
          <PenaltyTracker />
        </section>
      </div>

      {/* ---- Goal Minute Heatmap ---- */}
      <h2 className="mt-10 font-display text-xl font-semibold uppercase tracking-wider text-dim">🕐 Timing</h2>
      <div className="mt-3">
        <Suspense fallback={<div className="skeleton h-40 rounded-xl" />}>
          <GoalHeatmapSection />
        </Suspense>
      </div>

      {/* ---- Penalty Shootout Records ---- */}
      <h2 className="mt-10 font-display text-xl font-semibold uppercase tracking-wider text-dim">🥅 Penalty Shootout Records</h2>
      <div className="mt-3">
        <section className="rounded-xl border border-edge bg-panel/80 p-4">
          <SectionHeader title="Penalty Shootout Records" right="all-time WC shootout history" />
          <PenaltyShootoutHistory />
        </section>
      </div>

      <p className="mt-8 text-[10px] leading-snug text-dim">
        Money figures from Polymarket public market data (volume / open interest). Match stats, attendance and fouls from
        ESPN&apos;s public feed. Estimates labeled <span className="uppercase">est.</span> are transparent models, not official
        figures — see each card&apos;s note. Cached ~10 minutes.
      </p>
    </>
  );
}

async function UnderdogSection() {
  const [scorers, standings] = await Promise.all([getScorers(), getStandings()]);
  return (
    <section className="rounded-xl border border-edge bg-panel/80 p-4">
      <SectionHeader title="Fan Stats" right="adjusted for population & expectations" />
      <UnderdogStats scorers={scorers.data} standings={standings.data} />
    </section>
  );
}

async function GoalkeeperSection() {
  const allMatches = await getAllMatches();
  return (
    <section className="rounded-xl border border-edge bg-panel/80 p-4">
      <SectionHeader title="Golden Glove Race" right="saves, clean sheets, goals conceded" />
      <GoalkeeperRatings matches={allMatches.data} />
    </section>
  );
}

async function GoalHeatmapSection() {
  const allMatches = await getAllMatches();
  const events = allMatches.data
    .filter((m) => m.status === "FINISHED")
    .flatMap((m) => m.events ?? []);
  return (
    <section className="rounded-xl border border-edge bg-panel p-4">
      <SectionHeader title="Goal Minute Heatmap" right="when goals are scored" />
      <GoalMinuteHeatmap events={events} />
    </section>
  );
}

function InsightsSkeleton() {
  return (
    <div className="mt-6 flex flex-col gap-4" aria-hidden>
      <div className="skeleton h-8 w-56" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="skeleton h-64" />
        <div className="skeleton h-64" />
      </div>
      <div className="skeleton h-8 w-56" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="skeleton h-48" />
        <div className="skeleton h-48" />
        <div className="skeleton h-48" />
      </div>
    </div>
  );
}

export default function InsightsPage() {
  return (
    <div className="mx-auto max-w-shell px-4 py-8">
      <Link href="/" className="text-xs text-dim hover:text-ink">
        ← War Room
      </Link>
      <h1 className="mt-3 font-display text-3xl font-bold uppercase tracking-wide md:text-4xl">
        Tournament <span className="text-gold">Insights</span>
      </h1>
      <Suspense fallback={<InsightsSkeleton />}>
        <InsightsBody />
      </Suspense>
    </div>
  );
}
