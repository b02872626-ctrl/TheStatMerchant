export type CompetitionId = "premier-league" | "la-liga" | "serie-a" | "bundesliga" | "champions-league";
export type PositionGroup = "Goalkeepers" | "Defenders" | "Defensive Midfielders" | "Attacking Midfielders" | "Wingers" | "Strikers" | "All Players";
export type ChartType = "bar" | "scatter" | "radar";

export type MetricKey = "goals" | "assists" | "shots" | "keyPasses" | "passes" | "tackles" | "interceptions" | "dribbles" | "touches" | "progressivePasses" | "progressiveCarries";

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

export type Competition = { id: CompetitionId; name: string };
export type Metric = { key: MetricKey; label: string; shortLabel: string };

