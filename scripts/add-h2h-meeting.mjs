import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const H2H_PATH = path.join(ROOT, "data", "h2h.json");

function usage(exitCode = 0) {
  console.log(`Add or update a curated head-to-head meeting.

Usage:
  npm run h2h:add -- --date 2022-11-18 --home BEL --away EGY --score 1-2 --competition "International Friendly" --venue "Jaber Al-Ahmad International Stadium" --location "Kuwait City"

Required:
  --date YYYY-MM-DD
  --home FIFA_CODE
  --away FIFA_CODE
  --score HOME-AWAY
  --competition TEXT
  --venue TEXT

Optional:
  --location TEXT
  --note TEXT
`);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === "--help" || token === "-h") usage(0);
    if (!token.startsWith("--")) usage(1);
    const key = token.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) usage(1);
    out[key] = value;
    i++;
  }
  return out;
}

function required(args, key) {
  const value = args[key]?.trim();
  if (!value) {
    console.error(`Missing --${key}`);
    usage(1);
  }
  return value;
}

function parseScore(raw) {
  const match = raw.match(/^(\d+)\s*[-:]\s*(\d+)$/);
  if (!match) {
    console.error("--score must look like 1-2");
    usage(1);
  }
  return [Number(match[1]), Number(match[2])];
}

function sortedKey(homeCode, awayCode) {
  return [homeCode, awayCode].sort().join("-");
}

function recomputeRecord(record, aCode, bCode) {
  const meetings = record.meetings ?? [];
  let aWins = 0;
  let bWins = 0;
  let draws = 0;

  for (const meeting of meetings) {
    const homeWon = meeting.homeScore > meeting.awayScore;
    const awayWon = meeting.awayScore > meeting.homeScore;
    if (!homeWon && !awayWon) {
      draws++;
      continue;
    }
    const winner = homeWon ? meeting.homeCode : meeting.awayCode;
    if (winner === aCode) aWins++;
    else if (winner === bCode) bWins++;
  }

  record.played = meetings.length;
  record.aWins = aWins;
  record.draws = draws;
  record.bWins = bWins;

  const latest = [...meetings].sort((x, y) => y.date.localeCompare(x.date))[0];
  if (latest) {
    record.lastMeeting = `${latest.date.slice(0, 4)} ${latest.competition} - ${latest.homeCode} ${latest.homeScore}-${latest.awayScore} ${latest.awayCode}`;
  }
}

const args = parseArgs(process.argv.slice(2));
const date = required(args, "date");
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error("--date must be YYYY-MM-DD");
  usage(1);
}

const homeCode = required(args, "home").toUpperCase();
const awayCode = required(args, "away").toUpperCase();
if (homeCode === awayCode) {
  console.error("--home and --away must be different teams");
  usage(1);
}

const [homeScore, awayScore] = parseScore(required(args, "score"));
const competition = required(args, "competition");
const venue = required(args, "venue");
const location = args.location?.trim() ?? "";
const note = args.note?.trim();

const data = JSON.parse(fs.readFileSync(H2H_PATH, "utf8"));
const [aCode, bCode] = [homeCode, awayCode].sort();
const key = sortedKey(homeCode, awayCode);
const record =
  data[key] ??
  (data[key] = {
    played: 0,
    aWins: 0,
    draws: 0,
    bWins: 0,
    lastMeeting: "",
    note: "",
    meetings: [],
  });

record.meetings ??= [];
const meeting = {
  date,
  homeCode,
  awayCode,
  homeScore,
  awayScore,
  competition,
  venue,
  location,
};

const existingIndex = record.meetings.findIndex((m) => m.date === date && m.homeCode === homeCode && m.awayCode === awayCode);
if (existingIndex >= 0) record.meetings[existingIndex] = meeting;
else record.meetings.push(meeting);

record.meetings.sort((x, y) => y.date.localeCompare(x.date));
if (note !== undefined) record.note = note;
recomputeRecord(record, aCode, bCode);

const ordered = Object.fromEntries(Object.entries(data).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(H2H_PATH, `${JSON.stringify(ordered, null, 2)}\n`);

console.log(`Updated ${key}: ${record.played} meetings`);
