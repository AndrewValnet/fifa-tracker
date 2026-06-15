"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { jsonFetcher } from "@/hooks/fetcher";

interface VoteResult {
  matchId: string;
  results: { name: string; count: number }[];
  total: number;
}

interface Props {
  matchId: string;
  players: string[];  // list of player names (both teams)
}

export function FanMotmVote({ matchId, players }: Props) {
  const url = `/api/motm-vote/${matchId}`;
  const { data } = useSWR<VoteResult>(url, jsonFetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: false,
  });

  const [voted, setVoted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>("");

  async function submitVote() {
    if (!selected) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player: selected }),
      });
      if (res.status === 409) {
        setVoted(true); // already voted
        return;
      }
      if (!res.ok) throw new Error("Vote failed");
      setVoted(true);
      mutate(url);
    } catch {
      setError("Could not submit vote. Try again.");
    } finally {
      setPending(false);
    }
  }

  const results = data?.results ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="rounded-xl border border-edge bg-panel p-4">
      <h3 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-dim">
        Fan Vote · Man of the Match
      </h3>

      {!voted ? (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
            {players.map((p) => (
              <button
                key={p}
                onClick={() => setSelected(p)}
                className={`rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors ${
                  selected === p
                    ? "border-gold bg-gold/10 text-gold font-semibold"
                    : "border-edge bg-surface text-dim hover:border-gold/30 hover:text-white"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={submitVote}
            disabled={!selected || pending}
            className="mt-1 rounded-lg bg-pitch px-4 py-2 text-sm font-semibold text-black transition-opacity disabled:opacity-40"
          >
            {pending ? "Voting…" : "Cast Vote"}
          </button>
          {error && <p className="text-xs text-live">{error}</p>}
        </div>
      ) : (
        <div>
          <p className="mb-2 text-xs text-pitch font-semibold">Thanks for voting!</p>
          {results.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {results.slice(0, 5).map((r) => {
                const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
                return (
                  <li key={r.name} className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">{r.name}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-20 h-1.5 overflow-hidden rounded-full bg-edge/30">
                        <div
                          className="h-full rounded-full bg-pitch transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right font-mono text-[10px] text-dim">{pct}%</span>
                    </div>
                  </li>
                );
              })}
              <p className="text-[10px] text-dim">{total} vote{total !== 1 ? "s" : ""} cast</p>
            </ul>
          ) : (
            <p className="text-xs text-dim">No votes yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
