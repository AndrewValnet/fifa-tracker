"use client";

// Client-loaded Title Race so the Polymarket fetch never blocks the home render.

import useSWR from "swr";
import { FavoritesRanking } from "@/components/FavoritesRanking";
import { jsonFetcher } from "@/hooks/fetcher";
import type { Favorite } from "@/lib/types";

export function FavoritesPanel() {
  const { data } = useSWR<{ favorites: Favorite[] }>("/api/favorites", jsonFetcher, {
    revalidateOnFocus: false,
  });
  if (!data) return <div className="skeleton h-72 w-full" aria-hidden />;
  return <FavoritesRanking favorites={data.favorites} />;
}
