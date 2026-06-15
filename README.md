# WC26 Live — FIFA World Cup 2026 Dashboard

A personal, self-hosted live companion for the 2026 FIFA World Cup (Jun 11 – Jul 19 · USA · Canada · Mexico): real-time scores, Polymarket win probabilities, breaking news, standings, squads, formation diagrams and all 16 stadiums — in a broadcast-style dark UI themed per match in team colors.

Built with **Next.js 14 (App Router) + TypeScript + Tailwind CSS + SWR**, per `FIFA_WC2026_Dashboard_PRD.md`.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

**It works with zero API keys** — live scores arrive from worldcup26.ir (open, keyless) and Polymarket odds are public. For the full experience add the two free keys to `.env.local`:

| Key | Where to get it | Unlocks |
|---|---|---|
| `FOOTBALL_DATA_API_KEY` | [football-data.org/client/register](https://www.football-data.org/client/register) (free, 10 req/min) | Primary live feed, cards/subs events, referees, **squads + coaches + predicted XI** |
| `GNEWS_API_KEY` | [gnews.io](https://gnews.io/) (free, 100 req/day) | Live news headlines (otherwise an offline digest with search links is shown) |

Restart `npm run dev` after editing `.env.local`.

## Data sources & fallback chain

```
matches/standings/scorers : football-data.org → worldcup26.ir → bundled schedule (data/schedule.json)
match stats & lineups     : ESPN public JSON API (keyless) — possession, shots, passes, corners,
                            confirmed formations, per-player stats, headshots, attendance
players                   : ESPN rosters + athlete bios (keyless) · preferred foot via Wikidata
player photos             : ESPN headshots → Wikidata P18 / Wikimedia Commons → Wikipedia thumbnail → initials (all keyless)
odds & betting money      : Polymarket Gamma API (keyless) → tournament-winner market → hidden
audience estimate         : transparent model (lib/audience.ts) — match stage + team reach + kickoff time, anchored to FIFA 2022 (labeled "est.")
shared response cache     : Upstash Redis (optional) — keeps API responses warm across serverless cold starts
on-site viewer counts     : Upstash Redis (optional) — real concurrent + cumulative visitors to this dashboard
pick'em / reactions       : Upstash Redis (optional) — score predictions + leaderboard, live match reactions
push notifications        : Web Push + VAPID (optional) — goal alerts + kickoff reminders; sent by /api/cron/alerts
insights / analytics      : Polymarket volume + open interest + odds history · ESPN per-match/per-player stats + attendance
advancement calculator    : pure simulation over the fixture list (lib/qualification.ts, no new data)
broadcasters / h2h        : bundled, fact-checked (data/broadcasters.json, data/h2h.json)
news                      : GNews → offline digest
ticket prices (optional)  : SeatGeek (free client id) — hidden without a key
flags                     : FlagCDN (keyless)   crests: football-data.org
stadium photos            : Wikimedia Commons (pre-curated in data/stadiums.json)
maps                      : OpenStreetMap embeds (keyless)
```

Every payload carries its provenance; fallback sources are labeled in the UI (small tags, or the amber banner in full offline mode). Caching respects free-tier limits: live 25–30s, schedule 2–5m, news 10m, teams 6h, plus a client-side 8-req/min guard for football-data.org.

## Pages

- `/` — war room: live hero (or next-match countdown), tournament-wide betting totals (traded / at stake / settled pools), **"Your Teams" strip (followed teams, pinned fixtures) + goal-alert opt-in**, today's matches with odds bars, news grid with tag filters, group standings accordion, Golden Boot
- `/match/[id]` — match centre: team-color theming, live scoreboard + estimated clock, **live emoji reactions**, goal banner, events timeline with goal-clip search links, **live win-probability graph with goal markers**, ESPN match stats (possession, shots, passes, corners, free kicks won, penalties, saves, cards), confirmed lineups with player photos (predicted XI before they drop), squads, Polymarket panel, **audience panel (real on-site "watching now" + labeled global-audience estimate)**, **head-to-head record**, **where-to-watch (broadcaster by country)**, attendance, optional avg ticket price, venue card with map
- `/upcoming` — all 104 fixtures, filterable by status/group/team/host country/date
- `/predict` — **score pick'em + champion pick + leaderboard** (requires Upstash)
- `/standings` — 12 group tables with qualification color-coding, **"Who's Going Through?" advancement calculator**, knockout bracket, top scorers
- `/insights` — tournament "cheeky aggregate" analytics: money that backed the losing side, biggest bottle jobs, biggest upsets + how sharp the betting crowd was, per-capita national betting, dirtiest teams, theatrics index, clutch index, stadium fill rate, plus labeled estimates (carbon footprint, fan cardiac-risk multiplier, productivity "skived", a World Cup baby-boom gag)
- `/compare` — **side-by-side player stat comparison**
- `/teams` & `/teams/[id]` — all 48 nations: squad with headshots, **follow toggle + calendar (.ics) export**, **"Road to the Final" knockout path**, coach, schedule, W/D/L + cards + average possession, next-match odds, odds to win the World Cup, and the money picture (bet on them, traded on their matches, at stake, settled pools won/lost)
- `/players/[id]` — player profiles: photo, age, height, weight, nationality, birthplace, club, preferred foot (Wikidata, when recorded), tournament totals (apps, est. minutes, goals, assists, shots, accuracy, fouls, cards), per-match log, prediction markets naming them, goal-clip search links, **compare link**
- `/stadiums` — the 16 venues by country, each expandable to its full fixture list

Installable **PWA** (manifest + service worker), dynamic **OG share images** for the war room / matches / insights, a sidebar **team search**, and a **calendar feed** at `/api/calendar` (`?team=ESP` for one nation).

## Honest limits of free data

- **"Money won/lost"** uses Polymarket's public pool math: a settled market's open interest is paid in full to the winning side. Per-bettor P&L is not published anywhere, so the app reports pools and labels them as such.
- **Viewers per game** still isn't published in real time by anyone (no free API — verified June 2026: FOX/Telemundo own US streams, YouTube concurrents are owner-only, Wikimedia pageviews lag ~24h, Google Trends killed its free API). So the match page pairs two honest numbers: a **real** count of people on *this dashboard* (concurrent + cumulative, via optional Upstash Redis — labeled as site presence, not TV viewership) and a clearly-labeled **estimated global audience** model anchored to FIFA's published Qatar-2022 figures (avg 175M/match; final ~571M/min, 1.42B reach). Official **attendance** from ESPN is still shown too.
- **Goal clips** have no free API; scorer names link to targeted YouTube / X / Reddit searches, plus ESPN's own match clips when available.
- **Possession & advanced stats** come from ESPN's public feed; football-data's free tier doesn't carry them.

## Deploy

```bash
npx vercel --prod    # or push to a Git repo and import in Vercel/Netlify
```

Set the API env vars in your hosting dashboard. You do not need a full database for read-heavy public data; add optional Upstash Redis if you want shared response caching, pick'em, reactions, presence, or push subscriptions.

## Security posture

`npm audit` reports advisories against Next 14 (all fixed only in Next 15/16) and a dev-only `glob` issue inside `eslint-config-next`. This app does not use the affected surfaces — no `next/image` optimizer, no middleware/rewrites, no CSP nonces, no `beforeInteractive` scripts, no WebSockets — and it is a single-user personal dashboard, so the practical exposure is minimal. The PRD pins Next.js 14; if you ever expose this publicly at scale, upgrade to the latest Next major (`npx @next/codemod@latest upgrade`) and re-run `npm audit`.

## Notes & known trade-offs

- **Match ids are namespaced** (`fd-…`, `wc26-…`, `demo-…`) so links stay consistent within whichever source is active.
- The **live clock is an estimate** when the provider doesn't report an official minute (free tiers) — it's labeled `est`.
- **Lineups aren't on free tiers**, so formation diagrams show a squad-based *predicted* 4-3-3 (PRD §7.2a fallback).
- worldcup26.ir reports kickoff in stadium-local time; conversion to your timezone uses each stadium's IANA zone in `data/stadiums.json`.
- "Sort by odds spread" from the PRD was dropped to avoid hammering Polymarket with 100+ market lookups per page; odds load only for matches within 48h.
Trigger deploy Fri, Jun 12, 2026  6:46:53 PM
