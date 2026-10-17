import React, { useState, useMemo } from 'react';
import {
  X,
  BrainCircuit,
  ShieldCheck,
  Sparkles,
  Info,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Database,
  Sliders,
  AlertTriangle,
} from 'lucide-react';
import { NEIGHBOURHOODS } from '../data/neighbourhoods';
import { BedroomType } from '../types';
import {
  estimateRentWithInterval,
  getModelCoefficients,
  RentPredictionResult,
} from '../services/rentRegressionModel';

interface MlRentGapEstimatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyNeighbourhoodRent: (neighbourhoodId: string, rent: number | null) => void;
  defaultNeighbourhoodId?: string;
  defaultBedrooms?: BedroomType;
}

export function MlRentGapEstimatorModal({
  isOpen,
  onClose,
  onApplyNeighbourhoodRent,
  defaultNeighbourhoodId,
  defaultBedrooms = '1bed',
}: MlRentGapEstimatorModalProps) {
  const [selectedNeighbourhoodId, setSelectedNeighbourhoodId] = useState<string>(
    defaultNeighbourhoodId || NEIGHBOURHOODS[0].id
  );
  const [selectedBedroomCount, setSelectedBedroomCount] = useState<number>(
    defaultBedrooms === 'bachelor' ? 0 : defaultBedrooms === '1bed' ? 1 : defaultBedrooms === '2bed' ? 2 : 3
  );
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  const coefficients = useMemo(() => {
    return getModelCoefficients();
  }, []);

  const prediction: RentPredictionResult = useMemo(() => {
    return estimateRentWithInterval(selectedNeighbourhoodId, selectedBedroomCount);
  }, [selectedNeighbourhoodId, selectedBedroomCount]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyNeighbourhoodRent(selectedNeighbourhoodId, prediction.predictedRent);
    setAppliedNotice(
      `Applied ML estimated rent ($${prediction.predictedRent.toLocaleString()}/mo) to ${prediction.neighbourhoodName}!`
    );
    setTimeout(() => {
      setAppliedNotice(null);
    }, 3000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ml-modal-title"
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h2 id="ml-modal-title" className="text-base font-bold flex items-center gap-2">
                ML Rent Estimation Model for Gaps
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-900/80 text-purple-200 border border-purple-700">
                  R² = {coefficients.rSquared}
                </span>
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Multivariable Ridge Regression trained on N={coefficients.trainingSamplesCount} Toronto data points
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-stone-900">
          {/* Honest ML & Methodology Transparency Disclosure */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-bold text-amber-900 block mb-0.5">
                Civic Transparency &amp; Honest Modeling Policy
              </strong>
              With 10 distinct neighbourhoods in this civic benchmark, regression acts as <em>empirical interpolation</em> rather than speculative black-box machine learning. We use this linear model to fill unobserved gaps (such as 4-bedroom family suites or missing bedroom-neighbourhood pairs) with explicit 95% prediction intervals.
            </div>
          </div>

          {/* Model Coefficients Summary */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-purple-600" />
              Trained Model Parameters (Ordinary Least Squares with Ridge Penalty)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[10px] font-bold text-stone-500 uppercase">Base Intercept</span>
                <p className="text-base font-bold text-stone-900 mt-0.5">
                  ${coefficients.intercept.toLocaleString()}
                </p>
                <span className="text-[10px] text-stone-500">Baseline studio</span>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[10px] font-bold text-stone-500 uppercase">Per Bedroom</span>
                <p className="text-base font-bold text-emerald-700 mt-0.5">
                  +${coefficients.bedroomWeight.toLocaleString()}
                </p>
                <span className="text-[10px] text-stone-500">Incremental room</span>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[10px] font-bold text-stone-500 uppercase">Transit to Core</span>
                <p className="text-base font-bold text-blue-700 mt-0.5">
                  {coefficients.transitMinutesWeight}$/min
                </p>
                <span className="text-[10px] text-stone-500">Distance discount</span>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[10px] font-bold text-stone-500 uppercase">Subway Proximity</span>
                <p className="text-base font-bold text-purple-700 mt-0.5">
                  +${coefficients.rapidTransitBonus}
                </p>
                <span className="text-[10px] text-stone-500">Walking access bonus</span>
              </div>
            </div>
          </div>

          {/* Interactive Gap Estimator Tool */}
          <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 mb-4 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-purple-600" />
              Estimate Rent for Any Unit &amp; Fill Gaps
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Select Neighbourhood */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Neighbourhood:
                </label>
                <select
                  value={selectedNeighbourhoodId}
                  onChange={(e) => setSelectedNeighbourhoodId(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-2xs"
                >
                  {NEIGHBOURHOODS.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name} ({n.borough})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Bedroom Size */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Unit Configuration (Including 4-Bed Gap):
                </label>
                <div className="grid grid-cols-5 gap-1">
                  {[
                    { count: 0, label: 'Studio' },
                    { count: 1, label: '1 Bed' },
                    { count: 2, label: '2 Bed' },
                    { count: 3, label: '3 Bed' },
                    { count: 4, label: '4 Bed' },
                  ].map((b) => (
                    <button
                      key={b.count}
                      type="button"
                      onClick={() => setSelectedBedroomCount(b.count)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedBedroomCount === b.count
                          ? 'bg-purple-700 text-white shadow-xs'
                          : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Prediction Output Card */}
            <div className="mt-5 p-4 rounded-xl bg-white border border-purple-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                    estimated: true
                  </span>
                  <span className="text-xs font-bold text-stone-600">
                    {prediction.neighbourhoodName} &bull; {prediction.bedrooms}
                  </span>
                </div>

                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-stone-900">
                    ${prediction.predictedRent.toLocaleString()}
                  </span>
                  <span className="text-xs text-stone-500 font-medium">/ month</span>
                </div>

                <p className="text-xs font-mono font-semibold text-purple-900 mt-1">
                  95% Prediction Interval: ${prediction.intervalLow.toLocaleString()} – ${prediction.intervalHigh.toLocaleString()} (&plusmn;${prediction.intervalMargin})
                </p>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Apply this Rent to Calculator
                </button>
                {appliedNotice && (
                  <span className="text-[11px] font-medium text-emerald-700 animate-in fade-in">
                    {appliedNotice}
                  </span>
                )}
              </div>
            </div>

            {/* Regression Decomposition */}
            <div className="mt-4 pt-3 border-t border-stone-200 text-xs text-stone-600 leading-relaxed font-mono text-[11px]">
              <span className="font-bold text-stone-800">Model equation for this unit: </span>
              ${coefficients.intercept} (base) + ${prediction.coefficients.bedroomAdjustment} ({selectedBedroomCount} beds) + ${prediction.coefficients.commuteAdjustment} (transit distance) + ${prediction.coefficients.transitProximityBonus} (subway access) = <strong>${prediction.predictedRent}/mo</strong>.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-100 border-t border-stone-200 flex items-center justify-between">
          <span className="text-xs text-stone-500">
            CMHC Rental Survey 2024 &bull; MLS® Verified GTA Postings &bull; Ridge λ = 0.05
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
