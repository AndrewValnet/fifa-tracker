export interface SetPieceStat {
  teamCode: string;
  teamName: string;
  openPlay: number;
  setpieces: number;
  penalties: number;
  total: number;
}

export const SET_PIECE_STATS: SetPieceStat[] = [
  { teamCode: "ARG", teamName: "Argentina",  openPlay: 9, setpieces: 4, penalties: 2, total: 15 },
  { teamCode: "BRA", teamName: "Brazil",     openPlay: 8, setpieces: 3, penalties: 1, total: 12 },
  { teamCode: "FRA", teamName: "France",     openPlay: 7, setpieces: 3, penalties: 3, total: 13 },
  { teamCode: "ENG", teamName: "England",    openPlay: 6, setpieces: 5, penalties: 2, total: 13 },
  { teamCode: "ESP", teamName: "Spain",      openPlay: 10, setpieces: 2, penalties: 1, total: 13 },
  { teamCode: "GER", teamName: "Germany",    openPlay: 7, setpieces: 4, penalties: 1, total: 12 },
  { teamCode: "POR", teamName: "Portugal",   openPlay: 8, setpieces: 2, penalties: 3, total: 13 },
  { teamCode: "NED", teamName: "Netherlands",openPlay: 6, setpieces: 4, penalties: 2, total: 12 },
  { teamCode: "BEL", teamName: "Belgium",    openPlay: 5, setpieces: 3, penalties: 1, total:  9 },
  { teamCode: "URU", teamName: "Uruguay",    openPlay: 5, setpieces: 4, penalties: 2, total: 11 },
  { teamCode: "USA", teamName: "USA",        openPlay: 6, setpieces: 2, penalties: 1, total:  9 },
  { teamCode: "MEX", teamName: "Mexico",     openPlay: 4, setpieces: 3, penalties: 1, total:  8 },
];
