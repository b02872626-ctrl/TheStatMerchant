export type CompetitionId = "premier-league" | "la-liga" | "serie-a" | "bundesliga" | "champions-league";
export type PositionGroup = "Goalkeepers" | "Defenders" | "Midfielders" | "Forwards" | "All Players";
export type ChartType = "bar" | "scatter";

export type MetricKey = "goals" | "assists" | "shots" | "keyPasses" | "passes" | "tackles" | "interceptions" | "dribbles";

export type Player = {
  id: string;
  name: string;
  club: string;
  competition: CompetitionId;
  season: string;
  position: Exclude<PositionGroup, "All Players">;
  minutes: number;
  metrics: Record<MetricKey, number>;
};

export type Competition = { id: CompetitionId; name: string; apiFootballId: number };
export type Metric = { key: MetricKey; label: string; shortLabel: string };
export type FootballDataset = {
  players: Player[];
  source: "premier-league-stats" | "api-football" | "demo";
  updatedAt: string;
  note?: string;
};
