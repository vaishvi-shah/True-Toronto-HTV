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
  Edit2,
  RotateCcw,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { CalculatedCost, UserPreferences } from '../types';

interface NeighbourhoodTableProps {
  results: CalculatedCost[];
  preferences: UserPreferences;
  comparedIds: string[];
  onToggleCompare: (id: string) => void;
  onUpdateNeighbourhoodRent?: (id: string, rent: number | null) => void;
  onOpenPostingsModal?: (id: string) => void;
}

type SortField =
  | 'totalImpact'
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
  onUpdateNeighbourhoodRent,
  onOpenPostingsModal,
}) => {
  const [editingRentId, setEditingRentId] = useState<string | null>(null);
  const [editRentValue, setEditRentValue] = useState<number>(0);
  const [sortField, setSortField] = useState<SortField>('totalImpact');
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
      case 'totalImpact':
        valA = a.totalImpactMonthly;
        valB = b.totalImpactMonthly;
        break;
      case 'trueCost':
        valA = a.trueMonthlyCost;
        valB = b.trueMonthlyCost;
        break;
      case 'stickerRent':
        valA = a.effectiveRent ?? 0;
        valB = b.effectiveRent ?? 0;
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
        valA = a.incomeSharePercent ?? 0;
        valB = b.incomeSharePercent ?? 0;
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
              <th className="py-3.5 px-3 sm:px-4 text-center w-14">Total Impact Rank</th>
              <th className="py-3.5 px-3 sm:px-4">Neighbourhood</th>
              <th
                className="py-3.5 px-3 cursor-pointer hover:bg-stone-200 transition-colors"
                onClick={() => handleSort('totalImpact')}
              >
                <div className="flex items-center gap-1 text-stone-900 font-bold">
                  <span>Personalized Total</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
                </div>
              </th>
              <th
                className="py-3.5 px-3 cursor-pointer hover:bg-stone-200 transition-colors"
                onClick={() => handleSort('trueCost')}
              >
                <div className="flex items-center gap-1 text-stone-900 font-bold">
                  <span>True Monthly Cost</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
                </div>
              </th>
              <th
                className="py-3.5 px-3 cursor-pointer hover:bg-stone-200 transition-colors"
                onClick={() => handleSort('stickerRent')}
              >
                <div className="flex items-center gap-1">
                  <span>Housing / Rent</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
                </div>
              </th>
              <th
                className="py-3.5 px-3 cursor-pointer hover:bg-stone-200 transition-colors"
                onClick={() => handleSort('commuteCost')}
              >
                <div className="flex items-center gap-1">
                  <span>Commute Cost</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
                </div>
              </th>
              <th
                className="py-3.5 px-3 cursor-pointer hover:bg-stone-200 transition-colors"
                onClick={() => handleSort('commuteHours')}
              >
                <div className="flex items-center gap-1">
                  <span>Travel Hours</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
                </div>
              </th>
              <th className="py-3.5 px-3">Utilities</th>
              <th
                className="py-3.5 px-3 cursor-pointer hover:bg-stone-200 transition-colors"
                onClick={() => handleSort('timeCost')}
              >
                <div className="flex items-center gap-1">
                  <span>Time Value</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
                </div>
              </th>
              <th
                className="py-3.5 px-3 cursor-pointer hover:bg-stone-200 transition-colors"
                onClick={() => handleSort('incomeShare')}
              >
                <div className="flex items-center gap-1">
                  <span>Income Share</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
                </div>
              </th>
              <th className="py-3.5 px-3">Climate Exposure</th>
              <th className="py-3.5 px-3 text-center">Compare</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {sortedResults.map((cost, index) => {
              const n = cost.neighbourhood;
              const isCompared = comparedIds.includes(n.id);

              return (
                <tr
                  key={n.id}
                  className={`hover:bg-stone-50/80 transition-colors ${
                    isCompared ? 'bg-emerald-50/40' : ''
                  }`}
                >
                  {/* Rank */}
                  <td className="py-3.5 px-3 sm:px-4 text-center font-mono font-bold text-stone-700">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-stone-100 text-stone-800 text-xs">
                      #{index + 1}
                    </span>
                  </td>

                  {/* Neighbourhood */}
                  <td className="py-3.5 px-3 sm:px-4">
                    <div className="font-bold text-stone-900">{n.name}</div>
                    <div className="text-[11px] text-stone-500">{n.borough}</div>
                  </td>

                  {/* Personalized Total */}
                  <td className="py-3.5 px-3 font-mono">
                    <div className="text-sm font-bold text-stone-900">${cost.totalImpactMonthly.toLocaleString()}/mo</div>
                  </td>

                  {/* Out-of-pocket Cost */}
                  <td className="py-3.5 px-3 font-mono">
                    <div className="text-sm font-bold text-stone-900">
                      ${cost.trueMonthlyCost.toLocaleString()}/mo
                    </div>
                  </td>

                  {/* Rent (Editable) */}
                  <td className="py-3.5 px-3 font-mono">
                    {editingRentId === n.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="15000"
                          step="25"
                          value={editRentValue}
                          onChange={(e) => setEditRentValue(Number(e.target.value))}
                          className="w-20 bg-white border border-emerald-400 rounded-md px-1.5 py-0.5 text-xs font-mono font-bold text-stone-900"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (onUpdateNeighbourhoodRent) {
                              onUpdateNeighbourhoodRent(n.id, editRentValue > 0 ? editRentValue : null);
                            }
                            setEditingRentId(null);
                          }}
                          className="text-[10px] bg-emerald-700 text-white px-2 py-0.5 rounded-md font-semibold cursor-pointer"
                        >
                          OK
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingRentId(null)}
                          className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded-md cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-semibold ${
                              cost.isCustomRent ? 'text-emerald-800 font-bold' : 'text-stone-700'
                            }`}
                          >
                            {cost.effectiveRent !== null
                              ? `$${cost.effectiveRent.toLocaleString()}`
                              : 'Unspecified'}
                          </span>
                          {onUpdateNeighbourhoodRent && cost.rentStatus !== 'no_rent' && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRentId(n.id);
                                setEditRentValue(cost.effectiveRent ?? cost.originalMarketRent);
                              }}
                              className="text-[10px] text-stone-400 hover:text-emerald-700 cursor-pointer underline"
                              title="Click to input your own rent"
                            >
                              edit
                            </button>
                          )}
                        </div>
                        {cost.isCustomRent && (
                          <div className="text-[10px] text-emerald-700 flex items-center gap-1">
                            <span>User rent</span>
                            <button
                              type="button"
                              onClick={() => onUpdateNeighbourhoodRent && onUpdateNeighbourhoodRent(n.id, null)}
                              className="text-stone-400 underline hover:text-stone-600"
                              title="Reset to survey median"
                            >
                              reset
                            </button>
                          </div>
                        )}
                        {onOpenPostingsModal && (
                          <button
                            type="button"
                            onClick={() => onOpenPostingsModal(n.id)}
                            className="mt-1 text-[10px] text-amber-900 hover:text-amber-950 font-medium flex items-center gap-1 cursor-pointer bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded-md border border-amber-200 transition-colors"
                            title="Search live rentals on portals"
                          >
                            <Building2 className="w-2.5 h-2.5 text-amber-700" />
                            <span>Live Rentals</span>
                          </button>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Commute Cost */}
                  <td className="py-3.5 px-3 font-mono text-stone-700">
                    ${cost.commuteBreakdown.totalMonthlyCommuteCost}
                  </td>

                  {/* Commute Hours */}
                  <td className="py-3.5 px-3 font-mono text-stone-700">
                    {cost.monthlyCommuteHours} hrs
                  </td>

                  {/* Utilities */}
                  <td className="py-3.5 px-3 font-mono text-stone-700">
                    ${cost.utilitiesCost}
                  </td>

                  {/* Time Cost */}
                  <td className="py-3.5 px-3 font-mono text-stone-600">
                    {cost.timeCostMonthly > 0 ? `+$${cost.timeCostMonthly}` : '—'}
                  </td>

                  {/* Income Share */}
                  <td className="py-3.5 px-3">
                    {cost.incomeSharePercent !== null ? (
                      <span
                        className={`font-mono font-semibold px-2 py-0.5 rounded-md text-[11px] ${
                          cost.isSeverelyBurdened
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : cost.isRentBurdened
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {cost.incomeSharePercent}%
                      </span>
                    ) : (
                      <span className="text-stone-400 text-[11px] italic">—</span>
                    )}
                  </td>

                  {/* Climate Risks */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          n.floodRisk.level === 'Higher exposure'
                            ? 'bg-amber-500'
                            : n.floodRisk.level === 'Moderate exposure'
                            ? 'bg-blue-400'
                            : 'bg-emerald-400'
                        }`}
                        title={`Flood: ${n.floodRisk.level}`}
                      />
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          n.heatRisk.level === 'Higher exposure'
                            ? 'bg-rose-500'
                            : n.heatRisk.level === 'Moderate exposure'
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                        title={`Heat: ${n.heatRisk.level}`}
                      />
                    </div>
                  </td>

                  {/* Compare Action */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      onClick={() => onToggleCompare(n.id)}
                      className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        isCompared
                          ? 'bg-emerald-700 text-white'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                      }`}
                      title={isCompared ? 'Remove from compare' : 'Add to compare'}
                    >
                      {isCompared ? (
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
