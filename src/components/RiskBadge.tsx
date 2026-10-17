import React from 'react';
import { Droplets, Flame, CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react';

interface RiskBadgeProps {
  type: 'flood' | 'heat' | 'displacement';
  level: string; // 'Lower exposure' | 'Moderate exposure' | 'Higher exposure' | 'green' | 'yellow' | 'red'
  label: string;
  details?: string;
  subValue?: string | number | null;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  type,
  level,
  label,
  details,
  subValue,
}) => {
  if (type === 'flood') {
    const isHigh = level.toLowerCase().includes('higher') || level.toLowerCase().includes('high');
    const isModerate = level.toLowerCase().includes('moderate');

    const config = isHigh
      ? {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          icon: <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />,
        }
      : isModerate
      ? {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
        }
      : {
          bg: 'bg-sky-50 text-sky-800 border-sky-200',
          icon: <Droplets className="w-3.5 h-3.5 text-sky-600" />,
        };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${config.bg}`}
        title={details}
      >
        {config.icon}
        <span>Flood: {label}</span>
      </span>
    );
  }

  if (type === 'heat') {
    const isHigh = level.toLowerCase().includes('higher') || level.toLowerCase().includes('high');
    const isModerate = level.toLowerCase().includes('moderate');

    const config = isHigh
      ? {
          bg: 'bg-orange-50 text-orange-800 border-orange-200',
          icon: <AlertOctagon className="w-3.5 h-3.5 text-orange-600" />,
        }
      : isModerate
      ? {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
        }
      : {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: <Flame className="w-3.5 h-3.5 text-emerald-600" />,
        };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${config.bg}`}
        title={details}
      >
        {config.icon}
        <span>
          Heat: {label}
          {subValue !== null && subValue !== undefined
            ? ` (${subValue}% canopy)`
            : ' (no data)'}
        </span>
      </span>
    );
  }

  // Displacement Flag
  const isRed = level === 'red';
  const isYellow = level === 'yellow';

  const config = isRed
    ? {
        bg: 'bg-rose-50 text-rose-800 border-rose-200',
        dot: 'bg-rose-500',
        icon: <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />,
      }
    : isYellow
    ? {
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
        icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
      }
    : {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dot: 'bg-emerald-500',
        icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />,
      };

  return (
    <div className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${config.bg}`}>
      <span className="shrink-0 mt-0.5">{config.icon}</span>
      <div>
        <div className="font-semibold flex items-center gap-1.5">
          <span>Displacement Flag: {label}</span>
          {subValue !== undefined && subValue !== null && (
            <span className="font-mono text-[11px] opacity-80">
              (+{subValue}% turnover spread)
            </span>
          )}
        </div>
        {details && (
          <p className="text-[11px] mt-0.5 opacity-90 leading-relaxed">
            {details}
          </p>
        )}
      </div>
    </div>
  );
};
