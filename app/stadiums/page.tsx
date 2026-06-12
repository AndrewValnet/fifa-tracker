import type { Metadata } from "next";
import { StadiumCard } from "@/components/StadiumCard";
import { getAllMatches } from "@/lib/data";
import { STADIUMS, sortMatches } from "@/lib/schedule";
import type { Match } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stadiums",
  description: "The 16 venues of World Cup 2026 across the USA, Canada and Mexico — with every fixture they host.",
};

export default async function StadiumsPage() {
  const all = await getAllMatches();
  const byStadium = new Map<string, Match[]>();
  for (const m of all.data) {
    if (!m.stadiumId) continue;
    const list = byStadium.get(m.stadiumId) ?? [];
    list.push(m);
    byStadium.set(m.stadiumId, list);
  }
  for (const [k, list] of byStadium) byStadium.set(k, sortMatches(list));

  const byCountry: Record<string, typeof STADIUMS> = {};
  for (const s of STADIUMS) (byCountry[s.country] ??= []).push(s);
  const order = ["United States", "Canada", "Mexico"];

  return (
    <div className="mx-auto max-w-shell px-4 py-8">
      <h1 className="mb-2 font-display text-2xl font-bold uppercase tracking-wide md:text-3xl">
        16 <span className="text-pitch">Stadiums</span>, 3 Nations
      </h1>
      <p className="mb-8 max-w-2xl text-sm text-dim">
        From the Azteca — the first stadium to host matches at three World Cups — to the Final at MetLife
        Stadium on July 19, 2026. Expand a venue to see every match it hosts.
      </p>

      {order
        .filter((c) => byCountry[c]?.length)
        .map((country) => (
          <section key={country} className="mb-10" aria-label={`Stadiums in ${country}`}>
            <h2 className="mb-3 font-display text-lg font-semibold uppercase tracking-wider text-dim">
              {country}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {byCountry[country].map((s) => (
                <StadiumCard key={s.id} stadium={s} matches={byStadium.get(s.id) ?? []} />
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
