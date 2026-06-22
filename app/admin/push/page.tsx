import Link from "next/link";
import { pushDiagnostics, pushEnabled, pushSubscriptionCount } from "@/lib/push";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${
        ok ? "border-pitch/50 bg-pitch/10 text-pitch" : "border-live/50 bg-live/10 text-live"
      }`}
    >
      {label}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-edge bg-panel px-4 py-3">
      <p className="text-[11px] uppercase tracking-wider text-dim">{label}</p>
      <p className="mt-1 break-words font-mono text-sm text-ink">{value}</p>
    </div>
  );
}

export default async function PushAdminPage() {
  const diag = pushDiagnostics();
  const subs = await pushSubscriptionCount();

  const checklist = [
    { label: "VAPID public key", ok: diag.vapidPublicKeySet },
    { label: "VAPID private key", ok: diag.vapidPrivateKeySet },
    { label: "Upstash Redis", ok: diag.redisEnabled },
    { label: "Push enabled", ok: diag.enabled },
    { label: "Cron route deployed", ok: true },
  ];
  const allReady = checklist.every((item) => item.ok);

  return (
    <main className="mx-auto max-w-shell px-4 py-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <Link href="/" className="text-xs text-dim hover:text-ink">
            Back to War Room
          </Link>
          <h1 className="mt-2 font-display text-2xl font-bold uppercase tracking-wide md:text-3xl">
            Push <span className="text-pitch">Admin</span>
          </h1>
          <p className="mt-1 text-sm text-dim">
            Verify the pieces needed for goal alerts, kickoff reminders, halftime, full-time, and lineup pushes.
          </p>
        </div>
        <Badge ok={pushEnabled()} label={pushEnabled() ? "LIVE" : "DISABLED"} />
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Row label="VAPID public key" value={diag.vapidPublicKeySet ? "Set" : "Missing"} />
        <Row label="VAPID private key" value={diag.vapidPrivateKeySet ? "Set" : "Missing"} />
        <Row label="VAPID subject" value={diag.subject} />
        <Row label="Redis" value={diag.redisEnabled ? "Enabled" : "Missing"} />
        <Row label="Push enabled" value={diag.enabled ? "Yes" : "No"} />
        <Row label="Subscriptions stored" value={subs === null ? "Unavailable" : subs.toLocaleString("en-US")} />
      </section>

      <section className="mt-6 rounded-lg border border-edge bg-panel p-4">
        <h2 className="font-display text-lg font-semibold uppercase tracking-wider">
          {allReady ? "Push is ready" : "What still needs to be true"}
        </h2>
        <ul className="mt-3 grid gap-2 text-sm text-dim">
          {checklist.map((item) => (
            <li key={item.label} className="flex items-center justify-between rounded-md border border-edge/60 px-3 py-2">
              <span>{item.label}</span>
              <Badge ok={item.ok} label={item.ok ? "OK" : "Missing"} />
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-dim">
          {allReady ? (
            <>
              Everything required for push alerts is set. <code>/api/cron/alerts</code> still needs to be called on a schedule
              if you want live alerts to keep flowing.
            </>
          ) : (
            <>
              Alerts fire from <code>/api/cron/alerts</code>. For minute-level live alerts, that route should be called every
              minute by Vercel Cron or an external scheduler.
            </>
          )}
        </p>
      </section>
    </main>
  );
}
