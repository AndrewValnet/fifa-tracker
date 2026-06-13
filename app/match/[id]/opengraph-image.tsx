import { ImageResponse } from "next/og";
import { getMatchById } from "@/lib/data";
import { stageLabel, statusKind } from "@/lib/format";
import { ogFonts } from "@/lib/og-font";

export const runtime = "edge";
export const alt = "World Cup 2026 match";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { id: string } }) {
  const res = await getMatchById(params.id).catch(() => null);
  const m = res?.data;
  const home = m?.homeTeam?.code ?? m?.homeTeam?.name ?? "TBD";
  const away = m?.awayTeam?.code ?? m?.awayTeam?.name ?? "TBD";
  const kind = m ? statusKind(m.status) : "upcoming";
  const center = m && kind !== "upcoming" ? `${m.score.home ?? 0} – ${m.score.away ?? 0}` : "vs";
  const sub = m ? stageLabel(m.stage, m.group) : "FIFA World Cup 2026";

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
          padding: 64,
          justifyContent: "space-between",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "#8a93a6" }}>
          <span>WC26 LIVE</span>
          <span>{sub}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <span style={{ display: "flex", fontSize: 120, fontWeight: 800 }}>{home}</span>
          <span style={{ display: "flex", fontSize: 76, color: "#F5C518" }}>{center}</span>
          <span style={{ display: "flex", fontSize: 120, fontWeight: 800 }}>{away}</span>
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#8a93a6" }}>
          Live score · win-probability · audience · where to watch
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
