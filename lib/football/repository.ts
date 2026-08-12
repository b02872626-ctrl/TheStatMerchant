import { competitions, metrics, mockPlayers, positionGroups, seasons } from "./mock-data";
import type { CompetitionId, Player, PositionGroup } from "./types";

export interface FootballDataSource {
  getPlayers(filters: { competition: CompetitionId; season: string; position: PositionGroup }): Player[];
}

export const mockFootballDataSource: FootballDataSource = {
  getPlayers({ competition, season, position }) {
    return mockPlayers.filter(player => player.competition === competition && player.season === season && (position === "All Players" || player.position === position));
  },
};

export const footballCatalog = { competitions, seasons, positionGroups, metrics };

