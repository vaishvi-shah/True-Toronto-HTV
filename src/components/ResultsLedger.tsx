import React, { useEffect, useState } from 'react';
import { ChevronDown, Minus, Plus } from 'lucide-react';
import { CalculatedCost, UserPreferences } from '../types';
import { NeighbourhoodCard } from './NeighbourhoodCard';
import { refreshCinematic } from '../motion/cinematic';

interface ResultsLedgerProps {
  results: CalculatedCost[];
  preferences: UserPreferences;
  comparedIds: string[];
  onToggleCompare: (id: string) => void;
  onUpdateNeighbourhoodRent: (id: string, rent: number | null) => void;
  onOpenPostingsModal: (id?: string) => void;
  onOpenMlEstimator: (id: string) => void;
  getMonteCarloRange: (id: string) => [number, number] | undefined;
}

/**
 * The ranked ledger: each area is one ruled row in true-cost order, with the
 * full detail sheet (costs, listings, climate, citations) one expansion away.
 * Replaces ten identical cards with a single scannable broadsheet ranking.
 */
export const ResultsLedger: React.FC<ResultsLedgerProps> = ({
  results,
  preferences,
  comparedIds,
  onToggleCompare,
  onUpdateNeighbourhoodRent,
  onOpenPostingsModal,
  onOpenMlEstimator,
  getMonteCarloRange,
}) => {
  const [openId, setOpenId] = useState<string | null>(results[0]?.neighbourhood.id ?? null);

  // Results mount as a block after each analysis — pick up its reveals.
  useEffect(() => {
    refreshCinematic();
  }, []);

  if (!results.length) return null;

  return (
    <div data-reveal-group>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <p className="dateline text-stone-500">The ranking &middot; true monthly cost</p>
        <p className="text-[11px] text-stone-500">Select a row to open the full detail sheet</p>
      </div>
      <ol>
        {results.map((cost, index) => {
          const open = openId === cost.neighbourhood.id;
          const compared = comparedIds.includes(cost.neighbourhood.id);
          return (
            <li
              key={cost.neighbourhood.id}
              data-reveal-item
              className={`border-t border-[#1b1712]/15 ${index === results.length - 1 ? 'border-b' : ''} ${
                index === 0 ? 'border-t-2 border-[#1b1712]' : ''
              }`}
            >
              <div
                className={`flex items-center gap-3 py-3 sm:gap-5 sm:py-3.5 ${open ? 'bg-white/50' : ''}`}
              >
                <span
                  className={`font-display w-10 shrink-0 text-center leading-none ${
                    index === 0
                      ? 'bg-[#1b1712] py-1 text-2xl font-semibold text-[#f4f1e8]'
                      : 'text-2xl font-medium text-stone-400'
                  }`}
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : cost.neighbourhood.id)}
                  aria-expanded={open}
                  aria-label={`Rank ${index + 1}: ${cost.neighbourhood.name}, $${cost.trueMonthlyCost.toLocaleString()} per month — ${open ? 'collapse' : 'expand'} detail sheet`}
                  className="flex min-w-0 flex-1 cursor-pointer items-baseline gap-x-4 gap-y-0.5 text-left"
                >
                  <span className="min-w-0">
                    {index === 0 && (
                      <span className="dateline mb-0.5 block text-emerald-800">Recommended</span>
                    )}
                    <span className="block truncate text-base font-bold text-[#1b1712] sm:text-lg">
                      {cost.neighbourhood.name}
                    </span>
                    <span className="block text-[11px] font-medium uppercase tracking-wider text-stone-500">
                      {cost.neighbourhood.borough} &middot; {cost.monthlyCommuteHours} commute
                      hrs &middot; rent{' '}
                      {cost.effectiveRent !== null
                        ? `$${cost.effectiveRent.toLocaleString()}`
                        : 'unspecified'}
                    </span>
                  </span>
                </button>
                <span className="figures shrink-0 text-right text-lg font-bold text-[#1b1712] sm:text-xl">
                  ${cost.trueMonthlyCost.toLocaleString()}
                  <span className="block text-[10px] font-semibold text-stone-500">/mo true</span>
                </span>
                <button
                  type="button"
                  onClick={() => onToggleCompare(cost.neighbourhood.id)}
                  aria-pressed={compared}
                  aria-label={compared ? `Remove ${cost.neighbourhood.name} from comparison` : `Compare ${cost.neighbourhood.name}`}
                  title={compared ? 'Remove from comparison' : 'Add to comparison'}
                  className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center border transition-colors ${
                    compared
                      ? 'border-emerald-800 bg-emerald-800 text-white'
                      : 'border-[#1b1712]/25 text-stone-500 hover:border-[#1b1712] hover:text-[#1b1712]'
                  }`}
                >
                  {compared ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : cost.neighbourhood.id)}
                  aria-label={open ? 'Collapse detail sheet' : 'Expand detail sheet'}
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center text-stone-500 hover:text-[#1b1712]"
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>
              {open && (
                <div className="border-t border-dashed border-[#1b1712]/20 bg-white/40 px-2 py-4 sm:px-4">
                  <NeighbourhoodCard
                    cost={cost}
                    preferences={preferences}
                    isCompared={compared}
                    onToggleCompare={onToggleCompare}
                    onSelectForDetails={() => {}}
                    onUpdateNeighbourhoodRent={onUpdateNeighbourhoodRent}
                    onOpenPostingsModal={onOpenPostingsModal}
                    onOpenMlEstimator={onOpenMlEstimator}
                    monteCarloRange={getMonteCarloRange(cost.neighbourhood.id)}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};
