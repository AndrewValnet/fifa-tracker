"use client";

// Stable per-browser id (shared with presence) for predictions & reactions.

import { useEffect, useState } from "react";

const KEY = "wc26-sid";

export function getSessionId(): string {
  try {
    let v = localStorage.getItem(KEY);
    if (!v) {
      v = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      localStorage.setItem(KEY, v);
    }
    return v;
  } catch {
    return "";
  }
}

export function useSessionId(): string {
  const [id, setId] = useState("");
  useEffect(() => setId(getSessionId()), []);
  return id;
}
