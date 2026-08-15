import { footballCatalog } from "./repository";
import type { CompetitionId, MetricKey, Player, PositionGroup } from "./types";

const API_BASE_URL = "https://v3.football.api-sports.io";
const MAX_PAGES = 5;

type ApiFootballStatistics = {
  team?: { name?: string };
  games?: { minutes?: number | null; position?: string | null };
  shots?: { total?: number | null };
  goals?: { total?: number | null; assists?: number | null };
  passes?: { total?: number | null; key?: number | null };
  tackles?: { total?: number | null; interceptions?: number | null };
  dribbles?: { success?: number | null };
};

type ApiFootballPlayer = {
  player?: { id?: number; name?: string };
  statistics?: ApiFootballStatistics[];
};

type ApiFootballPage = {
  response?: ApiFootballPlayer[];
  paging?: { current?: number; total?: number };
  errors?: unknown[] | Record<string, unknown>;
};

function hasErrors(errors: ApiFootballPage["errors"]) {
  return Array.isArray(errors) ? errors.length > 0 : Boolean(errors && Object.keys(errors).length);
}

function providerErrorMessage(errors: ApiFootballPage["errors"]) {
  const messages = Array.isArray(errors)
    ? errors
    : errors && typeof errors === "object"
      ? Object.values(errors)
      : [];
  const detail = messages
    .flatMap(message => typeof message === "string" ? [message] : [])
    .map(message => message.trim())
    .filter(Boolean)
    .join(" ")
    .slice(0, 240);
  return detail || "The provider rejected this request. Check the API key, rate limit, and season coverage.";
}

function positionGroup(position?: string | null): Exclude<PositionGroup, "All Players"> {
  if (position === "Goalkeeper") return "Goalkeepers";
  if (position === "Defender") return "Defenders";
  if (position === "Midfielder") return "Midfielders";
  return "Forwards";
}

function per90(total: number | null | undefined, minutes: number) {
  if (!minutes || total == null) return 0;
  return Math.round((total * 90 / minutes) * 100) / 100;
}

function mapPlayer(item: ApiFootballPlayer, competition: CompetitionId, season: string): Player | null {
  const stats = item.statistics?.[0];
  const id = item.player?.id;
  const name = item.player?.name;
  const minutes = Number(stats?.games?.minutes ?? 0);
  if (!id || !name || !stats || minutes <= 0) return null;
  const metrics: Record<MetricKey, number> = {
    goals: per90(stats.goals?.total, minutes),
    assists: per90(stats.goals?.assists, minutes),
    shots: per90(stats.shots?.total, minutes),
    keyPasses: per90(stats.passes?.key, minutes),
    passes: per90(stats.passes?.total, minutes),
    tackles: per90(stats.tackles?.total, minutes),
    interceptions: per90(stats.tackles?.interceptions, minutes),
    dribbles: per90(stats.dribbles?.success, minutes),
  };
  return {
    id: String(id),
    name,
    club: stats.team?.name ?? "Unknown club",
    competition,
    season,
    position: positionGroup(stats.games?.position),
    minutes,
    metrics,
  };
}

async function fetchPage(apiKey: string, league: number, season: number, page: number) {
  const url = new URL("/players", API_BASE_URL);
  url.searchParams.set("league", String(league));
  url.searchParams.set("season", String(season));
  url.searchParams.set("page", String(page));
  const response = await fetch(url, {
    headers: { "x-apisports-key": apiKey },
    // Provider error responses must never be cached. Successful transformed
    // datasets are cached by the application route instead.
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`API-Football returned ${response.status}.`);
  const data = await response.json() as ApiFootballPage;
  if (hasErrors(data.errors)) throw new Error(`API-Football: ${providerErrorMessage(data.errors)}`);
  return data;
}

export async function getApiFootballPlayers(apiKey: string, competition: CompetitionId, season: string) {
  const league = footballCatalog.competitions.find(item => item.id === competition)?.apiFootballId;
  const seasonStart = Number(season.split("/")[0]);
  if (!league || !Number.isInteger(seasonStart)) throw new Error("Unsupported competition or season.");

  const firstPage = await fetchPage(apiKey, league, seasonStart, 1);
  const pageCount = Math.min(Math.max(firstPage.paging?.total ?? 1, 1), MAX_PAGES);
  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) => fetchPage(apiKey, league, seasonStart, index + 2)),
  );
  const seen = new Set<string>();
  return [firstPage, ...remainingPages]
    .flatMap(page => page.response ?? [])
    .map(item => mapPlayer(item, competition, season))
    .filter((player): player is Player => Boolean(player))
    .filter(player => {
      if (seen.has(player.id)) return false;
      seen.add(player.id);
      return true;
    })
    .sort((a, b) => b.minutes - a.minutes);
}
