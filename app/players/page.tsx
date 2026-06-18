import type { Metadata } from "next";
import { PlayersDirectoryClient } from "@/components/PlayersDirectoryClient";
import { getPlayerDirectory } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Players",
  description: "Search and inspect every available World Cup player profile.",
};

export default async function PlayersPage() {
  const players = await getPlayerDirectory();
  const teamCount = new Set(players.map((player) => player.teamCode)).size;
  const positionCount = new Set(players.map((player) => player.positionGroup)).size;

  return (
    <div className="mx-auto max-w-shell px-4 py-8">
      <section className="premium-border surface-glass relative overflow-hidden rounded-[2rem] px-4 py-6 md:px-8 md:py-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "linear-gradient(115deg, rgba(0,229,139,0.16), transparent 42%), linear-gradient(245deg, rgba(92,200,255,0.14), transparent 48%), repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 82px)",
          }}
        />
        <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.28em] text-pitch">
              World Cup player index
            </p>
            <h1 className="hero-copy-gradient mt-3 font-display text-4xl font-black uppercase leading-none tracking-wide md:text-6xl">
              Players
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-dim md:text-base">
              Every available roster profile in one place: headshots, country, group, position, shirt number,
              age, height, birthplace, nationality, and a direct path into the full player page.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-center">
              <p className="font-display text-3xl font-black text-gold">{players.length}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-dim">Profiles</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-center">
              <p className="font-display text-3xl font-black text-pitch">{teamCount}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-dim">Teams</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-center">
              <p className="font-display text-3xl font-black text-sky">{positionCount}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-dim">Roles</p>
            </div>
          </div>
        </div>
      </section>

      <PlayersDirectoryClient players={players} />
    </div>
  );
}
