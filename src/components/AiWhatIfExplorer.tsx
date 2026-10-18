import React, { useState } from 'react';
import {
  SlidersHorizontal,
  X,
  Send,
  RotateCw,
  TrendingDown,
  Clock,
  Leaf,
  CheckCircle2,
  ArrowRight,
  Car,
  Bus,
  Home,
  DollarSign,
  Laptop,
} from 'lucide-react';
import { WHAT_IF_SCENARIOS } from '../data/neighbourhoods';
import { UserPreferences, WhatIfScenario } from '../types';

interface AiWhatIfExplorerProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreferences: UserPreferences;
  onApplyScenario: (patch: Partial<UserPreferences>) => void;
}

interface WhatIfResponse {
  scenarioTitle: string;
  costDifference: number;
  hoursDifference: number;
  carbonDifference: number;
  oldCheapestName: string;
  newCheapestName: string;
  summary: string;
  isAiGenerated: boolean;
  activePatch: Partial<UserPreferences>;
}

function buildScenarioFallback(result: WhatIfResponse): string {
  const money = Math.abs(result.costDifference).toLocaleString();
  const hours = Math.abs(result.hoursDifference).toLocaleString();
  const carbon = Math.abs(result.carbonDifference).toLocaleString();
  const costText = result.costDifference < 0
    ? `Estimated monthly costs decrease by $${money}.`
    : result.costDifference > 0
      ? `Estimated monthly costs increase by $${money}.`
      : 'Estimated monthly costs remain unchanged.';
  const travelText = result.hoursDifference < 0
    ? `Monthly commute time decreases by ${hours} hours.`
    : result.hoursDifference > 0
      ? `Monthly commute time increases by ${hours} hours.`
      : 'Monthly commute time remains unchanged.';
  const emissionsText = result.carbonDifference < 0
    ? `Monthly emissions decrease by ${carbon} kg.`
    : result.carbonDifference > 0
      ? `Monthly emissions increase by ${carbon} kg.`
      : 'Monthly emissions remain unchanged.';
  return `${costText} ${travelText} ${emissionsText}`;
}

