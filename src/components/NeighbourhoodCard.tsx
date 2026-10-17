import React, { useState } from 'react';
import {
  Clock,
  Car,
  Bus,
  Droplets,
  Flame,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Leaf,
  Info,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';
import { CalculatedCost, UserPreferences } from '../types';

interface NeighbourhoodCardProps {
  cost: CalculatedCost;
  preferences: UserPreferences;
  isCompared: boolean;
  onToggleCompare: (id: string) => void;
  onSelectForDetails: (cost: CalculatedCost) => void;
}

export const NeighbourhoodCard: React.FC<NeighbourhoodCardProps> = ({
  cost,
  preferences,
  isCompared,
  onToggleCompare,
  onSelectForDetails,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const n = cost.neighbourhood;

  // Displacement badge color & label
  const displacementConfig = {
    green: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    yellow: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
    },
    red: {
      bg: 'bg-rose-50 text-rose-800 border-rose-200',
      dot: 'bg-rose-500',
    },
  }[n.displacementFlag.level];

  // Flood exposure badge
  const floodConfig = {
    'Lower exposure': 'bg-sky-50 text-sky-800 border-sky-200',
    'Moderate exposure': 'bg-amber-50 text-amber-800 border-amber-200',
    'Higher exposure': 'bg-rose-50 text-rose-800 border-rose-200',
  }[n.floodRisk.level];

  // Heat exposure badge
  const heatConfig = {
    'Lower exposure': 'bg-emerald-50 text-emerald-800 border-emerald-200',
    'Moderate exposure': 'bg-amber-50 text-amber-800 border-amber-200',
    'Higher exposure': 'bg-orange-50 text-orange-800 border-orange-200',
  }[n.heatRisk.level];

  // Rank shift label
  const rankShiftLabel =
    cost.rankShift > 0 ? (
      <span className="flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
        <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
        +{cost.rankShift} ranks better vs rent
      </span>
    ) : cost.rankShift < 0 ? (
      <span className="flex items-center text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
        <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
        {cost.rankShift} ranks worse vs rent
      </span>
    ) : (
      <span className="flex items-center text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
        <Minus className="w-3 h-3 mr-0.5" />
        Same rank as rent
      </span>
    );

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md ${
        isCompared
          ? 'border-emerald-500 ring-2 ring-emerald-500/20'
          : 'border-stone-200 hover:border-stone-300'
      }`}
    >
      {/* Top Card Header */}
      <div className="p-4 sm:p-5 border-b border-stone-100">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-stone-900 text-white font-mono text-xs font-bold shadow-xs">
              #{cost.trueCostRank}
            </span>
            <div>
              <h3 className="text-base font-bold text-stone-900 leading-snug">
                {n.name}
              </h3>
              <p className="text-xs text-stone-500">
                {n.borough} • CMHC Zone
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleCompare(n.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                isCompared
                  ? 'bg-emerald-600 text-white'
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
        </div>

        {/* Rank shift comparison pill */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {rankShiftLabel}
          <span className="text-xs text-stone-500">
            Sticker Rent Rank: #{cost.rentRank}
          </span>
        </div>
      </div>

      {/* Main Numbers: True Monthly Cost vs Sticker Rent */}
      <div className="p-4 sm:p-5 bg-stone-50/50">
        <div className="grid grid-cols-2 gap-3 pb-3 border-b border-stone-200/80">
          <div>
            <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              True Monthly Cost
            </div>
            <div className="text-2xl font-extrabold text-stone-900 font-mono tracking-tight mt-0.5">
              ${cost.trueMonthlyCost.toLocaleString()}
              <span className="text-xs font-normal text-stone-500"> /mo</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              Rent + Commute + Utilities
            </div>
          </div>

          <div className="border-l border-stone-200 pl-3">
            <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              Sticker Rent Only
            </div>
            <div className="text-xl font-bold text-stone-700 font-mono tracking-tight mt-0.5">
              ${cost.stickerRent.toLocaleString()}
              <span className="text-xs font-normal text-stone-500"> /mo</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              {preferences.bedrooms === 'bachelor'
                ? 'Bachelor'
                : preferences.bedrooms === '1bed'
                ? '1-Bedroom'
                : preferences.bedrooms === '2bed'
                ? '2-Bedroom'
                : '3-Bedroom'}{' '}
              median
            </div>
          </div>
        </div>

        {/* Cost Breakdown Pills */}
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div className="bg-white rounded-lg p-2 border border-stone-200/80">
            <span className="block text-[10px] uppercase font-semibold text-stone-400">
              Rent
            </span>
            <span className="text-xs font-bold font-mono text-stone-800">
              ${cost.stickerRent}
            </span>
          </div>

          <div className="bg-white rounded-lg p-2 border border-stone-200/80">
            <span className="block text-[10px] uppercase font-semibold text-stone-400">
              Commute
            </span>
            <span className="text-xs font-bold font-mono text-stone-800">
              ${cost.commuteBreakdown.totalMonthlyCommuteCost}
            </span>
          </div>

          <div className="bg-white rounded-lg p-2 border border-stone-200/80">
            <span className="block text-[10px] uppercase font-semibold text-stone-400">
              Utilities
            </span>
            <span className="text-xs font-bold font-mono text-stone-800">
              ${cost.utilitiesCost}
            </span>
          </div>
        </div>

        {/* Income burden indicator */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-stone-500">
            Share of Income: <strong className="text-stone-800">{cost.incomeSharePercent}%</strong>
          </span>
          {cost.isSeverelyBurdened ? (
            <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-sm">
              Severe Burden (&gt;50%)
            </span>
          ) : cost.isRentBurdened ? (
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-sm">
              Rent Burdened (&gt;30%)
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm">
              Standard Housing Ratio (&le;30%)
            </span>
          )}
        </div>
      </div>

      {/* The Cost of Your Time: STRICTLY SHOWN SEPARATELY */}
      <div className="p-4 sm:p-5 bg-amber-50/40 border-t border-b border-amber-100">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>The Cost of Your Time (Shown Separately)</span>
          </div>
          <span className="text-xs font-mono font-bold text-amber-950">
            ${cost.timeCostMonthly}/mo
          </span>
        </div>
        <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
          {cost.monthlyCommuteHours} hours/month travelling ({cost.commuteBreakdown.monthlyOneWayTrips} trips). Valued at 50% of your hourly wage (${cost.hourlyWage}/hr). <em>Kept separate so it never quietly inflates your out-of-pocket rent budget.</em>
        </p>
      </div>

      {/* Commute and Carbon footprint */}
      <div className="p-4 sm:p-5 border-b border-stone-100">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-stone-700 flex items-center gap-1.5">
            {preferences.commuteMode === 'car' ? (
              <Car className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Bus className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>Commute Profile:</span>
          </span>
          <span className="font-medium text-stone-800">
            {preferences.commuteMode === 'car'
              ? `${n.commutes[preferences.workplaceId]?.carMinutes ?? 30} mins driving`
              : `${n.commutes[preferences.workplaceId]?.transitMinutes ?? 40} mins transit`}
          </span>
        </div>

        <p className="text-xs text-stone-600 line-clamp-1" title={n.commutes[preferences.workplaceId]?.transitRouteDescription}>
          {n.commutes[preferences.workplaceId]?.transitRouteDescription}
        </p>

        {/* Carbon Footprint */}
        <div className="mt-3 flex items-center justify-between text-xs text-stone-600 pt-2 border-t border-stone-100">
          <span className="flex items-center gap-1 text-emerald-800 font-medium">
            <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            Carbon Footprint:
          </span>
          <span className="font-mono text-stone-700">
            <strong>{cost.carbonFootprintKg.total}</strong> kg CO₂e / mo
            <span className="text-[10px] text-stone-500 ml-1">
              (Commute: {cost.carbonFootprintKg.commute} kg)
            </span>
          </span>
        </div>
      </div>

      {/* Climate Risk Badges & Displacement Flag */}
      <div className="p-4 sm:p-5 space-y-2.5">
        <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
          Climate Exposure & Displacement Status
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Flood badge */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${floodConfig}`}
            title={n.floodRisk.details}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Flood: {n.floodRisk.level}</span>
          </span>

          {/* Heat badge */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${heatConfig}`}
            title={n.heatRisk.details}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>
              Heat: {n.heatRisk.level}
              {n.heatRisk.canopyCoverPercent !== null
                ? ` (${n.heatRisk.canopyCoverPercent}%)`
                : ' (no data)'}
            </span>
          </span>
        </div>

        {/* Displacement Flag */}
        <div
          className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${displacementConfig.bg}`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 mt-0.5 ${displacementConfig.dot}`}
          />
          <div>
            <div className="font-semibold flex items-center gap-1.5">
              <span>Displacement Flag: {n.displacementFlag.label}</span>
              <span className="font-mono text-[11px] opacity-80">
                (+{n.displacementFlag.turnoverGapPercent}% turnover spread)
              </span>
            </div>
            <p className="text-[11px] mt-0.5 opacity-90 leading-relaxed">
              {n.displacementFlag.details}
            </p>
          </div>
        </div>
      </div>

      {/* Collapsible Provenance & Data Sources Drawer */}
      <div className="border-t border-stone-200">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-2.5 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-50/80 hover:bg-stone-100 flex items-center justify-between transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-stone-500" />
            <span>Data Provenance & Open Sources</span>
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
              <strong className="text-stone-800">Rent Source:</strong>{' '}
              {n.provenance.rentSource} ({n.provenance.rentDate})
            </div>
            <div>
              <strong className="text-stone-800">Transit Model:</strong>{' '}
              {n.provenance.transitSource}
            </div>
            <div>
              <strong className="text-stone-800">Climate Data:</strong>{' '}
              {n.provenance.climateSource}
            </div>
            <div>
              <strong className="text-stone-800">TRCA Watershed:</strong>{' '}
              {n.floodRisk.watershed}
            </div>
            {n.missingDataNotes && (
              <div className="p-2 bg-amber-50 rounded-md border border-amber-200 text-amber-900">
                <strong>Data note:</strong> {n.missingDataNotes}
              </div>
            )}
            <div className="text-[10px] text-stone-400 pt-1 border-t border-stone-200">
              Verified: {n.provenance.lastVerified} • Free public civic data
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
