import React, { useState, useMemo } from 'react';
import {
  Dices,
  ShieldCheck,
  TrendingUp,
  Percent,
  CheckCircle2,
  Info,
  ArrowRight,
  BarChart2,
  ChevronDown,
} from 'lucide-react';
import { UserPreferences, CalculatedCost } from '../types';
import { runMonteCarloSimulation, PairwiseWinProbability } from '../services/monteCarloSimulation';

interface MonteCarloUncertaintyPanelProps {
  preferences: UserPreferences;
  results: CalculatedCost[];
}

export function MonteCarloUncertaintyPanel({
  preferences,
  results,
}: MonteCarloUncertaintyPanelProps) {
  const [selectedPairA, setSelectedPairA] = useState<string>(results[0]?.neighbourhood.id || '');
  const [selectedPairB, setSelectedPairB] = useState<string>(results[1]?.neighbourhood.id || '');
  const [simulationSeed, setSimulationSeed] = useState<number>(0);

  // Run 2,000 trial Monte Carlo simulation
  const simulation = useMemo(() => {
    return runMonteCarloSimulation(preferences, 2000);
  }, [preferences, simulationSeed]);

  // Pairwise win probability computation
  const activePairwise: PairwiseWinProbability | null = useMemo(() => {
    if (!selectedPairA || !selectedPairB || selectedPairA === selectedPairB) return null;

    const direct = simulation.pairwiseComparisons.find(
      (p) =>
        (p.neighbourhoodAId === selectedPairA && p.neighbourhoodBId === selectedPairB) ||
        (p.neighbourhoodAId === selectedPairB && p.neighbourhoodBId === selectedPairA)
    );

    if (direct) {
      if (direct.neighbourhoodAId === selectedPairA) {
        return direct;
      }
      return {
        neighbourhoodAId: selectedPairA,
        neighbourhoodAName: direct.neighbourhoodBName,
        neighbourhoodBId: selectedPairB,
        neighbourhoodBName: direct.neighbourhoodAName,
        probabilityACheaperPercent: Number((100 - direct.probabilityACheaperPercent).toFixed(1)),
        narrative: `${Number((100 - direct.probabilityACheaperPercent).toFixed(1))}% chance ${direct.neighbourhoodBName} is cheaper than ${direct.neighbourhoodAName} across simulated transit delays and asking rent ranges.`,
      };
    }

    return null;
  }, [simulation, selectedPairA, selectedPairB]);

  // Calculate global min and max across all neighbourhoods for consistent visual bar scaling
  const allP10s = Object.values(simulation.neighbourhoodStats).map((s) => s.p10);
  const allP90s = Object.values(simulation.neighbourhoodStats).map((s) => s.p90);
  const minCostGlobal = Math.max(0, Math.min(...allP10s) - 100);
  const maxCostGlobal = Math.max(...allP90s) + 100;
  const globalCostRange = Math.max(1, maxCostGlobal - minCostGlobal);

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-6 mb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-stone-100 text-stone-800">
              <Dices className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-stone-900">
              Monte Carlo Uncertainty Bands
            </h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
              {simulation.iterations.toLocaleString()} Simulations ({simulation.runtimeMs}ms)
            </span>
          </div>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
            Real life has transit delays and rent variances. Instead of hiding input uncertainty, we sample rents (±12%), TTC travel times (±20%), and utilities (±15%) 2,000 times to calculate honest 80% confidence intervals and pairwise win probabilities.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSimulationSeed((s) => s + 1)}
          className="pressable self-start md:self-auto px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-[background-color] cursor-pointer flex items-center gap-1.5"
        >
          <Dices className="w-3.5 h-3.5" />
          Re-run 2,000 Trials
        </button>
      </div>

      {/* Primary Probability Banner */}
      <div className="mt-5 p-4 rounded-xl bg-stone-100 border border-stone-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-stone-900 text-white flex items-center justify-center shrink-0 font-extrabold text-sm">
            {simulation.winnerStabilityPercent}%
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-700">
              Winner Stability Across Uncertainty
            </span>
            <p className="text-sm font-bold text-stone-900 mt-0.5">
              {results[0]?.neighbourhood.name.split(' (')[0]} wins #{1} in {simulation.winnerStabilityPercent}% of simulated market trials.
            </p>
            <p className="text-xs text-stone-600 mt-0.5">
              {simulation.primaryInsight}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0 bg-white px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Honest Indicators &bull; 80% Confidence Interval
        </div>
      </div>

      {/* Interactive Pairwise Win Probability Tool */}
      <div className="mt-6 p-4 rounded-xl bg-stone-50 border border-stone-200">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-3 flex items-center gap-1.5">
          <Percent className="w-3.5 h-3.5" />
          Interactive Pairwise Win Probability Calculator
        </h4>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-stone-600">Compare:</span>
            <select
              value={selectedPairA}
              onChange={(e) => setSelectedPairA(e.target.value)}
              className="bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-stone-500 cursor-pointer"
            >
              {results.map((r) => (
                <option key={r.neighbourhood.id} value={r.neighbourhood.id}>
                  {r.neighbourhood.name.split(' (')[0]}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs font-bold text-stone-400">vs</span>

          <div className="flex items-center gap-2">
            <select
              value={selectedPairB}
              onChange={(e) => setSelectedPairB(e.target.value)}
              className="bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-stone-500 cursor-pointer"
            >
              {results.map((r) => (
                <option key={r.neighbourhood.id} value={r.neighbourhood.id}>
                  {r.neighbourhood.name.split(' (')[0]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {activePairwise && (
          <div className="mt-4 pt-3 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                <span className="text-stone-900">{activePairwise.neighbourhoodAName}</span>
                <span className="text-stone-700">{activePairwise.neighbourhoodBName}</span>
              </div>

              {/* Progress bar */}
              <div className="h-3 w-full bg-stone-200 rounded-full overflow-hidden flex">
                <div
                  className="bg-stone-900 h-full transition-[width] duration-300"
                  style={{ width: `${activePairwise.probabilityACheaperPercent}%` }}
                />
                <div
                  className="bg-stone-300 h-full transition-[width] duration-300"
                  style={{ width: `${100 - activePairwise.probabilityACheaperPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono font-bold mt-1">
                <span className="text-stone-800">{activePairwise.probabilityACheaperPercent}% cheaper</span>
                <span className="text-stone-600">{Number((100 - activePairwise.probabilityACheaperPercent).toFixed(1))}% cheaper</span>
              </div>
            </div>

            <div className="sm:max-w-xs text-xs text-stone-700 font-medium pl-0 sm:pl-4 sm:border-l border-stone-200 leading-snug">
              {activePairwise.narrative}
            </div>
          </div>
        )}
      </div>

      {/* Uncertainty Bands Range Matrix */}
      <div className="mt-8">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5" />
            True Cost 80% Uncertainty Bands (P10 — P90 Range)
          </span>
          <span className="text-[11px] text-stone-500 font-normal">
            Low (P10) &bull; Median (P50) &bull; High (P90)
          </span>
        </h4>

        <div className="space-y-3">
          {results.map((cost, idx) => {
            const stats = simulation.neighbourhoodStats[cost.neighbourhood.id];
            if (!stats) return null;

            const p10Left = ((stats.p10 - minCostGlobal) / globalCostRange) * 100;
            const p90Right = ((stats.p90 - minCostGlobal) / globalCostRange) * 100;
            const p50Center = ((stats.p50 - minCostGlobal) / globalCostRange) * 100;
            const bandWidth = Math.max(3, p90Right - p10Left);

            const isTop = idx === 0;

            return (
              <div
                key={cost.neighbourhood.id}
                className={`p-3.5 rounded-xl border transition-colors ${
                  isTop ? 'bg-stone-100 border-stone-300' : 'bg-stone-50/50 border-stone-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
                        isTop ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-sm font-bold text-stone-900">
                      {cost.neighbourhood.name.split(' (')[0]}
                    </span>
                    <span className="text-xs text-stone-500">
                      ({cost.neighbourhood.borough})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-stone-600">
                      Point: <strong className="text-stone-900">${cost.trueMonthlyCost.toLocaleString()}</strong>
                    </span>
                    <span className="font-mono font-bold text-stone-900 px-2 py-0.5 rounded-md bg-stone-200/70">
                      80% CI: ${stats.p10.toLocaleString()} – ${stats.p90.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-stone-500 font-mono">
                      (&plusmn;${stats.stdDev})
                    </span>
                  </div>
                </div>

                {/* Range Bar Graphic */}
                <div className="relative h-6 bg-stone-200/80 rounded-lg overflow-hidden flex items-center px-1">
                  {/* Shaded 80% CI Band */}
                  <div
                    className={`absolute h-4 rounded-md transition-[left,width] duration-300 ${
                      isTop ? 'bg-stone-700' : 'bg-stone-400'
                    }`}
                    style={{
                      left: `${p10Left}%`,
                      width: `${bandWidth}%`,
                    }}
                    title={`80% Confidence: $${stats.p10} to $${stats.p90}`}
                  />

                  {/* Median P50 Marker */}
                  <div
                    className="absolute w-2 h-5 bg-white border-2 border-stone-900 rounded-xs shadow-xs z-10"
                    style={{ left: `calc(${p50Center}% - 4px)` }}
                    title={`Median: $${stats.p50}`}
                  />
                </div>

                {/* Mini Distribution Ticks */}
                <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono mt-1 px-1">
                  <span>${stats.min.toLocaleString()} (min observed)</span>
                  <span className="font-bold text-stone-700">P50: ${stats.p50.toLocaleString()}/mo</span>
                  <span>${stats.max.toLocaleString()} (max observed)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
