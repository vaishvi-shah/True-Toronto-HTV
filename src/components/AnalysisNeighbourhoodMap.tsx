import React, { useEffect, useMemo, useRef, useState } from 'react';
import { divIcon } from 'leaflet';
import { Activity, Briefcase, Bus, ExternalLink, Footprints, Home, MapPin, Plus, Search, ShoppingBasket, SlidersHorizontal, Trees } from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer, Tooltip } from 'react-leaflet';
import { CalculatedCost, UserPreferences, BedroomType } from '../types';
import { AREA_ROUTING_COORDINATES, WORKPLACE_ROUTING_COORDINATES } from '../data/routingCoordinates';
import { NEIGHBOURHOODS, WORKPLACES } from '../data/neighbourhoods';
import { DEMO_LISTINGS } from '../data/demoListings';
import { buildPlatformSearchUrls } from '../data/listings';
import { areaPinName } from '../services/mapAccessibility';
import 'leaflet/dist/leaflet.css';

interface AnalysisNeighbourhoodMapProps {
  results: CalculatedCost[];
  preferences: UserPreferences;
}

interface NearbyPlaceSummary {
  countWithin1_5Km: number;
  nearest: { name: string; distanceKm: number } | null;
}

interface AreaAmenities {
  groceries: NearbyPlaceSummary;
  everydayEssentials: NearbyPlaceSummary;
  transitAccess: NearbyPlaceSummary;
  recreation: NearbyPlaceSummary;
}

type AreaPriority = 'cost' | 'rent' | 'commute' | 'transit' | 'groceries' | 'walkability' | 'recreation';

const currency = (amount: number | null) => amount === null ? 'Not entered' : `$${Math.round(amount).toLocaleString()}`;
const unitLabel = (bedrooms: BedroomType) => bedrooms === 'bachelor' ? 'Studio' : bedrooms.replace('bed', ' bedroom');

