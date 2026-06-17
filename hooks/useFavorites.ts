"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "wc26-favorites";

export function useFavorites(): {
  favorites: string[];
  toggle: (code: string) => void;
  isFavorite: (code: string) => boolean;
  clear: () => void;
} {
  const [favorites, setFavorites] = useState<string[]>([]);

  // SSR-safe: read from localStorage only after mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
        }
      }
    } catch {
      // localStorage unavailable or corrupt — start empty
    }
  }, []);

  // Persist to localStorage whenever favorites change (skip initial empty state)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // Storage write failed — ignore silently
    }
  }, [favorites]);

  const toggle = useCallback((code: string) => {
    setFavorites((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }, []);

  const isFavorite = useCallback(
    (code: string) => favorites.includes(code),
    [favorites]
  );

  const clear = useCallback(() => {
    setFavorites([]);
  }, []);

  return { favorites, toggle, isFavorite, clear };
}
