import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { poolDbEnabled, poolQuery } from "@/lib/pool-db";
import { redis, redisEnabled, redisPipe, sanitizeKey } from "@/lib/redis";

const SESSION_COOKIE = "wc26-pool-session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 45;
const MIN_PASSWORD_LENGTH = 8;

export interface PoolUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: Date | string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function cleanName(name: string): string {
  return name.replace(/\s+/g, " ").trim().slice(0, 60);
}

function userKey(id: string): string {
  return `pool:user:${sanitizeKey(id)}`;
}

function emailKey(email: string): string {
  return `pool:email:${sanitizeKey(normalizeEmail(email))}`;
}

function nameKey(name: string): string {
  return `pool:name:${sanitizeKey(cleanName(name).toLowerCase())}`;
}

function sessionKey(token: string): string {
  return `pool:session:${sanitizeKey(token)}`;
}

function hashPassword(password: string, salt = randomBytes(16).toString("hex")): string {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const known = Buffer.from(hash, "hex");
  return known.length === candidate.length && timingSafeEqual(known, candidate);
}

function rowToUser(row: UserRow): PoolUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function userFromHash(id: string, raw: unknown): (PoolUser & { passwordHash?: string }) | null {
  const obj: Record<string, string> = {};
  if (Array.isArray(raw)) {
    for (let i = 0; i + 1 < raw.length; i += 2) obj[String(raw[i])] = String(raw[i + 1]);
  } else if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) obj[k] = String(v);
  }
  if (!obj.email || !obj.name) return null;
  return {
    id,
    email: obj.email,
    name: obj.name,
    createdAt: obj.createdAt ?? new Date().toISOString(),
    passwordHash: obj.passwordHash,
  };
}

export function accountsEnabled(): boolean {
  return poolDbEnabled() || redisEnabled();
}

export function publicUser(user: PoolUser): PoolUser {
  return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
}

export async function getUserById(id: string): Promise<PoolUser | null> {
  if (!id) return null;
  if (poolDbEnabled()) {
    const res = await poolQuery<UserRow>("select * from pool_users where id = $1 limit 1", [id]);
    return res.rows[0] ? rowToUser(res.rows[0]) : null;
  }
  if (!redisEnabled()) return null;
  const user = userFromHash(id, await redis("HGETALL", userKey(id)));
  return user ? publicUser(user) : null;
}

export async function currentUser(): Promise<PoolUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  if (poolDbEnabled()) {
    const res = await poolQuery<UserRow>(
      `select u.*
       from pool_sessions s
       join pool_users u on u.id = s.user_id
       where s.token = $1 and s.expires_at > now()
       limit 1`,
      [token],
    );
    return res.rows[0] ? rowToUser(res.rows[0]) : null;
  }
  if (!redisEnabled()) return null;
  const userId = (await redis("GET", sessionKey(token))) as string | null;
  return userId ? getUserById(userId) : null;
}

export function setSessionCookie(token: string) {
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
  });
}

export function clearSessionCookie() {
  cookies().set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}

async function createSession(userId: string): Promise<string | null> {
  const token = randomBytes(32).toString("base64url");
  if (poolDbEnabled()) {
    await poolQuery(
      `insert into pool_sessions (token, user_id, expires_at)
       values ($1, $2, now() + ($3 || ' seconds')::interval)`,
      [token, userId, SESSION_TTL_SECONDS],
    );
    return token;
  }
  const ok = await redisPipe([["SET", sessionKey(token), userId, "EX", SESSION_TTL_SECONDS]]);
  return ok ? token : null;
}

