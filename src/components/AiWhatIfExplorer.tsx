import React, { useState } from 'react';
import {
  Sparkles,
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

export const AiWhatIfExplorer: React.FC<AiWhatIfExplorerProps> = ({
  isOpen,
  onClose,
  currentPreferences,
  onApplyScenario,
}) => {
  const [customQuestion, setCustomQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WhatIfResponse | null>(null);

  if (!isOpen) return null;

  const runScenario = async (
    patch: Partial<UserPreferences>,
    label: string
  ) => {
    setLoading(true);
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

      if (!response.ok) {
        throw new Error('Network response failed');
      }

      const data = await response.json();
      setResult({
        ...data,
        activePatch: patch,
      });
    } catch (err) {
      console.error('Error running what-if scenario:', err);
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
      patch = { annualIncome: currentPreferences.annualIncome + 15000 };
    } else if (q.includes('roommate') || q.includes('downsize') || q.includes('smaller')) {
      patch = { bedrooms: '1bed' };
    } else if (q.includes('bike') || q.includes('cycle') || q.includes('walk')) {
      patch = { commuteMode: 'walk_bike' };
    } else {
      // General hybrid/transit combo
      patch = { hybridRemoteDaysPerWeek: 3 };
    }

    runScenario(patch, customQuestion);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">
                AI What-If Scenario Explorer
              </h3>
              <p className="text-xs text-stone-500">
                Calculator reruns deterministic math &bull; Gemini 3.8 Flash explains the outcome
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
                  className="p-3 rounded-xl border border-stone-200 hover:border-amber-400 bg-white hover:bg-amber-50/50 text-left transition-all group cursor-pointer disabled:opacity-50"
                >
                  <div className="font-semibold text-xs text-stone-900 group-hover:text-amber-900 flex items-center justify-between">
                    <span>{sc.label}</span>
                    <Sparkles className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-600" />
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
              placeholder="Or ask your own: e.g. What if I stop driving to work?"
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
                Calculator rerunning math & Gemini drafting explanation...
              </p>
              <p className="text-[11px] text-amber-700">
                Using stored CMHC rental rates, TTC fares, and TRCA models.
              </p>
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
                  {result.isAiGenerated ? 'Gemini 3.8 Flash' : 'Deterministic Engine'}
                </span>
              </div>

              {/* Math Metric Stat Cards */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-stone-800/80 border border-stone-700">
                  <span className="block text-[10px] uppercase font-semibold text-stone-400">
                    Monthly True Cost
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
                    Monthly Travel Time
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
                    Monthly Carbon
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
                  <span className="text-stone-400 block text-[10px]">Best Value Option:</span>
                  <span className="font-semibold text-stone-300">
                    {result.oldCheapestName}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400" />
                <div className="text-right">
                  <span className="text-emerald-400 block text-[10px]">New Best Option:</span>
                  <span className="font-bold text-white">
                    {result.newCheapestName}
                  </span>
                </div>
              </div>

              {/* Plain Language Explanation */}
              <p className="text-xs text-stone-300 leading-relaxed">
                {result.summary}
              </p>

              {/* Action: Apply to Dashboard */}
              <button
                onClick={() => {
                  onApplyScenario(result.activePatch);
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Apply this scenario to main dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
