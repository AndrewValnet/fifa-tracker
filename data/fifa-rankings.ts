export interface FifaRankingEntry {
  rank: number
  code: string       // FIFA 3-letter code
  name: string
  points: number
  change: number     // positions gained (+) or lost (-) vs previous ranking
  confederation: string
}

export const FIFA_RANKINGS: FifaRankingEntry[] = [
  { rank: 1, code: "ARG", name: "Argentina", points: 1871, change: 0, confederation: "CONMEBOL" },
  { rank: 2, code: "FRA", name: "France", points: 1840, change: 0, confederation: "UEFA" },
  { rank: 3, code: "ENG", name: "England", points: 1820, change: 1, confederation: "UEFA" },
  { rank: 4, code: "BEL", name: "Belgium", points: 1795, change: -1, confederation: "UEFA" },
  { rank: 5, code: "BRA", name: "Brazil", points: 1782, change: 0, confederation: "CONMEBOL" },
  { rank: 6, code: "POR", name: "Portugal", points: 1764, change: 2, confederation: "UEFA" },
  { rank: 7, code: "NED", name: "Netherlands", points: 1748, change: -1, confederation: "UEFA" },
  { rank: 8, code: "ESP", name: "Spain", points: 1742, change: -1, confederation: "UEFA" },
  { rank: 9, code: "GER", name: "Germany", points: 1719, change: 2, confederation: "UEFA" },
  { rank: 10, code: "URU", name: "Uruguay", points: 1706, change: -1, confederation: "CONMEBOL" },
  { rank: 11, code: "USA", name: "United States", points: 1698, change: 3, confederation: "CONCACAF" },
  { rank: 12, code: "MEX", name: "Mexico", points: 1680, change: -1, confederation: "CONCACAF" },
  { rank: 13, code: "CRO", name: "Croatia", points: 1672, change: -1, confederation: "UEFA" },
  { rank: 14, code: "ITA", name: "Italy", points: 1663, change: 2, confederation: "UEFA" },
  { rank: 15, code: "DEN", name: "Denmark", points: 1651, change: -1, confederation: "UEFA" },
  { rank: 16, code: "COL", name: "Colombia", points: 1638, change: 1, confederation: "CONMEBOL" },
  { rank: 17, code: "MAR", name: "Morocco", points: 1624, change: 3, confederation: "CAF" },
  { rank: 18, code: "SUI", name: "Switzerland", points: 1618, change: -2, confederation: "UEFA" },
  { rank: 19, code: "JPN", name: "Japan", points: 1608, change: 2, confederation: "AFC" },
  { rank: 20, code: "SEN", name: "Senegal", points: 1597, change: -1, confederation: "CAF" },
  { rank: 21, code: "KOR", name: "South Korea", points: 1579, change: 1, confederation: "AFC" },
  { rank: 22, code: "ECU", name: "Ecuador", points: 1563, change: -1, confederation: "CONMEBOL" },
  { rank: 23, code: "AUT", name: "Austria", points: 1551, change: 4, confederation: "UEFA" },
  { rank: 24, code: "POL", name: "Poland", points: 1544, change: -1, confederation: "UEFA" },
  { rank: 25, code: "TUR", name: "Türkiye", points: 1531, change: 2, confederation: "UEFA" },
  { rank: 26, code: "AUS", name: "Australia", points: 1519, change: -1, confederation: "AFC" },
  { rank: 27, code: "CMR", name: "Cameroon", points: 1504, change: 0, confederation: "CAF" },
  { rank: 28, code: "NGA", name: "Nigeria", points: 1496, change: 1, confederation: "CAF" },
  { rank: 29, code: "IRI", name: "Iran", points: 1483, change: -2, confederation: "AFC" },
  { rank: 30, code: "SRB", name: "Serbia", points: 1471, change: 1, confederation: "UEFA" },
  { rank: 31, code: "HUN", name: "Hungary", points: 1458, change: 2, confederation: "UEFA" },
  { rank: 32, code: "CIV", name: "Côte d'Ivoire", points: 1446, change: -1, confederation: "CAF" },
  { rank: 33, code: "QAT", name: "Qatar", points: 1432, change: 0, confederation: "AFC" },
  { rank: 34, code: "RSA", name: "South Africa", points: 1418, change: 2, confederation: "CAF" },
  { rank: 35, code: "ALG", name: "Algeria", points: 1405, change: -1, confederation: "CAF" },
  { rank: 36, code: "CAN", name: "Canada", points: 1398, change: 5, confederation: "CONCACAF" },
  { rank: 37, code: "GEO", name: "Georgia", points: 1385, change: 3, confederation: "UEFA" },
  { rank: 38, code: "VEN", name: "Venezuela", points: 1372, change: 2, confederation: "CONMEBOL" },
  { rank: 39, code: "PER", name: "Peru", points: 1359, change: -1, confederation: "CONMEBOL" },
  { rank: 40, code: "PAR", name: "Paraguay", points: 1348, change: -2, confederation: "CONMEBOL" },
  { rank: 41, code: "BOL", name: "Bolivia", points: 1334, change: 1, confederation: "CONMEBOL" },
  { rank: 42, code: "CRC", name: "Costa Rica", points: 1322, change: -2, confederation: "CONCACAF" },
  { rank: 43, code: "EGY", name: "Egypt", points: 1311, change: 1, confederation: "CAF" },
  { rank: 44, code: "SAU", name: "Saudi Arabia", points: 1298, change: 0, confederation: "AFC" },
  { rank: 45, code: "SLO", name: "Slovenia", points: 1284, change: 3, confederation: "UEFA" },
  { rank: 46, code: "SVK", name: "Slovakia", points: 1271, change: -1, confederation: "UEFA" },
  { rank: 47, code: "NZL", name: "New Zealand", points: 1258, change: 0, confederation: "OFC" },
  { rank: 48, code: "THA", name: "Thailand", points: 1109, change: 2, confederation: "AFC" },
]
