"use client";

import { useFavorites } from "@/hooks/useFavorites";
import { FavoriteButton } from "@/components/FavoriteButton";
import { Flag } from "@/components/Flag";

// 8 popular teams for quick-add
const POPULAR_TEAMS: { code: string; name: string }[] = [
  { code: "BRA", name: "Brazil" },
  { code: "ARG", name: "Argentina" },
  { code: "FRA", name: "France" },
  { code: "ENG", name: "England" },
  { code: "ESP", name: "Spain" },
  { code: "GER", name: "Germany" },
  { code: "POR", name: "Portugal" },
  { code: "NED", name: "Netherlands" },
];

export default function FavoritesPage() {
  const { favorites, isFavorite, toggle, clear } = useFavorites();

  return (
    <main className="min-h-screen bg-navy px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-shell">

        {/* Page header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl text-ink tracking-wide">
              Favorite Teams
            </h1>
            <p className="mt-1 text-dim text-sm">
              Star teams to follow their matches throughout the tournament
            </p>
          </div>
          {favorites.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="text-xs text-dim hover:text-ink border border-edge rounded-md px-3 py-1.5 transition-colors duration-150"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Favorited teams grid */}
        {favorites.length > 0 ? (
          <section aria-label="Your favorite teams" className="mb-12">
            <h2 className="font-display text-base text-dim uppercase tracking-widest mb-4">
              Following ({favorites.length})
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {favorites.map((code) => {
                // Find name from popular list or fall back to code
                const found = POPULAR_TEAMS.find((t) => t.code === code);
                const name = found?.name ?? code;
                return (
                  <div
                    key={code}
                    className="relative flex flex-col items-center gap-3 rounded-xl border border-edge bg-panel p-4 hover:border-gold/40 transition-colors duration-150"
                  >
                    <Flag code={code} name={name} width={64} />
                    <span className="font-body text-sm text-ink text-center leading-tight">
                      {name}
                    </span>
                    <div className="absolute top-2 right-2">
                      <FavoriteButton teamCode={code} teamName={name} size="sm" />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          /* Empty state */
          <section className="mb-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-edge bg-panel/50 py-16 px-8 text-center">
            <svg
              className="mb-4 text-dim"
              width={48}
              height={48}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <p className="font-body text-ink text-base">No favorite teams yet.</p>
            <p className="mt-1 text-dim text-sm max-w-xs">
              Star a team on any team page to follow them, or pick from the
              popular teams below.
            </p>
          </section>
        )}

        {/* Quick-add section */}
        <section aria-label="Popular teams">
          <h2 className="font-display text-base text-dim uppercase tracking-widest mb-4">
            Popular Teams
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-8">
            {POPULAR_TEAMS.map((team) => {
              const already = isFavorite(team.code);
              return (
                <button
                  key={team.code}
                  type="button"
                  onClick={() => toggle(team.code)}
                  aria-pressed={already}
                  className={[
                    "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-150",
                    "hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-none",
                    "focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy",
                    already
                      ? "border-gold/50 bg-gold/5"
                      : "border-edge bg-panel hover:border-edge/80",
                  ].join(" ")}
                >
                  <Flag code={team.code} name={team.name} width={40} />
                  <span className="font-body text-xs text-ink text-center leading-tight">
                    {team.name}
                  </span>
                  {already ? (
                    <span className="text-[10px] font-semibold text-gold">
                      ★ Following
                    </span>
                  ) : (
                    <span className="text-[10px] text-dim">+ Follow</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

      </div>
    </main>
  );
}
