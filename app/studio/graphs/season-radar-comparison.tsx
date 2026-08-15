"use client";

import { useEffect, useMemo, useState } from "react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import type { TooltipContentProps, TooltipValueType } from "recharts";
import { footballCatalog } from "../../../lib/football/repository";
import type { FootballDataset, MetricKey, Player } from "../../../lib/football/types";

type RadarCohort = "Forwards" | "Midfielders" | "Defenders" | "Attacking midfielders";
type RadarPoint = { metric: string; playerA: number; playerB: number; rawA: number; rawB: number };

const cohorts: RadarCohort[] = ["Forwards", "Midfielders", "Defenders", "Attacking midfielders"];
const radarMetrics: Record<RadarCohort, MetricKey[]> = {
  Forwards: ["goals", "assists", "shots", "keyPasses", "dribbles", "passes", "tackles", "interceptions"],
  Midfielders: ["assists", "keyPasses", "passes", "dribbles", "shots", "goals", "tackles", "interceptions"],
  Defenders: ["passes", "tackles", "interceptions", "keyPasses", "assists", "dribbles", "shots", "goals"],
  "Attacking midfielders": ["goals", "assists", "shots", "keyPasses", "dribbles", "passes", "tackles", "interceptions"],
};
const defaultPlayers: Record<RadarCohort, [string, string]> = {
  Forwards: ["Salah", "Saka"],
  Midfielders: ["Rice", "Ødegaard"],
  Defenders: ["van Dijk", "Saliba"],
  "Attacking midfielders": ["Palmer", "Ødegaard"],
};

function inCohort(player: Player, cohort: RadarCohort) {
  if (cohort !== "Attacking midfielders") return player.position === cohort;
  return player.position === "Midfielders" && (
    player.metrics.keyPasses >= 1 ||
    player.metrics.shots >= 1 ||
    player.metrics.goals + player.metrics.assists >= 0.25
  );
}

function percentile(value: number, players: Player[], metric: MetricKey) {
  if (!players.length) return 0;
  const values = players.map(player => player.metrics[metric]);
  const below = values.filter(item => item < value).length;
  const equal = values.filter(item => item === value).length;
  return Math.round(((below + equal / 2) / values.length) * 100);
}

function labelFor(metric: MetricKey) {
  return footballCatalog.metrics.find(item => item.key === metric)?.shortLabel ?? metric;
}

function RadarTooltip({ active, payload, playerAName, playerBName }: TooltipContentProps<TooltipValueType, string | number> & { playerAName: string; playerBName: string }) {
  const point = payload?.[0]?.payload as RadarPoint | undefined;
  if (!active || !point) return null;
  return <div className="radar-tooltip">
    <b>{point.metric}</b>
    <span className="radar-tooltip-a">{playerAName} <strong>{point.playerA}th</strong><small>{point.rawA.toFixed(2)} / 90</small></span>
    <span className="radar-tooltip-b">{playerBName} <strong>{point.playerB}th</strong><small>{point.rawB.toFixed(2)} / 90</small></span>
  </div>;
}

function PlayerSeasonControl({ label, season, playerId, players, onSeasonChange, onPlayerChange }: {
  label: string;
  season: string;
  playerId: string;
  players: Player[];
  onSeasonChange: (season: string) => void;
  onPlayerChange: (playerId: string) => void;
}) {
  return <div className="radar-player-control">
    <strong>{label}</strong>
    <label><span>Season</span><select value={season} onChange={event => onSeasonChange(event.target.value)}>{footballCatalog.seasons.map(item => <option key={item}>{item}</option>)}</select></label>
    <label><span>Player</span><select value={playerId} onChange={event => onPlayerChange(event.target.value)} disabled={!players.length}>{players.map(player => <option key={player.id} value={player.id}>{player.name} · {player.club}</option>)}</select></label>
  </div>;
}

