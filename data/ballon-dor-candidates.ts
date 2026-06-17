export interface GoldenBallCandidate {
  id: string;
  name: string;
  club: string;
  teamCode: string;
}

export const GOLDEN_BALL_CANDIDATES: GoldenBallCandidate[] = [
  // Frontrunners
  { id: "mbappe", name: "Kylian Mbappé", club: "Real Madrid", teamCode: "FRA" },
  { id: "vinicius", name: "Vinícius Jr.", club: "Real Madrid", teamCode: "BRA" },
  { id: "bellingham", name: "Jude Bellingham", club: "Real Madrid", teamCode: "ENG" },
  { id: "messi", name: "Lionel Messi", club: "Inter Miami", teamCode: "ARG" },
  // Spain
  { id: "yamal", name: "Lamine Yamal", club: "Barcelona", teamCode: "ESP" },
  { id: "pedri", name: "Pedri", club: "Barcelona", teamCode: "ESP" },
  { id: "rodri", name: "Rodri", club: "Manchester City", teamCode: "ESP" },
  { id: "williams", name: "Nico Williams", club: "Athletic Bilbao", teamCode: "ESP" },
  // Germany
  { id: "wirtz", name: "Florian Wirtz", club: "Bayern Munich", teamCode: "GER" },
  { id: "musiala", name: "Jamal Musiala", club: "Bayern Munich", teamCode: "GER" },
  // England
  { id: "saka", name: "Bukayo Saka", club: "Arsenal", teamCode: "ENG" },
  { id: "kane", name: "Harry Kane", club: "Bayern Munich", teamCode: "ENG" },
  { id: "foden", name: "Phil Foden", club: "Manchester City", teamCode: "ENG" },
  // France
  { id: "dembele", name: "Ousmane Dembélé", club: "PSG", teamCode: "FRA" },
  { id: "tchouameni", name: "Aurélien Tchouaméni", club: "Real Madrid", teamCode: "FRA" },
  // Brazil
  { id: "raphinha", name: "Raphinha", club: "Barcelona", teamCode: "BRA" },
  { id: "rodrygo", name: "Rodrygo", club: "Real Madrid", teamCode: "BRA" },
  // Portugal
  { id: "ronaldo", name: "Cristiano Ronaldo", club: "Al Nassr", teamCode: "POR" },
  { id: "brunofernandes", name: "Bruno Fernandes", club: "Man United", teamCode: "POR" },
  { id: "leao", name: "Rafael Leão", club: "AC Milan", teamCode: "POR" },
  // Others
  { id: "salah", name: "Mohamed Salah", club: "Liverpool", teamCode: "EGY" },
  { id: "modric", name: "Luka Modrić", club: "Real Madrid", teamCode: "CRO" },
  { id: "gvardiol", name: "Joško Gvardiol", club: "Man City", teamCode: "CRO" },
  { id: "gakpo", name: "Cody Gakpo", club: "Liverpool", teamCode: "NED" },
  { id: "pulisic", name: "Christian Pulisic", club: "AC Milan", teamCode: "USA" },
  { id: "hakimi", name: "Achraf Hakimi", club: "PSG", teamCode: "MAR" },
  { id: "valverde", name: "Federico Valverde", club: "Real Madrid", teamCode: "URU" },
  { id: "depaultio", name: "Rodrigo De Paul", club: "Atlético Madrid", teamCode: "ARG" },
  { id: "diallo", name: "Ismaël Diallo", club: "Arsenal", teamCode: "SEN" },
  { id: "osimhen", name: "Victor Osimhen", club: "Galatasaray", teamCode: "NGA" },
];

export const GOLDEN_BALL_BONUS = 15;

export function goldenBallWinner(): string | null {
  return process.env.WC26_GOLDEN_BALL?.trim() || null;
}
