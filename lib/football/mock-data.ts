import type { Competition, Metric, Player, PositionGroup } from "./types";

export const competitions: Competition[] = [
  { id: "premier-league", name: "Premier League" }, { id: "la-liga", name: "La Liga" },
  { id: "serie-a", name: "Serie A" }, { id: "bundesliga", name: "Bundesliga" },
  { id: "champions-league", name: "Champions League" },
];

export const seasons = ["2025/26", "2024/25", "2023/24"];
export const positionGroups: PositionGroup[] = ["Goalkeepers", "Defenders", "Defensive Midfielders", "Attacking Midfielders", "Wingers", "Strikers", "All Players"];
export const metrics: Metric[] = [
  { key: "goals", label: "Goals / 90", shortLabel: "Goals" }, { key: "assists", label: "Assists / 90", shortLabel: "Assists" },
  { key: "shots", label: "Shots / 90", shortLabel: "Shots" }, { key: "keyPasses", label: "Key Passes / 90", shortLabel: "Key passes" },
  { key: "passes", label: "Passes / 90", shortLabel: "Passes" }, { key: "tackles", label: "Tackles / 90", shortLabel: "Tackles" },
  { key: "interceptions", label: "Interceptions / 90", shortLabel: "Interceptions" }, { key: "dribbles", label: "Dribbles / 90", shortLabel: "Dribbles" },
  { key: "touches", label: "Touches / 90", shortLabel: "Touches" }, { key: "progressivePasses", label: "Progressive Passes / 90", shortLabel: "Prog. passes" },
  { key: "progressiveCarries", label: "Progressive Carries / 90", shortLabel: "Prog. carries" },
];

type Seed = [string, string, Player["position"], number, Partial<Player["metrics"]>];
const seeds: Seed[] = [
  ["haaland","Erling Haaland","Strikers",2390,{goals:0.94,assists:0.14,shots:4.05,keyPasses:0.72,dribbles:0.48}],
  ["salah","Mohamed Salah","Wingers",2512,{goals:0.78,assists:0.51,shots:3.62,keyPasses:2.18,dribbles:1.32,progressiveCarries:4.48}],
  ["saka","Bukayo Saka","Wingers",2180,{goals:0.49,assists:0.38,shots:3.08,keyPasses:2.61,dribbles:1.86,progressiveCarries:5.21}],
  ["palmer","Cole Palmer","Attacking Midfielders",2441,{goals:0.63,assists:0.39,shots:3.39,keyPasses:2.47,passes:43.8,progressivePasses:5.62}],
  ["odegaard","Martin Ødegaard","Attacking Midfielders",2298,{goals:0.23,assists:0.34,keyPasses:2.74,passes:56.1,progressivePasses:8.31,progressiveCarries:3.27}],
  ["bruno","Bruno Fernandes","Attacking Midfielders",2570,{goals:0.31,assists:0.35,shots:2.76,keyPasses:3.04,passes:54.7,progressivePasses:8.96}],
  ["rice","Declan Rice","Defensive Midfielders",2654,{goals:0.16,assists:0.21,passes:61.4,tackles:1.74,interceptions:1.31,progressivePasses:7.45}],
  ["rodri","Rodri","Defensive Midfielders",1842,{goals:0.21,assists:0.29,passes:88.6,tackles:2.03,interceptions:1.18,progressivePasses:10.42}],
  ["caicedo","Moisés Caicedo","Defensive Midfielders",2450,{goals:0.08,passes:67.9,tackles:3.28,interceptions:1.62,progressivePasses:6.84}],
  ["isak","Alexander Isak","Strikers",2110,{goals:0.72,assists:0.18,shots:3.44,keyPasses:1.11,dribbles:1.07}],
  ["watkins","Ollie Watkins","Strikers",2388,{goals:0.56,assists:0.31,shots:2.87,keyPasses:1.06,progressiveCarries:2.18}],
  ["son","Son Heung-min","Wingers",2076,{goals:0.54,assists:0.36,shots:2.98,keyPasses:1.86,dribbles:1.18}],
  ["gordon","Anthony Gordon","Wingers",2230,{goals:0.38,assists:0.27,shots:2.64,keyPasses:1.72,dribbles:1.64,progressiveCarries:4.92}],
  ["saliba","William Saliba","Defenders",2710,{passes:72.8,tackles:1.22,interceptions:1.04,touches:82.7,progressivePasses:5.74}],
  ["van-dijk","Virgil van Dijk","Defenders",2790,{goals:0.11,passes:78.4,tackles:0.84,interceptions:1.13,touches:88.2,progressivePasses:6.21}],
  ["gvardiol","Joško Gvardiol","Defenders",2405,{goals:0.19,assists:0.12,passes:69.1,tackles:1.61,interceptions:1.02,progressiveCarries:2.76}],
  ["trent","Trent Alexander-Arnold","Defenders",1940,{assists:0.33,keyPasses:2.29,passes:64.8,tackles:1.39,progressivePasses:9.84}],
  ["raya","David Raya","Goalkeepers",2880,{passes:32.4,touches:39.8,progressivePasses:2.86}],
  ["alisson","Alisson Becker","Goalkeepers",2214,{passes:30.8,touches:38.2,progressivePasses:2.31}],
  ["ederson","Ederson","Goalkeepers",2160,{assists:0.04,passes:38.7,touches:44.1,progressivePasses:4.12}],
];

const base = {goals:0.06,assists:0.09,shots:0.82,keyPasses:0.74,passes:48.2,tackles:1.21,interceptions:0.72,dribbles:0.61,touches:57.4,progressivePasses:4.18,progressiveCarries:2.06};
export const mockPlayers: Player[] = seeds.map(([id,name,position,minutes,custom], index) => ({
  id,name,position,minutes, club: ["Manchester City","Liverpool","Arsenal","Chelsea","Arsenal","Manchester United","Arsenal","Manchester City","Chelsea","Newcastle United","Aston Villa","Tottenham Hotspur","Newcastle United","Arsenal","Liverpool","Manchester City","Liverpool","Arsenal","Liverpool","Manchester City"][index],
  competition:"premier-league", season:"2025/26", metrics:{...base,...custom},
}));

