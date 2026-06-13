import { ImageResponse } from "next/og";
import { ogFonts } from "@/lib/og-font";

export const runtime = "edge";
export const alt = "WC26 Live — Tournament Insights";
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
          background: "#0A0E1A",
          color: "#F0F4FF",
          padding: 72,
          justifyContent: "space-between",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, color: "#8a93a6" }}>WC26 LIVE · INSIGHTS</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 84, fontWeight: 800 }}>Tournament Insights</div>
          <div style={{ display: "flex", fontSize: 34, color: "#F5C518", marginTop: 10 }}>
            Money on the losing side · biggest bottle jobs · dirtiest teams
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#8a93a6" }}>The cheeky numbers behind the World Cup</div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
