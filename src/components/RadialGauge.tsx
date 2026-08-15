import React from 'react';

interface RadialGaugeProps {
  id?: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  label: string;
  labelKhmer?: string;
  color: string;
  size?: number;
  icon?: React.ReactNode;
  statusText?: string;
  statusColor?: string;
  gaugeType?: 'semicircle' | 'arc';
}

export const RadialGauge: React.FC<RadialGaugeProps> = ({
  id,
  value,
  min,
  max,
  unit,
  label,
  labelKhmer,
  color,
  size = 180,
  icon,
  statusText,
  statusColor = '#10b981',
  gaugeType = 'arc'
}) => {
  const isSemicircle = gaugeType === 'semicircle';
  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2;
  const center = size / 2;
  
  // Semicircle (180 deg) or standard arc (240 deg)
  const startAngle = isSemicircle ? 180 : 135;
  const totalAngle = isSemicircle ? 180 : 270;
  
  const clampedValue = Math.min(Math.max(value, min), max);
  const percentage = (clampedValue - min) / (max - min || 1);
  const currentAngle = startAngle + percentage * totalAngle;

  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, r: number, startA: number, endA: number) => {
    const start = polarToCartesian(x, y, r, endA);
    const end = polarToCartesian(x, y, r, startA);
    const largeArcFlag = endA - startA <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  const backgroundArc = describeArc(center, center, radius, startAngle, startAngle + totalAngle);
  const valueArc = describeArc(center, center, radius, startAngle, currentAngle);

  // Gradient ID safe string
  const gradId = `gauge-grad-${color.replace(/[^a-zA-Z0-9]/g, '')}-${label.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div id={id} className="flex flex-col items-center justify-center p-2 relative w-full">
      <div className="relative" style={{ width: size, height: isSemicircle ? size * 0.75 : size }}>
        <svg width={size} height={isSemicircle ? size * 0.75 : size} className="overflow-visible">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} stopOpacity="0.7" />
              <stop offset="100%" stopColor={color} stopOpacity="1" />
            </linearGradient>
            <filter id={`glow-${gradId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={color} floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Background Track */}
          <path
            d={backgroundArc}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Value Active Arc */}
          {percentage > 0.001 && (
            <path
              d={valueArc}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              filter={`url(#glow-${gradId})`}
              className="transition-all duration-500 ease-out"
            />
          )}

          {/* Min and Max tick marks */}
          <text
            x={center - radius * (isSemicircle ? 0.9 : 0.7)}
            y={isSemicircle ? center + 5 : center + radius * 0.85}
            fill="#64748b"
            fontSize="10"
            fontWeight="600"
            textAnchor="middle"
          >
            {min}
          </text>
          <text
            x={center + radius * (isSemicircle ? 0.9 : 0.7)}
            y={isSemicircle ? center + 5 : center + radius * 0.85}
            fill="#64748b"
            fontSize="10"
            fontWeight="600"
            textAnchor="middle"
          >
            {max}
          </text>
        </svg>

        {/* Center Value Content */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center ${isSemicircle ? 'pt-4' : 'pt-2'}`}>
          {icon && <div className="mb-0.5 text-slate-400">{icon}</div>}
          <div className="flex items-baseline gap-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono">
              {typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(1)) : value}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-400 ml-0.5 font-mono">{unit}</span>
          </div>
          {statusText && (
            <span
              className="mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800/80"
              style={{ color: statusColor }}
            >
              {statusText}
            </span>
          )}
        </div>
      </div>

      <div className="text-center mt-1">
        <h4 className="text-xs font-bold text-slate-200 tracking-wide">{label}</h4>
        {labelKhmer && <p className="text-[11px] text-slate-400 mt-0.5">{labelKhmer}</p>}
      </div>
    </div>
  );
};
