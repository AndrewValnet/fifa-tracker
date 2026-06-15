"use client";

import useSWR from "swr";
import { jsonFetcher } from "@/hooks/fetcher";
import type { MatchWeather } from "@/lib/weather";

export function WeatherWidget({ stadiumId, utcDate }: { stadiumId: string; utcDate: string }) {
  const { data } = useSWR<{ weather: MatchWeather | null }>(
    `/api/weather/${stadiumId}?date=${encodeURIComponent(utcDate)}`,
    jsonFetcher,
    { refreshInterval: 30 * 60_000, revalidateOnFocus: false },
  );
  const w = data?.weather;
  if (!w) return null;
  return (
    <p
      className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-xs text-dim"
      title={`${w.description} · ${w.windKph} km/h wind at kickoff`}
    >
      <span aria-hidden>{w.icon}</span>
      <span>{w.tempC}°C / {w.tempF}°F</span>
      <span className="text-edge/60">·</span>
      <span>{w.description}</span>
      {w.precipProbPct > 15 ? (
        <>
          <span className="text-edge/60">·</span>
          <span>🌧️ {w.precipProbPct}% rain</span>
        </>
      ) : null}
      {w.windKph > 25 ? (
        <>
          <span className="text-edge/60">·</span>
          <span>💨 {w.windKph} km/h</span>
        </>
      ) : null}
    </p>
  );
}
