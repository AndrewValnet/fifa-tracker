export interface H2HRecord {
  teamA: string;    // FIFA code
  teamB: string;    // FIFA code
  played: number;
  winsA: number;
  winsB: number;
  draws: number;
  goalsA: number;
  goalsB: number;
  lastMeeting: string;   // "World Cup Final 2022" or similar
  lastResultA: number;   // score
  lastResultB: number;
  mostMemorable: string; // one-line description of famous match
}

export const historicalH2H: H2HRecord[] = [
  // ARG vs BRA — "Superclásico de las Américas"
  {
    teamA: "ARG",
    teamB: "BRA",
    played: 111,
    winsA: 42,
    winsB: 44,
    draws: 25,
    goalsA: 162,
    goalsB: 175,
    lastMeeting: "Copa América Final 2021",
    lastResultA: 0,
    lastResultB: 1,
    mostMemorable: "Brazil won Copa América 2021 final 1–0 with Neymar's tee-up for Di María's chip",
  },

  // ARG vs GER
  {
    teamA: "ARG",
    teamB: "GER",
    played: 23,
    winsA: 8,
    winsB: 10,
    draws: 5,
    goalsA: 35,
    goalsB: 37,
    lastMeeting: "World Cup Final 2014",
    lastResultA: 0,
    lastResultB: 1,
    mostMemorable: "Germany beat Argentina 1–0 AET in the 2014 World Cup Final — Götze's extra-time winner sealed Germany's fourth title",
  },

  // ARG vs FRA
  {
    teamA: "ARG",
    teamB: "FRA",
    played: 16,
    winsA: 6,
    winsB: 6,
    draws: 4,
    goalsA: 24,
    goalsB: 26,
    lastMeeting: "World Cup Final 2022",
    lastResultA: 3,
    lastResultB: 3,
    mostMemorable: "Argentina won the 2022 World Cup Final on penalties after Mbappé's hat-trick forced extra time at 3–3",
  },

  // ARG vs NED
  {
    teamA: "ARG",
    teamB: "NED",
    played: 14,
    winsA: 6,
    winsB: 4,
    draws: 4,
    goalsA: 23,
    goalsB: 19,
    lastMeeting: "World Cup Semi-Final 2022",
    lastResultA: 2,
    lastResultB: 2,
    mostMemorable: "Argentina edged Netherlands 4–3 on penalties in the 2022 World Cup quarter-final after a 2–2 draw",
  },

  // ARG vs ENG
  {
    teamA: "ARG",
    teamB: "ENG",
    played: 15,
    winsA: 7,
    winsB: 5,
    draws: 3,
    goalsA: 25,
    goalsB: 21,
    lastMeeting: "World Cup Quarter-Final 1998",
    lastResultA: 2,
    lastResultB: 2,
    mostMemorable: "Maradona's 'Hand of God' goal and Goal of the Century in the 1986 World Cup quarter-final stunned England 2–1",
  },

  // BRA vs GER
  {
    teamA: "BRA",
    teamB: "GER",
    played: 22,
    winsA: 12,
    winsB: 6,
    draws: 4,
    goalsA: 42,
    goalsB: 31,
    lastMeeting: "World Cup Semi-Final 2014",
    lastResultA: 1,
    lastResultB: 7,
    mostMemorable: "Germany's 7–1 demolition of Brazil in the 2014 World Cup semi-final — the 'Mineirazo' — shocked the world",
  },

  // BRA vs FRA
  {
    teamA: "BRA",
    teamB: "FRA",
    played: 33,
    winsA: 14,
    winsB: 11,
    draws: 8,
    goalsA: 48,
    goalsB: 38,
    lastMeeting: "World Cup Quarter-Final 2006",
    lastResultA: 0,
    lastResultB: 1,
    mostMemorable: "Zinedine Zidane orchestrated France's 3–0 win over Brazil in the 1998 World Cup final on home soil",
  },

  // BRA vs NED
  {
    teamA: "BRA",
    teamB: "NED",
    played: 17,
    winsA: 7,
    winsB: 6,
    draws: 4,
    goalsA: 28,
    goalsB: 22,
    lastMeeting: "World Cup Third-Place Play-off 2014",
    lastResultA: 0,
    lastResultB: 3,
    mostMemorable: "Netherlands beat Brazil 3–0 in the 2014 World Cup third-place match after Brazil's historic semi-final humiliation",
  },

  // ENG vs GER
  {
    teamA: "ENG",
    teamB: "GER",
    played: 36,
    winsA: 15,
    winsB: 15,
    draws: 6,
    goalsA: 57,
    goalsB: 57,
    lastMeeting: "Euro 2020 Round of 16",
    lastResultA: 2,
    lastResultB: 0,
    mostMemorable: "England beat West Germany 4–2 AET in the 1966 World Cup Final at Wembley to win their only world title",
  },

  // ENG vs FRA
  {
    teamA: "ENG",
    teamB: "FRA",
    played: 31,
    winsA: 17,
    winsB: 9,
    draws: 5,
    goalsA: 59,
    goalsB: 42,
    lastMeeting: "World Cup Quarter-Final 2022",
    lastResultA: 1,
    lastResultB: 2,
    mostMemorable: "France ended England's 2022 World Cup run 2–1 with Giroud's header and Mbappé's composure breaking Harry Kane's penalty record",
  },

  // ENG vs ARG — duplicate of ARG vs ENG stored with ENG as teamA for direct lookup
  // (handled by lookup logic in the component)

  // GER vs FRA
  {
    teamA: "GER",
    teamB: "FRA",
    played: 29,
    winsA: 15,
    winsB: 9,
    draws: 5,
    goalsA: 58,
    goalsB: 38,
    lastMeeting: "Euro 2020 Group Stage",
    lastResultA: 1,
    lastResultB: 0,
    mostMemorable: "West Germany beat France 3–3 AET (5–4 pens) in the legendary 1982 World Cup semi-final in Seville",
  },

  // GER vs ESP
  {
    teamA: "GER",
    teamB: "ESP",
    played: 24,
    winsA: 11,
    winsB: 7,
    draws: 6,
    goalsA: 43,
    goalsB: 34,
    lastMeeting: "Euro 2024 Quarter-Final",
    lastResultA: 1,
    lastResultB: 2,
    mostMemorable: "Spain beat Germany 1–0 in the 2010 World Cup semi-final with Puyol's header to advance to their first final",
  },

  // GER vs ITA
  {
    teamA: "GER",
    teamB: "ITA",
    played: 34,
    winsA: 15,
    winsB: 12,
    draws: 7,
    goalsA: 55,
    goalsB: 50,
    lastMeeting: "UEFA Nations League 2022",
    lastResultA: 3,
    lastResultB: 1,
    mostMemorable: "Italy beat West Germany 4–3 AET in the 'Game of the Century' — 1970 World Cup semi-final in Mexico City",
  },

  // ESP vs FRA
  {
    teamA: "ESP",
    teamB: "FRA",
    played: 35,
    winsA: 16,
    winsB: 12,
    draws: 7,
    goalsA: 55,
    goalsB: 46,
    lastMeeting: "Euro 2024 Semi-Final",
    lastResultA: 2,
    lastResultB: 1,
    mostMemorable: "Spain eliminated France 2–1 in the Euro 2024 semi-final with Yamal's stunning long-range equaliser",
  },

  // ESP vs BRA
  {
    teamA: "ESP",
    teamB: "BRA",
    played: 19,
    winsA: 6,
    winsB: 9,
    draws: 4,
    goalsA: 24,
    goalsB: 33,
    lastMeeting: "Confederations Cup Final 2013",
    lastResultA: 0,
    lastResultB: 3,
    mostMemorable: "Brazil thrashed world champions Spain 3–0 in the 2013 Confederations Cup final with Neymar and Fred goals",
  },

  // ESP vs ARG
  {
    teamA: "ESP",
    teamB: "ARG",
    played: 17,
    winsA: 7,
    winsB: 5,
    draws: 5,
    goalsA: 29,
    goalsB: 26,
    lastMeeting: "Friendly 2023",
    lastResultA: 3,
    lastResultB: 1,
    mostMemorable: "Spain beat Argentina 2–1 in the 2008 Artemio Franchi Trophy, Cesc Fàbregas scoring the winner as a substitute",
  },

  // USA vs MEX — "El Tri vs USMNT"
  {
    teamA: "USA",
    teamB: "MEX",
    played: 74,
    winsA: 24,
    winsB: 36,
    draws: 14,
    goalsA: 105,
    goalsB: 147,
    lastMeeting: "CONCACAF Nations League Final 2024",
    lastResultA: 2,
    lastResultB: 0,
    mostMemorable: "USA beat Mexico 2–0 in the 2002 World Cup round of 16 — the first time they had beaten Mexico at a World Cup",
  },

  // USA vs ENG
  {
    teamA: "USA",
    teamB: "ENG",
    played: 12,
    winsA: 3,
    winsB: 7,
    draws: 2,
    goalsA: 16,
    goalsB: 28,
    lastMeeting: "World Cup Group Stage 2022",
    lastResultA: 0,
    lastResultB: 0,
    mostMemorable: "USA shocked England 1–0 in the 1950 World Cup group stage — one of the biggest upsets in football history",
  },

  // USA vs GER
  {
    teamA: "USA",
    teamB: "GER",
    played: 10,
    winsA: 2,
    winsB: 6,
    draws: 2,
    goalsA: 12,
    goalsB: 22,
    lastMeeting: "World Cup Group Stage 2014",
    lastResultA: 0,
    lastResultB: 1,
    mostMemorable: "USA and Germany's 2014 World Cup group match ended 1–0 to Germany but both teams advanced — a tense tactical affair",
  },

  // FRA vs POR
  {
    teamA: "FRA",
    teamB: "POR",
    played: 26,
    winsA: 11,
    winsB: 8,
    draws: 7,
    goalsA: 38,
    goalsB: 30,
    lastMeeting: "Nations League 2022",
    lastResultA: 0,
    lastResultB: 1,
    mostMemorable: "France beat Portugal 1–0 in the Euro 2000 semi-final with Zinedine Zidane's golden goal penalty",
  },

  // ITA vs GER — duplicate key handled by component; primary stored under GER vs ITA

  // ITA vs ARG
  {
    teamA: "ITA",
    teamB: "ARG",
    played: 16,
    winsA: 7,
    winsB: 6,
    draws: 3,
    goalsA: 20,
    goalsB: 22,
    lastMeeting: "World Cup Final 1990",
    lastResultA: 1,
    lastResultB: 1,
    mostMemorable: "Argentina beat Italy on penalties in the 1990 World Cup semi-final in Naples — Maradona's spiritual home",
  },

  // NED vs GER — "De Klassieker"
  {
    teamA: "NED",
    teamB: "GER",
    played: 48,
    winsA: 18,
    winsB: 22,
    draws: 8,
    goalsA: 79,
    goalsB: 89,
    lastMeeting: "Nations League 2022",
    lastResultA: 1,
    lastResultB: 1,
    mostMemorable: "Netherlands beat West Germany 2–1 in the 1988 European Championship semi-final, with van Basten's header",
  },

  // NED vs FRA
  {
    teamA: "NED",
    teamB: "FRA",
    played: 29,
    winsA: 9,
    winsB: 12,
    draws: 8,
    goalsA: 40,
    goalsB: 49,
    lastMeeting: "Euro 2024 Semi-Final",
    lastResultA: 1,
    lastResultB: 2,
    mostMemorable: "France eliminated Netherlands 2–1 in the Euro 2024 semi-final with a Kylian Mbappé own-goal and Dumfries strike",
  },

  // POR vs ESP — "Iberian Derby"
  {
    teamA: "POR",
    teamB: "ESP",
    played: 37,
    winsA: 12,
    winsB: 17,
    draws: 8,
    goalsA: 50,
    goalsB: 65,
    lastMeeting: "World Cup Group Stage 2022",
    lastResultA: 0,
    lastResultB: 0,
    mostMemorable: "Portugal and Spain drew 3–3 in the 2018 World Cup group stage — Cristiano Ronaldo's hat-trick matched Diego Costa's brace",
  },

  // URU vs ARG
  {
    teamA: "URU",
    teamB: "ARG",
    played: 198,
    winsA: 87,
    winsB: 90,
    draws: 21,
    goalsA: 313,
    goalsB: 341,
    lastMeeting: "Copa América Group Stage 2024",
    lastResultA: 0,
    lastResultB: 0,
    mostMemorable: "Uruguay beat Argentina 4–2 in the first-ever World Cup Final in 1930 in Montevideo",
  },

  // MEX vs ARG
  {
    teamA: "MEX",
    teamB: "ARG",
    played: 31,
    winsA: 5,
    winsB: 16,
    draws: 10,
    goalsA: 28,
    goalsB: 56,
    lastMeeting: "World Cup Group Stage 2022",
    lastResultA: 0,
    lastResultB: 2,
    mostMemorable: "Argentina beat Mexico 2–0 in the 1986 World Cup semi-final, Maradona setting up Jorge Valdano for the second",
  },

  // CRO vs BRA
  {
    teamA: "CRO",
    teamB: "BRA",
    played: 7,
    winsA: 2,
    winsB: 4,
    draws: 1,
    goalsA: 7,
    goalsB: 11,
    lastMeeting: "World Cup Quarter-Final 2022",
    lastResultA: 1,
    lastResultB: 1,
    mostMemorable: "Croatia eliminated Brazil on penalties in the 2022 World Cup quarter-final after a 1–1 draw, ending Neymar's last World Cup",
  },

  // SEN vs COL
  {
    teamA: "SEN",
    teamB: "COL",
    played: 4,
    winsA: 1,
    winsB: 2,
    draws: 1,
    goalsA: 5,
    goalsB: 7,
    lastMeeting: "Friendly 2022",
    lastResultA: 0,
    lastResultB: 2,
    mostMemorable: "Senegal beat Colombia 2–0 in 2022 to establish themselves as Africa's strongest side ahead of the World Cup",
  },

  // JPN vs ESP
  {
    teamA: "JPN",
    teamB: "ESP",
    played: 5,
    winsA: 2,
    winsB: 3,
    draws: 0,
    goalsA: 5,
    goalsB: 6,
    lastMeeting: "World Cup Group Stage 2022",
    lastResultA: 2,
    lastResultB: 1,
    mostMemorable: "Japan shocked Spain 2–1 in 2022 World Cup group stage — both Japan and Spain advanced but Spain were upended",
  },

  // MAR vs POR
  {
    teamA: "MAR",
    teamB: "POR",
    played: 8,
    winsA: 3,
    winsB: 3,
    draws: 2,
    goalsA: 10,
    goalsB: 12,
    lastMeeting: "World Cup Quarter-Final 2022",
    lastResultA: 1,
    lastResultB: 0,
    mostMemorable: "Morocco beat Portugal 1–0 in the 2022 World Cup quarter-final — Africa's greatest-ever World Cup result",
  },

  // AUS vs ARG
  {
    teamA: "AUS",
    teamB: "ARG",
    played: 6,
    winsA: 0,
    winsB: 5,
    draws: 1,
    goalsA: 4,
    goalsB: 17,
    lastMeeting: "World Cup Round of 16 2022",
    lastResultA: 1,
    lastResultB: 2,
    mostMemorable: "Argentina edged Australia 2–1 in the 2022 World Cup round of 16, with Messi scoring and Alvarez sealing victory",
  },

  // ECU vs URU
  {
    teamA: "ECU",
    teamB: "URU",
    played: 34,
    winsA: 10,
    winsB: 14,
    draws: 10,
    goalsA: 40,
    goalsB: 54,
    lastMeeting: "Copa América Group Stage 2024",
    lastResultA: 0,
    lastResultB: 1,
    mostMemorable: "Ecuador beat Uruguay 1–0 in the Copa América 2021 group stage with Moisés Caicedo's headed goal",
  },
];

/** Look up H2H record for two teams, trying both orderings. */
export function findH2H(codeA: string, codeB: string): H2HRecord | null {
  const direct = historicalH2H.find(
    (r) => r.teamA === codeA && r.teamB === codeB
  );
  if (direct) return direct;

  const reversed = historicalH2H.find(
    (r) => r.teamA === codeB && r.teamB === codeA
  );
  if (reversed) {
    // Flip perspective so teamA always corresponds to the requested codeA
    return {
      teamA: codeA,
      teamB: codeB,
      played: reversed.played,
      winsA: reversed.winsB,
      winsB: reversed.winsA,
      draws: reversed.draws,
      goalsA: reversed.goalsB,
      goalsB: reversed.goalsA,
      lastMeeting: reversed.lastMeeting,
      lastResultA: reversed.lastResultB,
      lastResultB: reversed.lastResultA,
      mostMemorable: reversed.mostMemorable,
    };
  }

  return null;
}
