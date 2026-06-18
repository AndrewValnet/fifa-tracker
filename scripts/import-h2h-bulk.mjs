import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const H2H_PATH = path.join(ROOT, "data", "h2h.json");
const DEFAULT_INPUT = path.join(ROOT, "data", "h2h-import.json");

function usage(exitCode = 0) {
  console.log(`Bulk import curated head-to-head records.

Usage:
  npm run h2h:bulk -- --input data/h2h-import.json

Input format:
  {
    "ENG-CRO": {
      "played": 12,
      "aWins": 7,
      "draws": 2,
      "bWins": 3,
      "lastMeeting": "2026 WC group stage",
      "note": "...",
      "meetings": [
        {
          "date": "2026-06-17",
          "homeCode": "ENG",
          "awayCode": "CRO",
          "homeScore": 4,
          "awayScore": 2,
          "competition": "FIFA World Cup",
          "venue": "AT&T Stadium",
          "location": "Arlington, USA"
        }
      ]
    }
  }
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

function normalizeRecord(key, record) {
  if (!record || typeof record !== "object") throw new Error(`Bad record for ${key}`);
  const meetings = Array.isArray(record.meetings) ? record.meetings : [];
  meetings.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return {
    played: Number(record.played ?? meetings.length),
    aWins: Number(record.aWins ?? 0),
    draws: Number(record.draws ?? 0),
    bWins: Number(record.bWins ?? 0),
    lastMeeting: String(record.lastMeeting ?? ""),
    note: String(record.note ?? ""),
    meetings,
  };
}

const args = parseArgs(process.argv.slice(2));
const inputPath = path.resolve(ROOT, args.input ?? DEFAULT_INPUT);

if (!fs.existsSync(inputPath)) {
  console.error(`Input file not found: ${inputPath}`);
  usage(1);
}

const raw = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const existing = JSON.parse(fs.readFileSync(H2H_PATH, "utf8"));

for (const [key, value] of Object.entries(raw)) {
  if (!/^[A-Z]{3}-[A-Z]{3}$/.test(key)) continue;
  existing[key] = normalizeRecord(key, value);
}

const ordered = Object.fromEntries(Object.entries(existing).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(H2H_PATH, `${JSON.stringify(ordered, null, 2)}\n`);

console.log(`Imported ${Object.keys(raw).length} head-to-head entries from ${path.relative(ROOT, inputPath)}`);
