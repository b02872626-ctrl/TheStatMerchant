"use client";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipContentProps, TooltipValueType } from "recharts";
import type { ChartType, MetricKey, Player } from "../../../lib/football/types";
import { footballCatalog } from "../../../lib/football/repository";

const colors=["#e53b2c","#071e33","#efbd18","#64748b","#168b62","#8b5cf6","#e07a17","#2e75b6"];
export function GraphRenderer({players,metric,type}:{players:Player[];metric:MetricKey;type:ChartType}) {
  const metricInfo=footballCatalog.metrics.find(item=>item.key===metric)!;
  const data=players.map((player,index)=>({name:player.name.split(" ").at(-1),fullName:player.name,club:player.club,value:player.metrics[metric],minutes:player.minutes,fill:colors[index%colors.length]})).sort((a,b)=>b.value-a.value);
  if (!data.length) return <div className="graph-empty"><strong>Select players to compare</strong><p>Choose two or more players from the control panel.</p></div>;
  const tooltip=({active,payload}:TooltipContentProps<TooltipValueType,string|number>)=>{const item=payload?.[0]?.payload as typeof data[number] | undefined; return active&&item?<div className="graph-tooltip"><b>{item.fullName}</b><span>{item.club}</span><strong>{item.value.toFixed(2)} <small>/ 90</small></strong></div>:null};
  if(type==="scatter") return <ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{top:24,right:24,bottom:20,left:2}}><CartesianGrid stroke="#dedad1" strokeDasharray="3 5"/><XAxis type="number" dataKey="minutes" name="Minutes" tick={{fontSize:10}} label={{value:"Minutes played",position:"insideBottom",offset:-12,fontSize:10}}/><YAxis type="number" dataKey="value" name={metricInfo.label} tick={{fontSize:10}}/><Tooltip cursor={{strokeDasharray:"3 3"}} content={tooltip}/><Scatter data={data}>{data.map((entry,index)=><Cell key={entry.fullName} fill={colors[index%colors.length]}/>)}</Scatter></ScatterChart></ResponsiveContainer>;
  return <ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{top:20,right:12,bottom:data.length > 40 ? 4 : 28,left:0}}><CartesianGrid vertical={false} stroke="#dedad1" strokeDasharray="3 5"/><XAxis dataKey="name" tick={data.length > 40 ? false : {fontSize:10,fill:"#53606b"}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:10,fill:"#53606b"}} axisLine={false} tickLine={false}/><Tooltip cursor={{fill:"rgba(7,30,51,.04)"}} content={tooltip}/><Bar dataKey="value" radius={[3,3,0,0]}>{data.map((entry,index)=><Cell key={`${entry.fullName}-${index}`} fill={colors[index%colors.length]}/>)}</Bar></BarChart></ResponsiveContainer>;
}
