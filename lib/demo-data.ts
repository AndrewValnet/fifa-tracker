// Offline fallback content. The static schedule (data/schedule.json) already
// mirrors the real tournament; this module adds the pieces that normally come
// from the network: a news digest and helper accessors. Everything returned
// from here is flagged source="demo" so the UI can label it.

import { SCHEDULE, entryToMatch, sortMatches } from "@/lib/schedule";
import type { Match, NewsArticle } from "@/lib/types";

export function demoMatches(now: Date = new Date()): Match[] {
  return sortMatches(SCHEDULE.map((e) => entryToMatch(e, "demo", now)));
}

export function demoMatch(id: string, now: Date = new Date()): Match | null {
  const entry = SCHEDULE.find((e) => e.id === id);
  return entry ? entryToMatch(entry, "demo", now) : null;
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600_000).toISOString();
}

function gnewsLink(q: string): string {
  return `https://news.google.com/search?q=${encodeURIComponent(q)}`;
}

/** Curated tournament digest shown when GNews is unavailable. */
export function offlineNews(context?: { home?: string | null; away?: string | null }): NewsArticle[] {
  if (context?.home && context?.away) {
    const pair = `${context.home} vs ${context.away}`;
    return [
      {
        title: `Latest coverage: ${pair} at the 2026 World Cup`,
        description: `Live news search for ${pair}. Add a GNews API key in .env.local for an in-app feed.`,
        url: gnewsLink(`${pair} World Cup 2026`),
        image: null,
        source: "Google News",
        publishedAt: hoursAgo(0),
      },
      {
        title: `${context.home}: team news, lineups and injuries`,
        description: `Search results for ${context.home} ahead of kickoff.`,
        url: gnewsLink(`${context.home} World Cup 2026`),
        image: null,
        source: "Google News",
        publishedAt: hoursAgo(1),
      },
      {
        title: `${context.away}: team news, lineups and injuries`,
        description: `Search results for ${context.away} ahead of kickoff.`,
        url: gnewsLink(`${context.away} World Cup 2026`),
        image: null,
        source: "Google News",
        publishedAt: hoursAgo(1),
      },
    ];
  }

  return [
    {
      title: "Mexico open World Cup 2026 with 2–0 win over South Africa at the Azteca",
      description:
        "Julián Quiñones struck early and Raúl Jiménez sealed it as the host nation won the tournament opener in Mexico City — the Azteca's third World Cup opening match.",
      url: gnewsLink("Mexico South Africa World Cup 2026 opener Azteca"),
      image: null,
      source: "Offline digest",
      publishedAt: hoursAgo(26),
    },
    {
      title: "South Korea come from behind to beat Czech Republic 2–1 in Group A",
      description: "Goals from Hwang and Oh in the final 25 minutes turned the match around in Guadalajara.",
      url: gnewsLink("South Korea Czech Republic World Cup 2026"),
      image: null,
      source: "Offline digest",
      publishedAt: hoursAgo(20),
    },
    {
      title: "Canada's home World Cup begins against Bosnia and Herzegovina in Toronto",
      description: "BMO Field hosts Canada's first men's World Cup match on home soil in Group B.",
      url: gnewsLink("Canada Bosnia World Cup 2026 Toronto"),
      image: null,
      source: "Offline digest",
      publishedAt: hoursAgo(6),
    },
    {
      title: "USMNT kick off their campaign against Paraguay at SoFi Stadium",
      description: "The co-hosts open Group D in Los Angeles in front of 70,000.",
      url: gnewsLink("USA Paraguay World Cup 2026 SoFi"),
      image: null,
      source: "Offline digest",
      publishedAt: hoursAgo(4),
    },
    {
      title: "48 teams, 104 matches, 16 stadiums: how the expanded World Cup works",
      description:
        "Twelve groups of four, with the top two from each group plus the eight best third-placed teams advancing to a new Round of 32.",
      url: gnewsLink("World Cup 2026 format 48 teams explained"),
      image: null,
      source: "Offline digest",
      publishedAt: hoursAgo(30),
    },
    {
      title: "Group-by-group guide to the 2026 World Cup",
      description: "From Spain and France to debutants Curaçao and Jordan — every group assessed.",
      url: gnewsLink("World Cup 2026 group stage guide"),
      image: null,
      source: "Offline digest",
      publishedAt: hoursAgo(36),
    },
    {
      title: "Polymarket: over $10M already traded on opening-week matches",
      description: "Prediction markets are live for every fixture, with win probabilities updating in real time.",
      url: "https://polymarket.com/sports/fifa-world-cup",
      image: null,
      source: "Offline digest",
      publishedAt: hoursAgo(12),
    },
    {
      title: "From the Azteca to MetLife: the 16 stadiums of World Cup 2026",
      description: "Three countries, four time zones and the biggest World Cup footprint in history.",
      url: gnewsLink("World Cup 2026 stadiums guide"),
      image: null,
      source: "Offline digest",
      publishedAt: hoursAgo(48),
    },
  ];
}
