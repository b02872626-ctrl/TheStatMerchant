import type { DefensiveMetricKey, MetricKey, Player, PositionGroup } from "./types";

const DATA_ROOT = "https://raw.githubusercontent.com/imadeddine-belkat/Premier-League-Stats/main/pl_stats";

const COMMON_CLUBS = [
  "A_Villa_7", "Arsenal_3", "Bournemouth_91", "Brentford_94", "Brighton_36",
  "Chelsea_8", "C_Palace_31", "Everton_11", "Fulham_54", "Liverpool_14",
  "Man_City_43", "Man_Utd_1", "Newcastle_4", "Nottm_Forest_17", "Spurs_6",
  "West_Ham_21", "Wolves_39",
];

const CLUBS_BY_SEASON: Record<string, string[]> = {
  "2025/26": [...COMMON_CLUBS, "Burnley_90", "Leeds_2", "Sunderland_56"],
  "2024/25": [...COMMON_CLUBS, "Ipswich_40", "Leicester_13", "Southampton_20"],
  "2023/24": [...COMMON_CLUBS, "Burnley_90", "Luton_102", "Sheffield_Utd_49"],
  "2022/23": [...COMMON_CLUBS, "Leeds_2", "Leicester_13", "Southampton_20"],
};

const METRIC_COLUMNS: Record<MetricKey, string> = {
  goals: "goals",
  assists: "goalAssists",
  shots: "totalShots",
  keyPasses: "keyPassesAttemptAssists",
  passes: "totalPasses",
  tackles: "totalTackles",
  interceptions: "interceptions",
  dribbles: "successfulDribbles",
};
const DEFENSIVE_METRIC_COLUMNS: Record<DefensiveMetricKey, string> = {
  tacklesWon: "tacklesWon",
  clearances: "totalClearances",
  blocks: "blocks",
  aerialDuelsWon: "aerialDuelsWon",
  recoveries: "recoveries",
  duelsWon: "duelsWon",
};

type CsvRecord = Record<string, string>;
type PlayerAccumulator = {
  id: string;
  name: string;
  position: Exclude<PositionGroup, "All Players">;
  clubs: Set<string>;
  minutes: number;
  totals: Record<MetricKey, number>;
  defensiveTotals: Record<DefensiveMetricKey, number>;
};

function parseCsv(input: string): CsvRecord[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (character === '"') {
      if (quoted && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && input[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some(value => value.length > 0)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const [headerRow, ...dataRows] = rows;
  if (!headerRow) return [];
  const headers = headerRow.map((header, index) => index === 0 ? header.replace(/^\uFEFF/, "") : header);
  return dataRows.map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function numeric(record: CsvRecord, key: string) {
  const value = Number(record[key]);
  return Number.isFinite(value) ? value : 0;
}

function positionGroup(position: string): Exclude<PositionGroup, "All Players"> {
  if (position === "Goalkeeper" || position === "G") return "Goalkeepers";
  if (position === "Defender" || position === "D") return "Defenders";
  if (position === "Midfielder" || position === "M") return "Midfielders";
  return "Forwards";
}

function emptyTotals(): Record<MetricKey, number> {
  return { goals: 0, assists: 0, shots: 0, keyPasses: 0, passes: 0, tackles: 0, interceptions: 0, dribbles: 0 };
}

function emptyDefensiveTotals(): Record<DefensiveMetricKey, number> {
  return { tacklesWon: 0, clearances: 0, blocks: 0, aerialDuelsWon: 0, recoveries: 0, duelsWon: 0 };
}

async function fetchClubSeason(club: string, season: string) {
  const seasonLabel = season.replace("/", "-");
  const response = await fetch(`${DATA_ROOT}/${club}/players_stats/${seasonLabel}_players_stats.csv`, { cache: "no-store" });
  if (response.status === 404) return [];
  if (!response.ok) throw new Error(`Premier League Stats returned ${response.status}.`);
  return parseCsv(await response.text());
}

export async function getPremierLeagueStatsPlayers(season: string): Promise<Player[]> {
  const clubs = CLUBS_BY_SEASON[season];
  if (!clubs) throw new Error("This season is not available in the Premier League Stats dataset.");

  const results = await Promise.allSettled(clubs.map(club => fetchClubSeason(club, season)));
  const records = results.flatMap(result => result.status === "fulfilled" ? result.value : []);
  if (!records.length) throw new Error("Premier League Stats data could not be loaded.");

  const players = new Map<string, PlayerAccumulator>();
  records.forEach(record => {
    const id = record.playerId;
    const name = record.playerName;
    const minutes = numeric(record, "timePlayed");
    if (!id || !name || minutes <= 0) return;
    const existing = players.get(id) ?? {
      id,
      name,
      position: positionGroup(record.position),
      clubs: new Set<string>(),
      minutes: 0,
      totals: emptyTotals(),
      defensiveTotals: emptyDefensiveTotals(),
    };
    if (record.team_name) existing.clubs.add(record.team_name);
    existing.minutes += minutes;
    (Object.entries(METRIC_COLUMNS) as [MetricKey, string][]).forEach(([metric, column]) => {
      existing.totals[metric] += numeric(record, column);
    });
    (Object.entries(DEFENSIVE_METRIC_COLUMNS) as [DefensiveMetricKey, string][]).forEach(([metric, column]) => {
      existing.defensiveTotals[metric] += numeric(record, column);
    });
    players.set(id, existing);
  });

  return [...players.values()]
    .map(player => ({
      id: player.id,
      name: player.name,
      club: [...player.clubs].join(" / ") || "Unknown club",
      competition: "premier-league" as const,
      season,
      position: player.position,
      minutes: player.minutes,
      metrics: Object.fromEntries(
        (Object.keys(player.totals) as MetricKey[]).map(metric => [metric, Math.round((player.totals[metric] * 90 / player.minutes) * 100) / 100]),
      ) as Record<MetricKey, number>,
      profileMetrics: Object.fromEntries(
        (Object.keys(player.defensiveTotals) as DefensiveMetricKey[]).map(metric => [metric, Math.round((player.defensiveTotals[metric] * 90 / player.minutes) * 100) / 100]),
      ) as Record<DefensiveMetricKey, number>,
    }))
    .sort((a, b) => b.minutes - a.minutes);
}
