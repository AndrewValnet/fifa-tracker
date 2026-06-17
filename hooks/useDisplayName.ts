"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { jsonFetcher } from "@/hooks/fetcher";

const LS_KEY = "wc26-display-name";

interface PredictionsPayload {
  user: { name: string } | null;
}

/** Returns the user's saved display name + a setter.
 *  Priority: logged-in pool account name → localStorage → null (not set yet). */
export function useDisplayName(): {
  name: string | null;
  source: "pool" | "local" | null;
  setLocalName: (n: string) => void;
} {
  const { data } = useSWR<PredictionsPayload>("/api/predictions", jsonFetcher);
  const [localName, setLocalNameState] = useState<string | null>(null);

  // Read localStorage once on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) setLocalNameState(stored);
    } catch {
      // localStorage unavailable (SSR guard)
    }
  }, []);

  function setLocalName(n: string) {
    const trimmed = n.trim().slice(0, 30);
    setLocalNameState(trimmed);
    try {
      localStorage.setItem(LS_KEY, trimmed);
    } catch {
      // ignore
    }
  }

  const poolName = data?.user?.name ?? null;

  if (poolName) return { name: poolName, source: "pool", setLocalName };
  if (localName) return { name: localName, source: "local", setLocalName };
  return { name: null, source: null, setLocalName };
}
