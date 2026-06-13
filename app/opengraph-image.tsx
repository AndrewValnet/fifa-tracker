import { ImageResponse } from "next/og";
import { ogFonts } from "@/lib/og-font";

export const runtime = "edge";
export const alt = "WC26 Live — World Cup 2026 War Room";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0A0E1A, #10331F)",
          color: "#F0F4FF",
          padding: 72,
          justifyContent: "space-between",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, color: "#8a93a6", letterSpacing: 2 }}>WC26 LIVE</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 88, fontWeight: 800, lineHeight: 1.05 }}>World Cup 2026</div>
          <div style={{ display: "flex", fontSize: 40, color: "#F5C518", marginTop: 8 }}>The War Room</div>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#8a93a6" }}>
          Live scores · Polymarket odds · audience · cheeky insights · USA · CAN · MEX
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
