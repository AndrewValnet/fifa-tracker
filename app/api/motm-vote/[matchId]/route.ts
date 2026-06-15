// Fan Man-of-the-Match voting — in-memory store (resets on redeploy).
// Each visitor IP may vote once per match.
import { NextRequest, NextResponse } from "next/server";

interface VoteStore {
  votes: Record<string, number>;  // playerName → count
  voters: Set<string>;            // IP addresses that already voted
}

// Module-level in-memory store per matchId
const store = new Map<string, VoteStore>();

function getStore(matchId: string): VoteStore {
  if (!store.has(matchId)) store.set(matchId, { votes: {}, voters: new Set() });
  return store.get(matchId)!;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { matchId: string } },
) {
  const s = getStore(params.matchId);
  const sorted = Object.entries(s.votes)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  return NextResponse.json({ matchId: params.matchId, results: sorted, total: sorted.reduce((n, r) => n + r.count, 0) });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { matchId: string } },
) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "anon";

  const body = await req.json().catch(() => null);
  const player: string | undefined = body?.player;
  if (!player || typeof player !== "string" || player.length > 100) {
    return NextResponse.json({ error: "invalid player" }, { status: 400 });
  }

  const s = getStore(params.matchId);
  if (s.voters.has(ip)) {
    return NextResponse.json({ error: "already voted" }, { status: 409 });
  }

  s.voters.add(ip);
  s.votes[player] = (s.votes[player] ?? 0) + 1;

  const sorted = Object.entries(s.votes)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ ok: true, results: sorted, total: sorted.reduce((n, r) => n + r.count, 0) });
}
