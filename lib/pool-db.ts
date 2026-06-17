import { Pool, type QueryResult, type QueryResultRow } from "pg";

let schemaReady: Promise<void> | null = null;

declare global {
  // eslint-disable-next-line no-var
  var __wcPoolPg: Pool | undefined;
}

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function inferConnectionString(): string | null {
  const explicit =
    env("POSTGRES_URL") ||
    env("POSTGRES_PRISMA_URL") ||
    env("SUPABASE_DB_URL") ||
    (env("DATABASE_URL").startsWith("postgres") ? env("DATABASE_URL") : "");
  if (explicit) return explicit;

  if (env("SUPABASE_INFER_DIRECT_DB") !== "true") return null;

  const projectUrl = env("SUPABASE_URL") || env("NEXT_PUBLIC_SUPABASE_URL") || env("DATABASE_URL");
  const password = env("DATABASE_PASSWORD") || env("SUPABASE_DATABASE_PASSWORD");
  if (!projectUrl || !password) return null;

  try {
    const host = new URL(projectUrl).hostname;
    const ref = host.split(".")[0];
    if (!ref) return null;
    return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
  } catch {
    return null;
  }
}

export function poolDbEnabled(): boolean {
  return Boolean(inferConnectionString());
}

function getPool(): Pool | null {
  const connectionString = inferConnectionString();
  if (!connectionString) return null;
  if (!globalThis.__wcPoolPg) {
    globalThis.__wcPoolPg = new Pool({
      connectionString,
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
      ssl: { rejectUnauthorized: false },
    });
  }
  return globalThis.__wcPoolPg;
}

export async function ensurePoolSchema(): Promise<void> {
  const pool = getPool();
  if (!pool) throw new Error("Prediction database is not configured.");
  if (!schemaReady) {
    schemaReady = pool
      .query(`
        create table if not exists pool_users (
          id text primary key,
          email text not null unique,
          name text not null,
          password_hash text not null,
          champion_code text,
          created_at timestamptz not null default now()
        );

        create table if not exists pool_sessions (
          token text primary key,
          user_id text not null references pool_users(id) on delete cascade,
          expires_at timestamptz not null,
          created_at timestamptz not null default now()
        );

        create index if not exists pool_sessions_user_id_idx on pool_sessions(user_id);
        create index if not exists pool_sessions_expires_at_idx on pool_sessions(expires_at);
        create unique index if not exists pool_users_name_lower_key on pool_users (lower(name));

        create table if not exists pool_picks (
          user_id text not null references pool_users(id) on delete cascade,
          match_id text not null,
          outcome text not null check (outcome in ('HOME', 'DRAW', 'AWAY')),
          home_goals integer not null check (home_goals >= 0 and home_goals <= 30),
          away_goals integer not null check (away_goals >= 0 and away_goals <= 30),
          updated_at timestamptz not null default now(),
          primary key (user_id, match_id)
        );

        create index if not exists pool_picks_match_id_idx on pool_picks(match_id);
      `)
      .then(() => undefined)
      .catch((error) => {
        schemaReady = null;
        throw error;
      });
  }
  await schemaReady;
}

export async function poolQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  const pool = getPool();
  if (!pool) throw new Error("Prediction database is not configured.");
  await ensurePoolSchema();
  return pool.query<T>(text, params);
}
