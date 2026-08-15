import "server-only";

import { unstable_cache } from "next/cache";
import { getPremierLeagueStatsPlayers } from "./premier-league-stats";

export const getCachedPremierLeagueStatsPlayers = unstable_cache(
  getPremierLeagueStatsPlayers,
  ["premier-league-stats-players-v2"],
  { revalidate: 60 * 60 * 6 },
);
