import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flag } from "@/components/Flag";
import { LocalTime } from "@/components/LocalTime";
import { getPublicProfile } from "@/lib/predictions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const profile = await getPublicProfile(params.id);
  return { title: profile ? `${profile.name} - Prediction Profile` : "Prediction Profile" };
}

function outcomeText(outcome: string, homeCode?: string | null, awayCode?: string | null) {
  if (outcome === "DRAW") return "Draw";
  return outcome === "HOME" ? `${homeCode ?? "Home"} win` : `${awayCode ?? "Away"} win`;
}

export default async function PredictionProfilePage({ params }: { params: { id: string } }) {
  const profile = await getPublicProfile(params.id);
  if (!profile) notFound();

  return (
    <div className="mx-auto max-w-shell px-4 py-8">
      <Link href="/predict" className="text-xs text-dim hover:text-ink">
        &larr; Prediction pool
      </Link>

      <section className="mt-4 overflow-hidden rounded-xl border border-pitch/30 bg-[radial-gradient(circle_at_top_left,rgba(0,217,126,0.16),transparent_30%),linear-gradient(135deg,rgba(16,24,42,0.98),rgba(58,9,28,0.78))] p-5">
        <p className="text-xs uppercase tracking-[0.26em] text-pitch">Public prediction profile</p>
        <div className="mt-3 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h1 className="font-display text-4xl font-bold uppercase tracking-wide md:text-6xl">{profile.name}</h1>
            <p className="mt-2 text-sm text-dim">
              {profile.score.picked} match picks / {profile.score.correct} correct results / {profile.score.exact} exact scores
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
              <p className="font-display text-3xl font-bold">{profile.champion ?? "-"}</p>
              <p className="text-[10px] uppercase tracking-wider text-dim">champion</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide">Match Predictions</h2>
        {profile.picks.length ? (
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {profile.picks.map(({ match, pick, points, exact, correctResult }) => {
              const homeName = match.homeTeam?.name ?? match.homeLabel ?? "Home";
              const awayName = match.awayTeam?.name ?? match.awayLabel ?? "Away";
              return (
                <article key={match.id} className="rounded-xl border border-edge bg-panel p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-dim">
                    <span>{match.group ? `Group ${match.group}` : match.stage.replace(/_/g, " ")}</span>
                    <LocalTime iso={match.utcDate} style="weekday" className="font-mono" />
                  </div>
                  <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="min-w-0 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="truncate text-sm font-semibold">{homeName}</span>
                        <Flag code={match.homeTeam?.code} name={homeName} width={28} />
                      </div>
                    </div>
                    <div className="rounded-lg border border-edge bg-navy px-4 py-2 font-mono text-xl font-bold">
                      {pick.home}-{pick.away}
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
                    <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 font-mono text-gold">
                      {points} pts{exact ? " / exact" : correctResult ? " / result" : ""}
                    </span>
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
