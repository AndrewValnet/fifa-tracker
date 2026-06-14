"use client";

// Warm DNS/TLS to the runtime image CDNs and API hosts so the first flag/
// headshot/stadium image and odds/stats calls don't pay a cold handshake.
// Uses the React 18.3+ resource-hint APIs; no-ops on older react-dom.
// (next/font self-hosts the site fonts, so Google origins are intentionally absent.)

import ReactDOM from "react-dom";

const PRECONNECT = ["https://flagcdn.com", "https://a.espncdn.com", "https://upload.wikimedia.org"];
const DNS_PREFETCH = ["https://gamma-api.polymarket.com", "https://site.api.espn.com", "https://clob.polymarket.com"];

export function ResourceHints() {
  const rd = ReactDOM as unknown as {
    preconnect?: (href: string, options?: { crossOrigin?: string }) => void;
    prefetchDNS?: (href: string) => void;
  };
  if (typeof rd.preconnect === "function") {
    for (const href of PRECONNECT) rd.preconnect(href, { crossOrigin: "anonymous" });
  }
  if (typeof rd.prefetchDNS === "function") {
    for (const href of DNS_PREFETCH) rd.prefetchDNS(href);
  }
  return null;
}
