import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { isAdmin } from "../../../../lib/auth";
import { getApiFootballPlayers } from "../../../../lib/football/api-football";
import { getPremierLeagueStatsPlayers } from "../../../../lib/football/premier-league-stats";
import { footballCatalog, mockFootballDataSource } from "../../../../lib/football/repository";
import type { CompetitionId, FootballDataset } from "../../../../lib/football/types";

export const runtime = "nodejs";

const getCachedApiFootballPlayers = unstable_cache(
  async (competition: CompetitionId, season: string) => {
    const apiKey = process.env.API_FOOTBALL_KEY;
    if (!apiKey) throw new Error("API_FOOTBALL_KEY is not configured.");
    return getApiFootballPlayers(apiKey, competition, season);
  },
  ["api-football-players-v1"],
  { revalidate: 60 * 60 * 6 },
);

const getCachedPremierLeagueStatsPlayers = unstable_cache(
  getPremierLeagueStatsPlayers,
  ["premier-league-stats-players-v1"],
  { revalidate: 60 * 60 * 6 },
);

export async function GET(request: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const competition = request.nextUrl.searchParams.get("competition") as CompetitionId | null;
  const season = request.nextUrl.searchParams.get("season");
  const validCompetition = footballCatalog.competitions.some(item => item.id === competition);
  const validSeason = footballCatalog.seasons.includes(season ?? "");
  if (!competition || !season || !validCompetition || !validSeason) {
    return NextResponse.json({ error: "Unsupported competition or season." }, { status: 400 });
  }

  if (competition === "premier-league") {
    try {
      const players = await getCachedPremierLeagueStatsPlayers(season);
      const dataset: FootballDataset = {
        players,
        source: "premier-league-stats",
        updatedAt: new Date().toISOString(),
        note: "Weekly community dataset sourced from Premier-League-Stats.",
      };
      return NextResponse.json(dataset);
    } catch (error) {
      if (!process.env.API_FOOTBALL_KEY) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Premier League data could not be loaded." },
          { status: 502 },
        );
      }
    }
  }

  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    const dataset: FootballDataset = {
      players: mockFootballDataSource.getPlayers({ competition, season, position: "All Players" }),
      source: "demo",
      updatedAt: new Date().toISOString(),
      note: "Add API_FOOTBALL_KEY to load live API-Football data.",
    };
    return NextResponse.json(dataset);
  }

  try {
    const players = await getCachedApiFootballPlayers(competition, season);
    const dataset: FootballDataset = { players, source: "api-football", updatedAt: new Date().toISOString() };
    return NextResponse.json(dataset);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Football data could not be loaded." },
      { status: 502 },
    );
  }
}
