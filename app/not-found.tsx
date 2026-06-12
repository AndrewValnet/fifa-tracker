import Link from "next/link";

/** 404 — staged as a VAR offside review. */
export default function NotFound() {
  return (
    <div className="pitch-bg relative flex min-h-[80dvh] flex-col items-center justify-center gap-6 overflow-hidden px-4 py-16 text-center">
      {/* pitch backdrop with an offside line frozen mid-review */}
      <svg
        viewBox="0 0 720 300"
        aria-hidden
        className="w-full max-w-2xl opacity-95"
      >
        {/* turf */}
        <rect x="0" y="0" width="720" height="300" rx="12" fill="#0E2B1C" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={i * 120} y="0" width="60" height="300" fill="#10331F" />
        ))}
        <g stroke="#E8F5EE" strokeOpacity="0.4" strokeWidth="2" fill="none">
          <rect x="10" y="10" width="700" height="280" rx="8" />
          <line x1="360" y1="10" x2="360" y2="290" />
          <circle cx="360" cy="150" r="55" />
          <rect x="10" y="75" width="90" height="150" />
          <rect x="620" y="75" width="90" height="150" />
        </g>

        {/* the VAR offside line */}
        <line x1="520" y1="14" x2="520" y2="286" stroke="#FFD700" strokeWidth="2.5" strokeDasharray="10 7" />
        <text x="528" y="30" fill="#FFD700" fontSize="13" fontFamily="var(--font-roboto-mono), monospace">
          OFFSIDE LINE
        </text>

        {/* defenders */}
        <circle cx="500" cy="100" r="11" fill="#55B5E5" />
        <circle cx="470" cy="200" r="11" fill="#55B5E5" />
        <circle cx="300" cy="160" r="11" fill="#55B5E5" />
        {/* the page, caught beyond the last defender */}
        <g>
          <circle cx="585" cy="148" r="13" fill="#FF3B30" />
          <text x="585" y="153" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" fontFamily="var(--font-roboto-mono), monospace">
            404
          </text>
        </g>
        {/* ball */}
        <circle cx="430" cy="170" r="6" fill="#F0F4FF" />
        <text x="585" y="186" textAnchor="middle" fontSize="10" fill="#FF6B61" fontFamily="var(--font-inter), sans-serif">
          this page
        </text>
      </svg>

      <div className="flex flex-col items-center gap-3">
        <p className="flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.25em] text-gold">
          <span aria-hidden className="h-2 w-2 animate-pulse-dot rounded-full bg-gold" />
          VAR review complete
        </p>
        <h1 className="font-display text-4xl font-bold uppercase tracking-wide md:text-5xl">
          Off<span className="text-live">side</span>
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-dim">
          The page you played in behind the defense doesn&apos;t exist. The flag is up, the goal is
          disallowed, and play restarts from the War Room.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-pitch px-6 py-2.5 font-display text-sm font-semibold uppercase tracking-wider text-navy transition-transform hover:scale-105"
        >
          Back to the War Room
        </Link>
        <Link
          href="/upcoming"
          className="rounded-full border border-edge bg-panel px-6 py-2.5 font-display text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:border-pitch/50"
        >
          Today&apos;s matches
        </Link>
      </div>
    </div>
  );
}
