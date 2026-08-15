import { useState } from "react";
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
  const [query, setQuery] = useState("");
  const shown = players.filter(player => `${player.name} ${player.club}`.toLowerCase().includes(query.trim().toLowerCase()));
  const shownIds = shown.map(player => player.id);
  const selectedSet = new Set(selected);
  const shownSet = new Set(shownIds);
  const allShownSelected = shownIds.length > 0 && shownIds.every(id => selectedSet.has(id));
  const toggle = (id:string) => onChange(selectedSet.has(id) ? selected.filter(item=>item!==id) : [...selected,id]);
  const toggleAll = () => onChange(allShownSelected ? selected.filter(id => !shownSet.has(id)) : [...new Set([...selected, ...shownIds])]);
  return <fieldset className="player-field">
    <legend>Players <small>{selected.length} selected</small></legend>
    <input className="player-search" aria-label="Search players" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search player or club…" />
    <label className="player-select-all"><input type="checkbox" checked={allShownSelected} disabled={!shownIds.length} onChange={toggleAll}/><span className="player-check">✓</span><b>{query.trim() ? "Select all results" : "Select all players"}</b></label>
    <div className="player-list">{shown.length ? shown.map(player => {
      const checked = selectedSet.has(player.id);
      return <label key={player.id} className={checked ? "checked" : ""}><input type="checkbox" checked={checked} onChange={()=>toggle(player.id)}/><span className="player-check">✓</span><span><b>{player.name}</b><small>{player.club} · {player.minutes.toLocaleString()} min</small></span></label>;
    }) : <p>No players match this selection.</p>}</div>
  </fieldset>;
}
export function ChartTypeSelector({value,onChange}:SelectProps<ChartType>) { return <fieldset className="chart-type"><legend>Graph type</legend><div>{(["bar","scatter"] as ChartType[]).map(type=><button key={type} type="button" className={value===type?"active":""} onClick={()=>onChange(type)}>{type[0].toUpperCase()+type.slice(1)}</button>)}</div></fieldset>; }