export default function SeasonRadarComparison() {
  const [cohort, setCohort] = useState<RadarCohort>("Forwards");
  const [seasonA, setSeasonA] = useState("2024/25");
  const [seasonB, setSeasonB] = useState("2022/23");
  const [playerAId, setPlayerAId] = useState("");
  const [playerBId, setPlayerBId] = useState("");
  const [datasets, setDatasets] = useState<Record<string, FootballDataset>>({});
  const [loadState, setLoadState] = useState({ requestKey: "", error: "" });
  const requestKey = [...new Set([seasonA, seasonB])].sort().join(":");

  useEffect(() => {
    const controller = new AbortController();
    const seasons = [...new Set([seasonA, seasonB])];
    Promise.all(seasons.map(async season => {
      const response = await fetch(`/api/football/players?competition=premier-league&season=${encodeURIComponent(season)}`, { signal: controller.signal, cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Season data could not be loaded.");
      return [season, result as FootballDataset] as const;
    }))
      .then(results => {
        if (controller.signal.aborted) return;
        setDatasets(previous => ({ ...previous, ...Object.fromEntries(results) }));
        setLoadState({ requestKey, error: "" });
      })
      .catch(reason => {
        if (controller.signal.aborted) return;
        setLoadState({ requestKey, error: reason instanceof Error ? reason.message : "Season data could not be loaded." });
      });
    return () => controller.abort();
  }, [requestKey, seasonA, seasonB]);

  const playersA = useMemo(() => (datasets[seasonA]?.players ?? []).filter(player => inCohort(player, cohort)).sort((a, b) => a.name.localeCompare(b.name)), [cohort, datasets, seasonA]);
  const playersB = useMemo(() => (datasets[seasonB]?.players ?? []).filter(player => inCohort(player, cohort)).sort((a, b) => a.name.localeCompare(b.name)), [cohort, datasets, seasonB]);

  const selectedPlayerAId = playersA.some(player => player.id === playerAId) ? playerAId : (playersA.find(player => player.name.includes(defaultPlayers[cohort][0])) ?? playersA[0])?.id ?? "";
  const selectedPlayerBId = playersB.some(player => player.id === playerBId) ? playerBId : (playersB.find(player => player.name.includes(defaultPlayers[cohort][1])) ?? playersB[1] ?? playersB[0])?.id ?? "";
  const playerA = playersA.find(player => player.id === selectedPlayerAId);
  const playerB = playersB.find(player => player.id === selectedPlayerBId);
  const loading = loadState.requestKey !== requestKey;
  const error = loadState.requestKey === requestKey ? loadState.error : "";
  const peersA = playersA.filter(player => player.minutes >= 450);
  const peersB = playersB.filter(player => player.minutes >= 450);
  const chartData: RadarPoint[] = playerA && playerB ? radarMetrics[cohort].map(metric => ({
    metric: labelFor(metric),
    playerA: percentile(playerA.metrics[metric], peersA.length ? peersA : playersA, metric),
    playerB: percentile(playerB.metrics[metric], peersB.length ? peersB : playersB, metric),
    rawA: playerA.metrics[metric],
    rawB: playerB.metrics[metric],
  })) : [];

  return <section className="season-radar-card">
    <header className="season-radar-head">
      <div><span className="eyebrow">Season radar</span><h2>Player profile comparison</h2><p>Compare percentile ranks across different Premier League seasons.</p></div>
      <label className="radar-cohort"><span>Collective group</span><select value={cohort} onChange={event => { setCohort(event.target.value as RadarCohort); setPlayerAId(""); setPlayerBId(""); }}>{cohorts.map(item => <option key={item}>{item}</option>)}</select></label>
    </header>
    <div className="season-radar-body">
      <aside className="season-radar-controls">
        <PlayerSeasonControl label="Player one" season={seasonA} playerId={selectedPlayerAId} players={playersA} onSeasonChange={setSeasonA} onPlayerChange={setPlayerAId}/>
        <PlayerSeasonControl label="Player two" season={seasonB} playerId={selectedPlayerBId} players={playersB} onSeasonChange={setSeasonB} onPlayerChange={setPlayerBId}/>
        <p>Percentiles are calculated against {cohort.toLowerCase()} with at least 450 league minutes in each player&apos;s selected season.</p>
      </aside>
      <div className="season-radar-visual">
        {loading ? <div className="graph-empty"><strong>Loading season profiles…</strong><p>Preparing both comparison groups.</p></div> : error ? <div className="graph-empty graph-error"><strong>Comparison unavailable</strong><p>{error}</p></div> : playerA && playerB ? <>
          <div className="radar-players">
            <div className="radar-player-a"><i/><strong>{playerA.name}</strong><span>{playerA.club} · {seasonA}</span></div>
            <div className="radar-player-b"><i/><strong>{playerB.name}</strong><span>{playerB.club} · {seasonB}</span></div>
          </div>
          <div className="radar-chart-wrap"><ResponsiveContainer width="100%" height="100%"><RadarChart data={chartData} outerRadius="72%">
            <PolarGrid stroke="#c9c7c0" strokeDasharray="3 4"/>
            <PolarAngleAxis dataKey="metric" tick={{ fill: "#071e33", fontSize: 11, fontWeight: 700 }}/>
            <PolarRadiusAxis domain={[0, 100]} tickCount={5} tick={{ fill: "#777c7e", fontSize: 9 }} axisLine={false}/>
            <Radar name={playerA.name} dataKey="playerA" stroke="#e53b2c" fill="#e53b2c" fillOpacity={0.2} strokeWidth={3}/>
            <Radar name={playerB.name} dataKey="playerB" stroke="#2e75b6" fill="#2e75b6" fillOpacity={0.14} strokeWidth={3}/>
            <Tooltip content={props => <RadarTooltip {...props} playerAName={playerA.name} playerBName={playerB.name}/>}/>
          </RadarChart></ResponsiveContainer></div>
        </> : <div className="graph-empty"><strong>Select two players</strong><p>Choose a season and player on each side.</p></div>}
      </div>
    </div>
  </section>;
}
