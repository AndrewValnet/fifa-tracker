// Stadium gallery card (PRD §6 /stadiums) with the venue's full fixture list.

import Link from "next/link";
import { Flag } from "@/components/Flag";
import { LocalTime } from "@/components/LocalTime";
import { StadiumPhoto } from "@/components/StadiumPhoto";
import { fmtNumber, statusKind } from "@/lib/format";
import type { Match, Stadium } from "@/lib/types";

const COUNTRY_FLAG: Record<string, string> = {
  "United States": "🇺🇸",
  Canada: "🇨🇦",
  Mexico: "🇲🇽",
};

function FixtureRow({ match }: { match: Match }) {
  const kind = statusKind(match.status);
  const home = match.homeTeam;
  const away = match.awayTeam;
  return (
    <li>
      <Link
        href={`/match/${match.id}`}
        prefetch={false}
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-xs transition hover:bg-white/5"
      >
        <LocalTime iso={match.utcDate} style="date" className="w-14 shrink-0 font-mono text-[10px] text-dim" />
        <span className="flex min-w-0 flex-1 items-center justify-end gap-1.5 truncate">
          <span className="truncate">{home?.code ?? match.homeLabel ?? "TBD"}</span>
          {home?.code ? <Flag code={home.code} name={home.name} width={16} rounded={false} /> : null}
        </span>
        <span className="shrink-0 px-1 text-center font-mono font-semibold">
          {kind === "upcoming" ? (
            <LocalTime iso={match.utcDate} style="time" className="text-[10px] text-dim" />
          ) : (
            `${match.score.home ?? "–"}:${match.score.away ?? "–"}`
          )}
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate">
          {away?.code ? <Flag code={away.code} name={away.name} width={16} rounded={false} /> : null}
          <span className="truncate">{away?.code ?? match.awayLabel ?? "TBD"}</span>
        </span>
      </Link>
    </li>
  );
}

export function StadiumCard({ stadium, matches }: { stadium: Stadium; matches: Match[] }) {
  const played = matches.filter((m) => statusKind(m.status) === "finished").length;
  return (
    <div className="match-card-hover surface-card overflow-hidden rounded-2xl">
      <StadiumPhoto src={stadium.image} alt={stadium.name} className="h-40 w-full object-cover" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-lg font-semibold leading-tight">{stadium.name}</h3>
            <p className="text-xs text-dim">{stadium.fifaName}</p>
          </div>
          <span aria-label={stadium.country} title={stadium.country} className="text-xl">
            {COUNTRY_FLAG[stadium.country] ?? "🏳️"}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-dim">
          <span>{stadium.city}</span>
          <span className="font-mono">{fmtNumber(stadium.capacity)} seats</span>
        </div>

        <details className="group mt-2">
          <summary className="flex cursor-pointer select-none items-center justify-between text-xs">
            <span>
              <span className="font-semibold text-gold">{matches.length}</span>{" "}
              <span className="text-dim">
                tournament {matches.length === 1 ? "match" : "matches"}
                {played ? ` · ${played} played` : ""}
              </span>
            </span>
            <span aria-hidden className="text-dim transition-transform group-open:rotate-180">▾</span>
          </summary>
          <ul className="mt-2 flex flex-col border-t border-edge/50 pt-1">
            {matches.map((m) => (
              <FixtureRow key={m.id} match={m} />
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}
