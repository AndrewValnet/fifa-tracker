// Head-to-head lookup over the curated data/h2h.json. Oriented to home/away.

import h2hData from "@/data/h2h.json";

interface H2HRecord {
  played: number;
  aWins: number;
  draws: number;
  bWins: number;
  lastMeeting: string;
  note: string;
  meetings?: H2HMeeting[];
}

export interface H2HMeeting {
  date: string;
  homeCode: string;
  awayCode: string;
  homeScore: number;
  awayScore: number;
  competition: string;
  venue: string;
  location: string;
}

const DATA = h2hData as unknown as Record<string, H2HRecord>;

export interface H2HView {
  played: number;
  homeWins: number;
  draws: number;
  awayWins: number;
  lastMeeting: string;
  note: string;
  meetings: H2HMeeting[];
}

export function headToHead(homeCode: string | null | undefined, awayCode: string | null | undefined): H2HView | null {
  if (!homeCode || !awayCode) return null;
  const [a, b] = [homeCode, awayCode].sort();
  const rec = DATA[`${a}-${b}`];
  if (!rec || typeof rec !== "object" || typeof rec.played !== "number") return null;
  const homeIsA = a === homeCode;
  return {
    played: rec.played,
    homeWins: homeIsA ? rec.aWins : rec.bWins,
    awayWins: homeIsA ? rec.bWins : rec.aWins,
    draws: rec.draws,
    lastMeeting: rec.lastMeeting,
    note: rec.note,
    meetings: rec.meetings ?? [],
  };
}
