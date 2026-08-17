import React from 'react';
import { Droplets, AlertTriangle } from 'lucide-react';

interface WaterTankLevelProps {
  id?: string;
  value: number; // 0 to 100%
  min?: number;
  max?: number;
  unit?: string;
  label?: string;
  labelKhmer?: string;
  totalCapacityLiters?: number;
  highAlarmThreshold?: number;
  className?: string;
  lang?: 'km' | 'en';
}

export const WaterTankLevel: React.FC<WaterTankLevelProps> = ({
  id,
  value = 0,
  min = 0,
  max = 100,
  unit = '%',
  label = 'Water Level',
  labelKhmer = 'កម្រិតទឹកក្នុងអាង (Liquid Tank)',
  totalCapacityLiters = 2000,
  highAlarmThreshold = 85,
  className = '',
  lang = 'km',
}) => {
  const clampedValue = Math.min(Math.max(Number(value) || 0, min), max);
  const percentage = Math.round(((clampedValue - min) / (max - min || 1)) * 100);
  const currentLiters = Math.round((percentage / 100) * totalCapacityLiters);
  const isHighAlarm = percentage >= highAlarmThreshold;

  // Geometry for capsule tank
  const capsuleWidth = 190;
  const capsuleHeight = 240;
  const cornerRadius = 32;

  // Liquid height
  const liquidHeight = Math.max(0, Math.min(capsuleHeight - 8, (percentage / 100) * (capsuleHeight - 8)));
  const liquidY = capsuleHeight - 4 - liquidHeight;

  return (
    <div
      id={id}
      className={`flex flex-col justify-between w-full h-full select-none ${className}`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
            <Droplets className="w-4 h-4 text-sky-500" />
            <span>{label}</span>
          </h4>
          {labelKhmer && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{labelKhmer}</p>
          )}
        </div>

        {/* High Alarm / Status Pill */}
        <span
          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-xs flex items-center gap-1 transition-colors ${
            isHighAlarm
              ? 'bg-rose-50 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 animate-pulse'
              : 'bg-sky-50 dark:bg-sky-950/70 border-sky-300 dark:border-sky-800 text-sky-600 dark:text-sky-400'
          }`}
        >
          {isHighAlarm ? (
            <>
              <AlertTriangle className="w-3 h-3" />
              <span>HIGH ALARM</span>
            </>
          ) : (
            <span>NORMAL LEVEL</span>
          )}
        </span>
      </div>

      {/* Main Tank Capsule Diagram (Direct translation of image.png) */}
      <div className="relative flex items-center justify-center py-2">
        <div className="relative w-[190px] h-[240px] rounded-[32px] p-[3px] bg-gradient-to-b from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 shadow-md flex items-center justify-center">
          {/* Inner Tank Capsule */}
          <div className="relative w-full h-full rounded-[29px] overflow-hidden bg-slate-50 dark:bg-slate-900 border border-white/60 dark:border-slate-800 shadow-inner">
            {/* Background Tick Marks (100%, 75%, 50%, 25%, 0%) on the Left */}
            <div className="absolute left-3 top-0 bottom-0 flex flex-col justify-between py-6 z-10 pointer-events-none text-[11px] font-mono font-bold select-none text-slate-400 dark:text-slate-500">
              <span className="opacity-90">100%</span>
              <span className="opacity-80">75%</span>
              <span className="opacity-80">50%</span>
              <span className="opacity-80">25%</span>
              <span className="opacity-90">0%</span>
            </div>

            {/* Top SENSOR Pill Badge */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-20">
              <div className="bg-[#181d24] text-white text-[10px] font-bold tracking-wider px-3.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm border border-slate-700/60">
                <span className="w-2 h-2 rounded-full bg-slate-500 border border-slate-400 inline-block" />
                <span>SENSOR</span>
              </div>
            </div>

            {/* Ultrasonic Radar Wave beneath Sensor */}
            <svg
              className="absolute top-8 left-1/2 -translate-x-1/2 w-20 h-6 z-10 overflow-visible pointer-events-none"
              viewBox="0 0 80 24"
            >
              <path
                d="M 10 4 Q 40 18 70 4"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.6"
              />
              <path
                d="M 20 8 Q 40 20 60 8"
                fill="none"
                stroke="#bae6fd"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.8"
              />
            </svg>

            {/* SVG Liquid Fill with Animated Wave and Gradient */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox={`0 0 ${capsuleWidth} ${capsuleHeight}`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id={`tankGradient-${id || 'def'}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#00d4ff" />
                  <stop offset="35%" stopColor="#00b4d8" />
                  <stop offset="70%" stopColor="#0077b6" />
                  <stop offset="100%" stopColor="#0051ff" />
                </linearGradient>

                <clipPath id={`capsuleClip-${id || 'def'}`}>
                  <rect x="0" y="0" width={capsuleWidth} height={capsuleHeight} rx={cornerRadius} ry={cornerRadius} />
                </clipPath>
              </defs>

              <g clipPath={`url(#capsuleClip-${id || 'def'})`}>
                {/* Liquid Body */}
                <rect
                  x="0"
                  y={liquidY}
                  width={capsuleWidth}
                  height={liquidHeight + 20}
                  fill={`url(#tankGradient-${id || 'def'})`}
                  className="transition-all duration-700 ease-out"
                />

                {/* Surface Highlight Wave */}
                {percentage > 3 && (
                  <path
                    d={`M 0 ${liquidY} Q ${capsuleWidth * 0.25} ${liquidY - 3} ${capsuleWidth * 0.5} ${liquidY} T ${capsuleWidth} ${liquidY} L ${capsuleWidth} ${liquidY + 4} L 0 ${liquidY + 4} Z`}
                    fill="#e0f2fe"
                    opacity="0.75"
                    className="transition-all duration-700 ease-out"
                  />
                )}

                {/* Floating Translucent Bubbles */}
                {percentage > 15 && (
                  <>
                    <circle
                      cx="55"
                      cy={Math.min(capsuleHeight - 20, liquidY + liquidHeight * 0.8)}
                      r="5"
                      fill="#ffffff"
                      opacity="0.4"
                      className="animate-pulse"
                    />
                    <circle
                      cx="135"
                      cy={Math.min(capsuleHeight - 40, liquidY + liquidHeight * 0.55)}
                      r="4"
                      fill="#ffffff"
                      opacity="0.35"
                    />
                    <circle
                      cx="90"
                      cy={Math.min(capsuleHeight - 25, liquidY + liquidHeight * 0.35)}
                      r="3"
                      fill="#ffffff"
                      opacity="0.45"
                    />
                  </>
                )}
              </g>
            </svg>

            {/* Central Frosted Glass Percentage Pill (Exactly like image.png) */}
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <div className="bg-white/40 dark:bg-slate-900/50 backdrop-blur-md border border-white/70 dark:border-white/20 shadow-lg rounded-2xl px-5 py-2.5 flex items-center justify-center transform transition-transform duration-300">
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-xs font-mono">
                  {percentage}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Volume & Capacity Metrics */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
          <span>{lang === 'km' ? 'មាឌទឹកសរុប:' : 'Volume:'}</span>
          <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
            {currentLiters.toLocaleString()} / {totalCapacityLiters.toLocaleString()} L
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-lg font-black text-sky-600 dark:text-sky-400 font-mono">
            {clampedValue}
          </span>
          <span className="text-xs font-bold text-slate-400">{unit}</span>
        </div>
      </div>
    </div>
  );
};
