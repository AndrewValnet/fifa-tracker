"use client";

// Per-match headlines (PRD §7.2): 3–5 articles filtered by the two teams.

import { EmptyState } from "@/components/EmptyState";
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
    return (
      <EmptyState
        title="No recent headlines for this matchup yet."
        description="Fresh articles will appear once GNews has team-specific coverage."
      />
    );
  }
  return (
    <div className="grid gap-3">
      {articles.map((a) => (
        <NewsCard key={a.url + a.title} article={a} />
      ))}
    </div>
  );
}
