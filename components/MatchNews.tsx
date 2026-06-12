"use client";

// Per-match headlines (PRD §7.2): 3–5 articles filtered by the two teams.

import { NewsCard } from "@/components/NewsCard";
import { useNews } from "@/hooks/useNews";

export function MatchNews({ home, away }: { home: string | null; away: string | null }) {
  const { articles, isLoading } = useNews({ home, away, max: 5 });

  if (isLoading && !articles.length) {
    return (
      <div className="flex flex-col gap-3" aria-busy>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-20" />
        ))}
      </div>
    );
  }
  if (!articles.length) {
    return <p className="py-4 text-center text-sm text-dim">No recent headlines for this matchup.</p>;
  }
  return (
    <div className="grid gap-3">
      {articles.map((a) => (
        <NewsCard key={a.url + a.title} article={a} />
      ))}
    </div>
  );
}
