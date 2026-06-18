#!/usr/bin/env python3
"""
Download and filter the Kaggle international football results dataset down to
the current FIFA World Cup nations in data/teams.json.

Expected Kaggle dataset:
  martj42/international-football-results-from-1872-to-2017

Output:
  data/h2h-kaggle-filtered.json

This script keeps only matches where both teams are in the current World Cup
field, then groups them into a head-to-head structure that matches the app's
curated H2H format.
"""

from __future__ import annotations

import csv
import json
from collections import defaultdict
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
TEAMS_PATH = ROOT / "data" / "teams.json"
OUTPUT_PATH = ROOT / "data" / "h2h-kaggle-filtered.json"


@dataclass
class Meeting:
    date: str
    homeCode: str
    awayCode: str
    homeScore: int
    awayScore: int
    competition: str
    venue: str
    location: str


def normalize_name(name: str) -> str:
    return (
        name.lower()
        .replace("&", "and")
        .replace(".", "")
        .replace("-", " ")
        .replace("'", "")
        .replace("cote d ivoire", "ivory coast")
        .replace("czechia", "czech republic")
        .replace("south korea", "korea republic")
        .replace("bosnia and herzegovina", "bosnia and herzegovina")
        .strip()
    )


def load_team_map() -> dict[str, str]:
    teams = json.loads(TEAMS_PATH.read_text(encoding="utf-8"))
    out: dict[str, str] = {}
    for team in teams:
        code = team["code"]
        name = team["name"]
        out[normalize_name(name)] = code

    # common dataset aliases
    out.update(
        {
            "united states": "USA",
            "united states of america": "USA",
            "ivory coast": "CIV",
            "cote d'ivoire": "CIV",
            "cote d ivoire": "CIV",
            "czech republic": "CZE",
            "czechia": "CZE",
            "bosnia and herzegovina": "BIH",
            "cape verde": "CPV",
            "curacao": "CUW",
            "south korea": "KOR",
            "korea republic": "KOR",
            "iran": "IRN",
            "saudi arabia": "KSA",
            "the netherlands": "NED",
            "netherlands": "NED",
        }
    )
    return out


def normalize_tournament(name: str) -> str:
    name = name.strip()
    if name == "FIFA World Cup qualification":
        return "World Cup qualifier"
    return name or "Friendly"


def build_h2h(meetings: list[Meeting]) -> dict[str, Any]:
    meetings.sort(key=lambda m: m.date, reverse=True)
    a_wins = b_wins = draws = 0
    for m in meetings:
        if m.homeScore > m.awayScore:
            a_wins += 1
        elif m.awayScore > m.homeScore:
            b_wins += 1
        else:
            draws += 1

    latest = meetings[0] if meetings else None
    return {
        "played": len(meetings),
        "aWins": a_wins,
        "draws": draws,
        "bWins": b_wins,
        "lastMeeting": (
            f"{latest.date[:4]} {latest.competition} - {latest.homeCode} {latest.homeScore}-{latest.awayScore} {latest.awayCode}"
            if latest
            else ""
        ),
        "note": "Filtered from Kaggle international football results; venue/location are dataset-derived when available.",
        "meetings": [asdict(m) for m in meetings],
    }


def main() -> None:
    try:
        import kagglehub  # type: ignore
    except ImportError as exc:
        raise SystemExit(
            "kagglehub is not installed. Run: pip install kagglehub"
        ) from exc

    team_map = load_team_map()
    dataset_path = Path(kagglehub.dataset_download("martj42/international-football-results-from-1872-to-2017"))
    csv_path = dataset_path / "results.csv"
    if not csv_path.exists():
        raise SystemExit(f"Could not find results.csv in {dataset_path}")

    pairings: dict[str, list[Meeting]] = defaultdict(list)

    with csv_path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            home_name = row.get("home_team", "").strip()
            away_name = row.get("away_team", "").strip()
            home = team_map.get(normalize_name(home_name))
            away = team_map.get(normalize_name(away_name))
            if not home or not away:
                continue

            try:
                home_score = int(row.get("home_score", "0") or 0)
                away_score = int(row.get("away_score", "0") or 0)
            except ValueError:
                continue

            date = (row.get("date") or "").strip()
            if not date:
                continue

            tournament = normalize_tournament(row.get("tournament", ""))
            city = (row.get("city") or "").strip()
            country = (row.get("country") or "").strip()
            venue = city or "Unknown"
            location = country or "Unknown"
            key = "-".join(sorted([home, away]))

            pairings[key].append(
                Meeting(
                    date=date,
                    homeCode=home,
                    awayCode=away,
                    homeScore=home_score,
                    awayScore=away_score,
                    competition=tournament,
                    venue=venue,
                    location=location,
                )
            )

    output: dict[str, Any] = {}
    for key, meetings in pairings.items():
        output[key] = build_h2h(meetings)

    OUTPUT_PATH.write_text(json.dumps(dict(sorted(output.items())), indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(output)} filtered head-to-head pairings to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
