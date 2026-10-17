import React, { useMemo, useState } from 'react';
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { MapPin, ArrowUpDown, Check, Plus, Minus, SlidersHorizontal } from 'lucide-react';
import { CalculatedCost, UserPreferences } from '../types';
import { AREA_ROUTING_COORDINATES } from '../data/routingCoordinates';
import { WORKPLACES } from '../data/neighbourhoods';

interface NeighbourhoodExplorerProps {
  results: CalculatedCost[];
  preferences: UserPreferences;
  comparedIds: string[];
  onToggleCompare: (id: string) => void;
}

const TORONTO: [number, number] = [43.7001, -79.4163];
const money = (value: number | null) => value == null ? 'Not entered' : `$${Math.round(value).toLocaleString()}`;

function FocusMap({ center }: { center: [number, number] }) {
  const map = useMap();
  React.useEffect(() => { map.flyTo(center, Math.max(map.getZoom(), 10), { duration: 0.55 }); }, [center, map]);
  return null;
}

export const NeighbourhoodExplorer: React.FC<NeighbourhoodExplorerProps> = ({ results, preferences, comparedIds, onToggleCompare }) => {
  const [borough, setBorough] = useState('all');
  const [sort, setSort] = useState<'cost' | 'rent' | 'commute'>('cost');
  const [focusedId, setFocusedId] = useState('');

  const sortedResults = useMemo(() => {
    const items = results.filter((item) => borough === 'all' || item.neighbourhood.borough === borough);
    return items.sort((a, b) => sort === 'rent'
      ? (a.effectiveRent ?? Number.MAX_SAFE_INTEGER) - (b.effectiveRent ?? Number.MAX_SAFE_INTEGER)
      : sort === 'commute'
        ? a.monthlyCommuteHours - b.monthlyCommuteHours
        : a.trueMonthlyCost - b.trueMonthlyCost);
  }, [results, borough, sort]);
  const focused = results.find((item) => item.neighbourhood.id === focusedId);
  const compareItems = results.filter((item) => comparedIds.includes(item.neighbourhood.id));
  const workplaceName = WORKPLACES.find((workplace) => workplace.id === preferences.workplaceId)?.shortName || 'Selected workplace';

  if (!results.length) return null;

  return (
    <section className="mb-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-emerald-800"><MapPin className="h-4 w-4" /><span className="text-[11px] font-bold uppercase tracking-[0.16em]">Neighbourhood explorer</span></div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Explore the costs across Toronto</h1>
          <p className="mt-1 text-sm text-stone-600">Each dot marks one of the 10 neighbourhoods. Click a dot to see its cost breakdown, then compare the places that fit you best.</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-600 shadow-sm">
          <span className="font-semibold text-stone-800">Your analysis:</span> {workplaceName} · {preferences.commuteMode.replace('_', ' ')} · {preferences.bedrooms.replace('bed', ' bed')}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(390px,0.85fr)]">
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 px-4 py-3">
            <div><h2 className="text-sm font-bold text-stone-900">Places to live</h2><p className="text-[11px] text-stone-500">Click any neighbourhood dot to see costs.</p></div>
            <div className="flex items-center gap-2 text-[10px] text-stone-500"><span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />Selected to compare<span className="ml-2 h-2.5 w-2.5 rounded-full border-2 border-emerald-700 bg-white" />Currently viewing</div>
          </div>
          <MapContainer center={TORONTO} zoom={10} scrollWheelZoom className="h-[60vh] min-h-[430px] w-full">
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
            {focused && (() => {
              const point = AREA_ROUTING_COORDINATES[focused.neighbourhood.id];
              return <FocusMap center={point ? [point[1], point[0]] : TORONTO} />;
            })()}
            {results.map((item) => {
              const point = AREA_ROUTING_COORDINATES[item.neighbourhood.id];
              if (!point) return null;
              const selected = comparedIds.includes(item.neighbourhood.id);
              const active = focused?.neighbourhood.id === item.neighbourhood.id;
              return <CircleMarker key={item.neighbourhood.id} center={[point[1], point[0]]} radius={selected ? 11 : active ? 10 : 8} pathOptions={{ color: selected || active ? '#047857' : '#ffffff', weight: active ? 4 : 2, fillColor: selected ? '#059669' : '#0f766e', fillOpacity: selected ? 0.95 : 0.78 }} eventHandlers={{ click: () => setFocusedId(item.neighbourhood.id) }}>
                <Tooltip direction="top" offset={[0, -7]}><span className="font-semibold">{item.neighbourhood.name}</span><br />True monthly cost: {money(item.trueMonthlyCost)}</Tooltip>
              </CircleMarker>;
            })}
          </MapContainer>
          <div className="border-t border-stone-100 px-4 py-2 text-[10px] text-stone-500">Map points are representative locations for each neighbourhood, not boundary outlines. Map data © OpenStreetMap contributors.</div>
        </div>

        <aside className="flex max-h-[calc(60vh+64px)] min-h-[500px] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 p-4">
            <div className="mb-3 flex items-center justify-between"><div><h2 className="text-sm font-bold text-stone-900">Area costs</h2><p className="text-[11px] text-stone-500">{sortedResults.length} areas · sorted for your analysis</p></div><SlidersHorizontal className="h-4 w-4 text-stone-400" /></div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[10px] font-semibold text-stone-500">FILTER AREA
                <select value={borough} onChange={(event) => setBorough(event.target.value)} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-2 text-xs font-medium text-stone-800">
                  <option value="all">All neighbourhoods</option>{[...new Set(results.map((item) => item.neighbourhood.borough))].sort().map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              </label>
              <label className="text-[10px] font-semibold text-stone-500"><span className="inline-flex items-center gap-1">SORT BY <ArrowUpDown className="h-3 w-3" /></span>
                <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-2 text-xs font-medium text-stone-800">
                  <option value="cost">Total monthly cost</option><option value="rent">Rent</option><option value="commute">Commute time</option>
                </select>
              </label>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {focused ? <article className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
              <div className="flex items-start justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Selected neighbourhood</div><h3 className="mt-1 text-sm font-bold leading-snug text-stone-900">{focused.neighbourhood.name}</h3><p className="text-[11px] text-stone-500">{focused.neighbourhood.borough}</p></div>
                <button type="button" onClick={() => onToggleCompare(focused.neighbourhood.id)} className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${comparedIds.includes(focused.neighbourhood.id) ? 'border border-emerald-300 bg-white text-emerald-800' : 'bg-emerald-700 text-white hover:bg-emerald-800'}`}>{comparedIds.includes(focused.neighbourhood.id) ? <><Check className="h-3 w-3" /> Added</> : <><Plus className="h-3 w-3" /> Compare</>}</button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Metric label="True monthly cost" value={`${money(focused.trueMonthlyCost)}/mo`} strong />
                <Metric label="Housing / rent" value={focused.effectiveRent == null ? 'Not entered' : `${money(focused.effectiveRent)}/mo`} />
                <Metric label="Transportation" value={`${money(focused.commuteBreakdown.totalMonthlyCommuteCost)}/mo`} />
                <Metric label="Utilities" value={`${money(focused.utilitiesCost)}/mo`} />
                <Metric label="Commute time" value={`${focused.monthlyCommuteHours} hrs / month`} />
                <Metric label="Housing benchmark" value={focused.rentLabel} />
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-stone-500">Rent: {focused.rentLabel}. Commute costs and travel time reflect the selected workplace and mode; see methodology for data sources and assumptions.</p>
            </article> : <div className="mb-3 rounded-xl border border-dashed border-stone-300 bg-stone-50 p-5 text-center"><MapPin className="mx-auto h-5 w-5 text-emerald-700" /><h3 className="mt-2 text-xs font-bold text-stone-800">Pick a neighbourhood dot</h3><p className="mt-1 text-[10px] leading-relaxed text-stone-500">You’ll see estimated rent, utilities, transportation, and commute time here.</p></div>}

            {compareItems.length > 0 && <section className="mb-3 overflow-hidden rounded-xl border border-stone-200">
              <div className="flex items-center justify-between bg-stone-900 px-3 py-2 text-white"><h3 className="text-xs font-bold">Side-by-side comparison</h3><span className="text-[10px] text-stone-300">{compareItems.length} selected</span></div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-[10px]">
                  <thead><tr className="bg-stone-50">{compareItems.map((item) => <th key={item.neighbourhood.id} className="min-w-[125px] p-2 align-top"><button onClick={() => setFocusedId(item.neighbourhood.id)} className="line-clamp-2 text-left font-bold text-stone-800 hover:text-emerald-800">{item.neighbourhood.name}</button><button title="Remove from comparison" onClick={() => onToggleCompare(item.neighbourhood.id)} className="mt-1 inline-flex items-center gap-1 text-[9px] font-medium text-stone-500 hover:text-rose-700"><Minus className="h-3 w-3" /> Remove</button></th>)}</tr></thead>
                  <tbody>{[
                    ['True monthly cost', (item: CalculatedCost) => money(item.trueMonthlyCost)],
                    ['Housing / rent', (item: CalculatedCost) => money(item.effectiveRent)],
                    ['Transportation', (item: CalculatedCost) => money(item.commuteBreakdown.totalMonthlyCommuteCost)],
                    ['Utilities', (item: CalculatedCost) => money(item.utilitiesCost)],
                    ['Commute / month', (item: CalculatedCost) => `${item.monthlyCommuteHours} hrs`],
                  ].map(([label, getValue]) => <tr key={label as string} className="border-t border-stone-100"><th className="whitespace-nowrap p-2 font-semibold text-stone-500">{label as string}</th>{compareItems.map((item) => <td key={item.neighbourhood.id} className="p-2 font-mono font-semibold text-stone-800">{(getValue as (value: CalculatedCost) => string)(item)}</td>)}</tr>)}
                  </tbody>
                </table>
              </div>
            </section>}

            <div className="space-y-1.5">
              {sortedResults.map((item) => <button key={item.neighbourhood.id} onClick={() => setFocusedId(item.neighbourhood.id)} className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition-colors ${focused?.neighbourhood.id === item.neighbourhood.id ? 'border-emerald-300 bg-emerald-50' : 'border-transparent bg-stone-50 hover:border-stone-200 hover:bg-white'}`}>
                <span className="min-w-0"><span className="block truncate text-[11px] font-semibold text-stone-800">{item.neighbourhood.name}</span><span className="text-[10px] text-stone-500">{item.neighbourhood.borough} · {item.monthlyCommuteHours} commute hrs/mo</span></span><span className="shrink-0 text-right"><span className="block font-mono text-xs font-bold text-stone-900">{money(item.trueMonthlyCost)}<span className="text-[9px] font-medium text-stone-500">/mo</span></span><span className="text-[9px] text-stone-500">Rent {money(item.effectiveRent)}</span></span>
              </button>)}
            </div>
          </div>
          <div className="border-t border-stone-100 bg-stone-50 px-4 py-2 text-[10px] text-stone-500">Select up to 3 areas to compare. Cost values are estimates based on your last analyzed inputs.</div>
        </aside>
      </div>
    </section>
  );
};

const Metric = ({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) => (
  <div className={`rounded-lg border px-2.5 py-2 ${strong ? 'border-emerald-200 bg-white' : 'border-stone-200/70 bg-white/75'}`}><div className="text-[9px] font-semibold text-stone-500">{label}</div><div className={`mt-0.5 text-xs ${strong ? 'font-extrabold text-emerald-900' : 'font-bold text-stone-800'}`}>{value}</div></div>
);
