// "Road to MetLife" — a team's potential knockout path from its group slot,
// plus title odds. Server component.

import { LocalTime } from "@/components/LocalTime";
import { fmtPct } from "@/lib/format";
import { routeToFinal, type RouteSlot } from "@/lib/route";

const ROUNDS = ["Round of 32", "Round of 16", "Quarter-final", "Semi-final", "Final"];

function Scenario({ title, slot }: { title: string; slot: RouteSlot | null }) {
  return (
    <div className="rounded-lg border border-edge bg-panel2/50 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-dim">{title}</p>
      {slot ? (
        <p className="mt-1 text-sm">
          R32 vs <span className="font-semibold">{slot.opponent}</span>
          <span className="block text-[11px] text-dim">
            <LocalTime iso={slot.utcDate} style="weekday" />
            {slot.city ? ` · ${slot.city}` : ""}
          </span>
        </p>
      ) : (
        <p className="mt-1 text-sm text-dim">Bracket slot TBD</p>
      )}
    </div>
  );
}

export function RouteToFinal({
  group,
  outrightPrice,
}: {
  group: string | null;
  outrightPrice?: number | null;
}) {
  const route = routeToFinal(group);
  if (!route.asWinner && !route.asRunnerUp) return null;

  return (
    <div className="flex flex-col gap-3">
      {outrightPrice != null ? (
        <p className="text-sm text-dim">
          Title odds: <span className="font-semibold text-gold">{fmtPct(outrightPrice, 1)}</span> to lift the trophy at
          MetLife Stadium on Jul 19.
        </p>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2">
        <Scenario title="If they win the group" slot={route.asWinner} />
        <Scenario title="If they finish runner-up" slot={route.asRunnerUp} />
      </div>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-dim">
        {ROUNDS.map((r, i) => (
          <li key={r} className="flex items-center gap-2">
            <span className={i === ROUNDS.length - 1 ? "font-semibold text-gold" : ""}>{r}</span>
            {i < ROUNDS.length - 1 ? <span aria-hidden>→</span> : null}
          </li>
        ))}
      </ol>
      <p className="text-[10px] text-dim">Knockout path from the fixed 2026 bracket; opponents firm up as groups finish.</p>
    </div>
  );
}
