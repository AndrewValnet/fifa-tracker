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
      className="match-card-hover surface-card group flex h-full flex-col overflow-hidden rounded-2xl"
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
          className="flex h-24 items-center justify-center gap-3 overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--pitch) 70%, #0a0e1a), color-mix(in srgb, var(--gold) 52%, #0a0e1a))",
          }}
        >
          <span className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/10 font-display text-sm font-bold text-white/80">
            26
          </span>
          <span className="font-display text-sm font-bold uppercase tracking-[0.2em] text-white/70">WC 2026</span>
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-[11px] text-dim">
          <span className="font-semibold text-pitch">{article.source}</span>
          {" - "}
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
