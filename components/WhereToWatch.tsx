"use client";

// Where-to-watch guide: broadcaster/streaming options by country, defaulting to
// the viewer's likely region (from their locale) with a picker to switch.

import { useEffect, useState } from "react";
import broadcastersData from "@/data/broadcasters.json";

interface Broadcaster {
  name: string;
  kind: "tv" | "stream" | "both";
  free: boolean;
  language: string;
  url: string;
}
interface CountryEntry {
  country: string;
  countryCode: string;
  broadcasters: Broadcaster[];
}

const COUNTRIES = broadcastersData as CountryEntry[];

function detectCountry(): string {
  try {
    const region = new Intl.Locale(navigator.language).region?.toLowerCase();
    if (region && COUNTRIES.some((c) => c.countryCode === region)) return region;
  } catch {
    /* ignore */
  }
  return "us";
}

const KIND_ICON: Record<string, string> = { tv: "📺", stream: "📱", both: "📺" };

export function WhereToWatch() {
  const [code, setCode] = useState<string>("us");
  useEffect(() => setCode(detectCountry()), []);

  const entry = COUNTRIES.find((c) => c.countryCode === code) ?? COUNTRIES[0];

  return (
    <div className="flex flex-col gap-3">
      <select
        value={code}
        onChange={(e) => setCode(e.target.value)}
        aria-label="Your country"
        className="rounded-lg border border-edge bg-panel2 px-3 py-1.5 text-sm"
      >
        {COUNTRIES.map((c) => (
          <option key={c.countryCode} value={c.countryCode}>
            {c.country}
          </option>
        ))}
      </select>

      <ul className="flex flex-col gap-1.5">
        {entry.broadcasters.map((b) => (
          <li key={b.name} className="flex items-center gap-2 text-sm">
            <span aria-hidden>{KIND_ICON[b.kind]}</span>
            <a
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 flex-1 truncate hover:text-gold"
            >
              {b.name}
            </a>
            <span className="shrink-0 text-[10px] text-dim">{b.language}</span>
            <span
              className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                b.free ? "bg-pitch/15 text-pitch" : "border border-edge text-dim"
              }`}
            >
              {b.free ? "Free" : "Paid"}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-dim">
        Rights by market (FOX + Telemundo in the US). Availability/blackouts vary; check your provider.
      </p>
    </div>
  );
}
