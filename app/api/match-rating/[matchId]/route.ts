import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const matchId = params.matchId;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      {
        status: 400,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("rating" in body)
  ) {
    return NextResponse.json(
      { ok: false, error: "Missing rating field" },
      {
        status: 400,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  const { rating } = body as { rating: unknown };

  if (
    typeof rating !== "number" ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    return NextResponse.json(
      { ok: false, error: "Rating must be an integer between 1 and 5" },
      {
        status: 400,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  // No database — simply validate and acknowledge
  void matchId; // matchId available for future persistence

  return NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
