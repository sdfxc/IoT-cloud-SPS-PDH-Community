import React, { useState } from 'react';
import { Trash2, Activity, Send, Wifi, Radio, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { IoTDevice } from '../types';
import { playMechanicalSwitchSound } from '../utils/audioEffects';
import { WallSwitchControlCard } from './WallSwitchControlCard';

interface C3SmartBinDualPanelProps {
  device: IoTDevice;
  lang: 'km' | 'en';
  onUpdatePin: (pin: string, value: number) => void;
  dashboardIp?: string;
}

export const C3SmartBinDualPanel: React.FC<C3SmartBinDualPanelProps> = ({
  device,
  lang,
  onUpdatePin,
  dashboardIp = '192.168.4.1'
}) => {
  const [localDispatching, setLocalDispatching] = useState<string | null>(null);

  const fillLevel = Number(device.pins.V0?.value ?? 45);
  const distance = Number(device.pins.V1?.value ?? 12.5);
  const sw1State = Number(device.pins.V2?.value ?? 0) === 1;
  const sw2State = Number(device.pins.V3?.value ?? 0) === 1;
  const telegramSent = Number(device.pins.V4?.value ?? 0) === 1;

  // Toggle Switch 1 (GPIO 8)
  const handleToggleSw1 = async () => {
    const nextVal = sw1State ? 0 : 1;
    playMechanicalSwitchSound(!sw1State);
    setLocalDispatching('SW1');

    // Direct HTTP request to ESP32-C3
    if (dashboardIp) {
      try {
        fetch(`http://${dashboardIp}/led1/${nextVal === 1 ? 'on' : 'off'}`, { mode: 'no-cors' }).catch(() => {});
      } catch (e) {}
    }
    // Also trigger via API
    try {
      fetch(`/led1/${nextVal === 1 ? 'on' : 'off'}`).catch(() => {});
    } catch (e) {}

    onUpdatePin('V2', nextVal);
    setTimeout(() => setLocalDispatching(null), 400);
  };

  // Toggle Switch 2 (GPIO 9)
  const handleToggleSw2 = async () => {
    const nextVal = sw2State ? 0 : 1;
    playMechanicalSwitchSound(!sw2State);
    setLocalDispatching('SW2');

    // Direct HTTP request to ESP32-C3
    if (dashboardIp) {
      try {
        fetch(`http://${dashboardIp}/led2/${nextVal === 1 ? 'on' : 'off'}`, { mode: 'no-cors' }).catch(() => {});
      } catch (e) {}
    }
    // Also trigger via API
    try {
      fetch(`/led2/${nextVal === 1 ? 'on' : 'off'}`).catch(() => {});
    } catch (e) {}

    onUpdatePin('V3', nextVal);
    setTimeout(() => setLocalDispatching(null), 400);
  };

  // Determine fill color matching the firmware
  const getFillColor = (level: number) => {
    if (level >= 85) return '#ef4444'; // Red
    if (level >= 50) return '#f59e0b'; // Amber / Orange
    return '#10b981'; // Emerald Green
  };

  return (
    <div id="c3-smartbin-dual-panel" className="space-y-6">
      {/* Quick Info Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            C3
          </div>
          <div>
            <div className="font-extrabold text-white flex items-center gap-2">
              <span>{lang === 'km' ? 'ESP32-C3 ធុងសំរាម & កុងតាក់ភ្លោះ (SGT Dual Rocker)' : 'ESP32-C3 Smart Bin & Dual Switch (SGT Panel)'}</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                DUAL-MODE (AP + STA)
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              AP: <strong>SmartBin-ESP32 (192.168.4.1)</strong> • Router: <strong>SMART-WIFI-B339</strong> • Telegram Alerts Active
            </p>
          </div>
        </div>

        {/* Telegram Status pill */}
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold ${
            fillLevel >= 100 || telegramSent
              ? 'bg-rose-500/15 text-rose-400 border-rose-500/40 animate-pulse'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}>
            <Send className="w-3.5 h-3.5 text-sky-400" />
            <span>
              {fillLevel >= 100 || telegramSent
                ? (lang === 'km' ? '🚨 សំរាមពេញ! បានផ្ញើសារ Telegram' : '🚨 FULL BIN! Telegram Alert Dispatched')
                : (lang === 'km' ? 'Telegram រង់ចាំ (Alert នៅពេល >=100%)' : 'Telegram Ready (Trigger at 100%)')}
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Exact Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* CARD 1: SMART BIN LEVEL (Vertical Tank Gauge) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center justify-between min-h-[420px] relative hover:border-emerald-500/40 transition-all duration-300">
          <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-400 font-bold mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
              HC-SR04 • TRIG 2 / ECHO 3
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
              V0 ({fillLevel}%) & V1 ({distance.toFixed(1)}cm)
            </span>
          </div>

          <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-400 mt-1 mb-4 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'km' ? 'កម្រិតផ្ទុកធុងសំរាម (Smart Bin Level)' : 'Smart Bin Level'}</span>
          </h2>

          {/* Vertical Fill Tank (Exact Replica from firmware embedded CSS) */}
          <div className="relative w-36 sm:w-40 h-64 border-4 border-slate-600 rounded-3xl overflow-hidden bg-slate-950 shadow-[inset_0_0_15px_rgba(0,0,0,0.8)] flex flex-col justify-end">
            {/* Water Fill Bar */}
            <div
              className="w-full transition-all duration-500 ease-out flex items-center justify-center relative shadow-lg"
              style={{
                height: `${Math.min(100, Math.max(0, fillLevel))}%`,
                backgroundColor: getFillColor(fillLevel)
              }}
            >
              {/* Subtle top ripple wave highlight */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/30 backdrop-blur-sm" />
            </div>

            {/* Percentage text centered on tank */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-3xl sm:text-4xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-tight">
                {Math.round(fillLevel)}%
              </span>
            </div>
          </div>

          {/* Distance Info Display */}
          <div className="mt-4 text-center">
            <div className="text-base sm:text-lg font-bold text-sky-400 flex items-center justify-center gap-1.5">
              <Activity className="w-4 h-4" />
              <span>Distance: <strong>{distance.toFixed(1)}</strong> cm</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              (Empty: 20.0cm = 0% • Full: 5.0cm = 100%)
            </p>
          </div>
        </div>

        {/* CARD 2: DUAL SWITCH CONTROLLER (Gold SGT Wall Panel matching user image) */}
        <div className="flex flex-col items-center justify-center">
          <WallSwitchControlCard
            sw1State={sw1State}
            sw2State={sw2State}
            onToggleSw1={handleToggleSw1}
            onToggleSw2={handleToggleSw2}
            title={lang === 'km' ? 'Wall Switch Control' : 'Wall Switch Control'}
            sw1Label="SWITCH 1"
            sw2Label="SWITCH 2"
            brandText="S G T"
            dashboardIp={dashboardIp}
          />
        </div>
      </div>
    </div>
  );
};
