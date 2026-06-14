// Outright "win the World Cup" ranking by Polymarket implied probability.

import Link from "next/link";
import { Flag } from "@/components/Flag";
import { fmtPct } from "@/lib/format";
import type { Favorite } from "@/lib/types";

export function FavoritesRanking({ favorites, limit = 10 }: { favorites: Favorite[]; limit?: number }) {
  if (!favorites.length) {
    return <p className="py-2 text-center text-xs text-dim">Outright market unavailable right now.</p>;
  }
  const max = favorites[0]?.price || 1;
  return (
    <ol className="flex flex-col">
      {favorites.slice(0, limit).map((f, i) => (
        <li key={f.code} className="flex items-center gap-2.5 border-t border-edge/50 py-1.5 first:border-t-0">
          <span className="w-5 shrink-0 text-right font-mono text-xs text-dim">{i + 1}</span>
          <Flag code={f.code} name={f.name} width={22} />
          <Link href={`/teams/${f.code}`} className="min-w-0 flex-1 truncate text-sm hover:text-gold">
            {f.name}
          </Link>
          <span className="hidden h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-panel2 sm:block" aria-hidden>
            <span className="block h-full rounded-full bg-gold/70" style={{ width: `${(f.price / max) * 100}%` }} />
          </span>
          <span className="w-12 shrink-0 text-right font-mono text-sm font-semibold text-gold">{fmtPct(f.price)}</span>
        </li>
      ))}
    </ol>
  );
}
