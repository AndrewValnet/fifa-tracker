import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { ogFonts } from "@/lib/og-font";

export const runtime = "edge";

const size = { width: 1200, height: 630 };

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const home = searchParams.get("home") ?? "???";
  const away = searchParams.get("away") ?? "???";
  const pickHome = searchParams.get("pickHome") ?? "0";
  const pickAway = searchParams.get("pickAway") ?? "0";
  const name = searchParams.get("name") ?? "Anonymous";

  const byline = `${name}'s pick`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "#0a0e1a",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Radial gradient overlay */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, #0d2040 0%, #0a0e1a 70%)",
          }}
        />

        {/* Subtle top accent line */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #00d45e, #ffd700, #00d45e)",
          }}
        />

        {/* Main content — three-column layout */}
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 72px",
            marginTop: 24,
            position: "relative",
          }}
        >
          {/* Left: home team */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: 280,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 112,
                fontWeight: 800,
                color: "#f0f4ff",
                letterSpacing: -2,
                lineHeight: 1,
                textTransform: "uppercase",
              }}
            >
              {home}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 12,
                width: 64,
                height: 4,
                background: "#00d45e",
                borderRadius: 2,
              }}
            />
          </div>

          {/* Center: score */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
            }}
          >
            {/* Label */}
            <div
              style={{
                display: "flex",
                fontSize: 18,
                color: "#8a93a6",
                letterSpacing: 4,
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              PREDICTED SCORE
            </div>

            {/* Score display */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 160,
                  fontWeight: 800,
                  color: "#ffffff",
                  lineHeight: 1,
                  letterSpacing: -4,
                }}
              >
                {pickHome}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 100,
                  fontWeight: 300,
                  color: "#ffd700",
                  lineHeight: 1,
                  margin: "0 20px",
                  marginBottom: 8,
                }}
              >
                –
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 160,
                  fontWeight: 800,
                  color: "#ffffff",
                  lineHeight: 1,
                  letterSpacing: -4,
                }}
              >
                {pickAway}
              </div>
            </div>
          </div>

          {/* Right: away team */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: 280,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 112,
                fontWeight: 800,
                color: "#f0f4ff",
                letterSpacing: -2,
                lineHeight: 1,
                textTransform: "uppercase",
              }}
            >
              {away}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 12,
                width: 64,
                height: 4,
                background: "#ffd700",
                borderRadius: 2,
              }}
            />
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 72px",
            paddingBottom: 48,
            position: "relative",
          }}
        >
          {/* User byline */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#00d45e22",
                border: "1.5px solid #00d45e",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              ⚽
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 26,
                color: "#c8d0e0",
                fontWeight: 700,
              }}
            >
              {byline}
            </div>
          </div>

          {/* WC 2026 branding */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 13,
                color: "#8a93a6",
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              WC26 LIVE
            </div>
            <div
              style={{
                display: "flex",
                width: 1,
                height: 20,
                background: "#1e2a3d",
              }}
            />
            <div
              style={{
                display: "flex",
                fontSize: 13,
                color: "#ffd700",
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              FIFA WORLD CUP 2026
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
