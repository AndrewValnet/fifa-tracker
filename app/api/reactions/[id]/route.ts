import { NextResponse } from "next/server";
import { redisEnabled, redisPipe, sanitizeKey } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const REACTION_EMOJIS = ["⚽", "🔥", "😱", "👏", "😤", "🥶"];
const TTL = 14 * 24 * 3600; // reactions live two weeks

function toCounts(v: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (Array.isArray(v)) {
    for (let i = 0; i + 1 < v.length; i += 2) out[String(v[i])] = Number(v[i + 1]) || 0;
  } else if (v && typeof v === "object") {
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) out[k] = Number(val) || 0;
  }
  return out;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!redisEnabled()) return NextResponse.json({ enabled: false, counts: {} });
  const res = await redisPipe([["HGETALL", `reactions:${sanitizeKey(params.id)}`]]);
  return NextResponse.json({ enabled: true, counts: toCounts(res?.[0]) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!redisEnabled()) return NextResponse.json({ enabled: false, counts: {} });
  let emoji = "";
  try {
    emoji = ((await req.json()) as { emoji?: string }).emoji ?? "";
  } catch {
    /* ignore */
  }
  if (!REACTION_EMOJIS.includes(emoji)) {
    return NextResponse.json({ enabled: true, counts: {} }, { status: 400 });
  }
  const key = `reactions:${sanitizeKey(params.id)}`;
  const res = await redisPipe([
    ["HINCRBY", key, emoji, 1],
    ["EXPIRE", key, TTL],
    ["HGETALL", key],
  ]);
  return NextResponse.json({ enabled: true, counts: toCounts(res?.[2]) }, { headers: { "Cache-Control": "no-store" } });
}