export async function registerUser(input: {
  email: string;
  name: string;
  password: string;
  poolCode?: string;
}): Promise<{ ok: true; user: PoolUser; token: string } | { ok: false; error: string }> {
  if (!accountsEnabled()) return { ok: false, error: "Prediction accounts need Supabase or Redis to be configured." };
  const requiredCode = process.env.OFFICE_POOL_CODE?.trim();
  if (requiredCode && input.poolCode?.trim() !== requiredCode) {
    return { ok: false, error: "Invite code is incorrect." };
  }

  const email = normalizeEmail(input.email);
  const name = cleanName(input.name);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "Enter a valid work email." };
  if (name.length < 2) return { ok: false, error: "Enter your name." };
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }

  const id = randomBytes(12).toString("base64url");
  const createdAt = new Date().toISOString();
  const passwordHash = hashPassword(input.password);

  if (poolDbEnabled()) {
    try {
      const existingName = await poolQuery<{ id: string }>("select id from pool_users where lower(name) = lower($1) limit 1", [name]);
      if (existingName.rows.length) return { ok: false, error: "That username is already taken." };
      const res = await poolQuery<UserRow>(
        `insert into pool_users (id, email, name, password_hash, created_at)
         values ($1, $2, $3, $4, $5)
         returning *`,
        [id, email, name, passwordHash, createdAt],
      );
      const token = await createSession(id);
      if (!token) return { ok: false, error: "Account created, but sign-in failed. Try logging in." };
      return { ok: true, user: rowToUser(res.rows[0]), token };
    } catch (error) {
      if (String((error as { code?: string }).code) === "23505") {
        return { ok: false, error: "That email or username is already taken." };
      }
      return { ok: false, error: "Could not create account. Try again." };
    }
  }

  const existing = await redis("GET", emailKey(email));
  if (existing) return { ok: false, error: "An account already exists for that email." };
  const existingName = await redis("GET", nameKey(name));
  if (existingName) return { ok: false, error: "That username is already taken." };
  const setEmail = await redis("SET", emailKey(email), id, "NX");
  if (setEmail !== "OK") return { ok: false, error: "An account already exists for that email." };
  const setName = await redis("SET", nameKey(name), id, "NX");
  if (setName !== "OK") {
    await redis("DEL", emailKey(email));
    return { ok: false, error: "That username is already taken." };
  }
  const ok = await redisPipe([
    ["HSET", userKey(id), "email", email, "name", name, "createdAt", createdAt, "passwordHash", passwordHash],
    ["SADD", "pool:users", id],
  ]);
  if (!ok) return { ok: false, error: "Could not create account. Try again." };
  const token = await createSession(id);
  if (!token) return { ok: false, error: "Account created, but sign-in failed. Try logging in." };
  return { ok: true, user: { id, email, name, createdAt }, token };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<{ ok: true; user: PoolUser; token: string } | { ok: false; error: string }> {
  if (!accountsEnabled()) return { ok: false, error: "Prediction accounts need Supabase or Redis to be configured." };
  const email = normalizeEmail(input.email);

  if (poolDbEnabled()) {
    const res = await poolQuery<UserRow>("select * from pool_users where email = $1 limit 1", [email]);
    const user = res.rows[0];
    if (!user || !verifyPassword(input.password, user.password_hash)) {
      return { ok: false, error: "Email or password is incorrect." };
    }
    const token = await createSession(user.id);
    if (!token) return { ok: false, error: "Could not sign in. Try again." };
    return { ok: true, user: rowToUser(user), token };
  }

  const id = (await redis("GET", emailKey(email))) as string | null;
  if (!id) return { ok: false, error: "Email or password is incorrect." };
  const user = userFromHash(id, await redis("HGETALL", userKey(id)));
  if (!user?.passwordHash || !verifyPassword(input.password, user.passwordHash)) {
    return { ok: false, error: "Email or password is incorrect." };
  }
  const token = await createSession(id);
  if (!token) return { ok: false, error: "Could not sign in. Try again." };
  return { ok: true, user: publicUser(user), token };
}

export async function logoutCurrentUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    if (poolDbEnabled()) await poolQuery("delete from pool_sessions where token = $1", [token]);
    else if (redisEnabled()) await redis("DEL", sessionKey(token));
  }
  clearSessionCookie();
}
