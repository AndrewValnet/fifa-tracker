"use client";

// Pure-SVG formation diagram (PRD section 7.2a), no chart library.
// Player nodes are keyboard-focusable with accessible labels, can show
// headshots, and can deep-link to player pages.

import { useEffect, useId, useState } from "react";
import {
  fetchFallbackPlayerImage,
  knownPlayerImageMiss,
  rememberPlayerImageMiss,
} from "@/components/player-image-cache";
import { contrastText } from "@/lib/team-meta";
import type { SquadPlayer } from "@/lib/types";

export interface FormationPlayer {
  name: string;
  shirtNumber?: number | null;
  positionDetail?: string | null;
  /** headshot URL, with a name-based fallback before the numbered disc */
  image?: string | null;
  /** player-page link */
  href?: string | null;
}

export const SUPPORTED_FORMATIONS = ["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "5-3-2", "3-4-3"] as const;

function parseFormation(f: string): number[] {
  const parts = f
    .split("-")
    .map((n) => parseInt(n, 10))
    .filter((n) => Number.isFinite(n) && n > 0 && n <= 6);
  const sum = parts.reduce((a, b) => a + b, 0);
  return parts.length >= 2 && sum === 10 ? parts : [4, 3, 3];
}

function shortName(name: string): string {
  if (name.length <= 12) return name;
  const parts = name.split(/\s+/);
  const last = parts[parts.length - 1];
  return last.length <= 14 ? last : `${last.slice(0, 12)}...`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** Pick a predicted XI from a squad for a given formation. */
export function pickPredictedXI(squad: SquadPlayer[], formation = "4-3-3"): (SquadPlayer & { slotIndex: number })[] {
  const rows = parseFormation(formation);
  const buckets: Record<string, SquadPlayer[]> = { GK: [], DEF: [], MID: [], FWD: [], OTHER: [] };
  for (const p of squad) buckets[positionBucket(p)].push(p);

  const used = new Set<string>();
  const take = (bucketOrder: string[], n: number): SquadPlayer[] => {
    const out: SquadPlayer[] = [];
    for (const bucket of bucketOrder) {
      for (const p of buckets[bucket] ?? []) {
        if (out.length >= n) break;
        if (!used.has(p.id)) {
          out.push(p);
          used.add(p.id);
        }
      }
    }
    return out;
  };

  const xi: SquadPlayer[] = [...take(["GK", "OTHER"], 1)];
  const lineOrder = [
    ["DEF", "MID", "OTHER"],
    ["MID", "DEF", "FWD", "OTHER"],
    ["FWD", "MID", "OTHER"],
  ];
  rows.forEach((count, i) => {
    const bucketOrder = lineOrder[Math.min(i, lineOrder.length - 1)];
    xi.push(...take(bucketOrder, count));
  });

  if (xi.length < 11) {
    for (const p of squad) {
      if (xi.length >= 11) break;
      if (!used.has(p.id)) {
        xi.push(p);
        used.add(p.id);
      }
    }
  }
  return xi.slice(0, 11).map((p, i) => ({ ...p, slotIndex: i }));
}

function positionBucket(player: SquadPlayer): "GK" | "DEF" | "MID" | "FWD" | "OTHER" {
  const raw = `${player.positionDetail ?? ""} ${player.position ?? ""}`.toUpperCase();
  if (/\b(GK|GOALKEEPER|KEEPER)\b/.test(raw)) return "GK";
  if (/\b(CB|LCB|RCB|LB|RB|LWB|RWB|SW|DEFENDER|DEFENCE|DEFENSE|CENTRE-BACK|CENTER-BACK|FULL-BACK|FULLBACK|DF)\b/.test(raw)) {
    return "DEF";
  }
  if (/\b(CDM|DM|CM|CAM|AM|LM|RM|MIDFIELDER|MIDFIELD|MEZZALA|PIVOT|MF)\b/.test(raw)) return "MID";
  if (/\b(ST|CF|FW|FWD|LW|RW|SS|FORWARD|STRIKER|WINGER|ATTACKER|ATT)\b/.test(raw)) return "FWD";
  if (player.position === "DEF") return "DEF";
  if (player.position === "MID") return "MID";
  if (player.position === "FWD") return "FWD";
  if (player.position === "GK") return "GK";
  return "OTHER";
}

function FormationNode({
  player,
  slot,
  color,
  fg,
  clipId,
}: {
  player: FormationPlayer;
  slot: { x: number; y: number };
  color: string;
  fg: string;
  clipId: string;
}) {
  const [src, setSrc] = useState<string | null>(player.image ?? null);
  const [triedFallback, setTriedFallback] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSrc(player.image && !knownPlayerImageMiss("src", player.image) ? player.image : null);
    setTriedFallback(false);
    setFailed(false);

    if ((player.image && !knownPlayerImageMiss("src", player.image)) || !player.name) {
      return () => {
        cancelled = true;
      };
    }

    async function loadFallback() {
      setTriedFallback(true);
      try {
        const url = await fetchFallbackPlayerImage(player.name);
        if (!cancelled && url) {
          setSrc(url);
          return;
        }
      } catch {
        // Fall through to the numbered disc.
      }
      if (!cancelled) setFailed(true);
    }

    void loadFallback();
    return () => {
      cancelled = true;
    };
  }, [player.image, player.name]);

  async function tryFallback() {
    if (triedFallback) {
      setSrc(null);
      setFailed(true);
      return;
    }

    setTriedFallback(true);
    try {
      const url = await fetchFallbackPlayerImage(player.name);
      if (url) {
        setSrc(url);
        return;
      }
    } catch {
      // Fall through to the numbered disc.
    }
    setSrc(null);
    setFailed(true);
  }

  const hasImage = Boolean(src && !failed);
  const aria = `${player.name}${player.positionDetail ? `, ${player.positionDetail}` : ""}${player.shirtNumber ? `, number ${player.shirtNumber}` : ""}`;
  const discText = player.shirtNumber ?? (initials(player.name) || "*");
  const node = (
    <g
      className="formation-node"
      tabIndex={player.href ? undefined : 0}
      role="img"
      aria-label={aria}
      transform={`translate(${slot.x}, ${slot.y})`}
    >
      <title>{aria}</title>
      <circle r="21" fill={hasImage ? "#1C2540" : color} stroke={color} strokeWidth={hasImage ? 2.5 : 0} />
      {!hasImage ? <circle r="21" fill={color} stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" /> : null}
      {hasImage ? (
        <image
          href={src!}
          x="-20"
          y="-20"
          width="40"
          height="40"
          clipPath={`url(#${clipId})`}
          preserveAspectRatio="xMidYMid slice"
          onError={() => {
            rememberPlayerImageMiss("src", src);
            void tryFallback();
          }}
        />
      ) : null}
      {hasImage && player.shirtNumber ? (
        <g transform="translate(15, 14)">
          <circle r="9" fill={color} />
          <text textAnchor="middle" y="3.5" fontSize="10.5" fontWeight="700" fill={fg} fontFamily="var(--font-roboto-mono), monospace">
            {player.shirtNumber}
          </text>
        </g>
      ) : null}
      {!hasImage ? (
        <text y="5.5" textAnchor="middle" fontSize="15" fontWeight="700" fill={fg} fontFamily="var(--font-roboto-mono), monospace">
          {discText}
        </text>
      ) : null}
      <text
        y="38"
        textAnchor="middle"
        fontSize="12.5"
        fill="#F0F4FF"
        stroke="#0A0E1A"
        strokeWidth="3"
        paintOrder="stroke"
        fontFamily="var(--font-inter), sans-serif"
      >
        {shortName(player.name)}
      </text>
    </g>
  );

  return player.href ? (
    <a href={player.href} aria-label={`${aria} - open player page`}>
      {node}
    </a>
  ) : (
    node
  );
}

export function FormationDiagram({
  formation = "4-3-3",
  players,
  color = "#00D45E",
  label,
}: {
  formation?: string;
  players: FormationPlayer[];
  color?: string;
  label?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const rows = parseFormation(formation);
  const fg = contrastText(color);

  // Slot coordinates: GK at the bottom, attack at the top.
  const slots: { x: number; y: number }[] = [{ x: 200, y: 562 }];
  const yTop = 120;
  const yBottom = 470;
  rows.forEach((count, i) => {
    const y = rows.length === 1 ? (yTop + yBottom) / 2 : yBottom - (i * (yBottom - yTop)) / (rows.length - 1);
    for (let j = 0; j < count; j++) {
      slots.push({ x: (400 * (j + 1)) / (count + 1), y });
    }
  });

  const lineup = players.slice(0, slots.length);

  return (
    <figure className="w-full">
      <svg
        viewBox="0 0 400 620"
        className="w-full rounded-xl border border-edge"
        role="group"
        aria-label={`${label ?? "Lineup"} - ${formation} formation`}
      >
        <defs>
          <clipPath id={`face-${uid}`}>
            <circle cx="0" cy="0" r="20" />
          </clipPath>
        </defs>
        {/* turf */}
        <rect x="0" y="0" width="400" height="620" fill="#0E2B1C" />
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={i} x="0" y={i * 77.5} width="400" height="38.75" fill="#10331F" />
        ))}
        {/* markings */}
        <g stroke="#E8F5EE" strokeOpacity="0.45" strokeWidth="2" fill="none">
          <rect x="12" y="12" width="376" height="596" />
          <line x1="12" y1="310" x2="388" y2="310" />
          <circle cx="200" cy="310" r="52" />
          <circle cx="200" cy="310" r="2.5" fill="#E8F5EE" fillOpacity="0.45" />
          <rect x="90" y="12" width="220" height="88" />
          <rect x="145" y="12" width="110" height="32" />
          <rect x="90" y="520" width="220" height="88" />
          <rect x="145" y="576" width="110" height="32" />
          <circle cx="200" cy="78" r="2.5" fill="#E8F5EE" fillOpacity="0.45" />
          <circle cx="200" cy="542" r="2.5" fill="#E8F5EE" fillOpacity="0.45" />
          <path d="M 12 22 A 10 10 0 0 0 22 12" />
          <path d="M 378 12 A 10 10 0 0 0 388 22" />
          <path d="M 12 598 A 10 10 0 0 1 22 608" />
          <path d="M 388 598 A 10 10 0 0 0 378 608" />
        </g>

        {lineup.map((p, i) => (
          <FormationNode
            key={`${p.name}-${i}`}
            player={p}
            slot={slots[i]}
            color={color}
            fg={fg}
            clipId={`face-${uid}`}
          />
        ))}
      </svg>
      {label ? (
        <figcaption className="mt-2 flex items-center justify-between text-xs text-dim">
          <span>{label}</span>
          <span className="font-mono">{formation}</span>
        </figcaption>
      ) : null}
    </figure>
  );
}
