import type { Metadata } from "next";
import { Flag } from "@/components/Flag";
import { SectionHeader } from "@/components/SectionHeader";
import { VAR_DECISIONS, type VARDecision } from "@/data/var-decisions";
import { PENALTY_KICKS, type PenaltyKick } from "@/data/penalty-kicks";

export const metadata: Metadata = {
  title: "VAR & Penalties – WC 2026",
  description: "Every VAR review and open-play penalty from the 2026 World Cup group stage.",
};

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

type VARType = VARDecision["type"];

const TYPE_LABELS: Record<VARType, string> = {
  "goal-overturned": "Goal Check",
  "goal-awarded": "Goal Check",
  "red-card": "Red Card",
  "penalty-awarded": "Penalty",
  "mistaken-identity": "Identity",
};

const TYPE_COLORS: Record<VARType, string> = {
  "goal-overturned": "bg-blue-900/60 text-blue-300 border-blue-700/50",
  "goal-awarded": "bg-blue-900/60 text-blue-300 border-blue-700/50",
  "red-card": "bg-red-900/60 text-red-300 border-red-700/50",
  "penalty-awarded": "bg-yellow-900/50 text-yellow-300 border-yellow-700/50",
  "mistaken-identity": "bg-purple-900/60 text-purple-300 border-purple-700/50",
};

