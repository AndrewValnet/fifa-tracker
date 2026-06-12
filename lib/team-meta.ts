// Team metadata helpers: FIFA code resolution, flags, colors.
// Static registry data is bundled in /data (see PRD §5.5, §8.1).

import teamColors from "@/data/team-colors.json";
import flagMap from "@/data/team-flag-map.json";
import teamsRegistry from "@/data/teams.json";

export interface TeamColors {
  primary: string;
  secondary: string;
}

interface RegistryTeam {
  code: string;
  name: string;
  group: string;
  wc26Id: string;
}

export const TEAMS: RegistryTeam[] = teamsRegistry as RegistryTeam[];

const colors = teamColors as Record<string, TeamColors>;
const flags = flagMap as Record<string, string>;

/** Alternate spellings → FIFA code (football-data, Polymarket, news vary). */
const NAME_ALIASES: Record<string, string> = {
  "united states": "USA",
  "united states of america": "USA",
  usa: "USA",
  "korea republic": "KOR",
  "south korea": "KOR",
  czechia: "CZE",
  "czech republic": "CZE",
  "bosnia and herzegovina": "BIH",
  "bosnia-herzegovina": "BIH",
  bosnia: "BIH",
  "ivory coast": "CIV",
  "cote d'ivoire": "CIV",
  "côte d'ivoire": "CIV",
  "dr congo": "COD",
  "congo dr": "COD",
  "democratic republic of the congo": "COD",
  "cape verde": "CPV",
  "cabo verde": "CPV",
  turkiye: "TUR",
  "türkiye": "TUR",
  turkey: "TUR",
  "ir iran": "IRN",
  iran: "IRN",
  "saudi arabia": "KSA",
  netherlands: "NED",
  holland: "NED",
  "new zealand": "NZL",
  "curaçao": "CUW",
  curacao: "CUW",
};

const nameToCode = new Map<string, string>();
for (const t of TEAMS) nameToCode.set(t.name.toLowerCase(), t.code);
for (const [alias, code] of Object.entries(NAME_ALIASES)) nameToCode.set(alias, code);

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const nameToCodeNormalized = new Map<string, string>();
for (const [k, v] of nameToCode) nameToCodeNormalized.set(normalizeName(k), v);

/** Resolve a FIFA code from a TLA and/or free-form team name. */
export function resolveTeamCode(codeOrName: string | null | undefined, name?: string | null): string | null {
  if (codeOrName) {
    const up = codeOrName.toUpperCase();
    if (colors[up] || flags[up]) return up;
  }
  for (const candidate of [codeOrName, name]) {
    if (!candidate) continue;
    const hit = nameToCode.get(candidate.toLowerCase()) ?? nameToCodeNormalized.get(normalizeName(candidate));
    if (hit) return hit;
  }
  return null;
}

export function teamName(code: string | null): string | null {
  if (!code) return null;
  return TEAMS.find((t) => t.code === code)?.name ?? null;
}

export function teamGroup(code: string | null): string | null {
  if (!code) return null;
  return TEAMS.find((t) => t.code === code)?.group ?? null;
}

export function getTeamColors(code: string | null | undefined): TeamColors {
  if (code && colors[code.toUpperCase()]) return colors[code.toUpperCase()];
  return colors.DEFAULT;
}

/**
 * Pick a color usable as a text/border accent on the dark theme.
 * Very dark primaries (e.g. Germany) flip to the secondary color.
 */
export function getAccentColor(code: string | null | undefined): string {
  const { primary, secondary } = getTeamColors(code);
  return relativeLuminance(primary) < 0.06 ? secondary : primary;
}

function relativeLuminance(hex: string): number {
  const m = hex.replace("#", "");
  if (m.length < 6) return 0.5;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(m.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Pick black or white text for a given background color (WCAG-ish). */
export function contrastText(hexBg: string): string {
  return relativeLuminance(hexBg) > 0.35 ? "#0A0E1A" : "#F0F4FF";
}

export type FlagSize = "w40" | "w80" | "w160" | "w320" | "w640";

export function flagUrl(code: string | null | undefined, size: FlagSize = "w80"): string | null {
  if (!code) return null;
  const iso = flags[code.toUpperCase()];
  if (!iso) return null;
  return `https://flagcdn.com/${size}/${iso}.png`;
}

export function wc26IdToCode(wc26Id: string): string | null {
  return TEAMS.find((t) => t.wc26Id === wc26Id)?.code ?? null;
}

/**
 * Lowercase code variants used in Polymarket match-event slugs, which mix
 * FIFA codes ("usa", "cze") and ISO-2 codes ("kr") — e.g. fifwc-kr-cze-….
 */
export function slugCodeVariants(code: string | null | undefined): string[] {
  if (!code) return [];
  const out = [code.toLowerCase()];
  const iso = flags[code.toUpperCase()];
  if (iso) {
    const short = iso.includes("-") ? iso.split("-").pop()! : iso; // gb-eng -> eng
    if (short && !out.includes(short)) out.push(short);
  }
  return out;
}
