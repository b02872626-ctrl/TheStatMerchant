"use client";

import Image from "next/image";
import type { RadarCohort, RadarPoint } from "../../../lib/football/radar-profile";
import type { ChartType, MetricKey, Player } from "../../../lib/football/types";
import { footballCatalog } from "../../../lib/football/repository";
import { GraphRenderer } from "../../studio/graphs/graph-renderer";
import { PlayerRadarChart } from "../../studio/graphs/player-radar-chart";

type ComparisonProps = {
  kind: "comparison";
  players: Player[];
  metric: MetricKey;
  type: ChartType;
  season: string;
  position: string;
};

type RadarProps = {
  kind: "radar";
  playerA: Player;
  playerB: Player;
  chartData: RadarPoint[];
  seasonA: string;
  seasonB: string;
  cohort: RadarCohort;
};

export default function EmbedGraph(props: ComparisonProps | RadarProps) {
  if (props.kind === "radar") {
    return <main className="embed-graph embed-radar">
      <header className="embed-graph-header">
        <div><span className="eyebrow">Player profile · percentile rank</span><h1>{props.playerA.name} vs {props.playerB.name}</h1><p>{props.cohort} · Premier League</p></div>
        <Image src="/Logo/Asset%201.svg" alt="TheStatMerchant" width={92} height={39}/>
      </header>
      <div className="radar-players embed-radar-players">
        <div className="radar-player-a"><i/><strong>{props.playerA.name}</strong><span>{props.playerA.club} · {props.seasonA}</span></div>
        <div className="radar-player-b"><i/><strong>{props.playerB.name}</strong><span>{props.playerB.club} · {props.seasonB}</span></div>
      </div>
      <div className="embed-radar-chart"><PlayerRadarChart data={props.chartData} playerAName={props.playerA.name} playerBName={props.playerB.name}/></div>
      <footer>Percentile ranks versus {props.cohort.toLowerCase()} with 450+ league minutes · TheStatMerchant</footer>
    </main>;
  }

  const metricLabel = footballCatalog.metrics.find(item => item.key === props.metric)?.label ?? "Player comparison";
  return <main className="embed-graph embed-comparison">
    <header className="embed-graph-header">
      <div><span className="eyebrow">Player comparison · per 90</span><h1>{metricLabel}</h1><p>{props.players.map(player => player.name).join(" · ")}</p></div>
      <Image src="/Logo/Asset%201.svg" alt="TheStatMerchant" width={92} height={39}/>
    </header>
    <div className="embed-comparison-chart"><GraphRenderer players={props.players} metric={props.metric} type={props.type}/></div>
    <footer>{props.season} Premier League · {props.position} · TheStatMerchant</footer>
  </main>;
}

export function EmbedGraphError({ message }: { message: string }) {
  return <main className="embed-graph embed-error">
    <Image src="/Logo/Asset%201.svg" alt="TheStatMerchant" width={105} height={44}/>
    <strong>Graph unavailable</strong>
    <p>{message}</p>
  </main>;
}
