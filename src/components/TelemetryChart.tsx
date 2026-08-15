import React, { useState, useMemo } from 'react';
import { TelemetryPoint, TimeFilter } from '../types';
import { Activity, Download, RefreshCw, ZoomIn } from 'lucide-react';

interface TelemetryChartProps {
  data: TelemetryPoint[];
  currentFilter: TimeFilter;
  onFilterChange: (filter: TimeFilter) => void;
  lang: 'km' | 'en';
}

type SensorKey = 'temperature' | 'humidity' | 'gasCo' | 'soilMoisture';

interface SensorConfig {
  key: SensorKey;
  label: string;
  labelKhmer: string;
  unit: string;
  color: string;
  minDomain: number;
  maxDomain: number;
}

const SENSORS: SensorConfig[] = [
  { key: 'temperature', label: 'Temp (V0)', labelKhmer: 'សីតុណ្ហភាព', unit: '°C', color: '#f97316', minDomain: 15, maxDomain: 45 },
  { key: 'humidity', label: 'Humidity (V1)', labelKhmer: 'សំណើម', unit: '%', color: '#06b6d4', minDomain: 20, maxDomain: 100 },
  { key: 'gasCo', label: 'CO / Gas (V5)', labelKhmer: 'ផ្សែង/ឧស្ម័ន', unit: 'ppm', color: '#a855f7', minDomain: 100, maxDomain: 800 },
  { key: 'soilMoisture', label: 'Soil Moist (V7)', labelKhmer: 'សំណើមដី', unit: '%', color: '#10b981', minDomain: 10, maxDomain: 90 },
];

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  data,
  currentFilter,
  onFilterChange,
  lang
}) => {
  const [activeSensors, setActiveSensors] = useState<Record<SensorKey, boolean>>({
    temperature: true,
    humidity: true,
    gasCo: false,
    soilMoisture: true,
  });

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const toggleSensor = (key: SensorKey) => {
    setActiveSensors(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const chartHeight = 240;
  const chartWidth = 780;
  const padding = { top: 20, right: 30, bottom: 30, left: 45 };

  const usableWidth = chartWidth - padding.left - padding.right;
  const usableHeight = chartHeight - padding.top - padding.bottom;

  // Filtered dataset
  const points = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (currentFilter === 'live') return data.slice(-25);
    if (currentFilter === '1h') return data.slice(-50);
    if (currentFilter === '6h') return data.slice(-90);
    return data;
  }, [data, currentFilter]);

  // Compute stats
  const stats = useMemo(() => {
    if (points.length === 0) return { tempAvg: 0, tempMin: 0, tempMax: 0, humAvg: 0, gasAvg: 0 };
    const temps = points.map(p => p.temperature);
    const hums = points.map(p => p.humidity);
    const gases = points.map(p => p.gasCo);

    return {
      tempAvg: (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1),
      tempMin: Math.min(...temps).toFixed(1),
      tempMax: Math.max(...temps).toFixed(1),
      humAvg: (hums.reduce((a, b) => a + b, 0) / hums.length).toFixed(1),
      gasAvg: Math.round(gases.reduce((a, b) => a + b, 0) / gases.length),
    };
  }, [points]);

  // Generate SVG path points
  const generatePath = (sensorKey: SensorKey) => {
    if (points.length < 2) return '';
    const sensor = SENSORS.find(s => s.key === sensorKey)!;

    const coords = points.map((p, idx) => {
      const x = padding.left + (idx / (points.length - 1)) * usableWidth;
      const val = p[sensorKey];
      const normalizedY = (val - sensor.minDomain) / (sensor.maxDomain - sensor.minDomain || 1);
      const clampedNorm = Math.max(0, Math.min(1, normalizedY));
      const y = padding.top + (1 - clampedNorm) * usableHeight;
      return { x, y };
    });

    // Smooth Bezier Curve
    let path = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i === 0 ? 0 : i - 1];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return path;
  };

  // Generate fill area path
  const generateAreaPath = (sensorKey: SensorKey) => {
    if (points.length < 2) return '';
    const linePath = generatePath(sensorKey);
    const lastX = padding.left + usableWidth;
    const firstX = padding.left;
    const bottomY = padding.top + usableHeight;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  // Download CSV
  const exportCsv = () => {
    if (points.length === 0) return;
    let csv = 'Timestamp,Time,Temperature_C,Humidity_Pct,Gas_PPM,SoilMoisture_Pct,Fan_Speed_Pct,Relay1,Relay2\n';
    points.forEach(p => {
      csv += `${p.timestamp},${p.timeStr},${p.temperature},${p.humidity},${p.gasCo},${p.soilMoisture},${p.fanSpeed},${p.relay1},${p.relay2}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `blynk_telemetry_${currentFilter}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const timeFilterOptions: { key: TimeFilter; label: string; labelKhmer: string }[] = [
    { key: 'live', label: 'Live', labelKhmer: 'ផ្ទាល់' },
    { key: '1h', label: '1h', labelKhmer: '១ ម៉ោង' },
    { key: '6h', label: '6h', labelKhmer: '៦ ម៉ោង' },
    { key: '1d', label: '1d', labelKhmer: '១ ថ្ងៃ' },
    { key: '1w', label: '1w', labelKhmer: '១ សប្តាហ៍' },
    { key: '1mo', label: '1mo', labelKhmer: '១ ខែ' },
  ];

  const hoveredPoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : (points.length > 0 ? points[points.length - 1] : null);

  return (
    <div id="telemetry-chart-container" className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-sm">
      {/* Top Header & Time Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {lang === 'km' ? 'ក្រាបទិន្នន័យ Sensor Real-Time' : 'Real-Time Sensor Telemetry'}
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'km' ? 'ធ្វើបច្ចុប្បន្នភាពរៀងរាល់ ២វិនាទីម្តង' : 'Syncing live telemetry every 2000ms'}
            </p>
          </div>
        </div>

        {/* Time Filter Bar (Live, 1h, 6h, 1d, 1w, 1mo) */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
          {timeFilterOptions.map(tf => (
            <button
              key={tf.key}
              id={`filter-btn-${tf.key}`}
              onClick={() => onFilterChange(tf.key)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                currentFilter === tf.key
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {lang === 'km' ? tf.labelKhmer : tf.label}
            </button>
          ))}
          
          <button
            id="export-csv-btn"
            onClick={exportCsv}
            title={lang === 'km' ? 'ទាញយក CSV' : 'Export CSV'}
            className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded ml-1 transition"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sensor Legend Toggles */}
      <div className="flex flex-wrap items-center gap-2 pt-3 pb-2">
        {SENSORS.map(s => {
          const isActive = activeSensors[s.key];
          return (
            <button
              key={s.key}
              id={`toggle-sensor-${s.key}`}
              onClick={() => toggleSensor(s.key)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                isActive
                  ? 'bg-slate-800/90 text-white border-slate-700 shadow-sm'
                  : 'bg-slate-900/40 text-slate-500 border-slate-800 opacity-60'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full transition-transform"
                style={{ backgroundColor: s.color, transform: isActive ? 'scale(1)' : 'scale(0.7)' }}
              />
              <span>{lang === 'km' ? s.labelKhmer : s.label}</span>
              {hoveredPoint && isActive && (
                <span className="ml-1 font-mono text-slate-300 font-bold">
                  {hoveredPoint[s.key]}
                  {s.unit}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main SVG Telemetry Chart */}
      <div className="relative w-full overflow-hidden mt-1 select-none">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto overflow-visible cursor-crosshair"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const svgX = (mouseX / rect.width) * chartWidth;
            const relativeX = (svgX - padding.left) / usableWidth;
            const idx = Math.round(relativeX * (points.length - 1));
            if (idx >= 0 && idx < points.length) {
              setHoverIndex(idx);
            }
          }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            {SENSORS.map(s => (
              <linearGradient key={`grad-${s.key}`} id={`area-grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
              </linearGradient>
            ))}
          </defs>

          {/* Grid lines horizontal */}
          {[0, 0.25, 0.5, 0.75, 1].map((norm, i) => {
            const y = padding.top + norm * usableHeight;
            return (
              <g key={`grid-h-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + usableWidth}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  fill="#475569"
                  fontSize="9"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {Math.round((1 - norm) * 100)}%
                </text>
              </g>
            );
          })}

          {/* Vertical time markers */}
          {points.length > 1 && [0, Math.floor(points.length / 2), points.length - 1].map((idx) => {
            if (!points[idx]) return null;
            const x = padding.left + (idx / (points.length - 1)) * usableWidth;
            return (
              <g key={`grid-v-${idx}`}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + usableHeight}
                  stroke="#1e293b"
                  strokeDasharray="2 2"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={padding.top + usableHeight + 16}
                  fill="#64748b"
                  fontSize="9"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {points[idx].timeStr}
                </text>
              </g>
            );
          })}

          {/* Sensor Areas */}
          {SENSORS.map(s => {
            if (!activeSensors[s.key]) return null;
            return (
              <path
                key={`area-${s.key}`}
                d={generateAreaPath(s.key)}
                fill={`url(#area-grad-${s.key})`}
                className="transition-all duration-300"
              />
            );
          })}

          {/* Sensor Line Strokes */}
          {SENSORS.map(s => {
            if (!activeSensors[s.key]) return null;
            return (
              <path
                key={`line-${s.key}`}
                d={generatePath(s.key)}
                fill="none"
                stroke={s.color}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300"
              />
            );
          })}

          {/* Hover Crosshair & Dots */}
          {hoverIndex !== null && points[hoverIndex] && (
            <g>
              {/* Vertical line */}
              <line
                x1={padding.left + (hoverIndex / (points.length - 1)) * usableWidth}
                y1={padding.top}
                x2={padding.left + (hoverIndex / (points.length - 1)) * usableWidth}
                y2={padding.top + usableHeight}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="3 3"
              />

              {/* Dots on each active sensor */}
              {SENSORS.map(s => {
                if (!activeSensors[s.key]) return null;
                const val = points[hoverIndex][s.key];
                const normalizedY = (val - s.minDomain) / (s.maxDomain - s.minDomain || 1);
                const clampedNorm = Math.max(0, Math.min(1, normalizedY));
                const cx = padding.left + (hoverIndex / (points.length - 1)) * usableWidth;
                const cy = padding.top + (1 - clampedNorm) * usableHeight;
                return (
                  <circle
                    key={`hover-dot-${s.key}`}
                    cx={cx}
                    cy={cy}
                    r="5"
                    fill={s.color}
                    stroke="#0f172a"
                    strokeWidth="2"
                  />
                );
              })}
            </g>
          )}
        </svg>

        {/* Floating Tooltip Box */}
        {hoverIndex !== null && points[hoverIndex] && (
          <div
            className="absolute top-2 right-4 bg-slate-950/95 border border-slate-700/80 rounded-lg p-2.5 shadow-2xl pointer-events-none text-xs backdrop-blur-md"
            style={{ minWidth: '160px' }}
          >
            <div className="text-[11px] font-mono text-slate-400 mb-1 pb-1 border-b border-slate-800 flex justify-between">
              <span>Time:</span>
              <span className="text-white font-bold">{points[hoverIndex].timeStr}</span>
            </div>
            {SENSORS.map(s => {
              if (!activeSensors[s.key]) return null;
              return (
                <div key={`tip-${s.key}`} className="flex items-center justify-between py-0.5">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.label}:
                  </span>
                  <span className="font-mono font-bold text-white">
                    {points[hoverIndex][s.key]} {s.unit}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 mt-2 border-t border-slate-800/80 text-xs">
        <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
          <span className="text-slate-400 block text-[11px]">Avg Temperature</span>
          <span className="text-sm font-bold text-orange-400 font-mono">{stats.tempAvg}°C</span>
          <span className="text-[10px] text-slate-500 ml-1.5 font-mono">({stats.tempMin} - {stats.tempMax}°C)</span>
        </div>
        <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
          <span className="text-slate-400 block text-[11px]">Avg Humidity</span>
          <span className="text-sm font-bold text-cyan-400 font-mono">{stats.humAvg}%</span>
        </div>
        <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
          <span className="text-slate-400 block text-[11px]">Avg Air Quality</span>
          <span className="text-sm font-bold text-purple-400 font-mono">{stats.gasAvg} ppm</span>
        </div>
        <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
          <span className="text-slate-400 block text-[11px]">Total Stream Points</span>
          <span className="text-sm font-bold text-emerald-400 font-mono">{points.length} samples</span>
        </div>
      </div>
    </div>
  );
};
