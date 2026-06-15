// All-time head-to-head bar for the two sides. Server component; renders
// nothing when the pairing is not in the curated dataset.

import { headToHead } from "@/lib/h2h";
import { teamName } from "@/lib/team-meta";

function formatMeetingDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function HeadToHead({
  homeCode,
  awayCode,
  homeName,
  awayName,
}: {
  homeCode: string | null | undefined;
  awayCode: string | null | undefined;
  homeName: string;
  awayName: string;
}) {
  const h = headToHead(homeCode, awayCode);
  if (!h || !h.played) return null;
  const total = h.homeWins + h.draws + h.awayWins || 1;
  const pct = (n: number) => `${(n / total) * 100}%`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between text-sm font-semibold">
        <span style={{ color: "var(--home-color)" }}>{h.homeWins}</span>
        <span className="text-[11px] uppercase tracking-wider text-dim">
          {h.played} meetings - {h.draws} draws
        </span>
        <span style={{ color: "var(--away-color)" }}>{h.awayWins}</span>
      </div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-panel2">
        <span style={{ width: pct(h.homeWins), background: "var(--home-color)" }} title={`${homeName} ${h.homeWins} wins`} />
        <span style={{ width: pct(h.draws), background: "var(--border)" }} title={`${h.draws} draws`} />
        <span style={{ width: pct(h.awayWins), background: "var(--away-color)" }} title={`${awayName} ${h.awayWins} wins`} />
      </div>
      <div className="flex justify-between text-[10px] text-dim">
        <span>{homeName} wins</span>
        <span>{awayName} wins</span>
      </div>
      {h.lastMeeting ? <p className="text-[11px] text-dim">Last: {h.lastMeeting}</p> : null}
      {h.note ? <p className="text-[11px] italic text-dim">{h.note}</p> : null}
      {h.meetings.length ? (
        <div className="mt-2 overflow-x-auto rounded-lg border border-edge/70">
          <table className="min-w-[520px] w-full text-left text-[11px]">
            <thead className="bg-panel2 text-[10px] uppercase tracking-wider text-dim">
              <tr>
                <th className="px-2 py-1.5 font-semibold">Date</th>
                <th className="px-2 py-1.5 font-semibold">Match</th>
                <th className="px-2 py-1.5 font-semibold">Competition</th>
                <th className="px-2 py-1.5 font-semibold">Where</th>
              </tr>
            </thead>
            <tbody>
              {h.meetings.map((m) => {
                const home = teamName(m.homeCode) ?? m.homeCode;
                const away = teamName(m.awayCode) ?? m.awayCode;
                return (
                  <tr key={`${m.date}-${m.homeCode}-${m.awayCode}`} className="border-t border-edge/50">
                    <td className="whitespace-nowrap px-2 py-1.5 font-mono text-dim">{formatMeetingDate(m.date)}</td>
                    <td className="px-2 py-1.5">
                      <span className="font-semibold text-ink">{home}</span>{" "}
                      <span className="font-mono text-pitch">
                        {m.homeScore}-{m.awayScore}
                      </span>{" "}
                      <span className="font-semibold text-ink">{away}</span>
                    </td>
                    <td className="px-2 py-1.5 text-dim">{m.competition}</td>
                    <td className="px-2 py-1.5 text-dim">
                      {m.venue}
                      {m.location ? `, ${m.location}` : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
      <p className="text-[10px] text-dim">All-time, all competitions - approximate; source counts can vary.</p>
    </div>
  );
}
