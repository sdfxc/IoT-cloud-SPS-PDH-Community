import React, { useState } from 'react';
import { IoTDevice, VirtualPinId, TelemetryPoint, TimeFilter } from '../types';
import { RadialGauge } from './RadialGauge';
import { TelemetryChart } from './TelemetryChart';
import {
  Thermometer,
  Droplets,
  Wind,
  Sprout,
  Zap,
  Power,
  Lightbulb,
  Fan,
  Bell,
  Activity,
  Sliders,
  Sparkles,
  RefreshCw,
  Clock,
  ShieldCheck,
  Cpu,
  Layers,
  Info,
  Box,
  Copy,
  Check,
  SlidersHorizontal,
  Download,
  MoreVertical,
  AlertCircle,
  X,
  User,
  Building,
  Tag,
  Car,
  Compass,
  Send,
  Mail,
  Phone,
  Sun,
  ShieldAlert,
  Gauge
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DashboardViewProps {
  device: IoTDevice | null;
  telemetryData: TelemetryPoint[];
  timeFilter: TimeFilter;
  onTimeFilterChange: (filter: TimeFilter) => void;
  onUpdatePin: (pin: VirtualPinId, value: number | string) => void;
  lang: 'km' | 'en';
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  device,
  telemetryData,
  timeFilter,
  onTimeFilterChange,
  onUpdatePin,
  lang,
}) => {
  const [copiedToken, setCopiedToken] = useState(false);
  const [isEditingLayout, setIsEditingLayout] = useState(false);

  if (!device) {
    return (
      <div className="p-8 text-center text-slate-400">
        <Cpu className="w-12 h-12 mx-auto mb-3 text-slate-600 animate-pulse" />
        <p>{lang === 'km' ? 'សូមជ្រើសរើសឧបករណ៍ IoT...' : 'No active device selected...'}</p>
      </div>
    );
  }

  const copyToken = () => {
    navigator.clipboard.writeText(device.authToken);
    setCopiedToken(true);
    confetti({ particleCount: 20, spread: 45, origin: { y: 0.15 } });
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const timeFilterOptions: { key: TimeFilter; label: string; locked?: boolean }[] = [
    { key: 'live', label: 'Live' },
    { key: '1h', label: '1h' },
    { key: '6h', label: '6h' },
    { key: '1d', label: '1d' },
    { key: '1w', label: '1w' },
    { key: '1mo', label: '1mo', locked: true },
  ];

  return (
    <div id="blynk-dashboard-view" className="space-y-4">
      {/* Blynk Device Navigation & Meta Header (Exact match with Images 1-4) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Cube Icon, Name, Token Pill, Owner, Org */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Green 3D Cube (Blynk Trademark) */}
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shrink-0">
              <Box className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {device.name}
                </h1>

                {/* Status Badge */}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </span>
              </div>

              {/* Pills Bar: Auth Token, Owner, Organization */}
              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
                {/* Auth Token Pill */}
                <button
                  onClick={copyToken}
                  className="flex items-center gap-1 bg-slate-950 hover:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 transition"
                  title="Click to Copy Auth Token"
                >
                  <span>•••• - {device.authToken.slice(-4)}</span>
                  {copiedToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                </button>

                {/* Owner Pill */}
                <span className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800 text-[11px]">
                  <User className="w-3 h-3 text-slate-500" />
                  <span>{device.owner.split('@')[0]}</span>
                </span>

                {/* Org Pill */}
                <span className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800 text-[11px]">
                  <Building className="w-3 h-3 text-slate-500" />
                  <span>{device.orgId}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions Bar (Info, Notification, Time, Export, Edit layout) */}
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
            <button
              onClick={() => setIsEditingLayout(!isEditingLayout)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                isEditingLayout
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isEditingLayout ? 'Finish Edit' : 'Edit'}</span>
            </button>

            <button
              onClick={() => {}}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 text-xs transition"
              title="Add Tag"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>+ Tag</span>
            </button>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-slate-400">
              <button className="p-1 hover:text-white transition" title="Device Information">
                <Info className="w-3.5 h-3.5" />
              </button>
              <button className="p-1 hover:text-white transition" title="Notifications">
                <Bell className="w-3.5 h-3.5" />
              </button>
              <button className="p-1 hover:text-white transition" title="Export Data">
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Time Filters Bar (Live, 1h, 6h, 1d, 1w, 1mo...) */}
        <div className="flex items-center justify-between gap-3 pt-3 mt-3 border-t border-slate-800/80 overflow-x-auto">
          <div className="flex items-center gap-1 text-xs">
            {timeFilterOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => onTimeFilterChange(opt.key)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  timeFilter === opt.key
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>{opt.label}</span>
                {opt.locked && <span className="text-[10px] opacity-70">•</span>}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Telemetry 2s Polling</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TEMPLATE 1: ALERT SYSTEM (Matching Image 1)                               */}
      {/* ========================================================================= */}
      {device.templateId === 'TMPL_ALERT_SYSTEM' && (
        <div className="space-y-4">
          {/* Top 3 Big Semicircular Gauges (CO Level, Air Pressure, Water Level) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. CO Level Gauge (0 - 500 ppm, ~465 ppm) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col items-center justify-center relative">
              <RadialGauge
                id="gauge-co-level"
                value={Number(device.pins.V0?.value || 465)}
                min={0}
                max={500}
                unit="ppm"
                label="CO Level"
                labelKhmer="កម្រិតឧស្ម័ន CO"
                color="#f97316"
                size={220}
                gaugeType="semicircle"
                icon={<Wind className="w-5 h-5 text-orange-400" />}
                statusText="Dangerous Concentration"
                statusColor="#ef4444"
              />
            </div>

            {/* 2. Air Pressure Gauge (0 - 120 kPa, ~102.09 kPa) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col items-center justify-center relative">
              <RadialGauge
                id="gauge-air-pressure"
                value={Number(device.pins.V1?.value || 102.09)}
                min={0}
                max={120}
                unit="kPa"
                label="Air Pressure"
                labelKhmer="សម្ពាធបរិយាកាស"
                color="#06b6d4"
                size={220}
                gaugeType="semicircle"
                icon={<Gauge className="w-5 h-5 text-cyan-400" />}
                statusText="Standard Atmospheric"
                statusColor="#10b981"
              />
            </div>

            {/* 3. Water Level Gauge (0 - 100 %, ~18 %) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col items-center justify-center relative">
              <RadialGauge
                id="gauge-water-level"
                value={Number(device.pins.V2?.value || 18)}
                min={0}
                max={100}
                unit="%"
                label="Water Level"
                labelKhmer="កម្រិតទឹកក្នុងអាង"
                color="#3b82f6"
                size={220}
                gaugeType="semicircle"
                icon={<Droplets className="w-5 h-5 text-blue-400" />}
                statusText="Low Reserve (18%)"
                statusColor="#f59e0b"
              />
            </div>
          </div>

          {/* Alert System Control Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Siren Alert Buzzer */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Siren Alert</h4>
                <p className="text-xs text-slate-400">PIN V6 (GPIO 2)</p>
              </div>
              <button
                onClick={() => onUpdatePin('V6', Number(device.pins.V6?.value) === 1 ? 0 : 1)}
                className={`w-14 h-8 rounded-full p-1 transition flex items-center ${
                  Number(device.pins.V6?.value) === 1 ? 'bg-red-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md">
                  <Bell className="w-3.5 h-3.5 text-red-500" />
                </div>
              </button>
            </div>

            {/* Strobe Light */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Strobe Light</h4>
                <p className="text-xs text-slate-400">PIN V3 (GPIO 22)</p>
              </div>
              <button
                onClick={() => onUpdatePin('V3', Number(device.pins.V3?.value) === 1 ? 0 : 1)}
                className={`w-14 h-8 rounded-full p-1 transition flex items-center ${
                  Number(device.pins.V3?.value) === 1 ? 'bg-amber-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                </div>
              </button>
            </div>

            {/* Exhaust Fan Speed Slider */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:col-span-2 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Fan className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                  Exhaust Fan Speed (V4)
                </span>
                <span className="text-xs font-mono text-blue-400 font-bold">{device.pins.V4?.value || 80}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Number(device.pins.V4?.value || 80)}
                onChange={(e) => onUpdatePin('V4', Number(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TEMPLATE 2: SMART IRRIGATION (Matching Image 2)                           */}
      {/* ========================================================================= */}
      {device.templateId === 'TMPL_SMART_IRRIGATION' && (
        <div className="space-y-4">
          {/* Row 1: Water_Pump, សំណើមដី (Moisture Bar), សីតុណ្ហភាព (Temp Bar), Auto_Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Water_Pump (Switch Widget with large text & green button) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-300">Water_Pump</span>
              <div className="my-4 flex items-center justify-between">
                <span className="text-xl font-bold text-white">
                  {Number(device.pins.V0?.value) === 1 ? 'ON' : 'OFF'}
                </span>
                <button
                  onClick={() => onUpdatePin('V0', Number(device.pins.V0?.value) === 1 ? 0 : 1)}
                  className={`w-14 h-8 rounded-full p-1 transition flex items-center ${
                    Number(device.pins.V0?.value) === 1 ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md">
                    <Power className={`w-3.5 h-3.5 ${Number(device.pins.V0?.value) === 1 ? 'text-emerald-600' : 'text-slate-400'}`} />
                  </div>
                </button>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">PIN V0 (Relay 23)</span>
            </div>

            {/* សំណើមដី (Soil Moisture Vertical Level Bar 0-100%) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">សំណើមដី</span>
                <span className="text-xs font-mono font-bold text-cyan-400">{device.pins.V1?.value || 92}%</span>
              </div>
              <div className="my-3 flex items-center gap-3">
                <div className="flex-1 bg-slate-950 h-6 rounded-xl overflow-hidden border border-slate-800 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, Number(device.pins.V1?.value || 92)))}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* សីតុណ្ហភាពបរិយាកាស (Atmospheric Temp Horizontal Bar Gauge) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">សីតុណ្ហភាពបរិយាកាស</span>
                <span className="text-xs font-mono font-bold text-orange-400">{device.pins.V2?.value || 28.6} °C</span>
              </div>
              <div className="my-3">
                <div className="w-full bg-slate-950 h-6 rounded-xl overflow-hidden border border-slate-800 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 rounded-lg transition-all duration-500"
                    style={{ width: `${(Number(device.pins.V2?.value || 28.6) / 60) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0 °C</span>
                <span>30 °C</span>
                <span>60 °C</span>
              </div>
            </div>

            {/* Auto_Mode_Pump */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-300">Auto_Mode_Pump</span>
              <div className="my-4 flex items-center justify-between">
                <span className="text-xl font-bold text-white">
                  {Number(device.pins.V3?.value) === 1 ? 'ON' : 'OFF'}
                </span>
                <button
                  onClick={() => onUpdatePin('V3', Number(device.pins.V3?.value) === 1 ? 0 : 1)}
                  className={`w-14 h-8 rounded-full p-1 transition flex items-center ${
                    Number(device.pins.V3?.value) === 1 ? 'bg-blue-500 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md">
                    <Sliders className={`w-3.5 h-3.5 ${Number(device.pins.V3?.value) === 1 ? 'text-blue-600' : 'text-slate-400'}`} />
                  </div>
                </button>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">PIN V3 (Logic Sync)</span>
            </div>
          </div>

          {/* Row 2: Ambient Light, Green Card (ការលូតលាស់ទឹកពីដី), សំណើមបរិយាកាស, Solar_Angle */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Ambient Light Value Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Ambient Light</span>
                <Sun className="w-4 h-4 text-amber-400" />
              </div>
              <div className="my-3">
                <span className="text-3xl font-black text-white font-mono">{device.pins.V4?.value || 6}</span>
                <span className="text-sm font-semibold text-slate-400 ml-1">lx</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">BH1750 Sensor</span>
            </div>

            {/* Green Solid Card: ការលូតលាស់ទឹកពីដី */}
            <div className="bg-emerald-600 rounded-2xl p-5 shadow-xl flex flex-col justify-between text-white">
              <span className="text-xs font-bold opacity-90">ការលូតលាស់ទឹកពីដី</span>
              <div className="my-2">
                <span className="text-4xl font-black font-mono">{device.pins.V5?.value || 1}</span>
              </div>
              <span className="text-[11px] opacity-80">Active Flow Rate</span>
            </div>

            {/* Semicircle Gauge: សំណើមបរិយាកាស (0-100%) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col items-center justify-center">
              <RadialGauge
                id="gauge-irrigation-humidity"
                value={Number(device.pins.V6?.value || 68.4)}
                min={0}
                max={100}
                unit="%"
                label="សំណើមបរិយាកាស"
                color="#06b6d4"
                size={180}
                gaugeType="semicircle"
              />
            </div>

            {/* Semicircle Gauge: Solar_Angle (0-150) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col items-center justify-center">
              <RadialGauge
                id="gauge-irrigation-solar"
                value={Number(device.pins.V7?.value || 45)}
                min={0}
                max={150}
                unit="°"
                label="Solar_Angle"
                color="#f59e0b"
                size={180}
                gaugeType="semicircle"
              />
            </div>
          </div>

          {/* Row 3: Green Solid Card (កម្រិតព្រមានការរាំងស្ងួត) & Battery Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Green Solid Card: កម្រិតព្រមានការរាំងស្ងួត */}
            <div className="bg-emerald-600 rounded-2xl p-5 shadow-xl flex flex-col justify-between text-white">
              <span className="text-xs font-bold opacity-90">កម្រិតព្រមានការរាំងស្ងួត</span>
              <div className="my-2">
                <span className="text-4xl font-black font-mono">{device.pins.V8?.value || 0}</span>
              </div>
              <span className="text-[11px] opacity-80">Status: Safe (គ្មានគ្រោះរាំងស្ងួត)</span>
            </div>

            {/* Battery Level Wide Gauge */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Battery Level</span>
                <span className="text-sm font-mono font-bold text-lime-400">{device.pins.V9?.value || 94} %</span>
              </div>
              <div className="my-3">
                <div className="w-full bg-slate-950 h-5 rounded-xl overflow-hidden border border-slate-800 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-lime-500 to-emerald-400 rounded-lg transition-all duration-500"
                    style={{ width: `${Number(device.pins.V9?.value || 94)}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>12.6V Solar Grid Active</span>
                <span>Lithium LiFePO4</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TEMPLATE 3: SMART BIN (Matching Image 3)                                  */}
      {/* ========================================================================= */}
      {device.templateId === 'TMPL_SMART_BIN' && (
        <div className="space-y-4">
          {/* Row 1: Open_Trash, Dry_Storage, Telegram_Mode */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Open_Trash switch widget */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-300">Open_Trash</span>
              <div className="my-4 flex items-center justify-between">
                <span className="text-2xl font-bold text-white">
                  {Number(device.pins.V0?.value) === 1 ? 'On' : 'Off'}
                </span>
                <button
                  onClick={() => onUpdatePin('V0', Number(device.pins.V0?.value) === 1 ? 0 : 1)}
                  className={`w-14 h-8 rounded-full p-1 transition flex items-center ${
                    Number(device.pins.V0?.value) === 1 ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md">
                    <Power className={`w-3.5 h-3.5 ${Number(device.pins.V0?.value) === 1 ? 'text-emerald-600' : 'text-slate-400'}`} />
                  </div>
                </button>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Servo Lid Trigger (V0)</span>
            </div>

            {/* Dry_Storage Semicircle Gauge (0-100%, 60%) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col items-center justify-center">
              <RadialGauge
                id="gauge-dry-storage"
                value={Number(device.pins.V1?.value || 60)}
                min={0}
                max={100}
                unit="%"
                label="Dry_Storage"
                color="#f97316"
                size={200}
                gaugeType="semicircle"
              />
            </div>

            {/* Telegram_Mode switch widget (blue button) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Telegram_Mode</span>
                <Send className="w-4 h-4 text-sky-400" />
              </div>
              <div className="my-4 flex items-center justify-between">
                <span className="text-2xl font-bold text-white">
                  {Number(device.pins.V2?.value) === 1 ? 'On' : 'Off'}
                </span>
                <button
                  onClick={() => onUpdatePin('V2', Number(device.pins.V2?.value) === 1 ? 0 : 1)}
                  className={`w-14 h-8 rounded-full p-1 transition flex items-center ${
                    Number(device.pins.V2?.value) === 1 ? 'bg-sky-500 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md">
                    <Send className="w-3 h-3 text-sky-600" />
                  </div>
                </button>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Bot Notification Sync (V2)</span>
            </div>
          </div>

          {/* Row 2: Wet_Storage, Email_Mode, Call_Mode */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Wet_Storage Semicircle Gauge (0-100%, 18%) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col items-center justify-center">
              <RadialGauge
                id="gauge-wet-storage"
                value={Number(device.pins.V3?.value || 18)}
                min={0}
                max={100}
                unit="%"
                label="Wet_Storage"
                color="#06b6d4"
                size={200}
                gaugeType="semicircle"
              />
            </div>

            {/* Email_Mode (orange toggle switch) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Email_Mode</span>
                <Mail className="w-4 h-4 text-amber-400" />
              </div>
              <div className="my-4 flex items-center justify-between">
                <span className="text-2xl font-bold text-white">
                  {Number(device.pins.V4?.value) === 1 ? 'On' : 'Off'}
                </span>
                <button
                  onClick={() => onUpdatePin('V4', Number(device.pins.V4?.value) === 1 ? 0 : 1)}
                  className={`w-14 h-8 rounded-full p-1 transition flex items-center ${
                    Number(device.pins.V4?.value) === 1 ? 'bg-amber-500 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md">
                    <Mail className="w-3 h-3 text-amber-600" />
                  </div>
                </button>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">SMTP Alert Dispatch (V4)</span>
            </div>

            {/* Call_Mode (green toggle switch) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Call_Mode</span>
                <Phone className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="my-4 flex items-center justify-between">
                <span className="text-2xl font-bold text-white">
                  {Number(device.pins.V5?.value) === 1 ? 'On' : 'Off'}
                </span>
                <button
                  onClick={() => onUpdatePin('V5', Number(device.pins.V5?.value) === 1 ? 0 : 1)}
                  className={`w-14 h-8 rounded-full p-1 transition flex items-center ${
                    Number(device.pins.V5?.value) === 1 ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md">
                    <Phone className="w-3 h-3 text-emerald-600" />
                  </div>
                </button>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">VoIP / GSM Emergency (V5)</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TEMPLATE 4: TRAFFIC LIGHT AND PARKING (Matching Image 4)                  */}
      {/* ========================================================================= */}
      {device.templateId === 'TMPL_TRAFFIC_PARKING' && (
        <div className="space-y-4">
          {/* Row 1: Lamp (Switch), Parking count (4), Road A Car (4), Road B Car (4) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Lamp Toggle Switch */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-300">Lamp</span>
              <div className="my-4 flex items-center justify-between">
                <span className="text-2xl font-bold text-white">
                  {Number(device.pins.V0?.value) === 1 ? 'On' : 'Off'}
                </span>
                <button
                  onClick={() => onUpdatePin('V0', Number(device.pins.V0?.value) === 1 ? 0 : 1)}
                  className={`w-14 h-8 rounded-full p-1 transition flex items-center ${
                    Number(device.pins.V0?.value) === 1 ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md">
                    <Lightbulb className={`w-3.5 h-3.5 ${Number(device.pins.V0?.value) === 1 ? 'text-emerald-600' : 'text-slate-400'}`} />
                  </div>
                </button>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">PIN V0 (GPIO 22)</span>
            </div>

            {/* Parking count Big Display */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-300">Parking count</span>
              <div className="my-2">
                <span className="text-4xl font-black text-white font-mono">{device.pins.V1?.value || 4}</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono">Available Bays</span>
            </div>

            {/* Road A Car Big Display */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-300">Road A Car</span>
              <div className="my-2">
                <span className="text-4xl font-black text-white font-mono">{device.pins.V2?.value || 4}</span>
              </div>
              <span className="text-[11px] text-blue-400 font-mono">Vehicles Detected</span>
            </div>

            {/* Road B Car Big Display */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-300">Road B Car</span>
              <div className="my-2">
                <span className="text-4xl font-black text-white font-mono">{device.pins.V3?.value || 4}</span>
              </div>
              <span className="text-[11px] text-purple-400 font-mono">Vehicles Detected</span>
            </div>
          </div>

          {/* Row 2: Street Light & Traffic Signal Live Phase */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Street Light */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Street Light</h4>
                <p className="text-xs text-slate-400">PIN V4 (High-Mast Highway Lighting)</p>
              </div>
              <button
                onClick={() => onUpdatePin('V4', Number(device.pins.V4?.value) === 1 ? 0 : 1)}
                className={`w-14 h-8 rounded-full p-1 transition flex items-center ${
                  Number(device.pins.V4?.value) === 1 ? 'bg-amber-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                </div>
              </button>
            </div>

            {/* Traffic Signal Active Light */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Traffic Phase Controller</h4>
                <p className="text-xs text-slate-400">Automatic Timer & Sensor Priority</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <div className="w-4 h-4 rounded-full bg-red-500/30 border border-red-500/50" />
                <div className="w-4 h-4 rounded-full bg-amber-500/30 border border-amber-500/50" />
                <div className="w-4 h-4 rounded-full bg-emerald-400 border border-emerald-500 shadow-md shadow-emerald-400/80 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION: REAL-TIME TELEMETRY CHART                                        */}
      {/* ========================================================================= */}
      <TelemetryChart
        data={telemetryData}
        currentFilter={timeFilter}
        onFilterChange={onTimeFilterChange}
        lang={lang}
      />

      {/* ========================================================================= */}
      {/* SECTION: VIRTUAL PIN MAP INSPECTOR TABLE                                  */}
      {/* ========================================================================= */}
      <div id="virtual-pin-table-section" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {lang === 'km' ? 'តារាងផ្គូផ្គង Virtual Pin (Blynk Datastream Map)' : 'Virtual Pin Datastream Map (V0 - V15)'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'km' ? 'ទិន្នន័យផ្ទាល់ និងការភ្ជាប់ Pin ជាមួយ ESP32' : 'Hardware GPIO pin mapping and live values'}
              </p>
            </div>
          </div>

          <span className="text-xs text-slate-400 font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            Auth Token: <code className="text-emerald-400">{device.authToken.substring(0, 12)}...</code>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Virtual Pin</th>
                <th className="py-2.5 px-3">Datastream Name</th>
                <th className="py-2.5 px-3">Physical GPIO</th>
                <th className="py-2.5 px-3">Data Type</th>
                <th className="py-2.5 px-3">Live Value</th>
                <th className="py-2.5 px-3 text-right">Quick Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {Object.keys(device.pins).map(pinKey => {
                const p = device.pins[pinKey as VirtualPinId];
                if (!p) return null;
                const isRelay = p.type === 'relay' || p.type === 'status_led';
                const isSlider = p.type === 'slider_pwm';

                return (
                  <tr key={pinKey} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                        {p.pin}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <div className="font-semibold text-slate-200">{lang === 'km' ? p.labelKhmer : p.label}</div>
                      <div className="text-[10px] text-slate-400">{p.label}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-slate-300">
                        {p.gpioPin ? `GPIO ${p.gpioPin}` : 'Virtual Datastream'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {p.type.replace('_', ' ').toUpperCase()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {p.value} {p.unit || ''}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {isRelay ? (
                        <button
                          onClick={() => onUpdatePin(p.pin, Number(p.value) === 1 ? 0 : 1)}
                          className={`px-3 py-1 rounded text-xs font-bold font-sans transition ${
                            Number(p.value) === 1
                              ? 'bg-emerald-500 text-slate-950 shadow-sm'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {Number(p.value) === 1 ? 'ON (HIGH)' : 'OFF (LOW)'}
                        </button>
                      ) : isSlider ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => onUpdatePin(p.pin, Math.max(0, Number(p.value) - 10))}
                            className="px-1.5 py-0.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded"
                          >
                            -10
                          </button>
                          <span className="text-xs text-blue-400">{p.value}%</span>
                          <button
                            onClick={() => onUpdatePin(p.pin, Math.min(100, Number(p.value) + 10))}
                            className="px-1.5 py-0.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded"
                          >
                            +10
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-sans">Live Auto-Read</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
