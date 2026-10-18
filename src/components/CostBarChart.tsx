import React from 'react';
import { BarChart3, Clock, DollarSign, Home, Car, Zap } from 'lucide-react';
import { CalculatedCost } from '../types';

interface CostBarChartProps {
  results: CalculatedCost[];
  maxDisplay?: number;
}

export const CostBarChart: React.FC<CostBarChartProps> = ({
  results,
  maxDisplay = 10,
}) => {
  const displayItems = results.slice(0, maxDisplay);
  if (displayItems.length === 0) return null;

  // Find max total to scale bars proportionally
  const maxTotal = Math.max(
    ...displayItems.map((b) => b.totalImpactMonthly),
    1500
  );

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-stone-900 text-sm sm:text-base">
              Monthly Cost Breakdown Comparison
            </h3>
            <p className="text-xs text-stone-500">
              Visualizes out-of-pocket expenses (Housing + Transport + Utilities) and separately quantified Commute Time Value
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-stone-700">
            <span className="w-3 h-3 rounded-xs bg-emerald-600 shrink-0" />
            <span>Housing / Rent</span>
          </span>
          <span className="flex items-center gap-1.5 text-stone-700">
            <span className="w-3 h-3 rounded-xs bg-stone-800 shrink-0" />
            <span>Transport</span>
          </span>
          <span className="flex items-center gap-1.5 text-stone-700">
            <span className="w-3 h-3 rounded-xs bg-stone-400 shrink-0" />
            <span>Utilities</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-900 font-medium">
            <span className="w-3 h-3 rounded-xs bg-amber-400 border border-amber-500 shrink-0" />
            <span>Time Value (Sep)</span>
          </span>
        </div>
      </div>

      {/* Stacked Bars */}
      <div className="space-y-4">
        {displayItems.map((b, index) => {
          const rentAmount = b.effectiveRent ?? 0;
          const rentWidth = (rentAmount / maxTotal) * 100;
          const transitWidth =
            (b.commuteBreakdown.totalMonthlyCommuteCost / maxTotal) * 100;
          const utilsWidth = (b.utilitiesCost / maxTotal) * 100;
          const timeWidth = (b.timeCostMonthly / maxTotal) * 100;

          return (
            <div key={b.neighbourhood.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-stone-500 w-5">
                    #{b.impactRank || index + 1}
                  </span>
                  <span className="font-bold text-stone-900">
                    {b.neighbourhood.name}
                  </span>
                  <span className="text-[11px] text-stone-500">
                    ({b.neighbourhood.borough})
                  </span>
                  {b.isCustomRent && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded-sm">
                      User Rent
                    </span>
                  )}
                  {b.rentStatus === 'unspecified' && (
                    <span className="text-[10px] bg-stone-100 text-stone-600 font-medium px-1.5 py-0.2 rounded-sm">
                      Rent Unspecified
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-bold text-stone-900">
                    ${b.trueMonthlyCost.toLocaleString()}/mo
                  </span>
                  {b.timeCostMonthly > 0 && (
                    <span className="text-amber-800 font-medium text-[11px]">
                      (+${b.timeCostMonthly}/mo time)
                    </span>
                  )}
                </div>
              </div>

              {/* Bar Stack */}
              <div className="h-6 w-full bg-stone-100 rounded-lg overflow-hidden flex shadow-inner">
                {/* Rent segment if present */}
                {rentWidth > 0 && (
                  <div
                    style={{ width: `${rentWidth}%` }}
                    className="bg-emerald-600 h-full flex items-center justify-center text-[10px] text-white font-mono font-semibold"
                    title={`Housing/Rent: $${rentAmount}/mo`}
                  >
                    {rentWidth > 12 && `$${rentAmount}`}
                  </div>
                )}

                {/* Commute segment */}
                <div
                  style={{ width: `${transitWidth}%` }}
                  className="bg-stone-800 h-full flex items-center justify-center text-[10px] text-white font-mono font-semibold"
                  title={`Transport: $${b.commuteBreakdown.totalMonthlyCommuteCost}/mo`}
                >
                  {transitWidth > 8 && `$${b.commuteBreakdown.totalMonthlyCommuteCost}`}
                </div>

                {/* Utilities segment */}
                <div
                  style={{ width: `${utilsWidth}%` }}
                  className="bg-stone-400 h-full flex items-center justify-center text-[10px] text-stone-900 font-mono font-semibold"
                  title={`Utilities: $${b.utilitiesCost}/mo`}
                >
                  {utilsWidth > 6 && `$${b.utilitiesCost}`}
                </div>

                {/* Separated Time Cost Segment */}
                {timeWidth > 0 && (
                  <div
                    style={{ width: `${timeWidth}%` }}
                    className="bg-amber-400 border-l border-amber-500 h-full flex items-center justify-center text-[10px] text-amber-950 font-mono font-bold"
                    title={`Time Cost: $${b.timeCostMonthly}/mo (${b.monthlyCommuteHours} hrs)`}
                  >
                    {timeWidth > 8 && `+$${b.timeCostMonthly}`}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
