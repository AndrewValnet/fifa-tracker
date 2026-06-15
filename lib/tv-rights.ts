// WC 2026 broadcast rights by country/region.
// Static reference data — accurate as of tournament start June 2026.

export interface TvMarket {
  region: string;
  flag: string;      // country emoji flag
  channels: string[];
  streaming?: string[];
  free: boolean;     // true = at least some matches on free-to-air
  note?: string;
}

export const TV_MARKETS: TvMarket[] = [
  // ── Americas ──────────────────────────────────────────────────────────────
  {
    region: "United States",
    flag: "🇺🇸",
    channels: ["Fox (English)", "FS1 (English)", "Telemundo (Spanish)", "Universo (Spanish)"],
    streaming: ["Tubi (free)", "Fox Sports app", "Peacock"],
    free: true,
    note: "Fox & Telemundo share rights; opening/final on free Fox. Tubi streams selected matches free.",
  },
  {
    region: "Canada",
    flag: "🇨🇦",
    channels: ["CTV", "TSN", "RDS (French)", "TVA Sports (French)", "Noovo (French)"],
    streaming: ["TSN Direct", "RDS Direct"],
    free: true,
    note: "CTV carries selected matches free. French coverage via Noovo.",
  },
  {
    region: "Mexico",
    flag: "🇲🇽",
    channels: ["TV Azteca", "Canal 5 (Televisa)", "TUDN", "Imagen Televisión"],
    streaming: ["ViX+"],
    free: true,
    note: "All matches on free-to-air in Mexico as co-host nation.",
  },
  {
    region: "Brazil",
    flag: "🇧🇷",
    channels: ["TV Globo", "SporTV"],
    streaming: ["Globoplay", "GloboEsporte"],
    free: true,
  },
  {
    region: "Argentina",
    flag: "🇦🇷",
    channels: ["TyC Sports", "TV Pública (selected)", "El Trece", "DSports"],
    streaming: ["TyC Play", "Flow"],
    free: true,
  },

  // ── Europe ────────────────────────────────────────────────────────────────
  {
    region: "United Kingdom",
    flag: "🇬🇧",
    channels: ["BBC One/Two (selected)", "ITV1/ITV4 (selected)"],
    streaming: ["BBC iPlayer (free)", "ITVX (free)"],
    free: true,
    note: "BBC & ITV share rights. England matches guaranteed on free TV.",
  },
  {
    region: "Germany",
    flag: "🇩🇪",
    channels: ["ARD (Das Erste)", "ZDF", "MagentaTV (all matches)"],
    streaming: ["ARD Mediathek (free)", "ZDF Mediathek (free)"],
    free: true,
    note: "ARD & ZDF split free matches. MagentaTV has full rights.",
  },
  {
    region: "France",
    flag: "🇫🇷",
    channels: ["TF1 (selected)", "M6 (selected)", "beIN Sports (all)"],
    streaming: ["TF1+ (free)", "beIN Sports Connect"],
    free: true,
    note: "TF1 has rights for France matches + selected. beIN shows all.",
  },
  {
    region: "Spain",
    flag: "🇪🇸",
    channels: ["RTVE/La 1 (selected)", "La 2", "TVE", "Gol TV"],
    streaming: ["RTVE Play (free)", "DAZN"],
    free: true,
  },
  {
    region: "Netherlands",
    flag: "🇳🇱",
    channels: ["NOS (selected)", "Ziggo Sport"],
    streaming: ["NOS.nl (free)", "Ziggo Sport Totaal"],
    free: true,
  },
  {
    region: "Portugal",
    flag: "🇵🇹",
    channels: ["RTP1 (selected)", "SIC", "Sport TV"],
    streaming: ["RTP Play (free)"],
    free: true,
  },
  {
    region: "Italy",
    flag: "🇮🇹",
    channels: ["RAI (selected)", "Sky Sport", "Now TV"],
    streaming: ["RaiPlay (free)", "Sky Go"],
    free: true,
  },
  {
    region: "Belgium",
    flag: "🇧🇪",
    channels: ["RTBF (French, selected)", "VRT (Dutch, selected)", "DAZN"],
    streaming: ["Auvio (free)", "VRT Max (free)"],
    free: true,
  },
  {
    region: "Norway",
    flag: "🇳🇴",
    channels: ["NRK (selected)", "TV 2"],
    streaming: ["NRK TV (free)"],
    free: true,
  },
  {
    region: "Australia",
    flag: "🇦🇺",
    channels: ["SBS (free-to-air)", "Optus Sport"],
    streaming: ["SBS On Demand (free)"],
    free: true,
    note: "SBS carries all matches free in Australia.",
  },

  // ── Asia ──────────────────────────────────────────────────────────────────
  {
    region: "Japan",
    flag: "🇯🇵",
    channels: ["NHK (selected)", "Fuji TV (selected)", "ABEMA", "DAZN"],
    streaming: ["ABEMA (all matches, free)", "NHK Plus"],
    free: true,
    note: "ABEMA streams all 104 matches free in Japan — unprecedented.",
  },
  {
    region: "South Korea",
    flag: "🇰🇷",
    channels: ["KBS2", "MBC", "SBS", "JTBC"],
    streaming: ["Wavve", "TVING"],
    free: true,
    note: "Major terrestrial broadcasters split the tournament.",
  },
  {
    region: "India",
    flag: "🇮🇳",
    channels: ["Sports18", "Sports18 HD"],
    streaming: ["JioCinema (free)", "Jio TV"],
    free: true,
    note: "JioCinema streams all matches free (ad-supported) in India.",
  },
  {
    region: "Middle East & N. Africa",
    flag: "🌍",
    channels: ["beIN Sports", "beIN Sports Max"],
    streaming: ["beIN Sports Connect"],
    free: false,
    note: "beIN Sports holds rights across the MENA region (paid subscription).",
  },
  {
    region: "China",
    flag: "🇨🇳",
    channels: ["CCTV 5 (selected)", "iQIYI Sport", "Migu Video"],
    streaming: ["Migu Video (streaming)", "Tencent Video"],
    free: false,
  },

  // ── Africa ────────────────────────────────────────────────────────────────
  {
    region: "South Africa",
    flag: "🇿🇦",
    channels: ["SABC 2 (selected)", "SuperSport"],
    streaming: ["DStv Now"],
    free: true,
    note: "SABC carries selected matches free. SuperSport has full rights.",
  },
  {
    region: "Sub-Saharan Africa",
    flag: "🌍",
    channels: ["SuperSport", "Canal+ (Francophone)"],
    streaming: ["DStv Now", "Canal+ Online"],
    free: false,
  },

  // ── Global ────────────────────────────────────────────────────────────────
  {
    region: "Everywhere else",
    flag: "🌐",
    channels: ["FIFA+ (selected matches free globally)"],
    streaming: ["FIFA+ app & website"],
    free: true,
    note: "FIFA+ streams selected matches globally for free — check the FIFA+ app.",
  },
];
