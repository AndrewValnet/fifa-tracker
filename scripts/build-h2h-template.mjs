import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TEAMS_PATH = path.join(ROOT, "data", "teams.json");
const OUT_PATH = path.join(ROOT, "data", "h2h-import.json");

const teams = JSON.parse(fs.readFileSync(TEAMS_PATH, "utf8"));
const out = {};

for (let i = 0; i < teams.length; i++) {
  for (let j = i + 1; j < teams.length; j++) {
    const a = teams[i].code;
    const b = teams[j].code;
    out[`${a}-${b}`] = {
      played: 0,
      aWins: 0,
      draws: 0,
      bWins: 0,
      lastMeeting: "",
      note: "",
      meetings: [],
    };
  }
}

fs.writeFileSync(OUT_PATH, `${JSON.stringify(out, null, 2)}\n`);
console.log(`Wrote template with ${Object.keys(out).length} pairings to ${path.relative(ROOT, OUT_PATH)}`);