export const AiWhatIfExplorer: React.FC<AiWhatIfExplorerProps> = ({
  isOpen,
  onClose,
  currentPreferences,
  onApplyScenario,
}) => {
  const [customQuestion, setCustomQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WhatIfResponse | null>(null);
  const [whatIfError, setWhatIfError] = useState<{
    status: number | string;
    code: string;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const runScenario = async (
    patch: Partial<UserPreferences>,
    label: string
  ) => {
    setLoading(true);
    setWhatIfError(null);
    try {
      const response = await fetch('/api/gemini/what-if', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalPreferences: currentPreferences,
          scenarioPatch: patch,
          question: label,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        // Live Gemini failed: keep the real engine deltas, but show the
        // Gemini error code instead of placeholder narration.
        setWhatIfError(
          data?.error ?? {
            status: response.status,
            code: `HTTP_${response.status}`,
            message: 'Gemini what-if request failed',
          }
        );
        setResult(data ? { ...data, activePatch: patch } : null);
        return;
      }

      setResult({
        ...data,
        activePatch: patch,
      });
    } catch (err) {
      console.error('Error running what-if scenario:', err);
      setWhatIfError({
        status: 0,
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Could not reach the analysis server',
      });
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;

    // Interpret user's custom question into an appropriate calculator patch
    const q = customQuestion.toLowerCase();
    let patch: Partial<UserPreferences> = {};

    if (q.includes('car') && (q.includes('no') || q.includes('ditch') || q.includes('sell') || q.includes('transit'))) {
      patch = { commuteMode: 'transit' };
    } else if (q.includes('drive') || q.includes('buy a car') || q.includes('own a car')) {
      patch = { commuteMode: 'car' };
    } else if (q.includes('remote') || q.includes('hybrid') || q.includes('home')) {
      patch = { hybridRemoteDaysPerWeek: 2 };
    } else if (q.includes('raise') || q.includes('earn') || q.includes('more money') || q.includes('salary')) {
      patch = { annualIncome: (currentPreferences.annualIncome || 50000) + 15000 };
    } else if (q.includes('roommate') || q.includes('downsize') || q.includes('smaller')) {
      patch = { bedrooms: '1bed' };
    } else if (q.includes('rent') && (q.includes('cheap') || q.includes('lower') || q.includes('budget'))) {
      patch = { rentMode: 'user_entered', customFixedRent: 1600 };
    } else if (q.includes('bike') || q.includes('cycle') || q.includes('walk')) {
      patch = { commuteMode: 'walk_bike' };
    } else {
      // General hybrid/transit combo
      patch = { hybridRemoteDaysPerWeek: 3 };
    }

    runScenario(patch, customQuestion);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60">
      <div className="modal-enter bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">
                Scenario Explorer
              </h3>
              <p className="text-xs text-stone-500">
                Compare how changes to your commute, schedule, or housing may affect estimated costs.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">
              Select a Scenario to Test:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {WHAT_IF_SCENARIOS.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => runScenario(sc.patch, sc.label)}
                  disabled={loading}
                  className="pressable p-3 rounded-xl border border-stone-200 hover:border-stone-400 bg-white hover:bg-stone-100 text-left transition-[background-color,border-color] duration-200 cursor-pointer disabled:opacity-50"
                >
                  <div className="font-semibold text-xs text-stone-900 flex items-center justify-between">
                    <span>{sc.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1 line-clamp-1">
                    {sc.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Question input */}
          <form onSubmit={handleCustomSubmit} className="relative">
            <input
              type="text"
              placeholder="Describe a change: e.g. What if I switch to transit?"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 pr-10 text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={loading || !customQuestion.trim()}
              className="absolute right-2 top-2 p-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Loading Indicator */}
          {loading && (
            <div className="p-6 rounded-xl bg-amber-50/40 border border-amber-200 text-center space-y-2">
              <RotateCw className="w-6 h-6 animate-spin text-amber-600 mx-auto" />
              <p className="text-xs font-semibold text-amber-900">
                Recalculating costs and preparing your summary...
              </p>
              <p className="text-[11px] text-amber-700">
                Using published rent, transit, and neighbourhood data.
              </p>
            </div>
          )}

          {whatIfError && !loading && (
            <div
              role="status"
              className="p-3 rounded-xl bg-stone-100 border border-stone-200 text-xs text-stone-700 leading-relaxed"
            >
              {result
                ? 'A personalized summary is temporarily unavailable. Showing the results from your scenario.'
                : 'This scenario could not be completed. Please try again shortly.'}
            </div>
          )}

          {/* Results Display */}
          {result && !loading && (
            <div className="p-5 rounded-2xl bg-stone-900 text-white space-y-4 border border-stone-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {result.scenarioTitle}
                </span>
                <span className="text-[10px] text-stone-400">
                  {result.isAiGenerated ? 'Personalized summary' : 'Calculated summary'}
                </span>
              </div>

              {/* Math Metric Stat Cards */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-stone-800/80 border border-stone-700">
                  <span className="block text-[10px] uppercase font-semibold text-stone-400">
                    Monthly Cost Change
                  </span>
                  <span
                    className={`text-sm font-extrabold font-mono ${
                      result.costDifference <= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {result.costDifference <= 0 ? '-' : '+'}
                    ${Math.abs(result.costDifference)}/mo
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-800/80 border border-stone-700">
                  <span className="block text-[10px] uppercase font-semibold text-stone-400">
                    Commute Time Change
                  </span>
                  <span
                    className={`text-sm font-extrabold font-mono ${
                      result.hoursDifference <= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {result.hoursDifference <= 0 ? '' : '+'}
                    {result.hoursDifference} hrs
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-800/80 border border-stone-700">
                  <span className="block text-[10px] uppercase font-semibold text-stone-400">
                    Emissions Change
                  </span>
                  <span
                    className={`text-sm font-extrabold font-mono ${
                      result.carbonDifference <= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {result.carbonDifference <= 0 ? '' : '+'}
                    {result.carbonDifference} kg
                  </span>
                </div>
              </div>

              {/* Best Neighbourhood Shift */}
              <div className="p-3 rounded-xl bg-stone-800/50 border border-stone-700 text-xs flex items-center justify-between">
                <div>
                  <span className="text-stone-400 block text-[10px]">Current lowest-cost area:</span>
                  <span className="font-semibold text-stone-300">
                    {result.oldCheapestName}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400" />
                <div className="text-right">
                  <span className="text-emerald-400 block text-[10px]">Scenario lowest-cost area:</span>
                  <span className="font-bold text-white">
                    {result.newCheapestName}
                  </span>
                </div>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed">
                {result.summary?.trim() || buildScenarioFallback(result)}
              </p>

              {/* Action: Apply to Dashboard */}
              <button
                onClick={() => {
                  onApplyScenario(result.activePatch);
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Apply this scenario</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
