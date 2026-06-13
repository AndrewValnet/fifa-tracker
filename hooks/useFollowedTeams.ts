"use client";

// Followed teams, persisted in localStorage and synced across components in the
// same tab via a custom event (plus cross-tab via the native storage event).
// No backend needed — personalization works with zero infra.

import { useCallback, useEffect, useState } from "react";

const KEY = "wc26-followed";
const EVENT = "wc26-followed-change";

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function write(codes: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(codes));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* ignore quota/availability */
  }
}

export function useFollowedTeams() {
  const [followed, setFollowed] = useState<string[]>([]);

  useEffect(() => {
    setFollowed(read());
    const sync = () => setFollowed(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((code: string) => {
    const cur = read();
    const next = cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code];
    write(next);
    setFollowed(next);
  }, []);

  const isFollowed = useCallback((code: string) => followed.includes(code), [followed]);

  return { followed, toggle, isFollowed };
}
