"use client";

import { useEffect, useMemo, useState } from "react";
import { footballCatalog } from "../../../lib/football/repository";
import type { ChartType, CompetitionId, FootballDataset, MetricKey, PositionGroup } from "../../../lib/football/types";
import { ChartTypeSelector, CompetitionSelector, MetricSelector, PlayerSelector, PositionSelector, SeasonSelector } from "./selectors";
import { GraphRenderer } from "./graph-renderer";
import SeasonRadarComparison from "./season-radar-comparison";

type LoadedDataset = FootballDataset & { requestKey: string };

export default function GraphBuilder() {
  const [competition, setCompetition] = useState<CompetitionId>("premier-league");
  const [season, setSeason] = useState("2025/26");
  const [position, setPosition] = useState<PositionGroup>("All Players");
  const [selected, setSelected] = useState<string[]>([]);
  const [metric, setMetric] = useState<MetricKey>("goals");
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [dataset, setDataset] = useState<LoadedDataset | null>(null);
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const requestKey = `${competition}:${season}`;

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/football/players?competition=${encodeURIComponent(competition)}&season=${encodeURIComponent(season)}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async response => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Football data could not be loaded.");
        return result as FootballDataset;
      })
      .then(result => {
        if (controller.signal.aborted) return;
        setDataset({ ...result, requestKey });
        setSelected(result.players.slice(0, 4).map(player => player.id));
        setLoadError("");
      })
      .catch(error => {
        if (controller.signal.aborted) return;
        setLoadError(error instanceof Error ? error.message : "Football data could not be loaded.");
      });
    return () => controller.abort();
  }, [competition, requestKey, retryCount, season]);

  const loading = dataset?.requestKey !== requestKey && !loadError;
  const players = useMemo(
    () => (dataset?.requestKey === requestKey ? dataset.players : []).filter(player => position === "All Players" || player.position === position),
    [dataset, position, requestKey],
  );
  const selectedSet = new Set(selected);
  const selectedPlayers = players.filter(player => selectedSet.has(player.id));
  const metricLabel = footballCatalog.metrics.find(item => item.key === metric)?.label;
  const competitionName = footballCatalog.competitions.find(item => item.id === competition)?.name;
  const isLive = dataset?.requestKey === requestKey && dataset.source === "api-football";
  const isCommunity = dataset?.requestKey === requestKey && dataset.source === "premier-league-stats";
  const statusLabel = loadError ? "Source error" : loading ? "Loading" : isLive ? "API-Football" : isCommunity ? "PL Stats" : "Demo data";
  const updatedAt = dataset?.requestKey === requestKey ? new Date(dataset.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

  return <div className="graph-page-stack"><div className="graph-builder">
    <aside className="graph-controls">
      <div className="control-head"><span>Build comparison</span><button onClick={() => setSelected([])}>Clear</button></div>
      <CompetitionSelector value={competition} onChange={value => { setCompetition(value); setPosition("All Players"); setSelected([]); setLoadError(""); }} />
      <SeasonSelector value={season} onChange={value => { setSeason(value); setPosition("All Players"); setSelected([]); setLoadError(""); }} />
      <PositionSelector value={position} onChange={value => { setPosition(value); setSelected([]); }} />
      <PlayerSelector players={players} selected={selected} onChange={setSelected} />
      <MetricSelector value={metric} onChange={setMetric} />
      <ChartTypeSelector value={chartType} onChange={setChartType} />
    </aside>
    <section className="graph-canvas">
      <header>
        <div><span className="eyebrow">Player comparison · per 90</span><h2>{metricLabel}</h2><p>{selectedPlayers.length ? selectedPlayers.map(player => player.name).join(" · ") : "Select players from the control panel"}</p></div>
        <div className={`live-badge ${loadError ? "error" : isLive || isCommunity ? "" : "demo"}`}><i />{statusLabel}</div>
      </header>
      <div className="chart-stage">
        {loading ? <div className="graph-empty"><strong>Loading player data…</strong><p>Fetching and preparing season statistics.</p></div> : loadError ? <div className="graph-empty graph-error"><strong>Data unavailable</strong><p>{loadError}</p><button type="button" className="graph-retry" onClick={() => { setLoadError(""); setRetryCount(count => count + 1); }}>Retry</button></div> : <GraphRenderer players={selectedPlayers} metric={metric} type={chartType} />}
      </div>
      <footer><span>{season} {competitionName} · {isLive ? "Live provider data" : dataset?.note ?? "Demo dataset"}</span><span>{players.length} players · {updatedAt ? `Loaded ${updatedAt}` : "Loading…"}</span></footer>
    </section>
  </div><SeasonRadarComparison/></div>;
}
