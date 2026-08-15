import type { Metadata } from "next";
import { buildRadarData, inRadarCohort, radarCohorts, type RadarCohort } from "../../../lib/football/radar-profile";
import { footballCatalog } from "../../../lib/football/repository";
import { getCachedPremierLeagueStatsPlayers } from "../../../lib/football/server-data";
import type { ChartType, MetricKey, PositionGroup } from "../../../lib/football/types";
import EmbedGraph, { EmbedGraphError } from "./embed-graph";

export const metadata: Metadata = {
  title: "TheStatMerchant graph",
  robots: { index: false, follow: false },
};

type Query = Record<string, string | string[] | undefined>;

function value(query: Query, key: string) {
  const result = query[key];
  return Array.isArray(result) ? result[0] : result;
}

function validSeason(season: string | undefined): season is string {
  return !!season && footballCatalog.seasons.includes(season);
}

async function loadRadar(query: Query) {
  const cohortValue = value(query, "cohort");
  const cohort = radarCohorts.includes(cohortValue as RadarCohort) ? cohortValue as RadarCohort : "All players";
  const seasonA = value(query, "seasonA");
  const seasonB = value(query, "seasonB");
  const playerAId = value(query, "playerA");
  const playerBId = value(query, "playerB");
  if (!validSeason(seasonA) || !validSeason(seasonB)) {
    return { error: "This radar embed is missing a season." } as const;
  }

  const seasons = [...new Set([seasonA, seasonB])];
  const results = await Promise.all(seasons.map(async season => [season, await getCachedPremierLeagueStatsPlayers(season)] as const));
  const datasets = Object.fromEntries(results);
  const playersA = datasets[seasonA].filter(player => inRadarCohort(player, cohort));
  const playersB = datasets[seasonB].filter(player => inRadarCohort(player, cohort));
  const playerA = playersA.find(player => player.id === playerAId) ?? playersA[0];
  const playerB = playersB.find(player => player.id === playerBId) ?? playersB[1] ?? playersB[0];
  if (!playerA || !playerB) return { error: "One of the selected players is no longer available in this dataset." } as const;

  return { kind: "radar", playerA, playerB, chartData: buildRadarData(playerA, playerB, cohort, playersA, playersB), seasonA, seasonB, cohort } as const;
}

async function loadComparison(query: Query) {
  const season = value(query, "season");
  const metricValue = value(query, "metric");
  const typeValue = value(query, "type");
  const positionValue = value(query, "position");
  const playerValue = value(query, "players");
  if (!validSeason(season)) return { error: "This graph embed uses an unsupported season." } as const;

  const metric = footballCatalog.metrics.some(item => item.key === metricValue) ? metricValue as MetricKey : "goals";
  const type: ChartType = typeValue === "scatter" ? "scatter" : "bar";
  const position = footballCatalog.positionGroups.includes(positionValue as PositionGroup) ? positionValue as PositionGroup : "All Players";
  const allPlayers = await getCachedPremierLeagueStatsPlayers(season);
  const positionPlayers = allPlayers.filter(player => position === "All Players" || player.position === position);
  const selectedIds = new Set((playerValue ?? "").split(",").filter(Boolean));
  const players = playerValue === "all" ? positionPlayers : positionPlayers.filter(player => selectedIds.has(player.id));
  if (!players.length) return { error: "This graph does not have any selected players." } as const;

  return { kind: "comparison", players, metric, type, season, position } as const;
}

export default async function GraphEmbedPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  let result;
  try {
    result = value(query, "kind") === "radar" ? await loadRadar(query) : await loadComparison(query);
  } catch (error) {
    result = { error: error instanceof Error ? error.message : "The data source could not be loaded." } as const;
  }

  if ("error" in result && typeof result.error === "string") return <EmbedGraphError message={result.error}/>;
  return result.kind === "radar"
    ? <EmbedGraph kind="radar" playerA={result.playerA} playerB={result.playerB} chartData={result.chartData} seasonA={result.seasonA} seasonB={result.seasonB} cohort={result.cohort}/>
    : <EmbedGraph kind="comparison" players={result.players} metric={result.metric} type={result.type} season={result.season} position={result.position}/>;
}
