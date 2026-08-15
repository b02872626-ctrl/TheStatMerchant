import type { MetricKey, Player, ProfileMetricKey } from "./types";

export type RadarCohort = "All players" | "Forwards" | "Midfielders" | "Defenders" | "Attacking midfielders";
export type RadarPoint = { metric: string; playerA: number; playerB: number; rawA: number; rawB: number };

export const radarCohorts: RadarCohort[] = ["All players", "Forwards", "Midfielders", "Defenders", "Attacking midfielders"];

export const radarMetrics: Record<RadarCohort, ProfileMetricKey[]> = {
  "All players": ["goals", "assists", "shots", "keyPasses", "dribbles", "passes", "tackles", "interceptions"],
  Forwards: ["goals", "assists", "shots", "keyPasses", "dribbles", "passes", "tackles", "interceptions"],
  Midfielders: ["assists", "keyPasses", "passes", "dribbles", "shots", "goals", "tackles", "interceptions"],
  Defenders: ["tacklesWon", "interceptions", "clearances", "blocks", "aerialDuelsWon", "recoveries", "duelsWon", "passes"],
  "Attacking midfielders": ["goals", "assists", "shots", "keyPasses", "dribbles", "passes", "tackles", "interceptions"],
};

const profileLabels: Record<ProfileMetricKey, string> = {
  goals: "Goals", assists: "Assists", shots: "Shots", keyPasses: "Key passes",
  passes: "Passes", tackles: "Tackles", interceptions: "Interceptions", dribbles: "Dribbles",
  tacklesWon: "Tackles won", clearances: "Clearances", blocks: "Blocks",
  aerialDuelsWon: "Aerial wins", recoveries: "Recoveries", duelsWon: "Duels won",
};

export function inRadarCohort(player: Player, cohort: RadarCohort) {
  if (cohort === "All players") return true;
  if (cohort !== "Attacking midfielders") return player.position === cohort;
  return player.position === "Midfielders" && (
    player.metrics.keyPasses >= 1 ||
    player.metrics.shots >= 1 ||
    player.metrics.goals + player.metrics.assists >= 0.25
  );
}

function metricValue(player: Player, metric: ProfileMetricKey) {
  if (metric in player.metrics) return player.metrics[metric as MetricKey];
  return player.profileMetrics?.[metric] ?? 0;
}

function percentile(value: number, players: Player[], metric: ProfileMetricKey) {
  if (!players.length) return 0;
  let below = 0;
  let equal = 0;
  players.forEach(player => {
    const candidate = metricValue(player, metric);
    if (candidate < value) below += 1;
    else if (candidate === value) equal += 1;
  });
  return Math.round(((below + equal / 2) / players.length) * 100);
}

export function buildRadarData(playerA: Player, playerB: Player, cohort: RadarCohort, playersA: Player[], playersB: Player[]): RadarPoint[] {
  const eligibleA = playersA.filter(player => player.minutes >= 450);
  const eligibleB = playersB.filter(player => player.minutes >= 450);
  const peersA = eligibleA.length ? eligibleA : playersA;
  const peersB = eligibleB.length ? eligibleB : playersB;

  return radarMetrics[cohort].map(metric => ({
    metric: profileLabels[metric],
    playerA: percentile(metricValue(playerA, metric), peersA, metric),
    playerB: percentile(metricValue(playerB, metric), peersB, metric),
    rawA: metricValue(playerA, metric),
    rawB: metricValue(playerB, metric),
  }));
}
