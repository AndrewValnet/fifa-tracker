import type { Metadata } from "next";
import Link from "next/link";
import { usageSnapshot } from "@/lib/cache";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Usage Admin",
  description: "API usage, cache health, and quota warnings for WC26 Live.",
};

type Usage = Awaited<ReturnType<typeof usageSnapshot>>;

function envNumber(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function localAttempts(usage: Usage, provider: string): number {
  return usage.upstream?.[provider]?.attempts ?? 0;
}

function remoteValue(usage: Usage, key: string): number | null {
  const value = usage.remoteDaily?.[key];
  return typeof value === "number" ? value : null;
}

function providerAttempts(usage: Usage, provider: string): number {
  return remoteValue(usage, `upstream:${provider}:attempts`) ?? localAttempts(usage, provider);
}

function sumRemoteCache(usage: Usage, field: string): number {
  let total = 0;
  for (const [key, value] of Object.entries(usage.remoteDaily ?? {})) {
    if (key.startsWith("cache:") && key.endsWith(`:${field}`)) total += value;
  }
  return total;
}

function sumLocalCache(usage: Usage, field: keyof Usage["cache"][string]): number {
  return Object.values(usage.cache ?? {}).reduce((sum, row) => sum + (row[field] ?? 0), 0);
}

function pct(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "n/a";
  return `${Math.round(value * 100)}%`;
}

function number(value: number): string {
  return value.toLocaleString("en-US");
}

function warningLevel(used: number, limit: number): "ok" | "warn" | "danger" {
  if (!limit) return "ok";
  const ratio = used / limit;
  if (ratio >= 0.9) return "danger";
  if (ratio >= 0.7) return "warn";
  return "ok";
}

function MetricCard({
  label,
  value,
  detail,
  tone = "normal",
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "normal" | "warn" | "danger" | "good";
}) {
  const toneClass =
    tone === "danger"
      ? "border-live/60 bg-live/10"
      : tone === "warn"
        ? "border-gold/60 bg-gold/10"
        : tone === "good"
          ? "border-pitch/60 bg-pitch/10"
          : "border-edge bg-panel";

  return (
    <section className={`rounded-lg border p-4 ${toneClass}`}>
      <p className="text-[11px] uppercase tracking-wider text-dim">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold text-ink">{value}</p>
      {detail ? <p className="mt-1 text-xs leading-relaxed text-dim">{detail}</p> : null}
    </section>
  );
}

function WarningList({ warnings }: { warnings: string[] }) {
  if (!warnings.length) {
    return (
      <section className="rounded-lg border border-pitch/50 bg-pitch/10 px-4 py-3 text-sm text-pitch">
        No quota or cache warnings right now.
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-gold/50 bg-gold/10 px-4 py-3">
      <h2 className="font-display text-lg font-semibold uppercase tracking-wider text-gold">Warnings</h2>
      <ul className="mt-2 grid gap-1.5 text-sm text-ink">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </section>
  );
}

export default async function UsageAdminPage() {
  const usage = await usageSnapshot();
  const fdLimit = envNumber("FOOTBALL_DATA_DAILY_LIMIT", 100);
  const espnLimit = envNumber("ESPN_DAILY_SOFT_LIMIT", 500);

  const footballDataCalls = providerAttempts(usage, "football-data");
  const espnCalls = providerAttempts(usage, "espn");
  const redisHits = sumRemoteCache(usage, "remoteHits") + sumRemoteCache(usage, "remoteStaleHits");
  const redisMisses = sumRemoteCache(usage, "remoteMisses");
  const localRedisHits = sumLocalCache(usage, "remoteHits") + sumLocalCache(usage, "remoteStaleHits");
  const localRedisMisses = sumLocalCache(usage, "remoteMisses");
  const effectiveHits = redisHits || localRedisHits;
  const effectiveMisses = redisMisses || localRedisMisses;
  const redisTotal = effectiveHits + effectiveMisses;
  const redisHitRate = redisTotal ? effectiveHits / redisTotal : null;
  const largePayloadSkips = sumRemoteCache(usage, "remoteWriteSkips") || sumLocalCache(usage, "remoteWriteSkips");
  const fdTone = warningLevel(footballDataCalls, fdLimit);
  const espnTone = warningLevel(espnCalls, espnLimit);

  const warnings: string[] = [];
  if (!usage.remoteCacheEnabled) warnings.push("Redis cache is disabled in this environment.");
  if (fdTone === "danger") warnings.push(`football-data is above 90% of the configured daily limit (${fdLimit}).`);
  else if (fdTone === "warn") warnings.push(`football-data is above 70% of the configured daily limit (${fdLimit}).`);
  if (espnTone === "danger") warnings.push(`ESPN is above 90% of the configured soft daily limit (${espnLimit}).`);
  else if (espnTone === "warn") warnings.push(`ESPN is above 70% of the configured soft daily limit (${espnLimit}).`);
  if (largePayloadSkips > 0) warnings.push(`${number(largePayloadSkips)} cache payloads were skipped because they were too large.`);
  if (redisTotal >= 10 && redisHitRate !== null && redisHitRate < 0.5) warnings.push("Redis cache hit rate is below 50% today.");

  return (
    <main className="mx-auto max-w-shell px-4 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/" className="text-xs text-dim hover:text-ink">
            Back to War Room
          </Link>
          <h1 className="mt-2 font-display text-2xl font-bold uppercase tracking-wide md:text-3xl">
            Usage <span className="text-pitch">Admin</span>
          </h1>
          <p className="mt-1 text-sm text-dim">
            Daily API calls, Redis cache health, and payload warnings. Remote counters reset by UTC date.
          </p>
        </div>
        <a href="/api/usage" className="rounded-full border border-edge bg-panel px-3 py-1.5 text-xs text-dim hover:text-ink">
          Raw JSON
        </a>
      </div>

      <WarningList warnings={warnings} />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="football-data calls today"
          value={number(footballDataCalls)}
          detail={`${number(fdLimit)} configured daily limit`}
          tone={fdTone === "danger" ? "danger" : fdTone === "warn" ? "warn" : "normal"}
        />
        <MetricCard
          label="ESPN calls today"
          value={number(espnCalls)}
          detail={`${number(espnLimit)} configured soft limit`}
          tone={espnTone === "danger" ? "danger" : espnTone === "warn" ? "warn" : "normal"}
        />
        <MetricCard
          label="Redis hit rate"
          value={pct(redisHitRate)}
          detail={`${number(effectiveHits)} hits / ${number(effectiveMisses)} misses`}
          tone={redisHitRate !== null && redisHitRate >= 0.7 ? "good" : redisHitRate !== null && redisHitRate < 0.5 ? "warn" : "normal"}
        />
        <MetricCard
          label="Large payload skips"
          value={number(largePayloadSkips)}
          detail={`Remote cache cap: ${number(usage.maxRemotePayloadBytes)} bytes`}
          tone={largePayloadSkips > 0 ? "warn" : "normal"}
        />
      </div>

      <section className="mt-6 rounded-lg border border-edge bg-panel p-4">
        <h2 className="font-display text-lg font-semibold uppercase tracking-wider">Cache Status</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-dim">Redis</dt>
            <dd className={usage.remoteCacheEnabled ? "font-semibold text-pitch" : "font-semibold text-live"}>
              {usage.remoteCacheEnabled ? "Enabled" : "Disabled"}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-dim">Warm cache entries</dt>
            <dd className="font-mono">{number(usage.cacheStoreSize)}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-dim">In-flight requests</dt>
            <dd className="font-mono">{number(usage.inFlight)}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-dim">FD tokens last minute</dt>
            <dd className="font-mono">
              {number(usage.footballDataTokensLastMinute)} / {number(usage.footballDataTokenBudgetPerMinute)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-edge bg-panel">
        <div className="border-b border-edge px-4 py-3">
          <h2 className="font-display text-lg font-semibold uppercase tracking-wider">Cache Breakdown</h2>
          <p className="text-xs text-dim">Warm-instance counters plus Redis daily counters where available.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-left text-sm">
            <thead className="bg-panel2 text-[11px] uppercase tracking-wider text-dim">
              <tr>
                <th className="px-3 py-2">Namespace</th>
                <th className="px-3 py-2">Memory hits</th>
                <th className="px-3 py-2">Remote hits</th>
                <th className="px-3 py-2">Remote misses</th>
                <th className="px-3 py-2">Write skips</th>
                <th className="px-3 py-2">Refresh errors</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(usage.cache ?? {}).length ? (
                Object.entries(usage.cache).map(([namespace, row]) => (
                  <tr key={namespace} className="border-t border-edge/50">
                    <td className="px-3 py-2 font-semibold">{namespace}</td>
                    <td className="px-3 py-2 font-mono">{number(row.memoryHits)}</td>
                    <td className="px-3 py-2 font-mono">{number(row.remoteHits + row.remoteStaleHits)}</td>
                    <td className="px-3 py-2 font-mono">{number(row.remoteMisses)}</td>
                    <td className="px-3 py-2 font-mono">{number(row.remoteWriteSkips)}</td>
                    <td className="px-3 py-2 font-mono">{number(row.refreshErrors)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-3 py-6 text-center text-dim" colSpan={6}>
                    No warm-instance cache activity recorded on this server yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
