"use client";

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import type { TooltipContentProps, TooltipValueType } from "recharts";
import type { RadarPoint } from "../../../lib/football/radar-profile";

function RadarTooltip({ active, payload, playerAName, playerBName }: TooltipContentProps<TooltipValueType, string | number> & { playerAName: string; playerBName: string }) {
  const point = payload?.[0]?.payload as RadarPoint | undefined;
  if (!active || !point) return null;
  return <div className="radar-tooltip">
    <b>{point.metric}</b>
    <span className="radar-tooltip-a">{playerAName} <strong>{point.playerA}th</strong><small>{point.rawA.toFixed(2)} / 90</small></span>
    <span className="radar-tooltip-b">{playerBName} <strong>{point.playerB}th</strong><small>{point.rawB.toFixed(2)} / 90</small></span>
  </div>;
}

export function PlayerRadarChart({ data, playerAName, playerBName }: { data: RadarPoint[]; playerAName: string; playerBName: string }) {
  return <ResponsiveContainer width="100%" height="100%"><RadarChart data={data} outerRadius="72%">
    <PolarGrid stroke="#c9c7c0" strokeDasharray="3 4"/>
    <PolarAngleAxis dataKey="metric" tick={{ fill: "#071e33", fontSize: 11, fontWeight: 700 }}/>
    <PolarRadiusAxis domain={[0, 100]} tickCount={5} tick={{ fill: "#777c7e", fontSize: 9 }} axisLine={false}/>
    <Radar name={playerAName} dataKey="playerA" stroke="#e53b2c" fill="#e53b2c" fillOpacity={0.2} strokeWidth={3}/>
    <Radar name={playerBName} dataKey="playerB" stroke="#2e75b6" fill="#2e75b6" fillOpacity={0.14} strokeWidth={3}/>
    <Tooltip content={props => <RadarTooltip {...props} playerAName={playerAName} playerBName={playerBName}/>}/>
  </RadarChart></ResponsiveContainer>;
}