function areaIcon(rank: number, selected: boolean, accessibleName: string) {
  return divIcon({
    className: 'housing-area-marker',
    html: `<div style="width:34px;height:34px;border-radius:50% 50% 50% 8px;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;background:${selected ? '#1c1917' : '#ffffff'};border:2px solid #1c1917"><span aria-hidden="true" style="transform:rotate(45deg);font-size:13px;line-height:1;font-weight:800;font-family:system-ui,sans-serif;color:${selected ? '#ffffff' : '#1c1917'}">${rank}</span><span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;">${accessibleName}</span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
  });
}

function workplaceIcon() {
  return divIcon({
    className: 'workplace-map-marker',
    html: '<div style="width:34px;height:42px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 1px 3px #0008)"><svg viewBox="0 0 32 42" width="34" height="42" aria-hidden="true"><path d="M16 1C7.7 1 1 7.7 1 16c0 10.2 15 25 15 25s15-14.8 15-25C31 7.7 24.3 1 16 1Z" fill="#dc2626" stroke="white" stroke-width="2"/><circle cx="16" cy="16" r="5" fill="white"/></svg></div>',
    iconSize: [34, 42],
    iconAnchor: [17, 41],
  });
}

function currentHomeIcon() {
  return divIcon({
    className: 'current-home-map-marker',
    html: '<div style="width:38px;height:38px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 1px 6px #0008;color:#fff"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/><path d="M3 10h18"/></svg></div>',
    iconSize: [38, 38],
    iconAnchor: [19, 38],
  });
}

export const AnalysisNeighbourhoodMap: React.FC<AnalysisNeighbourhoodMapProps> = ({ results, preferences }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bedroomFilter, setBedroomFilter] = useState<'all' | BedroomType>('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [maxCommute, setMaxCommute] = useState('');
  const [visibleCount, setVisibleCount] = useState(6);
  const [amenitiesByArea, setAmenitiesByArea] = useState<Record<string, AreaAmenities>>({});
  const [amenitiesAsOf, setAmenitiesAsOf] = useState<string | null>(null);
  const [amenitiesLoading, setAmenitiesLoading] = useState(true);
  const [amenitiesError, setAmenitiesError] = useState(false);
  const [priority, setPriority] = useState<AreaPriority>('cost');
  const [comparedAreaIds, setComparedAreaIds] = useState<string[]>([]);
  const listingSection = useRef<HTMLElement>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/neighbourhood-amenities')
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Nearby place data is unavailable');
        return payload;
      })
      .then((payload) => {
        if (!active) return;
        setAmenitiesByArea(payload.byNeighbourhood || {});
        setAmenitiesAsOf(payload.dataAsOf || null);
      })
      .catch(() => { if (active) setAmenitiesError(true); })
      .finally(() => { if (active) setAmenitiesLoading(false); });
    return () => { active = false; };
  }, []);

  const selected = results.find((item) => item.neighbourhood.id === selectedId) || null;
  const workplace = WORKPLACES.find((item) => item.id === preferences.workplaceId);
  const workplacePoint = workplace ? WORKPLACE_ROUTING_COORDINATES[workplace.id] : undefined;
  const currentHome = NEIGHBOURHOODS.find((item) => item.id === preferences.currentNeighbourhoodId);
  const currentHomePoint = currentHome ? AREA_ROUTING_COORDINATES[currentHome.id] : undefined;
  const orderedResults = useMemo(() => [...results].sort((a, b) => {
    if (priority === 'rent') return (a.effectiveRent ?? Number.MAX_SAFE_INTEGER) - (b.effectiveRent ?? Number.MAX_SAFE_INTEGER);
    if (priority === 'commute') return a.monthlyCommuteHours - b.monthlyCommuteHours;
    if (priority === 'transit') return (amenitiesByArea[b.neighbourhood.id]?.transitAccess.countWithin1_5Km || 0) - (amenitiesByArea[a.neighbourhood.id]?.transitAccess.countWithin1_5Km || 0);
    if (priority === 'groceries') return (amenitiesByArea[b.neighbourhood.id]?.groceries.countWithin1_5Km || 0) - (amenitiesByArea[a.neighbourhood.id]?.groceries.countWithin1_5Km || 0);
    if (priority === 'walkability') {
      const bScore = (amenitiesByArea[b.neighbourhood.id]?.groceries.countWithin1_5Km || 0) + (amenitiesByArea[b.neighbourhood.id]?.everydayEssentials.countWithin1_5Km || 0);
      const aScore = (amenitiesByArea[a.neighbourhood.id]?.groceries.countWithin1_5Km || 0) + (amenitiesByArea[a.neighbourhood.id]?.everydayEssentials.countWithin1_5Km || 0);
      return bScore - aScore;
    }
    if (priority === 'recreation') return (amenitiesByArea[b.neighbourhood.id]?.recreation.countWithin1_5Km || 0) - (amenitiesByArea[a.neighbourhood.id]?.recreation.countWithin1_5Km || 0);
    return a.trueMonthlyCost - b.trueMonthlyCost;
  }), [results, priority, amenitiesByArea]);
  const selectedCommuteMinutes = selected?.commuteBreakdown.monthlyOneWayTrips
    ? Math.round(selected.monthlyCommuteHours * 60 / selected.commuteBreakdown.monthlyOneWayTrips)
    : 0;
  const listings = useMemo(() => {
    if (!selectedId) return [];
    return DEMO_LISTINGS.filter((listing) => listing.neighbourhoodId === selectedId)
      .filter((listing) => bedroomFilter === 'all' || listing.bedrooms === bedroomFilter)
      .filter((listing) => minPrice === '' || listing.monthlyRent >= Number(minPrice))
      .filter((listing) => maxPrice === '' || listing.monthlyRent <= Number(maxPrice))
      .filter(() => maxCommute === '' || selectedCommuteMinutes <= Number(maxCommute))
      .sort((a, b) => a.monthlyRent - b.monthlyRent);
  }, [selectedId, bedroomFilter, minPrice, maxPrice, maxCommute, selectedCommuteMinutes]);

  useEffect(() => {
    setVisibleCount(6);
    if (selectedId) listingSection.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedId]);

  const portalLinks = selected ? buildPlatformSearchUrls(selected.neighbourhood.name, bedroomFilter === 'all' ? preferences.bedrooms : bedroomFilter, maxPrice ? Number(maxPrice) : undefined) : null;
  const comparedAreas = orderedResults.filter((item) => comparedAreaIds.includes(item.neighbourhood.id));
  const toggleAreaCompare = (id: string) => setComparedAreaIds((previous) => {
    if (previous.includes(id)) return previous.filter((areaId) => areaId !== id);
    return previous.length < 3 ? [...previous, id] : previous;
  });

  return (
    <section className="my-10 border-y-2 border-[#1b1712] bg-white/40" aria-label="Explore Toronto neighbourhoods and demo rental examples" data-reveal="fade-up">
      <div className="border-b border-[#1b1712]/15 px-5 py-5 sm:px-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2 text-stone-500"><MapPin className="h-4 w-4" /><span className="dateline">Explore places to live</span></div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-[#1b1712]">Toronto neighbourhood map</h2>
            <p className="mt-1 text-[13px] text-stone-600">Select a marker for a cost and lifestyle snapshot — every pin names its area, rank, and monthly cost.</p>
          </div>
          <label className="flex items-center gap-2 text-[10px] font-semibold text-stone-500">PRIORITIZE
            <select value={priority} onChange={(event) => setPriority(event.target.value as AreaPriority)} className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-2 text-xs font-semibold text-stone-800">
              <option value="cost">Lowest total monthly cost</option><option value="rent">Lowest average rent</option><option value="commute">Shortest commute</option><option value="transit" disabled={amenitiesLoading || amenitiesError}>Mapped transit-stop count</option><option value="groceries" disabled={amenitiesLoading || amenitiesError}>Mapped grocery count</option><option value="walkability" disabled={amenitiesLoading || amenitiesError}>Nearby essentials proxy</option><option value="recreation" disabled={amenitiesLoading || amenitiesError}>Mapped recreation-place count</option>
            </select>
          </label>
        </div>
      </div>

      <div className="relative">
        <MapContainer center={[43.7001, -79.4163]} zoom={10} scrollWheelZoom className="h-[58vh] min-h-[390px] w-full">
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
          {workplace && workplacePoint && <Marker position={[workplacePoint[1], workplacePoint[0]]} icon={workplaceIcon()} zIndexOffset={1000} title={`Workplace: ${workplace.name}`}>
            <Tooltip direction="top" offset={[0, -36]} permanent>Work</Tooltip>
            <Popup><strong>Workplace</strong><br />{workplace.name}<br /><span>{workplace.address}</span></Popup>
          </Marker>}
          {currentHome && currentHomePoint && <Marker position={[currentHomePoint[1], currentHomePoint[0]]} icon={currentHomeIcon()} zIndexOffset={1100} title={`Current home: ${currentHome.name}`}>
            <Tooltip direction="top" offset={[0, -20]} permanent>Current home</Tooltip>
            <Popup><strong>Current home</strong><br />{currentHome.name}</Popup>
          </Marker>}
          {results.map((item, index) => {
            const point = AREA_ROUTING_COORDINATES[item.neighbourhood.id];
            const nearby = amenitiesByArea[item.neighbourhood.id];
            const route = preferences.routeEstimates?.[item.neighbourhood.id];
            const oneWayMinutes = item.commuteBreakdown.monthlyOneWayTrips ? Math.round(item.monthlyCommuteHours * 60 / item.commuteBreakdown.monthlyOneWayTrips) : 0;
            if (!point) return null;
            return <Marker key={item.neighbourhood.id} position={[point[1], point[0]]} icon={areaIcon(index + 1, item.neighbourhood.id === selectedId, areaPinName(index + 1, item))} title={areaPinName(index + 1, item)} eventHandlers={{ click: () => setSelectedId(item.neighbourhood.id) }}>
              <Tooltip direction="top" offset={[0, -30]} opacity={1}>
                <div className="min-w-48 py-0.5">
                  <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-stone-900">{item.neighbourhood.name}</div>
                  <div className="space-y-0.5 text-[10px] text-stone-700">
                    <div className="flex justify-between gap-4"><span>Rent</span><b>{currency(item.effectiveRent)}/mo</b></div>
                    <div className="flex justify-between gap-4"><span>Transportation</span><b>{currency(item.commuteBreakdown.totalMonthlyCommuteCost)}/mo</b></div>
                    <div className="flex justify-between gap-4"><span>Utilities</span><b>{currency(item.utilitiesCost)}/mo</b></div>
                    <div className="flex justify-between gap-4 border-t border-stone-200 pt-1"><span>Estimated total</span><b>{currency(item.trueMonthlyCost)}/mo</b></div>
                    <div className="flex justify-between gap-4 pt-0.5"><span>Commute</span><b>~{oneWayMinutes} min one way</b></div>
                    <div className="flex justify-between gap-4"><span>Road distance</span><b>{route ? `~${route.carDistanceKm} km` : 'Not available'}</b></div>
                    {nearby ? <>
                      <div className="flex justify-between gap-4 border-t border-stone-200 pt-1"><span>Groceries nearby</span><b>{nearby.groceries.countWithin1_5Km} mapped</b></div>
                      <div className="flex justify-between gap-4"><span>Everyday access</span><b>{nearby.everydayEssentials.countWithin1_5Km + nearby.groceries.countWithin1_5Km} places</b></div>
                      <div className="flex justify-between gap-4"><span>Transit / recreation</span><b>{nearby.transitAccess.countWithin1_5Km} / {nearby.recreation.countWithin1_5Km}</b></div>
                    </> : <div className="pt-1 text-stone-500">{amenitiesLoading ? 'Loading nearby places…' : 'Nearby-place data unavailable'}</div>}
                  </div>
                  <div className="mt-1.5 text-[9px] font-semibold text-emerald-800">Click marker for rental examples</div>
                </div>
              </Tooltip>
            </Marker>;
          })}
        </MapContainer>
        <div className="pointer-events-none absolute bottom-4 left-4 flex flex-wrap gap-x-3 gap-y-1 bg-[#1b1712] px-3 py-2 text-[10px] font-semibold text-[#f4f1e8]"><span className="font-bold">10 neighbourhoods</span><span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3 text-red-400" aria-hidden="true" /> Work</span>{currentHome && <span className="inline-flex items-center gap-1"><Home className="h-3 w-3 text-blue-300" aria-hidden="true" /> Current home</span>}<span className="border-l border-white/30 pl-2">Select a pin to explore</span></div>
      </div>
      <div className="border-t border-[#1b1712]/15 px-4 py-4 sm:px-6">
        <div className="mb-1 flex items-baseline justify-between gap-2"><span className="dateline text-stone-500">Areas ranked by {priority === 'cost' ? 'monthly cost' : priority === 'rent' ? 'rent' : priority === 'commute' ? 'commute time' : priority}</span><span className="text-[11px] text-stone-500">Select a rank to open the area</span></div>
        <ol className="grid gap-x-10 sm:grid-cols-2" data-reveal-group>{orderedResults.map((item, index) => <li key={item.neighbourhood.id} className={`flex min-w-0 items-center gap-1.5 border-b border-[#1b1712]/10 ${selectedId === item.neighbourhood.id ? 'bg-emerald-900/[0.06]' : ''}`} data-reveal-item>
          <button type="button" onClick={() => setSelectedId(item.neighbourhood.id)} title={`${item.neighbourhood.name} — open area details`} aria-label={`Rank ${index + 1}: ${item.neighbourhood.name}, ${currency(item.trueMonthlyCost)} per month`} className="flex min-w-0 flex-1 cursor-pointer items-baseline gap-2 py-2 text-left">
            <span className="figures w-5 shrink-0 text-xs font-bold text-[#1b1712]">{index + 1}</span>
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#1b1712]">{item.neighbourhood.name}</span>
            <span className="figures shrink-0 text-xs font-semibold text-stone-600">{currency(item.trueMonthlyCost)}/mo</span>
          </button>
          <button type="button" onClick={() => toggleAreaCompare(item.neighbourhood.id)} title={comparedAreaIds.includes(item.neighbourhood.id) ? `Remove ${item.neighbourhood.name} from comparison` : `Compare ${item.neighbourhood.name} (max 3)`} aria-pressed={comparedAreaIds.includes(item.neighbourhood.id)} aria-label={comparedAreaIds.includes(item.neighbourhood.id) ? `Remove ${item.neighbourhood.name} from comparison` : `Compare ${item.neighbourhood.name}`} className={`flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center border transition-colors ${comparedAreaIds.includes(item.neighbourhood.id) ? 'border-emerald-800 bg-emerald-800 text-white' : 'border-[#1b1712]/20 text-stone-400 hover:border-[#1b1712] hover:text-[#1b1712]'}`}><Plus className="h-3.5 w-3.5" /></button>
        </li>)}</ol>
      </div>
      {comparedAreas.length > 1 && <div className="border-t border-stone-100 bg-stone-50 px-4 py-4 sm:px-6"><div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-bold text-stone-800">Neighbourhood comparison ({comparedAreas.length}/3)</h3><button type="button" onClick={() => setComparedAreaIds([])} className="text-[10px] font-semibold text-stone-500 underline">Clear comparison</button></div><div className="overflow-x-auto rounded-xl border border-stone-200 bg-white"><table className="w-full min-w-[620px] text-left text-[10px]"><thead><tr className="bg-stone-50"><th className="p-2.5 text-stone-500">Monthly indicator</th>{comparedAreas.map((item) => <th key={item.neighbourhood.id} className="min-w-32 p-2.5 font-bold text-stone-800">{item.neighbourhood.name}</th>)}</tr></thead><tbody>{[
        ['True monthly cost', (item: CalculatedCost) => `${currency(item.trueMonthlyCost)}/mo`],['Rent', (item: CalculatedCost) => `${currency(item.effectiveRent)}/mo`],['Transportation', (item: CalculatedCost) => `${currency(item.commuteBreakdown.totalMonthlyCommuteCost)}/mo`],['Utilities', (item: CalculatedCost) => `${currency(item.utilitiesCost)}/mo`],['Commute time', (item: CalculatedCost) => `${item.monthlyCommuteHours} hrs/mo`],['Grocers within 1.5 km', (item: CalculatedCost) => amenitiesByArea[item.neighbourhood.id] ? String(amenitiesByArea[item.neighbourhood.id].groceries.countWithin1_5Km) : 'Unavailable'],['Recreation places within 1.5 km', (item: CalculatedCost) => amenitiesByArea[item.neighbourhood.id] ? String(amenitiesByArea[item.neighbourhood.id].recreation.countWithin1_5Km) : 'Unavailable'],
      ].map(([label, getValue]) => <tr key={label as string} className="border-t border-stone-100"><th className="whitespace-nowrap p-2.5 font-semibold text-stone-500">{label as string}</th>{comparedAreas.map((item) => <td key={item.neighbourhood.id} className="p-2.5 font-mono font-semibold text-stone-800">{(getValue as (cost: CalculatedCost) => string)(item)}</td>)}</tr>)}</tbody></table></div></div>}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 bg-stone-50 px-4 py-2.5 text-[10px] text-stone-500 sm:px-6"><span>Points show representative locations, not official neighbourhood boundaries. Costs are estimates for your analyzed inputs.</span><span>Map and nearby-place data © OpenStreetMap contributors{amenitiesAsOf ? ` · OSM snapshot ${amenitiesAsOf}` : ''}</span></div>

      {selected && <section ref={listingSection} className="scroll-mt-4 border-t border-stone-200" aria-live="polite">
        <div className="flex flex-col gap-3 bg-stone-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div><span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Neighbourhood details · {selected.neighbourhood.borough}</span><h3 className="mt-1 text-lg font-bold text-stone-900">{selected.neighbourhood.name}</h3><p className="mt-1 text-xs text-stone-600">A cost and lifestyle snapshot for your selected workplace, household, and commute mode.</p></div>
          <button type="button" onClick={() => setSelectedId(null)} className="self-start rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 sm:self-center">Close area</button>
        </div>

        <div className="grid gap-4 bg-stone-50/60 p-4 sm:p-6 lg:grid-cols-2">
          <section className="rounded-xl border border-stone-200 bg-white p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">A. Estimated monthly cost of living</h4>
            <div className="mt-3 space-y-2 text-xs">
              <CostLine label={`Housing · ${preferences.bedrooms === 'bachelor' ? 'studio' : preferences.bedrooms.replace('bed', ' bedroom')}`} value={currency(selected.effectiveRent)} />
              <CostLine label="Transportation" value={currency(selected.commuteBreakdown.totalMonthlyCommuteCost)} />
              {selected.commuteBreakdown.transitFares > 0 && <CostLine label="  Transit fares" value={currency(selected.commuteBreakdown.transitFares)} muted />}
              {selected.commuteBreakdown.fuel > 0 && <CostLine label="  Fuel" value={currency(selected.commuteBreakdown.fuel)} muted />}
              {selected.commuteBreakdown.vehicleOperating > 0 && <CostLine label="  Vehicle ownership / operating" value={currency(selected.commuteBreakdown.vehicleOperating)} muted />}
              {selected.commuteBreakdown.workplaceParking > 0 && <CostLine label="  Workplace parking" value={currency(selected.commuteBreakdown.workplaceParking)} muted />}
              <CostLine label="Utilities" value={currency(selected.utilitiesCost)} />
              <CostLine label="Groceries" value="Not included — no verified area-specific spend data" muted />
              <div className="border-t border-stone-200 pt-2"><CostLine label="Estimated total (rent + transport + utilities)" value={`${currency(selected.trueMonthlyCost)}/mo`} strong /></div>
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-stone-500">Groceries, discretionary spending, and other household expenses are excluded from the total; available evidence does not support a reliable neighbourhood-specific grocery bill. Rent basis: {selected.rentLabel}{selected.neighbourhood.provenance.rentDate ? ` (${selected.neighbourhood.provenance.rentDate})` : ''}.</p>
          </section>

          <section className="rounded-xl border border-stone-200 bg-white p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">B. Transportation &amp; workplace commute</h4>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <LifestyleMetric icon={<Bus className="h-3.5 w-3.5" />} label="Selected mode" value={preferences.commuteMode.replace('_', ' ')} />
              <LifestyleMetric icon={<Activity className="h-3.5 w-3.5" />} label="Estimated one-way time" value={`~${selectedCommuteMinutes} min`} />
              <LifestyleMetric icon={<MapPin className="h-3.5 w-3.5" />} label="Road distance to work" value={preferences.routeEstimates?.[selected.neighbourhood.id] ? `~${preferences.routeEstimates[selected.neighbourhood.id].carDistanceKm} km` : 'Unavailable'} />
              <LifestyleMetric icon={<Bus className="h-3.5 w-3.5" />} label="Mapped transit stops nearby" value={amenitiesByArea[selected.neighbourhood.id] ? `${amenitiesByArea[selected.neighbourhood.id].transitAccess.countWithin1_5Km} within 1.5 km` : amenitiesLoading ? 'Loading…' : 'Unavailable'} />
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-stone-500">Commute time is the app’s area-level estimate for your selected mode, not a live departure itinerary. Road distance is route distance from a representative area point when available. Nearby stop counts do not measure frequency or service quality.</p>
          </section>

          <section className="rounded-xl border border-stone-200 bg-white p-4 lg:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">C–F. Grocery access, everyday convenience &amp; recreation</h4>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <PlaceMetric icon={<ShoppingBasket className="h-4 w-4" />} title="Grocery access" summary={amenitiesByArea[selected.neighbourhood.id]?.groceries} loading={amenitiesLoading} error={amenitiesError} />
              <PlaceMetric icon={<Footprints className="h-4 w-4" />} title="Everyday convenience" summary={amenitiesByArea[selected.neighbourhood.id]?.everydayEssentials} loading={amenitiesLoading} error={amenitiesError} />
              <PlaceMetric icon={<Bus className="h-4 w-4" />} title="Transit access" summary={amenitiesByArea[selected.neighbourhood.id]?.transitAccess} loading={amenitiesLoading} error={amenitiesError} />
              <PlaceMetric icon={<Trees className="h-4 w-4" />} title="Recreation &amp; lifestyle" summary={amenitiesByArea[selected.neighbourhood.id]?.recreation} loading={amenitiesLoading} error={amenitiesError} />
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-stone-500">Counts summarize mapped places within 1.5 km straight-line distance of an approximate neighbourhood center. Everyday convenience is a proximity proxy, not an official walkability score; missing OpenStreetMap entries may undercount. Recreation includes mapped parks, playgrounds, sports/fitness facilities, libraries, community centers, and cultural venues. Source: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="font-semibold text-emerald-800 underline">OpenStreetMap contributors</a>{amenitiesAsOf ? `, data snapshot ${amenitiesAsOf}` : ''}. {amenitiesError && 'Nearby-place data could not be loaded.'}</p>
          </section>
        </div>

        <div className="border-y border-amber-200 bg-amber-50 px-5 py-3 sm:px-7"><p className="text-[11px] font-semibold text-amber-950">Illustrative demo rent examples — not available units or live listings.</p><p className="mt-0.5 text-[10px] leading-relaxed text-amber-900/80">Example prices are generated around the area's historical CMHC rent benchmark. Use the links below to search actual availability on rental platforms.</p></div>

        <div className="grid grid-cols-2 gap-3 bg-white px-5 py-4 sm:grid-cols-4 sm:px-7">
          <label className="text-[10px] font-semibold text-stone-600">UNIT SIZE<select value={bedroomFilter} onChange={(event) => setBedroomFilter(event.target.value as 'all' | BedroomType)} className="mt-1 block w-full rounded-lg border border-stone-300 bg-stone-50 px-2.5 py-2 text-xs"><option value="all">All sizes</option><option value="bachelor">Studio</option><option value="1bed">1 bedroom</option><option value="2bed">2 bedrooms</option><option value="3bed">3+ bedrooms</option></select></label>
          <label className="text-[10px] font-semibold text-stone-600">MIN RENT / MONTH<input type="number" min="0" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="No minimum" className="mt-1 block w-full rounded-lg border border-stone-300 bg-stone-50 px-2.5 py-2 text-xs" /></label>
          <label className="text-[10px] font-semibold text-stone-600">MAX RENT / MONTH<input type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="No maximum" className="mt-1 block w-full rounded-lg border border-stone-300 bg-stone-50 px-2.5 py-2 text-xs" /></label>
          <label className="text-[10px] font-semibold text-stone-600">MAX COMMUTE (ONE WAY)<select value={maxCommute} onChange={(event) => setMaxCommute(event.target.value)} className="mt-1 block w-full rounded-lg border border-stone-300 bg-stone-50 px-2.5 py-2 text-xs"><option value="">Any time</option><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option><option value="90">90 minutes</option><option value="120">120 minutes</option></select></label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 bg-stone-50 px-5 py-3 sm:px-7">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-700"><Search className="h-3.5 w-3.5 text-stone-500" />Search actual listings for this area:</div>
          <div className="flex flex-wrap gap-1.5">{portalLinks && Object.entries({ HouseSigma: portalLinks.houseSigma, 'Realtor.ca': portalLinks.realtorCa, Zillow: portalLinks.zillow, 'Rentals.ca': portalLinks.rentalsCa }).map(([label, url]) => <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-stone-700 hover:border-emerald-300 hover:text-emerald-800">{label}<ExternalLink className="h-3 w-3" /></a>)}</div>
        </div>

        <div className="bg-stone-50/70 p-5 sm:p-7">
          {listings.length ? <>
            <div className="mb-3 flex items-center justify-between text-[11px] text-stone-500"><span>{listings.length} demo examples match · lowest rent first</span><span>Showing {Math.min(visibleCount, listings.length)}</span></div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {listings.slice(0, visibleCount).map((listing) => <article key={listing.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><Home className="h-4 w-4" /></div><span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-900">Demo</span></div>
                <h4 className="mt-3 text-sm font-bold text-stone-900">Illustrative {unitLabel(listing.bedrooms)} apartment</h4>
                <p className="mt-0.5 text-[10px] text-stone-500">{selected.neighbourhood.name} · example only</p>
                <p className="mt-3 font-mono text-xl font-extrabold text-emerald-800">{currency(listing.monthlyRent)}<span className="ml-1 text-[10px] font-medium text-stone-500">/mo</span></p>
                <div className="mt-2 flex items-center justify-between border-t border-stone-100 pt-2 text-[10px] text-stone-500"><span>Area benchmark</span><span>{currency(listing.benchmarkRent)}/mo</span></div>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-stone-500"><span>Estimated commute</span><span>~{selectedCommuteMinutes} min one way</span></div>
              </article>)}
            </div>
            {listings.length > visibleCount && <div className="mt-5 text-center"><button type="button" onClick={() => setVisibleCount((count) => count < 9 ? Math.min(count + 3, listings.length) : listings.length)} className="rounded-xl border border-emerald-200 bg-white px-5 py-2 text-xs font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50">{visibleCount < 9 ? 'View 3 more' : 'View all examples'}</button></div>}
          </> : <div className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center"><SlidersHorizontal className="mx-auto h-5 w-5 text-stone-400" /><h4 className="mt-2 text-sm font-bold text-stone-800">No demo examples match these filters</h4><p className="mt-1 text-xs text-stone-500">Try a wider rent range, unit size, or commute limit.</p></div>}
          <p className="mt-4 text-center text-[10px] leading-relaxed text-stone-500">Demo prices are illustrative estimates based on historical area rent references and do not represent current vacancies. Commute is an area-level estimate, not a unit-specific route.</p>
        </div>
      </section>}
    </section>
  );
};

const CostLine = ({ label, value, muted = false, strong = false }: { label: string; value: string; muted?: boolean; strong?: boolean }) => (
  <div className={`flex items-start justify-between gap-3 ${strong ? 'font-extrabold text-stone-900' : muted ? 'text-[10px] text-stone-500' : 'font-medium text-stone-700'}`}><span>{label}</span><span className="max-w-[62%] text-right">{value}</span></div>
);

const LifestyleMetric = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-lg border border-stone-100 bg-stone-50 p-2.5"><div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wide text-stone-500">{icon}{label}</div><div className="mt-1 text-xs font-bold capitalize text-stone-800">{value}</div></div>
);

const PlaceMetric = ({ icon, title, summary, loading, error }: { icon: React.ReactNode; title: string; summary?: NearbyPlaceSummary; loading: boolean; error: boolean }) => (
  <article className="rounded-lg border border-stone-100 bg-stone-50 p-3">
    <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-700">{icon}{title}</div>
    {summary ? <><p className="mt-2 text-lg font-extrabold text-emerald-800">{summary.countWithin1_5Km}<span className="ml-1 text-[9px] font-semibold text-stone-500">mapped nearby</span></p><p className="mt-1 text-[10px] leading-relaxed text-stone-500">{summary.nearest ? `Nearest: ${summary.nearest.name} · ~${summary.nearest.distanceKm} km straight-line` : 'No matching mapped places found in this radius.'}</p></> : <p className="mt-2 text-[10px] text-stone-500">{loading ? 'Loading nearby place data…' : error ? 'Nearby place data unavailable.' : 'No nearby place data available.'}</p>}
  </article>
);
