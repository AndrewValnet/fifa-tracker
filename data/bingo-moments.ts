export interface BingoMoment {
  id: string;
  text: string;
  emoji: string;
  category: "goals" | "drama" | "cards" | "records" | "fan";
}

export const FREE_CELL: BingoMoment = {
  id: "free",
  text: "FREE",
  emoji: "🏆",
  category: "records",
};

export const BINGO_MOMENTS: BingoMoment[] = [
  {
    id: "hat-trick",
    text: "Hat-trick scored",
    emoji: "⚽",
    category: "goals",
  },
  {
    id: "gk-yellow",
    text: "Goalkeeper yellow card",
    emoji: "🟨",
    category: "cards",
  },
  {
    id: "var-overturns",
    text: "VAR overturns goal",
    emoji: "📺",
    category: "drama",
  },
  {
    id: "own-goal-final",
    text: "Own goal in final",
    emoji: "😬",
    category: "goals",
  },
  {
    id: "penalty-shootout",
    text: "Penalty shootout",
    emoji: "🥅",
    category: "drama",
  },
  {
    id: "red-card-30",
    text: "Red card before 30'",
    emoji: "🟥",
    category: "cards",
  },
  {
    id: "five-nil",
    text: "5-0 or bigger win",
    emoji: "🔥",
    category: "records",
  },
  {
    id: "messi-goal",
    text: "Messi goal",
    emoji: "🐐",
    category: "goals",
  },
  {
    id: "ronaldo-goal",
    text: "Ronaldo goal",
    emoji: "⭐",
    category: "goals",
  },
  {
    id: "stoppage-winner",
    text: "Stoppage time winner",
    emoji: "⏱️",
    category: "drama",
  },
  {
    id: "var-red-card",
    text: "Player sent off by VAR",
    emoji: "🖥️",
    category: "cards",
  },
  {
    id: "corner-goal",
    text: "Corner kick goal",
    emoji: "📐",
    category: "goals",
  },
  // FREE cell is inserted at index 12 (center of 5x5) by the page component
  {
    id: "freekick-goal",
    text: "Free kick goal",
    emoji: "🎯",
    category: "goals",
  },
  {
    id: "debut-goal",
    text: "Debut international goal",
    emoji: "🌟",
    category: "records",
  },
  {
    id: "scores-vs-own",
    text: "Scores vs own country",
    emoji: "😮",
    category: "drama",
  },
  {
    id: "two-yellows",
    text: "Two yellows same match",
    emoji: "🟨🟨",
    category: "cards",
  },
  {
    id: "gk-saves-pen",
    text: "Goalkeeper saves penalty",
    emoji: "🧤",
    category: "drama",
  },
  {
    id: "comeback-80",
    text: "80+ min comeback",
    emoji: "💪",
    category: "drama",
  },
  {
    id: "extra-time",
    text: "Match goes to extra time",
    emoji: "⏰",
    category: "drama",
  },
  {
    id: "three-in-half",
    text: "Team scores 3+ in half",
    emoji: "💥",
    category: "records",
  },
  {
    id: "yellow-5min",
    text: "Yellow card in 1st 5 min",
    emoji: "⚡",
    category: "cards",
  },
  {
    id: "ref-controversy",
    text: "Referee controversy",
    emoji: "😤",
    category: "drama",
  },
  {
    id: "star-injury",
    text: "Star player injured",
    emoji: "🏥",
    category: "drama",
  },
  {
    id: "pitch-invasion",
    text: "Fan pitch invasion attempt",
    emoji: "🏃",
    category: "fan",
  },
];
