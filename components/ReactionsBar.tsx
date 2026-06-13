"use client";

// Live emoji reactions per match (Upstash counters). Polls every 8s, optimistic
// on click, lightly throttled. Hides itself when Upstash isn't configured.

import { useRef, useState } from "react";
import useSWR from "swr";
import { jsonFetcher } from "@/hooks/fetcher";

const EMOJIS = ["⚽", "🔥", "😱", "👏", "😤", "🥶"];

export function ReactionsBar({ matchId }: { matchId: string }) {
  const { data, mutate } = useSWR<{ enabled: boolean; counts: Record<string, number> }>(
    `/api/reactions/${matchId}`,
    jsonFetcher,
    { refreshInterval: 8000 },
  );
  const [local, setLocal] = useState<Record<string, number>>({});
  const clicks = useRef<number[]>([]);

  if (data && data.enabled === false) return null;
  const counts = data?.counts ?? {};

  const react = async (emoji: string) => {
    const now = Date.now();
    clicks.current = clicks.current.filter((t) => now - t < 20_000);
    if (clicks.current.length >= 8) return; // throttle bursts
    clicks.current.push(now);
    setLocal((l) => ({ ...l, [emoji]: (l[emoji] ?? 0) + 1 }));
    try {
      const r = await fetch(`/api/reactions/${matchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      }).then((x) => x.json());
      if (r?.counts) {
        mutate({ enabled: true, counts: r.counts }, { revalidate: false });
        setLocal({});
      }
    } catch {
      /* keep optimistic value */
    }
  };

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
      <span className="text-[11px] uppercase tracking-widest text-dim">React</span>
      {EMOJIS.map((e) => {
        const n = (counts[e] ?? 0) + (local[e] ?? 0);
        return (
          <button
            key={e}
            type="button"
            onClick={() => react(e)}
            className="flex items-center gap-1 rounded-full border border-edge bg-panel px-3 py-1.5 text-sm transition-colors hover:border-gold/50"
            aria-label={`React ${e}`}
          >
            <span aria-hidden>{e}</span>
            {n > 0 ? <span className="font-mono text-xs tabular-nums text-dim">{n}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
