import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flag } from "@/components/Flag";
import { LocalTime } from "@/components/LocalTime";
import { getPublicProfile } from "@/lib/predictions";
import { GOLDEN_BALL_CANDIDATES } from "@/data/ballon-dor-candidates";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const profile = await getPublicProfile(params.id);
  return { title: profile ? `${profile.name} — Prediction Profile` : "Prediction Profile" };
}

function outcomeText(outcome: string, homeCode?: string | null, awayCode?: string | null) {
  if (outcome === "DRAW") return "Draw";
  return outcome === "HOME" ? `${homeCode ?? "Home"} win` : `${awayCode ?? "Away"} win`;
}

export default async function PredictionProfilePage({ params }: { params: { id: string } }) {
  const profile = await getPublicProfile(params.id);
  if (!profile) notFound();

  const gbCandidate = GOLDEN_BALL_CANDIDATES.find((c) => c.id === profile.goldenBall);

  return (
    <div className="mx-auto max-w-shell px-4 py-8">
      <Link href="/predict" className="text-xs text-dim hover:text-ink">
        &larr; Prediction pool
      </Link>

      {/* Hero */}
      <section className="mt-4 overflow-hidden rounded-xl border border-pitch/30 pitch-horizontal bg-[linear-gradient(135deg,rgba(16,24,42,0.98),rgba(58,9,28,0.78))] p-5">
        <p className="text-xs uppercase tracking-[0.26em] text-pitch">⚽ Public prediction profile</p>
        <div className="mt-3 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h1 className="font-display text-4xl font-bold uppercase tracking-wide md:text-6xl">{profile.name}</h1>
            <p className="mt-2 text-sm text-dim">
              {profile.score.picked} match picks · {profile.score.correct} correct results · {profile.score.exact} exact scores
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3">
              <p className="font-display text-3xl font-bold text-gold">{profile.score.points}</p>
              <p className="text-[10px] uppercase tracking-wider text-dim">points</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3">
              <p className="font-display text-3xl font-bold">{profile.score.exact}</p>
              <p className="text-[10px] uppercase tracking-wider text-dim">exact</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3">
              <p className="font-display text-3xl font-bold">{profile.score.correct}</p>
              <p className="text-[10px] uppercase tracking-wider text-dim">correct</p>
            </div>
          </div>
        </div>

        {/* Bonus picks */}
        <div className="mt-4 flex flex-wrap gap-3">
          {profile.champion && (
            <div className="flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/8 px-3 py-2">
              <span className="text-base">🏆</span>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-dim">Champion pick</p>
                <div className="flex items-center gap-1.5">
                  <Flag code={profile.champion} name={profile.champion} width={20} />
                  <p className="text-sm font-semibold text-gold">
                    {profile.champion}
                    {profile.score.championHit && <span className="ml-1 text-pitch">✓ +25 pts</span>}
                  </p>
                </div>
              </div>
            </div>
          )}
          {gbCandidate && (
            <div className="flex items-center gap-2 rounded-lg border border-[#9333ea]/30 bg-[#9333ea]/8 px-3 py-2">
              <span className="text-base">✨</span>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-dim">Ballon d&apos;Or pick</p>
                <div className="flex items-center gap-1.5">
                  <Flag code={gbCandidate.teamCode} name={gbCandidate.teamCode} width={20} />
                  <p className="text-sm font-semibold text-[#c084fc]">
                    {gbCandidate.name}
                    {profile.score.goldenBallHit && <span className="ml-1 text-pitch">✓ +15 pts</span>}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Match predictions */}
      <section className="mt-6">
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide">Match Predictions</h2>
        {profile.picks.length ? (
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {profile.picks.map(({ match, pick, points, exact, correctResult }) => {
              const homeName = match.homeTeam?.name ?? match.homeLabel ?? "Home";
              const awayName = match.awayTeam?.name ?? match.awayLabel ?? "Away";
              const ptsBg = exact
                ? "border-pitch/60 bg-pitch/10 text-pitch"
                : correctResult
                  ? "border-gold/50 bg-gold/10 text-gold"
                  : points
                    ? "border-dim/30 bg-panel2/60 text-dim"
                    : "border-gold/40 bg-gold/10 text-gold";
              return (
                <article key={match.id} className="overflow-hidden rounded-xl border border-edge bg-panel">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-edge/60 bg-panel2/40 px-3 py-2 text-[11px] text-dim">
                    <span className="font-semibold uppercase tracking-wide">
                      {match.group ? `Group ${match.group}` : match.stage.replace(/_/g, " ")}
                    </span>
                    <LocalTime iso={match.utcDate} style="weekday" className="font-mono" />
                  </div>

                  <div className="p-3">
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <div className="min-w-0 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="truncate text-sm font-semibold">{homeName}</span>
                          <Flag code={match.homeTeam?.code} name={homeName} width={28} />
                        </div>
                      </div>
                      <div className="rounded-lg border border-edge bg-navy px-4 py-2 font-mono text-xl font-bold">
                        {pick.home}–{pick.away}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Flag code={match.awayTeam?.code} name={awayName} width={28} />
                          <span className="truncate text-sm font-semibold">{awayName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-dim">
                      <span>{outcomeText(pick.outcome, match.homeTeam?.code, match.awayTeam?.code)}</span>
                      <span className={`rounded-full border px-2 py-0.5 font-mono font-semibold ${ptsBg}`}>
                        {points} pts{exact ? " · exact!" : correctResult ? " · correct" : ""}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-dashed border-edge bg-panel2/40 p-6 text-center text-sm text-dim">
            No public match picks yet.
          </div>
        )}
      </section>
    </div>
  );
}
