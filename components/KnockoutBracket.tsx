// Knockout bracket (PRD §7.4): Round of 32 → Final as scrollable columns.
// Undecided slots show their qualification labels (e.g. "Winner Group C").

import Link from "next/link";
import clsx from "clsx";
import { Flag } from "@/components/Flag";
import { LocalTime } from "@/components/LocalTime";
import { statusKind } from "@/lib/format";
import type { Match, Stage } from "@/lib/types";

const COLUMNS: { stage: Stage; title: string }[] = [
  { stage: "LAST_32", title: "Round of 32" },
  { stage: "LAST_16", title: "Round of 16" },
  { stage: "QUARTER_FINALS", title: "Quarter-finals" },
  { stage: "SEMI_FINALS", title: "Semi-finals" },
  { stage: "THIRD_PLACE", title: "Third place" },
  { stage: "FINAL", title: "Final" },
];

function BracketTeamRow({
  name,
  code,
  score,
  winner,
}: {
  name: string;
  code: string | null;
  score: number | null;
  winner: boolean;
}) {
  const tbd = !code;
  return (
    <div className={clsx("flex items-center gap-2 px-2.5 py-1.5", winner && "bg-pitch/10")}>
      {code ? (
        <Flag code={code} name={name} width={20} rounded={false} />
      ) : (
        <span aria-hidden className="inline-block h-[15px] w-5 rounded-sm bg-panel2" />
      )}
      <span className={clsx("min-w-0 flex-1 truncate text-xs", tbd ? "italic text-dim" : winner ? "font-semibold" : "")}>
        {name}
      </span>
      <span className={clsx("font-mono text-xs tabular-nums", winner ? "font-bold text-gold" : "text-dim")}>
        {score ?? ""}
      </span>
    </div>
  );
}

function BracketCard({ match }: { match: Match }) {
  const kind = statusKind(match.status);
  const homeName = match.homeTeam?.name ?? match.homeLabel ?? "TBD";
  const awayName = match.awayTeam?.name ?? match.awayLabel ?? "TBD";
  return (
    <Link
      href={`/match/${match.id}`}
      prefetch={false}
      className="block overflow-hidden rounded-lg border border-edge bg-panel text-ink transition-colors hover:border-pitch/50"
    >
      <BracketTeamRow
        name={homeName}
        code={match.homeTeam?.code ?? null}
        score={kind === "upcoming" ? null : match.score.home}
        winner={match.score.winner === "HOME_TEAM"}
      />
      <div className="border-t border-edge/60" />
      <BracketTeamRow
        name={awayName}
        code={match.awayTeam?.code ?? null}
        score={kind === "upcoming" ? null : match.score.away}
        winner={match.score.winner === "AWAY_TEAM"}
      />
      <p className="border-t border-edge/60 bg-panel2/50 px-2.5 py-1 text-[10px] text-dim">
        <LocalTime iso={match.utcDate} style="weekday" />
      </p>
    </Link>
  );
}

export function KnockoutBracket({ matches }: { matches: Match[] }) {
  const byStage = new Map<Stage, Match[]>();
  for (const m of matches) {
    if (m.stage === "GROUP_STAGE") continue;
    const list = byStage.get(m.stage) ?? [];
    list.push(m);
    byStage.set(m.stage, list);
  }
  for (const list of byStage.values()) {
    list.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  }

  const columns = COLUMNS.filter((c) => (byStage.get(c.stage)?.length ?? 0) > 0);
  if (!columns.length) {
    return (
      <p className="rounded-lg border border-dashed border-edge px-4 py-8 text-center text-sm text-dim">
        Knockout bracket appears when the Round of 32 is set (June 28).
      </p>
    );
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max items-start gap-4">
        {columns.map((c) => (
          <div key={c.stage} className="w-56">
            <h3 className="mb-2 text-center font-display text-xs font-semibold uppercase tracking-widest text-dim">
              {c.title}
            </h3>
            <div className="flex flex-col justify-around gap-2">
              {byStage.get(c.stage)!.map((m) => (
                <BracketCard key={m.id} match={m} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
