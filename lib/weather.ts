import { cached, fetchWithTimeout } from "@/lib/cache";

export interface MatchWeather {
  tempC: number;
  tempF: number;
  precipProbPct: number;
  windKph: number;
  wmoCode: number;
  description: string;
  icon: string;
}

function wmoDescription(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code <= 48) return "Foggy";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  return "Thunderstorm";
}

function wmoIcon(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 2) return "🌤️";
  if (code === 3) return "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌦️";
  return "⛈️";
}

export async function getWeatherForKickoff(
  lat: number,
  lng: number,
  utcIso: string,
): Promise<MatchWeather | null> {
  const cacheKey = `weather:${lat.toFixed(2)},${lng.toFixed(2)}`;
  return cached(cacheKey, 30 * 60_000, async () => {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&hourly=temperature_2m,precipitation_probability,weathercode,windspeed_10m` +
      `&timezone=auto&forecast_days=4`;
    const res = await fetchWithTimeout(url, {}, 8000);
    if (!res.ok) throw new Error(`open-meteo ${res.status}`);
    const data = (await res.json()) as {
      hourly: {
        time: string[];
        temperature_2m: number[];
        precipitation_probability: number[];
        weathercode: number[];
        windspeed_10m: number[];
      };
    };
    const { time, temperature_2m, precipitation_probability, weathercode, windspeed_10m } =
      data.hourly;
    const kickoffMs = new Date(utcIso).getTime();
    let bestIdx = 0;
    let bestDiff = Infinity;
    time.forEach((t, i) => {
      const diff = Math.abs(new Date(t).getTime() - kickoffMs);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = i;
      }
    });
    const tempC = Math.round(temperature_2m[bestIdx] ?? 20);
    const code = weathercode[bestIdx] ?? 0;
    return {
      tempC,
      tempF: Math.round(tempC * 9 / 5 + 32),
      precipProbPct: precipitation_probability[bestIdx] ?? 0,
      windKph: Math.round(windspeed_10m[bestIdx] ?? 0),
      wmoCode: code,
      description: wmoDescription(code),
      icon: wmoIcon(code),
    };
  });
}
