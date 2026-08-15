import type { Competition, Metric, Player, PositionGroup } from "./types";

export const competitions: Competition[] = [
  { id: "premier-league", name: "Premier League", apiFootballId: 39 }, { id: "la-liga", name: "La Liga", apiFootballId: 140 },
  { id: "serie-a", name: "Serie A", apiFootballId: 135 }, { id: "bundesliga", name: "Bundesliga", apiFootballId: 78 },
  { id: "champions-league", name: "Champions League", apiFootballId: 2 },
];

export const seasons = ["2025/26", "2024/25", "2023/24"];
export const positionGroups: PositionGroup[] = ["All Players", "Goalkeepers", "Defenders", "Midfielders", "Forwards"];
export const metrics: Metric[] = [
  { key: "goals", label: "Goals / 90", shortLabel: "Goals" }, { key: "assists", label: "Assists / 90", shortLabel: "Assists" },
  { key: "shots", label: "Shots / 90", shortLabel: "Shots" }, { key: "keyPasses", label: "Key Passes / 90", shortLabel: "Key passes" },
  { key: "passes", label: "Passes / 90", shortLabel: "Passes" }, { key: "tackles", label: "Tackles / 90", shortLabel: "Tackles" },
  { key: "interceptions", label: "Interceptions / 90", shortLabel: "Interceptions" }, { key: "dribbles", label: "Successful dribbles / 90", shortLabel: "Dribbles" },
];

type Seed = [string, string, Player["position"], number, Partial<Player["metrics"]>];
const seeds: Seed[] = [
  ["haaland","Erling Haaland","Forwards",2390,{goals:0.94,assists:0.14,shots:4.05,keyPasses:0.72,dribbles:0.48}],
  ["salah","Mohamed Salah","Forwards",2512,{goals:0.78,assists:0.51,shots:3.62,keyPasses:2.18,dribbles:1.32}],
  ["saka","Bukayo Saka","Forwards",2180,{goals:0.49,assists:0.38,shots:3.08,keyPasses:2.61,dribbles:1.86}],
  ["palmer","Cole Palmer","Midfielders",2441,{goals:0.63,assists:0.39,shots:3.39,keyPasses:2.47,passes:43.8}],
  ["odegaard","Martin Ødegaard","Midfielders",2298,{goals:0.23,assists:0.34,keyPasses:2.74,passes:56.1}],
  ["bruno","Bruno Fernandes","Midfielders",2570,{goals:0.31,assists:0.35,shots:2.76,keyPasses:3.04,passes:54.7}],
  ["rice","Declan Rice","Midfielders",2654,{goals:0.16,assists:0.21,passes:61.4,tackles:1.74,interceptions:1.31}],
  ["rodri","Rodri","Midfielders",1842,{goals:0.21,assists:0.29,passes:88.6,tackles:2.03,interceptions:1.18}],
  ["caicedo","Moisés Caicedo","Midfielders",2450,{goals:0.08,passes:67.9,tackles:3.28,interceptions:1.62}],
  ["isak","Alexander Isak","Forwards",2110,{goals:0.72,assists:0.18,shots:3.44,keyPasses:1.11,dribbles:1.07}],
  ["watkins","Ollie Watkins","Forwards",2388,{goals:0.56,assists:0.31,shots:2.87,keyPasses:1.06}],
  ["son","Son Heung-min","Forwards",2076,{goals:0.54,assists:0.36,shots:2.98,keyPasses:1.86,dribbles:1.18}],
  ["gordon","Anthony Gordon","Forwards",2230,{goals:0.38,assists:0.27,shots:2.64,keyPasses:1.72,dribbles:1.64}],
  ["saliba","William Saliba","Defenders",2710,{passes:72.8,tackles:1.22,interceptions:1.04}],
  ["van-dijk","Virgil van Dijk","Defenders",2790,{goals:0.11,passes:78.4,tackles:0.84,interceptions:1.13}],
  ["gvardiol","Joško Gvardiol","Defenders",2405,{goals:0.19,assists:0.12,passes:69.1,tackles:1.61,interceptions:1.02}],
  ["trent","Trent Alexander-Arnold","Defenders",1940,{assists:0.33,keyPasses:2.29,passes:64.8,tackles:1.39}],
  ["raya","David Raya","Goalkeepers",2880,{passes:32.4}],
  ["alisson","Alisson Becker","Goalkeepers",2214,{passes:30.8}],
  ["ederson","Ederson","Goalkeepers",2160,{assists:0.04,passes:38.7}],
];

const base = {goals:0.06,assists:0.09,shots:0.82,keyPasses:0.74,passes:48.2,tackles:1.21,interceptions:0.72,dribbles:0.61};
export const mockPlayers: Player[] = seeds.map(([id,name,position,minutes,custom], index) => ({
  id,name,position,minutes, club: ["Manchester City","Liverpool","Arsenal","Chelsea","Arsenal","Manchester United","Arsenal","Manchester City","Chelsea","Newcastle United","Aston Villa","Tottenham Hotspur","Newcastle United","Arsenal","Liverpool","Manchester City","Liverpool","Arsenal","Liverpool","Manchester City"][index],
  competition:"premier-league", season:"2025/26", metrics:{...base,...custom},
}));
