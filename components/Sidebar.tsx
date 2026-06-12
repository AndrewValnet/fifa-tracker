"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { NAV_ITEMS } from "@/components/nav-items";
import { LiveBadge } from "@/components/LiveBadge";
import { useLiveMatches } from "@/hooks/useFixtures";

/** Desktop persistent side panel (PRD §8.4). Hidden below lg. */
export function Sidebar() {
  const pathname = usePathname();
  const { matches } = useLiveMatches();

  return (
    <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-edge bg-panel/60 backdrop-blur lg:flex">
      <Link href="/" className="flex items-center gap-2 px-5 py-5">
        <span aria-hidden className="text-2xl">🏆</span>
        <span className="font-display text-xl font-semibold tracking-wide">
          WC<span className="text-pitch">26</span> LIVE
        </span>
      </Link>

      <nav className="flex flex-col gap-1 px-3" aria-label="Primary">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active ? "bg-panel2 font-semibold text-ink" : "text-dim hover:bg-panel2/60 hover:text-ink",
              )}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 px-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-dim">Live now</p>
        {matches.length === 0 ? (
          <p className="text-xs text-dim">No matches in play</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {matches.slice(0, 4).map((m) => (
              <li key={m.id}>
                <Link
                  href={`/match/${m.id}`}
                  prefetch={false}
                  className="block rounded-lg border border-edge bg-panel2/70 px-3 py-2 text-xs hover:border-pitch/50"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate">
                      {(m.homeTeam?.code ?? "TBD") + " " + (m.score.home ?? "–") + ":" + (m.score.away ?? "–") + " " + (m.awayTeam?.code ?? "TBD")}
                    </span>
                    <LiveBadge tiny />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-auto px-5 py-4 text-[11px] leading-relaxed text-dim">
        <p>FIFA World Cup 2026™</p>
        <p>Jun 11 – Jul 19 · USA · CAN · MEX</p>
      </div>
    </aside>
  );
}
