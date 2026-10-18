import React, { useState } from 'react';
import {
  Clock,
  Car,
  Bus,
  Bike,
  Footprints,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Leaf,
  Check,
  ChevronDown,
  ChevronUp,
  Edit2,
  Save,
  RotateCcw,
  Database,
  ChevronRight,
} from 'lucide-react';
import { CalculatedCost, UserPreferences } from '../types';
import { RiskBadge } from './RiskBadge';

function commuteBreakdownMinutes(monthlyHours: number, oneWayTrips: number) {
  return oneWayTrips > 0 ? Math.round((monthlyHours * 60) / oneWayTrips) : 0;
}

interface NeighbourhoodCardProps {
  cost: CalculatedCost;
  preferences: UserPreferences;
  isCompared: boolean;
  onToggleCompare: (id: string) => void;
  onSelectForDetails?: (id: string) => void;
  onUpdateNeighbourhoodRent?: (id: string, rent: number | null) => void;
  onOpenPostingsModal?: (id: string) => void;
}

export const NeighbourhoodCard: React.FC<NeighbourhoodCardProps> = ({
  cost: b,
  preferences,
  isCompared,
  onToggleCompare,
  onUpdateNeighbourhoodRent,
  onOpenPostingsModal,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingRent, setIsEditingRent] = useState(false);
  const [tempRentInput, setTempRentInput] = useState<number>(b.effectiveRent ?? b.originalMarketRent);

  const n = b.neighbourhood;

  const handleSaveCustomRent = () => {
    if (onUpdateNeighbourhoodRent) {
      onUpdateNeighbourhoodRent(n.id, tempRentInput > 0 ? tempRentInput : null);
    }
    setIsEditingRent(false);
  };

  const handleResetRent = () => {
    if (onUpdateNeighbourhoodRent) {
      onUpdateNeighbourhoodRent(n.id, null);
    }
    setTempRentInput(b.originalMarketRent);
    setIsEditingRent(false);
  };

  // Rank shift indicator
  const rankShiftLabel =
    b.rankShift > 0 ? (
      <span className="flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
        <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
        +{b.rankShift} ranks higher under true cost
      </span>
    ) : b.rankShift < 0 ? (
      <span className="flex items-center text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
        <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
        {b.rankShift} ranks lower under true cost
      </span>
    ) : (
      <span className="flex items-center text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
        <Minus className="w-3 h-3 mr-0.5" />
        Same rank as sticker rent
      </span>
    );

  const hasDestinationEstimate = Boolean(n.commutes[preferences.workplaceId]);
  const commuteDetail = {
    ...(n.commutes[preferences.workplaceId] || {
      transitMinutes: 40,
      transitTransfers: 1,
      transitRouteDescription: 'Generic commute baseline (destination route unavailable)',
      carMinutes: 30,
      carDistanceKm: 15,
    }),
    ...(preferences.routeEstimates?.[n.id] || {}),
  };
  const oneWayCommuteMinutes = commuteBreakdownMinutes(b.monthlyCommuteHours, b.commuteBreakdown.monthlyOneWayTrips);

  const isRentUnspecified = b.rentStatus === 'unspecified';
  const isRentFree = b.rentStatus === 'no_rent';

  return (
    <div
      className={`bg-white rounded-xl border transition-[border-color] duration-200 overflow-hidden flex flex-col ${
        isCompared
          ? 'border-stone-900 ring-1 ring-stone-900/20'
          : 'border-stone-200 hover:border-stone-400'
      }`}
    >
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-stone-100">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <span
              className="flex items-center justify-center w-7 h-7 rounded-xl bg-stone-900 text-white font-mono text-xs font-bold shadow-xs shrink-0"
              title={`Personalized total rank #${b.impactRank}`}
            >
              #{b.impactRank}
            </span>
            <div>
              <h3 className="text-base font-bold text-stone-900 leading-tight">
                {n.name}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                {n.borough}
              </p>
            </div>
          </div>

          <button
            onClick={() => onToggleCompare(n.id)}
            className={`pressable px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-[background-color,color] cursor-pointer shrink-0 ${
              isCompared
                ? 'bg-stone-900 text-white font-semibold'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
            }`}
          >
            {isCompared ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Comparing</span>
              </>
            ) : (
              <span>+ Compare</span>
            )}
          </button>
        </div>

        {/* Rank shift comparison pill */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {rankShiftLabel}
          <span className="text-[11px] text-stone-400 font-mono">
            Rent Rank: #{b.rentRank}
          </span>
        </div>
      </div>

      {/* Main Numbers: True Monthly Out-of-Pocket Cost */}
      <div className="p-4 sm:p-5 bg-stone-50/60">
        <div className="grid grid-cols-2 gap-3 pb-3 border-b border-stone-200/80">
          <div>
            <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              True Monthly Cost
            </div>
            <div className="text-2xl font-extrabold text-stone-900 font-mono tracking-tight mt-0.5">
              ${b.trueMonthlyCost.toLocaleString()}
              <span className="text-xs font-normal text-stone-500"> /mo</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              {isRentFree
                ? 'Commute + Utilities only'
                : isRentUnspecified
                ? 'Commute + Utilities (rent unspecified)'
                : 'Rent + Commute + Utilities'}
            </div>
          </div>

          {/* Housing / Rent Section */}
          <div className="border-l border-stone-200 pl-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  Housing / Rent
                </span>

                <div className="flex items-center gap-1">
                  {!isEditingRent && onUpdateNeighbourhoodRent && !isRentFree && (
                    <button
                      type="button"
                      onClick={() => {
                        setTempRentInput(b.effectiveRent ?? b.originalMarketRent);
                        setIsEditingRent(true);
                      }}
                      className="text-[11px] text-emerald-800 hover:text-emerald-950 font-semibold flex items-center gap-0.5 cursor-pointer bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200"
                      title="Customize rent for this specific neighbourhood"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>{b.isCustomRent ? 'Edit' : isRentUnspecified ? 'Enter Rent' : 'Custom'}</span>
                    </button>
                  )}
                </div>
              </div>

              {isEditingRent ? (
                <div className="mt-1.5 space-y-1.5">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-stone-600">$</span>
                    <input
                      type="number"
                      min="0"
                      max="15000"
                      step="25"
                      value={tempRentInput}
                      onChange={(e) => setTempRentInput(Number(e.target.value))}
                      className="w-24 bg-white border border-emerald-400 rounded-md px-1.5 py-0.5 text-xs font-mono font-bold text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                      autoFocus
                    />
                    <span className="text-[10px] text-stone-400">/mo</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSaveCustomRent}
                      className="px-2 py-0.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Save className="w-3 h-3" />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingRent(false)}
                      className="px-2 py-0.5 rounded-md bg-stone-200 hover:bg-stone-300 text-stone-700 text-[10px] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-0.5">
                  {isRentFree ? (
                    <div>
                      <div className="text-base font-bold font-mono text-stone-700">$0 /mo</div>
                      <span className="text-[10px] text-stone-500">Living rent-free</span>
                    </div>
                  ) : isRentUnspecified ? (
                    <div>
                      <div className="text-sm font-semibold text-amber-700">Unspecified</div>
                      <span className="text-[10px] text-stone-500">Not included in total</span>
                    </div>
                  ) : (
                    <div>
                      <div className="text-lg font-bold font-mono text-stone-900">
                        ${b.effectiveRent?.toLocaleString()}
                        <span className="text-xs font-normal text-stone-500"> /mo</span>
                      </div>
                      <div className="text-[10px] text-stone-500 flex items-center gap-1 flex-wrap">
                        {b.isCustomRent ? (
                          <>
                            <span className="text-emerald-800 font-semibold bg-emerald-50 px-1 rounded-sm">
                              Your Rent
                            </span>
                            <button
                              type="button"
                              onClick={handleResetRent}
                              className="text-[10px] text-stone-400 hover:text-stone-700 underline flex items-center gap-0.5 cursor-pointer ml-1"
                              title="Reset to this area's CMHC rent reference"
                            >
                              <RotateCcw className="w-2.5 h-2.5" />
                              Area reference rent: ${b.originalMarketRent}
                            </button>
                          </>
                        ) : (
                          <span>{n.provenance.rentSource} · {n.provenance.rentDate}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Breakdown Line Items */}
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div className="bg-white rounded-xl p-2 border border-stone-200/80">
            <span className="block text-[10px] uppercase font-semibold text-stone-400">
              Housing
            </span>
            <span className="text-xs font-bold font-mono text-stone-800">
              {b.effectiveRent !== null ? `$${b.effectiveRent.toLocaleString()}` : '—'}
            </span>
          </div>

          <div className="bg-white rounded-xl p-2 border border-stone-200/80">
            <span className="block text-[10px] uppercase font-semibold text-stone-400">
              Commute
            </span>
            <span className="text-xs font-bold font-mono text-stone-800">
              ${b.commuteBreakdown.totalMonthlyCommuteCost.toLocaleString()}
            </span>
          </div>

          <div className="bg-white rounded-xl p-2 border border-stone-200/80">
            <span className="block text-[10px] uppercase font-semibold text-stone-400">
              Utilities
            </span>
            <span className="text-xs font-bold font-mono text-stone-800">
              ${b.utilitiesCost.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Income burden indicator or missing info message */}
        <div className="mt-3 flex items-center justify-between text-xs">
          {b.incomeSharePercent !== null ? (
            <>
              <span className="text-stone-600">
                Gross Income Share: <strong className="text-stone-900">{b.incomeSharePercent}%</strong>
              </span>
              {b.isSeverelyBurdened ? (
                <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                  Severe Burden (&gt;50%)
                </span>
              ) : b.isRentBurdened ? (
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  Rent Burdened (&gt;30%)
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  Affordable Ratio (&le;30%)
                </span>
              )}
            </>
          ) : (
            <span className="text-[11px] text-stone-400 italic">
              Income not provided &bull; Burden ratio uncalculated
            </span>
          )}
        </div>
      </div>

      {onOpenPostingsModal && (
        <div className="border-t border-b border-stone-200 bg-stone-50 p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-stone-900">Live rental search</p>
              <p className="mt-0.5 text-[10px] text-stone-500">Search current availability on HouseSigma, Realtor.ca, Zillow, and Rentals.ca.</p>
            </div>
            <button type="button" onClick={() => onOpenPostingsModal(n.id)} className="shrink-0 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-100">
              Search live
            </button>
          </div>
        </div>
      )}

      {/* Value of Your Time: Separated out so it never silently inflates out-of-pocket cash */}
      <div className="p-3.5 sm:p-4 bg-stone-50 border-b border-stone-200/80">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800">
            <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Commute Time Economic Valuation</span>
          </div>
          <span className="text-xs font-mono font-bold text-stone-900">
            {b.timeCostMonthly > 0 ? `+$${b.timeCostMonthly.toLocaleString()}/mo` : `${b.monthlyCommuteHours} hrs/mo`}
          </span>
        </div>
        <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
          {b.monthlyCommuteHours} hrs/mo travel time ({oneWayCommuteMinutes} min one-way).
          {b.timeCostMonthly > 0
            ? ` Quantified separately as economic time value.`
            : ` (Monetization disabled or rate unspecified).`}
        </p>
      </div>

      {/* Commute and Carbon footprint */}
      <div className="p-4 sm:p-5 border-b border-stone-100 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-stone-700 flex items-center gap-1.5">
            {preferences.commuteMode === 'car' ? (
              <Car className="w-3.5 h-3.5 text-emerald-600" />
            ) : preferences.commuteMode === 'cycling' ? (
              <Bike className="w-3.5 h-3.5 text-emerald-600" />
            ) : preferences.commuteMode === 'walking' || preferences.commuteMode === 'walk_bike' ? (
              <Footprints className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Bus className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>Commute Details:</span>
          </span>
          <span className="font-medium text-stone-800">
            {preferences.commuteMode === 'car'
              ? `${oneWayCommuteMinutes} mins (${commuteDetail.carDistanceKm} km each way)`
            : preferences.commuteMode === 'walking' || preferences.commuteMode === 'walk_bike'
              ? `${oneWayCommuteMinutes} min walking estimate`
            : preferences.commuteMode === 'cycling'
              ? `${oneWayCommuteMinutes} min cycling estimate`
              : preferences.commuteMode === 'hybrid'
                ? `${oneWayCommuteMinutes} min mixed estimate`
                : `${oneWayCommuteMinutes} mins (${commuteDetail.transitTransfers} transfer${commuteDetail.transitTransfers === 1 ? '' : 's'})`}
          </span>
        </div>
        <p className="text-[10px] text-stone-500">
          {preferences.commuteMode === 'car'
            ? preferences.routeEstimates?.[n.id]
              ? 'OpenRouteService road estimate from an approximate area centre; no live traffic.'
              : hasDestinationEstimate
                ? 'Saved area-to-workplace road estimate; no live traffic.'
                : 'No destination-specific route is available; a generic baseline is shown.'
            : preferences.commuteMode === 'walking' || preferences.commuteMode === 'cycling' || preferences.commuteMode === 'walk_bike'
              ? 'Estimated from representative area-to-work distance and typical walking or cycling speed; not turn-by-turn routing.'
              : hasDestinationEstimate
                ? 'Stored transit-time estimate; not a live trip planner.'
                : 'Transit time is estimated from area-to-work distance; this is not a live itinerary.'}
        </p>

        {/* Carbon Footprint */}
        <div className="flex items-center justify-between text-xs text-stone-600 pt-1 border-t border-stone-100" title="Estimated monthly commute operational emissions. Home energy and active-travel lifecycle emissions are excluded; see methodology for factors and assumptions.">
          <span className="flex items-center gap-1 text-emerald-800 font-medium">
            <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            Estimated commute emissions:
          </span>
          <span className="font-mono text-stone-700">
            <strong>{b.carbonFootprintKg.total}</strong> kg CO₂e / mo
          </span>
        </div>
      </div>

      {/* Climate exposure indicators */}
      <div className="p-4 sm:p-5 space-y-2 flex-1">
        <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
          Climate Exposure
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <RiskBadge
            type="flood"
            level={n.floodRisk.level}
            label={n.floodRisk.level}
            details={`${n.floodRisk.watershed} - ${n.floodRisk.details}`}
          />
          <RiskBadge
            type="heat"
            level={n.heatRisk.level}
            label={n.heatRisk.level}
            details={n.heatRisk.details}
            subValue={n.heatRisk.canopyCoverPercent}
          />
        </div>

      </div>

      {/* Collapsible Provenance Drawer */}
      <div className="border-t border-stone-200 mt-auto">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-2.5 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-50/80 hover:bg-stone-100 flex items-center justify-between transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-stone-500" />
            <span>Public Data Citations</span>
          </span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        {isExpanded && (
          <div className="p-4 bg-stone-50 text-[11px] text-stone-600 space-y-2 border-t border-stone-200">
            <div>
              <strong className="text-stone-800">Area rent reference:</strong> historical CMHC survey-zone average mapped approximately to this neighbourhood ({n.provenance.rentDate}) and bedroom count; it is not a current listing or neighbourhood-level observation. Verify locally before making a housing decision.
            </div>
            <div>
              <strong className="text-stone-800">Transit:</strong> {n.provenance.transitSource} &bull; Route: {commuteDetail.transitRouteDescription}.
            </div>
            <div>
              <strong className="text-stone-800">Flood Data:</strong> {n.floodRisk.source} ({n.floodRisk.sourceDate}). Watershed: {n.floodRisk.watershed}.
            </div>
            <div>
              <strong className="text-stone-800">Heat / Canopy:</strong> {n.heatRisk.source} ({n.heatRisk.sourceDate}).
              {n.heatRisk.canopyCoverPercent === null && (
                <span className="text-amber-800 ml-1">Sensor canopy is &quot;no data&quot; for this zone.</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
