import React from 'react';
import { X, Check, Clock, Droplets, Flame, Scale, TrendingDown, Leaf } from 'lucide-react';
import { CalculatedCost, UserPreferences } from '../types';

interface ComparisonDrawerProps {
  comparedCosts: CalculatedCost[];
  preferences: UserPreferences;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export const ComparisonDrawer: React.FC<ComparisonDrawerProps> = ({
  comparedCosts,
  preferences,
  onRemove,
  onClear,
}) => {
  if (comparedCosts.length === 0) return null;

  const cheapest = [...comparedCosts].sort((a, b) => a.trueMonthlyCost - b.trueMonthlyCost)[0];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-300 shadow-2xl p-4 sm:p-5 max-h-[85vh] overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-stone-900">
              Head-to-Head Comparison ({comparedCosts.length} selected)
            </h3>
            <span className="text-xs text-stone-500 hidden sm:inline">
              Comparing out-of-pocket, travel hours, and civic indicators
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClear}
              className="text-xs text-stone-500 hover:text-stone-800 underline cursor-pointer"
            >
              Clear All
            </button>
            <button
              onClick={onClear}
              className="p-1 rounded-md text-stone-400 hover:text-stone-700 bg-stone-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {comparedCosts.map((item) => {
            const isWinner = item.neighbourhood.id === cheapest.neighbourhood.id && comparedCosts.length > 1;
            const savingsVsMax = Math.max(...comparedCosts.map((c) => c.trueMonthlyCost)) - item.trueMonthlyCost;

            return (
              <div
                key={item.neighbourhood.id}
                className={`p-4 rounded-xl border relative transition-all ${
                  isWinner
                    ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                    : 'border-stone-200 bg-white'
                }`}
              >
                <button
                  onClick={() => onRemove(item.neighbourhood.id)}
                  className="absolute top-3 right-3 text-stone-400 hover:text-stone-700 p-1 rounded-md cursor-pointer"
                  title="Remove"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-2 mb-2 pr-6">
                  <span className="w-6 h-6 rounded-md bg-stone-900 text-white font-mono text-xs font-bold flex items-center justify-center">
                    #{item.trueCostRank}
                  </span>
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm">
                      {item.neighbourhood.name}
                    </h4>
                    <span className="text-[11px] text-stone-500">
                      {item.neighbourhood.borough}
                    </span>
                  </div>
                </div>

                {isWinner && (
                  <div className="mb-3 px-2 py-1 bg-emerald-100 text-emerald-900 rounded-md text-[11px] font-semibold flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Best Value: Saves ${savingsVsMax}/mo vs highest option</span>
                  </div>
                )}

                {/* Metrics */}
                <div className="space-y-2 text-xs border-t border-stone-200/60 pt-2.5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-stone-600 font-semibold">True Monthly Cost:</span>
                    <span className="font-mono text-base font-extrabold text-stone-900">
                      ${item.trueMonthlyCost.toLocaleString()}/mo
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-stone-500 text-[11px]">
                    <span>Sticker Rent:</span>
                    <span className="font-mono text-stone-700">${item.stickerRent}</span>
                  </div>

                  <div className="flex justify-between items-center text-stone-500 text-[11px]">
                    <span>Commute Cost:</span>
                    <span className="font-mono text-stone-700">
                      ${item.commuteBreakdown.totalMonthlyCommuteCost}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-stone-500 text-[11px]">
                    <span>Utilities:</span>
                    <span className="font-mono text-stone-700">${item.utilitiesCost}</span>
                  </div>

                  <div className="flex justify-between items-center text-stone-500 text-[11px] border-t border-dashed border-stone-200 pt-1.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      Commute Time:
                    </span>
                    <span className="font-mono text-stone-800 font-medium">
                      {item.monthlyCommuteHours} hrs / mo
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-amber-900 text-[11px] bg-amber-50 p-1.5 rounded-sm">
                    <span>Time Cost (Separately Valued):</span>
                    <span className="font-mono font-bold">${item.timeCostMonthly}/mo</span>
                  </div>

                  <div className="flex justify-between items-center text-stone-600 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Leaf className="w-3 h-3 text-emerald-600" />
                      Carbon Footprint:
                    </span>
                    <span className="font-mono text-stone-800">
                      {item.carbonFootprintKg.total} kg CO₂e
                    </span>
                  </div>

                  {/* Climate badges */}
                  <div className="pt-2 border-t border-stone-200/60 flex flex-wrap gap-1 text-[10px]">
                    <span className="px-1.5 py-0.5 rounded-sm bg-sky-50 text-sky-800 border border-sky-200">
                      Flood: {item.neighbourhood.floodRisk.level.replace(' exposure', '')}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-sm bg-amber-50 text-amber-800 border border-amber-200">
                      Heat: {item.neighbourhood.heatRisk.level.replace(' exposure', '')}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded-sm font-medium ${
                        item.neighbourhood.displacementFlag.level === 'green'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.neighbourhood.displacementFlag.level === 'yellow'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.neighbourhood.displacementFlag.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
