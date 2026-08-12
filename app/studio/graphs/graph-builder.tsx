"use client";
import { useEffect, useMemo, useState } from "react";
import { footballCatalog, mockFootballDataSource } from "../../../lib/football/repository";
import type { ChartType, CompetitionId, MetricKey, PositionGroup } from "../../../lib/football/types";
import { ChartTypeSelector, CompetitionSelector, MetricSelector, PlayerSelector, PositionSelector, SeasonSelector } from "./selectors";
import { GraphRenderer } from "./graph-renderer";

export default function GraphBuilder(){
  const [competition,setCompetition]=useState<CompetitionId>("premier-league"); const [season,setSeason]=useState("2025/26");
  const [position,setPosition]=useState<PositionGroup>("All Players"); const [selected,setSelected]=useState(["salah","saka","palmer","haaland"]);
  const [metric,setMetric]=useState<MetricKey>("goals"); const [chartType,setChartType]=useState<ChartType>("bar");
  const players=useMemo(()=>mockFootballDataSource.getPlayers({competition,season,position}),[competition,season,position]);
  useEffect(()=>setSelected(current=>current.filter(id=>players.some(player=>player.id===id))),[players]);
  const selectedPlayers=players.filter(player=>selected.includes(player.id)); const metricLabel=footballCatalog.metrics.find(item=>item.key===metric)?.label;
  return <div className="graph-builder"><aside className="graph-controls"><div className="control-head"><span>Build comparison</span><button onClick={()=>setSelected([])}>Clear</button></div><CompetitionSelector value={competition} onChange={value=>{setCompetition(value);setSelected([])}}/><SeasonSelector value={season} onChange={value=>{setSeason(value);setSelected([])}}/><PositionSelector value={position} onChange={setPosition}/><PlayerSelector players={players} selected={selected} onChange={setSelected}/><MetricSelector value={metric} onChange={setMetric}/><ChartTypeSelector value={chartType} onChange={setChartType}/></aside><section className="graph-canvas"><header><div><span className="eyebrow">Player comparison · per 90</span><h2>{metricLabel}</h2><p>{selectedPlayers.length?selectedPlayers.map(player=>player.name).join(" · "):"No players selected"}</p></div><div className="live-badge"><i/> Live preview</div></header><div className="chart-stage"><GraphRenderer players={selectedPlayers} metric={metric} type={chartType}/></div><footer><span>2025/26 Premier League mock data</span><span>Minimum 900 minutes · Updated 12 Aug 2026</span></footer></section></div>;
}