function TypeBadge({ type }: { type: VARType }) {
  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${TYPE_COLORS[type]}`}
    >
      {TYPE_LABELS[type]}
    </span>
  );
}

function OutcomeBadge({ outcome }: { outcome: VARDecision["outcome"] }) {
  if (outcome === "upheld") {
    return (
      <span className="inline-block rounded border border-[#00d45e]/40 bg-[#00d45e]/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-[#00d45e]">
        Upheld
      </span>
    );
  }
  return (
    <span className="inline-block rounded border border-[#ffd700]/40 bg-[#ffd700]/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-[#ffd700]">
      Overturned
    </span>
  );
}

function PenaltyResultBadge({ result }: { result: PenaltyKick["result"] }) {
  if (result === "scored") {
    return (
      <span className="inline-block rounded border border-[#00d45e]/40 bg-[#00d45e]/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-[#00d45e]">
        Scored
      </span>
    );
  }
  if (result === "saved") {
    return (
      <span className="inline-block rounded border border-[#ff3b30]/40 bg-[#ff3b30]/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-[#ff3b30]">
        Saved
      </span>
    );
  }
  return (
    <span className="inline-block rounded border border-[#ff3b30]/40 bg-[#ff3b30]/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-[#ff3b30]">
      Missed
    </span>
  );
}

// ─── stat computation ────────────────────────────────────────────────────────

function computeStats() {
  const totalReviews = VAR_DECISIONS.length;
  const overturned = VAR_DECISIONS.filter((d) => d.outcome === "overturned").length;
  const overturnRate = Math.round((overturned / totalReviews) * 100);

  const totalPenalties = PENALTY_KICKS.length;
  const scored = PENALTY_KICKS.filter((p) => p.result === "scored").length;
  const conversionRate = Math.round((scored / totalPenalties) * 100);

  return { totalReviews, overturned, overturnRate, totalPenalties, scored, conversionRate };
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function VARPage() {
  const stats = computeStats();

  return (
    <main className="mx-auto max-w-shell px-4 py-8">
      {/* Page heading */}
      <h1 className="font-display text-2xl font-black uppercase tracking-tight mb-2">
        VAR Decisions &amp; Penalties
      </h1>
      <p className="mb-8 text-sm text-dim">
        Every VAR review and open-play penalty from WC 2026 group stage — June 11–17, 2026.
      </p>

      {/* ── Stats bar ───────────────────────────────────────────────────── */}
      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="VAR Reviews" value={stats.totalReviews} />
        <StatCard label="Decisions Overturned" value={stats.overturned} />
        <StatCard
          label="Overturn Rate"
          value={`${stats.overturnRate}%`}
          accent="gold"
        />
        <StatCard label="Open-Play Penalties" value={stats.totalPenalties} />
        <StatCard label="Penalties Scored" value={stats.scored} accent="pitch" />
        <StatCard
          label="Conversion Rate"
          value={`${stats.conversionRate}%`}
          accent="pitch"
        />
      </div>

      {/* ── VAR Decisions table ─────────────────────────────────────────── */}
      <section className="mb-12" aria-label="VAR decisions">
        <SectionHeader
          title="VAR Decisions"
          right={`${VAR_DECISIONS.length} reviews · group stage`}
        />
        <div className="overflow-x-auto rounded-xl border border-edge bg-panel">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-xs uppercase tracking-wider text-dim">
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Match</th>
                <th className="px-4 py-3 font-semibold text-center">Min</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Decision</th>
                <th className="px-4 py-3 font-semibold">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {VAR_DECISIONS.map((d, i) => (
                <tr
                  key={d.id}
                  className={`border-b border-edge/50 last:border-0 transition-colors hover:bg-white/[0.03] ${
                    i % 2 === 0 ? "" : "bg-white/[0.015]"
                  }`}
                >
                  {/* Date */}
                  <td className="px-4 py-3 text-dim whitespace-nowrap">
                    {formatDate(d.date)}
                  </td>

                  {/* Match with flags */}
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      <Flag code={d.homeCode} name={d.homeCode} width={20} />
                      <span className="hidden sm:inline text-dim">vs</span>
                      <Flag code={d.awayCode} name={d.awayCode} width={20} />
                      <span className="ml-1 hidden lg:inline text-xs text-dim">
                        {d.match}
                      </span>
                    </span>
                  </td>

                  {/* Minute */}
                  <td className="px-4 py-3 text-center font-mono text-xs text-dim">
                    {d.minute}&apos;
                  </td>

                  {/* Type badge */}
                  <td className="px-4 py-3">
                    <TypeBadge type={d.type} />
                  </td>

                  {/* Decision (hidden on mobile) */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-xs leading-snug">
                      <span className="text-dim">Initial: </span>
                      {d.initialCall}
                    </p>
                    <p className="text-xs leading-snug mt-0.5">
                      <span className="text-dim">VAR: </span>
                      {d.varDecision}
                    </p>
                  </td>

                  {/* Outcome badge */}
                  <td className="px-4 py-3">
                    <OutcomeBadge outcome={d.outcome} />
                    <p className="mt-1 hidden xl:block text-xs text-dim leading-snug max-w-xs">
                      {d.description}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Penalty Kicks table ──────────────────────────────────────────── */}
      <section aria-label="Open-play penalties">
        <SectionHeader
          title="Open-Play Penalties"
          right={`${PENALTY_KICKS.length} awarded · group stage`}
        />
        <div className="overflow-x-auto rounded-xl border border-edge bg-panel">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-xs uppercase tracking-wider text-dim">
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Match</th>
                <th className="px-4 py-3 font-semibold text-center">Min</th>
                <th className="px-4 py-3 font-semibold">Player</th>
                <th className="px-4 py-3 font-semibold">Result</th>
              </tr>
            </thead>
            <tbody>
              {PENALTY_KICKS.map((p, i) => (
                <tr
                  key={p.id}
                  className={`border-b border-edge/50 last:border-0 transition-colors hover:bg-white/[0.03] ${
                    i % 2 === 0 ? "" : "bg-white/[0.015]"
                  }`}
                >
                  {/* Date */}
                  <td className="px-4 py-3 text-dim whitespace-nowrap">
                    {formatDate(p.date)}
                  </td>

                  {/* Match with flags */}
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      <Flag code={p.homeCode} name={p.homeCode} width={20} />
                      <span className="hidden sm:inline text-dim">vs</span>
                      <Flag code={p.awayCode} name={p.awayCode} width={20} />
                      <span className="ml-1 hidden lg:inline text-xs text-dim">
                        {p.match}
                      </span>
                    </span>
                  </td>

                  {/* Minute */}
                  <td className="px-4 py-3 text-center font-mono text-xs text-dim">
                    {p.minute}&apos;
                  </td>

                  {/* Player + team flag */}
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <Flag code={p.teamCode} name={p.teamName} width={18} />
                      <span>{p.player}</span>
                    </span>
                    {p.result === "saved" && p.goalkeeper && (
                      <p className="mt-0.5 text-xs text-dim hidden sm:block">
                        Saved by {p.goalkeeper}
                      </p>
                    )}
                  </td>

                  {/* Result badge */}
                  <td className="px-4 py-3">
                    <PenaltyResultBadge result={p.result} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

// ─── StatCard sub-component ──────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "gold" | "pitch";
}) {
  const valueColor =
    accent === "gold"
      ? "text-[#ffd700]"
      : accent === "pitch"
      ? "text-[#00d45e]"
      : "text-white";

  return (
    <div className="rounded-xl border border-edge bg-panel px-4 py-4">
      <p className="mb-1 text-xs uppercase tracking-wider text-dim">{label}</p>
      <p className={`font-display text-2xl font-black ${valueColor}`}>{value}</p>
    </div>
  );
}
