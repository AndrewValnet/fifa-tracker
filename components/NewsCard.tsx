"use client";

import { useState } from "react";
import { timeAgo } from "@/lib/format";
import type { NewsArticle } from "@/lib/types";

export function NewsCard({ article }: { article: NewsArticle }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="match-card-hover group flex h-full flex-col overflow-hidden rounded-xl border border-edge bg-panel"
    >
      {article.image && !imgFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.image}
          alt=""
          width={640}
          height={360}
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
          className="h-36 w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
        />
      ) : (
        <div
          aria-hidden
          className="flex h-24 items-center justify-center gap-2 overflow-hidden"
          style={{ background: "linear-gradient(135deg, var(--color-pitch) 0%, color-mix(in srgb, var(--color-pitch) 60%, #0a0e1a) 100%)" }}
        >
          <span className="text-3xl opacity-70">⚽</span>
          <span className="font-display text-sm font-bold uppercase tracking-[0.2em] text-white/60">WC 2026</span>
          <span className="text-3xl opacity-70">🏆</span>
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-[11px] text-dim">
          <span className="font-semibold text-pitch">{article.source}</span>
          {" · "}
          {timeAgo(article.publishedAt)}
        </p>
        <h3 className="line-clamp-3 text-sm font-semibold leading-snug group-hover:text-gold">
          {article.title}
        </h3>
        {article.description ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-dim">{article.description}</p>
        ) : null}
      </div>
    </a>
  );
}
