"use client";

import { useEffect, useState } from "react";

/**
 * True after hydration. Used to gate locale/timezone-dependent rendering
 * (kickoff times, countdowns) so server and client markup never diverge.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
