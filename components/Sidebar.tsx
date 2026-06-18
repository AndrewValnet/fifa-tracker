"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { NAV_ITEMS } from "@/components/nav-items";
import { LiveBadge } from "@/components/LiveBadge";
import { SearchBox } from "@/components/SearchBox";
import { useLiveMatches } from "@/hooks/useFixtures";

/** Desktop persistent side panel (PRD section 8.4). Hidden below lg. */
export function Sidebar() {
  const pathname = usePathname();
  const { matches } = useLiveMatches();

  return (
    <aside className="surface-glass sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r-0 lg:flex">
      <Link href="/" className="group flex items-center gap-3 px-5 py-5">
        <span
          aria-hidden
          className="grid h-11 w-11 place-items-center rounded-2xl border border-gold/35 bg-gold/10 font-display text-lg font-bold text-gold shadow-lg shadow-gold/10"
        >
          26
        </span>
        <span className="leading-tight">
          <span className="block font-display text-xl font-semibold tracking-wide">WC26 Live</span>
          <span className="block text-[10px] uppercase tracking-[0.34em] text-dim group-hover:text-pitch">
            War Room
          </span>
        </span>
      </Link>

      <SearchBox />

      <nav className="flex flex-col gap-1 px-3" aria-label="Primary">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                active
                  ? "border border-pitch/20 bg-pitch/10 font-semibold text-ink shadow-lg shadow-pitch/5"
                  : "text-dim hover:bg-white/5 hover:text-ink",
              )}
            >
              <span
                aria-hidden
                className={clsx(
                  "grid h-7 w-7 place-items-center rounded-lg border text-sm transition",
                  active
                    ? "border-pitch/30 bg-pitch/15"
                    : "border-white/5 bg-black/15 group-hover:border-white/10 group-hover:bg-white/5",
                )}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 px-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-dim">Live now</p>
        {matches.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 bg-black/15 px-3 py-3 text-xs text-dim">
            No matches in play
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {matches.slice(0, 4).map((m) => (
              <li key={m.id}>
                <Link
                  href={`/match/${m.id}`}
                  prefetch={false}
                  className="block rounded-xl border border-edge/70 bg-black/20 px-3 py-2 text-xs transition hover:border-pitch/50 hover:bg-pitch/5"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate">
                      {(m.homeTeam?.code ?? "TBD") +
                        " " +
                        (m.score.home ?? "-") +
                        ":" +
                        (m.score.away ?? "-") +
                        " " +
                        (m.awayTeam?.code ?? "TBD")}
                    </span>
                    <LiveBadge tiny />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mx-5 mb-4 mt-auto rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-[11px] leading-relaxed text-dim">
        <p className="font-semibold text-ink">FIFA World Cup 2026</p>
        <p>Jun 11 - Jul 19 &middot; USA &middot; CAN &middot; MEX</p>
      </div>
    </aside>
  );
}
