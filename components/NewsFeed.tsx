"use client";

// Breaking-news feed (PRD §7.1): card grid, tag filter, 10-minute refresh.

import { useMemo, useState } from "react";
import clsx from "clsx";
import { NewsCard } from "@/components/NewsCard";
import { SectionHeader } from "@/components/SectionHeader";
import { useNews } from "@/hooks/useNews";
import type { NewsArticle } from "@/lib/types";

const TAGS = ["All", "Group Stage", "Knockout", "Upsets"] as const;
type Tag = (typeof TAGS)[number];

const TAG_PATTERNS: Record<Exclude<Tag, "All">, RegExp> = {
  "Group Stage": /\bgroup\b|\bgroup stage\b/i,
  Knockout: /knockout|round of 32|round of 16|quarter|semi|final/i,
  Upsets: /upset|shock|stun|surprise|sensation/i,
};

function matchesTag(a: NewsArticle, tag: Tag): boolean {
  if (tag === "All") return true;
  const text = `${a.title} ${a.description ?? ""}`;
  return TAG_PATTERNS[tag].test(text);
}

export function NewsFeed() {
  const { articles, demo, isLoading } = useNews({ max: 12 });
  const [tag, setTag] = useState<Tag>("All");

  const filtered = useMemo(() => articles.filter((a) => matchesTag(a, tag)), [articles, tag]);

  return (
    <section aria-label="Breaking news">
      <SectionHeader
        title="Breaking News"
        right={demo ? <span className="text-gold">offline digest — add a GNews key for live headlines</span> : "refreshes every 10 min"}
      />

      <div role="tablist" aria-label="News filter" className="mb-4 flex flex-wrap gap-2">
        {TAGS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tag === t}
            onClick={() => setTag(t)}
            className={clsx(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              tag === t
                ? "border-pitch/60 bg-pitch/15 font-semibold text-pitch"
                : "border-edge text-dim hover:border-pitch/40 hover:text-ink",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading && !articles.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-48" />
          ))}
        </div>
      ) : filtered.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((a) => (
            <NewsCard key={a.url + a.title} article={a} />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-edge px-4 py-8 text-center text-sm text-dim">
          No “{tag}” headlines right now.
        </p>
      )}
    </section>
  );
}
