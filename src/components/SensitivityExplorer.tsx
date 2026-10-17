import React, { useState, useMemo } from 'react';
import {
  Zap,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  RotateCcw,
  Info,
} from 'lucide-react';
import { UserPreferences, CalculatedCost } from '../types';
import { analyzeSensitivity, CrossoverPoint } from '../services/sensitivityAnalysis';

interface SensitivityExplorerProps {
  preferences: UserPreferences;
  results: CalculatedCost[];
  onApplyPreference: (patch: Partial<UserPreferences>) => void;
}

export function SensitivityExplorer({
  preferences,
  results,
  onApplyPreference,
}: SensitivityExplorerProps) {
  const [activeSweep, setActiveSweep] = useState<'commuteDays' | 'wageFactor'>('commuteDays');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const sensitivity = useMemo(() => {
    return analyzeSensitivity(preferences);
  }, [preferences]);

  const currentRemoteFraction = Math.min(5, Math.max(0, preferences.hybridRemoteDaysPerWeek)) / 5;
  const currentOnSiteDays = Math.round(21 * (1 - currentRemoteFraction));
  const currentWageFactor = preferences.timeValuationRate ?? 0.5;

  const currentWinner = results[0];
  const runnerUp = results[1];

  const sweepData = activeSweep === 'commuteDays' ? sensitivity.commuteDaysSweep : sensitivity.wageFactorSweep;

  // Filter crossovers by active parameter
  const activeCrossovers = sensitivity.crossovers.filter((c) => c.parameter === activeSweep);

  // Top 4 neighbourhoods to display on chart
  const topNeighbourhoods = results.slice(0, 4);
  const palette = [
    { line: '#059669', bg: 'bg-emerald-600', text: 'text-emerald-700' }, // #1 emerald
    { line: '#1c1917', bg: 'bg-stone-900', text: 'text-stone-900' },     // #2 stone
    { line: '#d97706', bg: 'bg-amber-600', text: 'text-amber-700' },     // #3 amber
    { line: '#57534e', bg: 'bg-stone-600', text: 'text-stone-700' },     // #4 stone
  ];

  // SVG Chart bounds
  const chartWidth = 720;
  const chartHeight = 280;
  const padding = { top: 30, right: 30, bottom: 45, left: 60 };

  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Determine min and max values for axes
  const xValues = sweepData.map((d) => d.parameterValue);
  const minX = Math.min(...xValues, 0);
  const maxX = Math.max(...xValues, activeSweep === 'commuteDays' ? 22 : 1.2);

  let minY = Infinity;
  let maxY = -Infinity;
  for (const pt of sweepData) {
    for (const n of topNeighbourhoods) {
      const val = pt.costs[n.neighbourhood.id];
      if (val !== undefined) {
        if (val < minY) minY = val;
        if (val > maxY) maxY = val;
      }
    }
  }

  // Add 8% margin to Y axis
  const ySpan = Math.max(100, maxY - minY);
  const scaledMinY = Math.max(0, Math.floor((minY - ySpan * 0.08) / 50) * 50);
  const scaledMaxY = Math.ceil((maxY + ySpan * 0.08) / 50) * 50;

  const getX = (val: number) => padding.left + ((val - minX) / (maxX - minX || 1)) * innerWidth;
  const getY = (val: number) => padding.top + innerHeight - ((val - scaledMinY) / (scaledMaxY - scaledMinY || 1)) * innerHeight;

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-6 mb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
              <Zap className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-stone-900">
              Sensitivity &amp; Break-Even Analysis
            </h3>
            {sensitivity.isRankingFragile && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                <AlertTriangle className="w-3 h-3" />
                Fragile Ranking
              </span>
            )}
          </div>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
            Deterministic parameter sweeps detect the exact tipping points where rankings flip. Discover how many commute days or what wage rate reverses the outcome between cheaper rent and shorter travel.
          </p>
        </div>

        {/* Parameter Selector */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl self-start md:self-auto border border-stone-200">
          <button
            onClick={() => setActiveSweep('commuteDays')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-[background-color,color] cursor-pointer ${
              activeSweep === 'commuteDays'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Commute Days Sweep
          </button>
          <button
            onClick={() => setActiveSweep('wageFactor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-[background-color,color] cursor-pointer ${
              activeSweep === 'wageFactor'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Wage Valuation Sweep
          </button>
        </div>
      </div>

      {/* Primary Break-Even Callout Banner */}
      <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Primary Break-Even Tipping Point
            </span>
            <p className="text-sm font-semibold text-stone-900 mt-0.5">
              &ldquo;{sensitivity.primaryBreakEvenNarrative}&rdquo;
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <span className="text-xs text-stone-600">Current schedule:</span>
          <span className="px-2.5 py-1 rounded-lg bg-white border border-stone-300 text-xs font-bold text-stone-800 shadow-2xs">
            {activeSweep === 'commuteDays' ? `${currentOnSiteDays} days / mo` : `${Math.round(currentWageFactor * 100)}% of wage`}
          </span>
        </div>
      </div>

      {/* Crossover Cards Grid */}
      {activeCrossovers.length > 0 && (
        <div className="mt-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            Detected Ranking Crossovers &amp; Flip Points
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {activeCrossovers.map((crossover, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-[background-color,border-color] duration-200 ${
                  crossover.fragility === 'fragile'
                    ? 'bg-rose-50/50 border-rose-200'
                    : crossover.fragility === 'moderate'
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-stone-50 border-stone-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      crossover.fragility === 'fragile'
                        ? 'bg-rose-100 text-rose-800'
                        : crossover.fragility === 'moderate'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {crossover.fragility === 'fragile'
                      ? 'High Sensitivity'
                      : crossover.fragility === 'moderate'
                      ? 'Moderate Sensitivity'
                      : 'Robust'}
                  </span>

                  <span className="text-xs font-bold text-stone-800">
                    Flip at: {crossover.formattedFlipValue}
                  </span>
                </div>

                <p className="text-xs text-stone-800 leading-relaxed font-medium">
                  {crossover.narrative}
                </p>

                <div className="mt-3 pt-2.5 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-600">
                  <span>True Cost at flip: <strong className="text-stone-900">${crossover.costAtCrossover.toLocaleString()}</strong>/mo</span>
                  {activeSweep === 'commuteDays' ? (
                    <button
                      type="button"
                      onClick={() => {
                        const remoteRatio = Math.max(0, Math.min(1, 1 - crossover.flipValue / 21));
                        onApplyPreference({ hybridRemoteDaysPerWeek: Number((remoteRatio * 5).toFixed(1)) });
                      }}
                      className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      Test this flip <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onApplyPreference({
                          timeValuationType: 'percent_of_wage',
                          timeValuationRate: crossover.flipValue,
                        });
                      }}
                      className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      Test this flip <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Crossover Curve Chart */}
      <div className="mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            Parameter Sweep Curve (Top 4 Contenders)
          </h4>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {topNeighbourhoods.map((n, i) => (
              <span key={n.neighbourhood.id} className="flex items-center gap-1.5 font-medium text-stone-700">
                <span
                  className="w-3 h-1.5 rounded-full"
                  style={{ backgroundColor: palette[i % palette.length].line }}
                />
                {n.neighbourhood.name.split(' (')[0]}
              </span>
            ))}
          </div>
        </div>

        {/* SVG Curve Plot */}
        <div className="w-full overflow-x-auto bg-stone-50/70 rounded-xl border border-stone-200 p-2">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full max-w-full h-auto select-none"
            style={{ minWidth: 540 }}
          >
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
              const yVal = scaledMinY + pct * (scaledMaxY - scaledMinY);
              const yCoord = getY(yVal);
              return (
                <g key={pct}>
                  <line
                    x1={padding.left}
                    y1={yCoord}
                    x2={chartWidth - padding.right}
                    y2={yCoord}
                    stroke="#e7e5e4"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 8}
                    y={yCoord + 4}
                    textAnchor="end"
                    className="text-[10px] fill-stone-400 font-mono"
                  >
                    ${Math.round(yVal)}
                  </text>
                </g>
              );
            })}

            {/* Current Value Vertical Marker */}
            {(() => {
              const currentXVal = activeSweep === 'commuteDays' ? currentOnSiteDays : currentWageFactor;
              const xCoord = getX(currentXVal);
              return (
                <g>
                  <line
                    x1={xCoord}
                    y1={padding.top}
                    x2={xCoord}
                    y2={padding.top + innerHeight}
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={xCoord}
                    y={padding.top - 8}
                    textAnchor="middle"
                    className="text-[10px] fill-emerald-800 font-bold"
                  >
                    Current ({activeSweep === 'commuteDays' ? `${currentOnSiteDays}d` : `${Math.round(currentWageFactor * 100)}%`})
                  </text>
                </g>
              );
            })()}

            {/* Lines for Top 4 Neighbourhoods */}
            {topNeighbourhoods.map((n, i) => {
              const points = sweepData
                .map((d) => {
                  const yVal = d.costs[n.neighbourhood.id];
                  if (yVal === undefined) return null;
                  return `${getX(d.parameterValue)},${getY(yVal)}`;
                })
                .filter(Boolean)
                .join(' ');

              const color = palette[i % palette.length].line;

              return (
                <g key={n.neighbourhood.id}>
                  <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth={i === 0 ? 3 : 2}
                    points={points}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={i === 0 ? 1 : 0.85}
                  />
                  {sweepData.map((d, dIdx) => {
                    const yVal = d.costs[n.neighbourhood.id];
                    if (yVal === undefined) return null;
                    const cx = getX(d.parameterValue);
                    const cy = getY(yVal);
                    const isHovered = hoveredIndex === dIdx;

                    return (
                      <circle
                        key={dIdx}
                        cx={cx}
                        cy={cy}
                        r={isHovered ? 5 : i === 0 ? 3.5 : 2.5}
                        fill={isHovered ? '#ffffff' : color}
                        stroke={color}
                        strokeWidth="2"
                        className="transition-[fill,r] duration-150 cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(dIdx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />
                    );
                  })}
                </g>
              );
            })}

            {/* Crossover Flip Points on SVG */}
            {activeCrossovers.map((c, cIdx) => {
              const cx = getX(c.flipValue);
              const cy = getY(c.costAtCrossover);

              if (cx >= padding.left && cx <= chartWidth - padding.right) {
                return (
                  <g key={`cross-${cIdx}`}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r="6"
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                    />
                    <circle
                      cx={cx}
                      cy={cy}
                      r="10"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                      opacity="0.8"
                    />
                    <text
                      x={cx}
                      y={cy - 12}
                      textAnchor="middle"
                      className="text-[9px] fill-amber-900 font-extrabold"
                    >
                      FLIP: {c.formattedFlipValue}
                    </text>
                  </g>
                );
              }
              return null;
            })}

            {/* X Axis Labels */}
            {sweepData.map((d, idx) => {
              // Show every 2nd label if many
              if (activeSweep === 'commuteDays' && idx % 2 !== 0 && idx !== sweepData.length - 1) return null;
              const xCoord = getX(d.parameterValue);
              return (
                <text
                  key={idx}
                  x={xCoord}
                  y={chartHeight - 12}
                  textAnchor="middle"
                  className="text-[10px] fill-stone-500 font-medium font-mono"
                >
                  {d.label}
                </text>
              );
            })}

            {/* X Axis Title */}
            <text
              x={padding.left + innerWidth / 2}
              y={chartHeight - 0}
              textAnchor="middle"
              className="text-[11px] fill-stone-600 font-bold"
            >
              {activeSweep === 'commuteDays' ? 'Commute Days Per Month' : 'Time Valuation Rate (% of Hourly Wage)'}
            </text>
          </svg>
        </div>

        {/* Hovered Point Detail Callout */}
        {hoveredIndex !== null && sweepData[hoveredIndex] && (
          <div className="mt-3 p-3 rounded-xl bg-stone-100 border border-stone-200 text-xs flex flex-wrap items-center justify-between gap-3">
            <span className="font-bold text-stone-800">
              At {sweepData[hoveredIndex].label}:
            </span>
            <div className="flex flex-wrap items-center gap-4">
              {topNeighbourhoods.map((n, i) => (
                <span key={n.neighbourhood.id} className="flex items-center gap-1.5 font-medium">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: palette[i % palette.length].line }}
                  />
                  <span>{n.neighbourhood.name.split(' (')[0]}:</span>
                  <strong className="text-stone-900">
                    ${sweepData[hoveredIndex].costs[n.neighbourhood.id]?.toLocaleString()}/mo
                  </strong>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
