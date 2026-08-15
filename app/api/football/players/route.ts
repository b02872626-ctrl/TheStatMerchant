import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "../../../../lib/auth";
import { getApiFootballPlayers } from "../../../../lib/football/api-football";
import { footballCatalog, mockFootballDataSource } from "../../../../lib/football/repository";
import type { CompetitionId, FootballDataset } from "../../../../lib/football/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const competition = request.nextUrl.searchParams.get("competition") as CompetitionId | null;
  const season = request.nextUrl.searchParams.get("season");
  const validCompetition = footballCatalog.competitions.some(item => item.id === competition);
  const validSeason = footballCatalog.seasons.includes(season ?? "");
  if (!competition || !season || !validCompetition || !validSeason) {
    return NextResponse.json({ error: "Unsupported competition or season." }, { status: 400 });
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
    const players = await getApiFootballPlayers(apiKey, competition, season);
    const dataset: FootballDataset = { players, source: "api-football", updatedAt: new Date().toISOString() };
    return NextResponse.json(dataset);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Football data could not be loaded." },
      { status: 502 },
    );
  }
}
