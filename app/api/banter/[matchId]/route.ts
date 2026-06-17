import { NextRequest, NextResponse } from "next/server";
import { redisPipe, redisEnabled, sanitizeKey } from "@/lib/redis";

export type BanterComment = { name: string; msg: string; ts: number };

function stripHtml(raw: string): string {
  return raw.replace(/<[^>]*>/g, "").trim();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { matchId: string } },
): Promise<NextResponse> {
  if (!redisEnabled()) {
    return NextResponse.json({ comments: [] });
  }

  const key = `banter:${sanitizeKey(params.matchId)}`;
  const result = await redisPipe([["LRANGE", key, "0", "49"]]);

  if (!result) {
    return NextResponse.json({ comments: [] });
  }

  const raw = result[0];
  if (!Array.isArray(raw)) {
    return NextResponse.json({ comments: [] });
  }

  const comments: BanterComment[] = [];
  for (const item of raw) {
    try {
      const parsed = JSON.parse(item as string) as BanterComment;
      if (
        typeof parsed.name === "string" &&
        typeof parsed.msg === "string" &&
        typeof parsed.ts === "number"
      ) {
        comments.push(parsed);
      }
    } catch {
      // skip malformed entries
    }
  }

  // Sort ascending by timestamp (oldest first)
  comments.sort((a, b) => a.ts - b.ts);

  return NextResponse.json({ comments });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { matchId: string } },
): Promise<NextResponse> {
  if (!redisEnabled()) {
    return NextResponse.json({ error: "Comments unavailable" }, { status: 503 });
  }

  let body: { name?: unknown; msg?: unknown };
  try {
    body = (await req.json()) as { name?: unknown; msg?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawName = typeof body.name === "string" ? body.name.trim() : "";
  const rawMsg = typeof body.msg === "string" ? body.msg.trim() : "";

  const name = stripHtml(rawName);
  const msg = stripHtml(rawMsg);

  if (name.length < 1 || name.length > 30) {
    return NextResponse.json(
      { error: "Name must be between 1 and 30 characters" },
      { status: 400 },
    );
  }
  if (msg.length < 1 || msg.length > 200) {
    return NextResponse.json(
      { error: "Message must be between 1 and 200 characters" },
      { status: 400 },
    );
  }

  const comment: BanterComment = { name, msg, ts: Date.now() };
  const key = `banter:${sanitizeKey(params.matchId)}`;
  const serialized = JSON.stringify(comment);

  await redisPipe([
    ["LPUSH", key, serialized],
    ["LTRIM", key, "0", "99"],
  ]);

  return NextResponse.json({ ok: true }, { status: 201 });
}
