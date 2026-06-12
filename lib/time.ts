// Timezone utilities (no external dependency).
// worldcup26.ir reports kickoff times in *stadium-local* time; each stadium in
// data/stadiums.json carries its IANA timezone so we can convert to UTC.

const dtfCache = new Map<string, Intl.DateTimeFormat>();

function tzFormatter(tz: string): Intl.DateTimeFormat {
  let f = dtfCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    dtfCache.set(tz, f);
  }
  return f;
}

/** The wall-clock time (as a UTC-interpreted ms value) shown in `tz` at instant `ts`. */
function wallTimeAt(ts: number, tz: string): number {
  const parts: Record<string, string> = {};
  for (const p of tzFormatter(tz).formatToParts(ts)) parts[p.type] = p.value;
  return Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    parts.hour === "24" ? 0 : Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
}

/** Convert a wall-clock time in `tz` to a UTC Date (iterative offset solve, DST-safe). */
export function zonedTimeToUtc(
  year: number,
  month: number, // 1-12
  day: number,
  hour: number,
  minute: number,
  tz: string,
): Date {
  const desired = Date.UTC(year, month - 1, day, hour, minute, 0);
  let guess = desired;
  for (let i = 0; i < 3; i++) {
    const diff = desired - wallTimeAt(guess, tz);
    if (diff === 0) break;
    guess += diff;
  }
  return new Date(guess);
}

/** Parse worldcup26.ir "MM/DD/YYYY HH:mm" stadium-local stamps into UTC ISO. */
export function localStampToUtcIso(stamp: string, tz: string): string | null {
  const m = stamp.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const [, mo, d, y, h, mi] = m.map(Number);
  return zonedTimeToUtc(y, mo, d, h, mi, tz).toISOString();
}

/** YYYY-MM-DD of an instant in a given timezone (used for Polymarket slugs). */
export function dateStringInTz(iso: string | Date, tz: string): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function addDays(yyyyMmDd: string, days: number): string {
  const d = new Date(`${yyyyMmDd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
