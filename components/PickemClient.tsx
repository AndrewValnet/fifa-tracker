"use client";

// Score pick'em + champion pick + leaderboard. Requires Upstash (shows a notice
// otherwise). Picks/scoring persist server-side keyed by the browser session id.

import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import { Flag } from "@/components/Flag";
import { LocalTime } from "@/components/LocalTime";
import { jsonFetcher } from "@/hooks/fetcher";
import { useSessionId } from "@/hooks/useSessionId";
import { statusKind } from "@/lib/format";
import { TEAMS } from "@/lib/team-meta";
import type { Match, Sourced } from "@/lib/types";

const SORTED_TEAMS = [...TEAMS].sort((a, b) => a.name.localeCompare(b.name));

interface ScoreInfo {
  points: number;
  exact: number;
  correct: number;
  championHit: boolean;
}
interface LeaderRow {
  sessionId: string;
  name: string;
  points: number;
  exact: number;
  champion: string | null;
  championHit: boolean;
}

export function PickemClient() {
  const sid = useSessionId();
  const { data: matchData } = useSWR<Sourced<Match[]>>("/api/matches", jsonFetcher);
  const [name, setName] = useState("");
  const [champion, setChampion] = useState("");
  const [picks, setPicks] = useState<Record<string, { h: string; a: string }>>({});
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [score, setScore] = useState<ScoreInfo | null>(null);
  const [board, setBoard] = useState<LeaderRow[]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const loadBoard = useCallback(async () => {
    try {
      const r = await fetch("/api/leaderboard").then((x) => x.json());
      setBoard(r.rows ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!sid) return;
    fetch(`/api/predictions?sessionId=${sid}`)
      .then((r) => r.json())
      .then((d) => {
        setEnabled(!!d.enabled);
        if (d.name) setName(d.name);
        if (d.champion) setChampion(d.champion);
        if (d.picks) {
          const next: Record<string, { h: string; a: string }> = {};
          for (const [mid, v] of Object.entries(d.picks as Record<string, string>)) {
            const [h, a] = String(v).split(":");
            next[mid] = { h: h ?? "", a: a ?? "" };
          }
          setPicks(next);
        }
        if (d.score) setScore(d.score);
      })
      .catch(() => setEnabled(false));
    loadBoard();
  }, [sid, loadBoard]);

  const setPick = (id: string, side: "h" | "a", value: string) => {
    const v = value.replace(/[^0-9]/g, "").slice(0, 2);
    setPicks((p) => ({ ...p, [id]: { ...(p[id] ?? { h: "", a: "" }), [side]: v } }));
  };

  const save = async () => {
    if (!sid) return;
    setStatus("saving");
    const flat: Record<string, string> = {};
    for (const [id, v] of Object.entries(picks)) {
      if (v.h !== "" && v.a !== "") flat[id] = `${v.h}:${v.a}`;
    }
    try {
      const r = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid, name: name || "Anonymous", champion, picks: flat }),
      }).then((x) => x.json());
      if (r.ok) {
        setStatus("saved");
        const me = await fetch(`/api/predictions?sessionId=${sid}`).then((x) => x.json());
        if (me.score) setScore(me.score);
        loadBoard();
        setTimeout(() => setStatus("idle"), 2000);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (enabled === false) {
    return (
      <div className="rounded-xl border border-dashed border-edge px-4 py-8 text-center text-sm text-dim">
        Predictions need a configured Upstash Redis store (the same one that powers live viewer counts). Add{" "}
        <code className="text-ink">UPSTASH_REDIS_REST_URL</code> / <code className="text-ink">_TOKEN</code> — see the
        README.
      </div>
    );
  }

  const matches = matchData?.data ?? [];
  const upcoming = matches
    .filter((m) => statusKind(m.status) === "upcoming" && m.homeTeam?.code && m.awayTeam?.code)
    .sort((a, b) => +new Date(a.utcDate) - +new Date(b.utcDate))
    .slice(0, 24);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="flex flex-col gap-1 text-xs text-dim">
          Display name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={40}
            className="rounded-lg border border-edge bg-panel2 px-3 py-2 text-sm text-ink"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-dim">
          Champion pick (+25 pts)
          <select
            value={champion}
            onChange={(e) => setChampion(e.target.value)}
            className="rounded-lg border border-edge bg-panel2 px-3 py-2 text-sm"
          >
            <option value="">Pick a winner…</option>
            {SORTED_TEAMS.map((t) => (
              <option key={t.code} value={t.code}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={save}
          disabled={status === "saving"}
          className="rounded-full border border-gold/50 bg-gold/10 px-6 py-2 text-sm font-semibold text-gold disabled:opacity-50"
        >
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : "Save picks"}
        </button>
      </div>

      {score ? (
        <div className="flex flex-wrap gap-4 rounded-xl border border-edge bg-panel px-4 py-3 text-sm">
          <span className="font-display text-2xl font-bold text-gold">{score.points} pts</span>
          <span className="text-dim">
            {score.exact} exact · {score.correct} correct{score.championHit ? " · 🏆 champion hit!" : ""}
          </span>
        </div>
      ) : null}

      <div>
        <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-widest text-dim">Upcoming matches</h2>
        {upcoming.length ? (
          <ul className="flex flex-col gap-1.5">
            {upcoming.map((m) => {
              const p = picks[m.id] ?? { h: "", a: "" };
              return (
                <li key={m.id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-lg border border-edge bg-panel px-3 py-2">
                  <span className="flex min-w-0 items-center justify-end gap-2 text-sm">
                    <span className="truncate">{m.homeTeam?.name}</span>
                    <Flag code={m.homeTeam?.code} name={m.homeTeam?.name} width={20} />
                  </span>
                  <span className="flex items-center gap-1">
                    <input
                      inputMode="numeric"
                      value={p.h}
                      onChange={(e) => setPick(m.id, "h", e.target.value)}
                      aria-label={`${m.homeTeam?.name} goals`}
                      className="w-9 rounded border border-edge bg-panel2 px-1 py-1 text-center text-sm"
                    />
                    <span className="text-dim">–</span>
                    <input
                      inputMode="numeric"
                      value={p.a}
                      onChange={(e) => setPick(m.id, "a", e.target.value)}
                      aria-label={`${m.awayTeam?.name} goals`}
                      className="w-9 rounded border border-edge bg-panel2 px-1 py-1 text-center text-sm"
                    />
                  </span>
                  <span className="flex min-w-0 items-center gap-2 text-sm">
                    <Flag code={m.awayTeam?.code} name={m.awayTeam?.name} width={20} />
                    <span className="truncate">{m.awayTeam?.name}</span>
                  </span>
                  <span className="col-span-3 text-center text-[10px] text-dim">
                    <LocalTime iso={m.utcDate} style="weekday" />
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-edge px-4 py-6 text-center text-xs text-dim">
            No upcoming fixtures to predict right now.
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-widest text-dim">🏆 Leaderboard</h2>
        {board.length ? (
          <ol className="flex flex-col">
            {board.map((r, i) => (
              <li
                key={r.sessionId}
                className="flex items-center gap-3 border-t border-edge/50 py-2 text-sm first:border-t-0"
              >
                <span className="w-6 text-right font-mono text-dim">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate">
                  {r.name}
                  {r.championHit ? " 🏆" : r.champion ? <span className="text-dim"> · {r.champion}</span> : null}
                </span>
                <span className="font-mono text-xs text-dim">{r.exact} exact</span>
                <span className="font-mono font-semibold text-gold">{r.points}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-lg border border-dashed border-edge px-4 py-6 text-center text-xs text-dim">
            No predictions yet — be the first to save picks.
          </p>
        )}
      </div>

      <p className="text-[10px] text-dim">
        Scoring: 5 pts exact score · 3 correct result + goal difference · 2 correct result · +25 if your champion wins it
        all. Picks are tied to this browser.
      </p>
    </div>
  );
}
