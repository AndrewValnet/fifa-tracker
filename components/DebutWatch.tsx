// Static component — no client data needed.
// Reads wc-history data to find nations making their World Cup debut in 2026.
import Link from "next/link";
import { Flag } from "@/components/Flag";
import { getDebutNations } from "@/lib/wc-history";

const DEBUT_NATIONS = getDebutNations();

export function DebutWatch() {
  if (!DEBUT_NATIONS.length) {
    return <p className="py-4 text-center text-sm text-dim">No debut nations found.</p>;
  }

  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {DEBUT_NATIONS.map((t) => (
        <li key={t.code}>
          <Link
            href={`/teams/${t.code}`}
            prefetch={false}
            className="flex items-center gap-2 rounded-lg border border-edge bg-panel px-3 py-2 text-sm transition-colors hover:border-gold/50 hover:bg-gold/5"
          >
            <Flag code={t.code} name={t.code} width={22} />
            <div className="min-w-0">
              <div className="truncate font-semibold leading-tight">{t.code}</div>
              <div className="text-[10px] text-dim">WC debut · 2026</div>
            </div>
            <span className="ml-auto shrink-0 text-base" aria-hidden>🌟</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
