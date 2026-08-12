import type { ChartType, CompetitionId, MetricKey, Player, PositionGroup } from "../../../lib/football/types";
import { footballCatalog } from "../../../lib/football/repository";

type SelectProps<T extends string> = { value: T; onChange: (value: T) => void };
function SelectField({ label, value, options, onChange, disabled }: { label: string; value: string; options: {value:string;label:string}[]; onChange:(value:string)=>void; disabled?:boolean }) {
  return <label className="graph-field"><span>{label}</span><select value={value} disabled={disabled} onChange={event=>onChange(event.target.value)}>{options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}
export function CompetitionSelector({value,onChange}:SelectProps<CompetitionId>) { return <SelectField label="Competition" value={value} onChange={v=>onChange(v as CompetitionId)} options={footballCatalog.competitions.map(c=>({value:c.id,label:c.name}))}/>; }
export function SeasonSelector({value,onChange}:SelectProps<string>) { return <SelectField label="Season" value={value} onChange={onChange} options={footballCatalog.seasons.map(s=>({value:s,label:s}))}/>; }
export function PositionSelector({value,onChange}:SelectProps<PositionGroup>) { return <SelectField label="Position group" value={value} onChange={v=>onChange(v as PositionGroup)} options={footballCatalog.positionGroups.map(p=>({value:p,label:p}))}/>; }
export function MetricSelector({value,onChange}:SelectProps<MetricKey>) { return <SelectField label="Statistic" value={value} onChange={v=>onChange(v as MetricKey)} options={footballCatalog.metrics.map(m=>({value:m.key,label:m.label}))}/>; }
export function PlayerSelector({players,selected,onChange}:{players:Player[];selected:string[];onChange:(ids:string[])=>void}) {
  const toggle=(id:string)=>onChange(selected.includes(id)?selected.filter(item=>item!==id):[...selected,id]);
  return <fieldset className="player-field"><legend>Players <small>{selected.length} selected</small></legend><div className="player-list">{players.length ? players.map(player=><label key={player.id} className={selected.includes(player.id)?"checked":""}><input type="checkbox" checked={selected.includes(player.id)} onChange={()=>toggle(player.id)}/><span className="player-check">✓</span><span><b>{player.name}</b><small>{player.club}</small></span></label>) : <p>No mock data for this selection yet.</p>}</div></fieldset>;
}
export function ChartTypeSelector({value,onChange}:SelectProps<ChartType>) { return <fieldset className="chart-type"><legend>Graph type</legend><div>{(["bar","scatter","radar"] as ChartType[]).map(type=><button key={type} type="button" className={value===type?"active":""} onClick={()=>onChange(type)}>{type[0].toUpperCase()+type.slice(1)}</button>)}</div></fieldset>; }

