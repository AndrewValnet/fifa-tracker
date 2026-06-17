export interface InjuryRecord {
  teamCode: string;
  player: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  injury: string;
  status: "out" | "doubt" | "returned";
  note: string;
}

export const INJURIES: InjuryRecord[] = [
  // England
  {
    teamCode: "ENG",
    player: "Luke Shaw",
    position: "DEF",
    injury: "Hamstring strain",
    status: "doubt",
    note: "Recurring left hamstring issue; returned to training days before squad departure.",
  },
  {
    teamCode: "ENG",
    player: "Ben Chilwell",
    position: "DEF",
    injury: "Knee ligament",
    status: "out",
    note: "Ruptured ACL in April; confirmed miss for the entire tournament.",
  },

  // Brazil
  {
    teamCode: "BRA",
    player: "Neymar Jr.",
    position: "FWD",
    injury: "Ankle ligament",
    status: "doubt",
    note: "Recurring ankle issues throughout his career; fitness being monitored daily.",
  },
  {
    teamCode: "BRA",
    player: "Gabriel Jesus",
    position: "FWD",
    injury: "Knee cartilage",
    status: "returned",
    note: "Missed final two Arsenal games of the season but declared fit after scan.",
  },

  // France
  {
    teamCode: "FRA",
    player: "Adrien Rabiot",
    position: "MID",
    injury: "Thigh strain",
    status: "doubt",
    note: "Picked up knock in Juventus training; included in squad with question mark.",
  },
  {
    teamCode: "FRA",
    player: "Lucas Hernandez",
    position: "DEF",
    injury: "Achilles tendinopathy",
    status: "out",
    note: "Chronic tendon issue flared up in May; ruled out for the whole competition.",
  },

  // Spain
  {
    teamCode: "ESP",
    player: "Pedri",
    position: "MID",
    injury: "Knee contusion",
    status: "returned",
    note: "Bruised knee in late May; cleared by Barcelona medical staff before squad named.",
  },
  {
    teamCode: "ESP",
    player: "Gavi",
    position: "MID",
    injury: "Knee (ACL recovery)",
    status: "doubt",
    note: "Returned from long ACL rehab in March; Spain are managing his minutes carefully.",
  },

  // Portugal
  {
    teamCode: "POR",
    player: "Diogo Jota",
    position: "FWD",
    injury: "Calf muscle tear",
    status: "out",
    note: "Suffered a grade-2 tear in Liverpool's final league fixture; will not recover in time.",
  },
  {
    teamCode: "POR",
    player: "Nuno Mendes",
    position: "DEF",
    injury: "Groin strain",
    status: "doubt",
    note: "Pulled up in PSG training; travelling with squad but fitness race against the clock.",
  },

  // Germany
  {
    teamCode: "GER",
    player: "Leroy Sané",
    position: "FWD",
    injury: "Ankle knock",
    status: "returned",
    note: "Twisted ankle in Bayern Munich's last Bundesliga game; scan showed no ligament damage.",
  },
  {
    teamCode: "GER",
    player: "Toni Kroos",
    position: "MID",
    injury: "Muscle fatigue",
    status: "doubt",
    note: "Came out of retirement for WC26; team managing his physical load at age 36.",
  },

  // Argentina
  {
    teamCode: "ARG",
    player: "Ángel Di María",
    position: "FWD",
    injury: "Muscle fatigue / fitness concern",
    status: "doubt",
    note: "At 38, coaching staff watching his conditioning carefully after a long season.",
  },
  {
    teamCode: "ARG",
    player: "Alejandro Garnacho",
    position: "FWD",
    injury: "Hamstring tightness",
    status: "returned",
    note: "Reported tightness post-Man Utd season; precautionary week's rest confirmed him fit.",
  },

  // Italy
  {
    teamCode: "ITA",
    player: "Federico Chiesa",
    position: "FWD",
    injury: "Knee discomfort",
    status: "doubt",
    note: "Managed knee issue throughout the season at Liverpool; fitness monitored pre-tournament.",
  },

  // Netherlands
  {
    teamCode: "NED",
    player: "Virgil van Dijk",
    position: "DEF",
    injury: "Groin strain",
    status: "returned",
    note: "Minor strain picked up in Liverpool's penultimate match; scan clear, no lasting damage.",
  },

  // Morocco
  {
    teamCode: "MAR",
    player: "Romain Saïss",
    position: "DEF",
    injury: "Hamstring",
    status: "out",
    note: "Veteran defender tore hamstring in training; out for the entirety of WC 2026.",
  },

  // Japan
  {
    teamCode: "JPN",
    player: "Takehiro Tomiyasu",
    position: "DEF",
    injury: "Knee inflammation",
    status: "doubt",
    note: "Chronic knee issue; Arsenal cleared him to join squad but Japan are being cautious.",
  },

  // United States
  {
    teamCode: "USA",
    player: "Gio Reyna",
    position: "MID",
    injury: "Hamstring strain",
    status: "returned",
    note: "History of hamstring problems; latest strain was minor and he trained fully this week.",
  },

  // Mexico
  {
    teamCode: "MEX",
    player: "Hirving Lozano",
    position: "FWD",
    injury: "Shoulder",
    status: "returned",
    note: "Had shoulder surgery in late 2025; completed full pre-tournament camp without issues.",
  },
];
