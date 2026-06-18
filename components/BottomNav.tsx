"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { NAV_ITEMS } from "@/components/nav-items";

/** Mobile bottom tab bar (PRD §8.4). Hidden at lg and above. */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="surface-glass fixed inset-x-0 bottom-0 z-40 rounded-t-2xl border-x-0 border-b-0 border-t border-white/10 shadow-2xl shadow-black/60 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex px-1.5 pt-1.5">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-[10px] transition",
                  active ? "bg-pitch/10 text-pitch" : "text-dim hover:bg-white/5 hover:text-ink",
                )}
              >
                {active ? <span aria-hidden className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-pitch" /> : null}
                <span aria-hidden className="text-lg leading-none">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
