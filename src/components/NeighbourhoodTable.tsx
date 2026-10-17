import React, { useState } from 'react';
import {
  ArrowUpDown,
  Droplets,
  Flame,
  Check,
  Plus,
  Clock,
  Car,
  Bus,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { CalculatedCost, UserPreferences } from '../types';

interface NeighbourhoodTableProps {
  results: CalculatedCost[];
  preferences: UserPreferences;
  comparedIds: string[];
  onToggleCompare: (id: string) => void;
}

type SortField =
  | 'trueCost'
  | 'stickerRent'
  | 'commuteCost'
  | 'commuteHours'
  | 'timeCost'
  | 'carbon'
  | 'incomeShare';

export const NeighbourhoodTable: React.FC<NeighbourhoodTableProps> = ({
  results,
  preferences,
  comparedIds,
  onToggleCompare,
}) => {
  const [sortField, setSortField] = useState<SortField>('trueCost');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    let valA = 0;
    let valB = 0;
    switch (sortField) {
      case 'trueCost':
        valA = a.trueMonthlyCost;
        valB = b.trueMonthlyCost;
        break;
      case 'stickerRent':
        valA = a.stickerRent;
        valB = b.stickerRent;
        break;
      case 'commuteCost':
        valA = a.commuteBreakdown.totalMonthlyCommuteCost;
        valB = b.commuteBreakdown.totalMonthlyCommuteCost;
        break;
      case 'commuteHours':
        valA = a.monthlyCommuteHours;
        valB = b.monthlyCommuteHours;
        break;
      case 'timeCost':
        valA = a.timeCostMonthly;
        valB = b.timeCostMonthly;
        break;
      case 'carbon':
        valA = a.carbonFootprintKg.total;
        valB = b.carbonFootprintKg.total;
        break;
      case 'incomeShare':
        valA = a.incomeSharePercent;
        valB = b.incomeSharePercent;
        break;
    }
    return sortAsc ? valA - valB : valB - valA;
  });

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-stone-100/80 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3 sm:px-4 text-center w-12">Rank</th>
              <th className="py-3 px-3 sm:px-4">Neighbourhood</th>
              <th
                className="py-3 px-3 cursor-pointer hover:bg-stone-200 transition-colors"
                onClick={() => handleSort('trueCost')}
              >
                <div className="flex items-center gap-1 font-bold text-stone-900">
                  <span>True Monthly Cost</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="py-3 px-3 cursor-pointer hover:bg-stone-200 transition-colors"
                onClick={() => handleSort('stickerRent')}
              >
                <div className="flex items-center gap-1">
                  <span>Sticker Rent</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="py-3 px-3 cursor-pointer hover:bg-stone-200 transition-colors"
                onClick={() => handleSort('commuteCost')}
              >
                <div className="flex items-center gap-1">
                  <span>Commute Cost</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="py-3 px-3 cursor-pointer hover:bg-stone-200 transition-colors"
                onClick={() => handleSort('commuteHours')}
              >
                <div className="flex items-center gap-1">
                  <span>Commute Time</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="py-3 px-3 cursor-pointer hover:bg-stone-200 transition-colors bg-amber-50/50 text-amber-900"
                onClick={() => handleSort('timeCost')}
                title="Separately valued; does not inflate out-of-pocket rent"
              >
                <div className="flex items-center gap-1 font-semibold">
                  <span>Time Cost (Sep)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="py-3 px-3 cursor-pointer hover:bg-stone-200 transition-colors"
                onClick={() => handleSort('carbon')}
              >
                <div className="flex items-center gap-1">
                  <span>Carbon (kg)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3">Climate Exposure</th>
              <th className="py-3 px-3">Displacement Status</th>
              <th className="py-3 px-3 text-center">Compare</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {sortedResults.map((cost) => {
              const n = cost.neighbourhood;
              const isComp = comparedIds.includes(n.id);

              return (
                <tr
                  key={n.id}
                  className={`hover:bg-stone-50/80 transition-colors ${
                    isComp ? 'bg-emerald-50/40' : ''
                  }`}
                >
                  <td className="py-3.5 px-3 sm:px-4 text-center font-mono font-bold text-stone-700">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-stone-100 text-stone-800 text-xs">
                      #{cost.trueCostRank}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 sm:px-4">
                    <div className="font-bold text-stone-900 text-xs sm:text-sm">
                      {n.name}
                    </div>
                    <div className="text-[11px] text-stone-500">
                      {n.borough} • {cost.rankShift > 0 ? (
                        <span className="text-emerald-700 font-medium">
                          +{cost.rankShift} vs rent rank
                        </span>
                      ) : cost.rankShift < 0 ? (
                        <span className="text-rose-700 font-medium">
                          {cost.rankShift} vs rent rank
                        </span>
                      ) : (
                        <span>Same as rent rank</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 font-mono">
                    <div className="text-sm font-bold text-stone-900">
                      ${cost.trueMonthlyCost.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-stone-400">
                      {cost.incomeSharePercent}% of income
                    </div>
                  </td>
                  <td className="py-3.5 px-3 font-mono text-stone-700 font-medium">
                    ${cost.stickerRent.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-stone-700">
                    ${cost.commuteBreakdown.totalMonthlyCommuteCost}
                  </td>
                  <td className="py-3.5 px-3 text-stone-700">
                    <div className="font-mono">{cost.monthlyCommuteHours} hrs/mo</div>
                    <div className="text-[10px] text-stone-500">
                      {preferences.commuteMode === 'car'
                        ? `${n.commutes[preferences.workplaceId]?.carMinutes}m / trip`
                        : `${n.commutes[preferences.workplaceId]?.transitMinutes}m / trip`}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 bg-amber-50/30 font-mono text-amber-900 font-medium">
                    ${cost.timeCostMonthly}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-stone-700">
                    {cost.carbonFootprintKg.total} kg
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex items-center gap-1 text-[11px] text-stone-700">
                        <Droplets className="w-3 h-3 text-sky-600 shrink-0" />
                        <span className="truncate max-w-[110px]" title={n.floodRisk.details}>
                          {n.floodRisk.level.replace(' exposure', '')}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-stone-700">
                        <Flame className="w-3 h-3 text-amber-600 shrink-0" />
                        <span className="truncate max-w-[110px]" title={n.heatRisk.details}>
                          {n.heatRisk.level.replace(' exposure', '')}
                          {n.heatRisk.canopyCoverPercent !== null
                            ? ` (${n.heatRisk.canopyCoverPercent}%)`
                            : ' (no data)'}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        n.displacementFlag.level === 'green'
                          ? 'bg-emerald-100 text-emerald-800'
                          : n.displacementFlag.level === 'yellow'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                      title={n.displacementFlag.details}
                    >
                      {n.displacementFlag.label}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <button
                      onClick={() => onToggleCompare(n.id)}
                      className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                        isComp
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      }`}
                      title={isComp ? 'Remove from comparison' : 'Add to comparison'}
                    >
                      {isComp ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
