import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Activity, Send, Wifi, Radio, AlertTriangle, CheckCircle2, Wind, ShieldAlert, Sparkles, Zap } from 'lucide-react';
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

  // Fast realtime local sensor states
  const [liveDistance, setLiveDistance] = useState<number>(Number(device.pins.V1?.value ?? 12.5));
  const [liveFillLevel, setLiveFillLevel] = useState<number>(Number(device.pins.V0?.value ?? 45));
  const [livePpm, setLivePpm] = useState<number>(Number(device.pins.V4?.value ?? 95));
  const [liveAirBad, setLiveAirBad] = useState<boolean>(Number(device.pins.V5?.value ?? 0) === 1 || Number(device.pins.V4?.value ?? 95) >= 400);
  const [liveSw1, setLiveSw1] = useState<boolean>(Number(device.pins.V2?.value ?? 0) === 1);
  const [liveSw2, setLiveSw2] = useState<boolean>(Number(device.pins.V3?.value ?? 0) === 1);

  // User configurable ESP32 IP for direct live connection
  const [targetIp, setTargetIp] = useState<string>(() => localStorage.getItem('sps_esp32_c3_ip') || device.ipAddress || '192.168.4.1');
  const [isDirectConnected, setIsDirectConnected] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Live');

  // Keep in sync with device props when props change
  useEffect(() => {
    if (device.pins.V0) setLiveFillLevel(Number(device.pins.V0.value));
    if (device.pins.V1) setLiveDistance(Number(device.pins.V1.value));
    if (device.pins.V2) setLiveSw1(Number(device.pins.V2.value) === 1);
    if (device.pins.V3) setLiveSw2(Number(device.pins.V3.value) === 1);
    if (device.pins.V4) {
      const p = Number(device.pins.V4.value);
      setLivePpm(p);
      setLiveAirBad(p >= 400 || Number(device.pins.V5?.value ?? 0) === 1);
    }
  }, [device.pins.V0?.value, device.pins.V1?.value, device.pins.V2?.value, device.pins.V3?.value, device.pins.V4?.value, device.pins.V5?.value]);

  // Fast Real-Time polling: Polls both physical ESP32 IP (if reachable) and server /data
  useEffect(() => {
    let isMounted = true;
    const fastPoll = async () => {
      // 1. Try polling real physical ESP32 directly if available (e.g. 192.168.4.1 or home router IP)
      if (targetIp && targetIp !== '0.0.0.0') {
        const cleanIp = targetIp.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
        try {
          const directController = new AbortController();
          const dTimeout = setTimeout(() => directController.abort(), 1200);
          const directRes = await fetch(`http://${cleanIp}/data`, {
            signal: directController.signal,
            mode: 'cors',
            headers: { 'Accept': 'application/json' }
          });
          clearTimeout(dTimeout);
          if (directRes.ok) {
            const dData = await directRes.json();
            if (isMounted && dData) {
              setIsDirectConnected(true);
              setLastSyncTime(new Date().toLocaleTimeString());
              if (typeof dData.level === 'number') setLiveFillLevel(dData.level);
              if (typeof dData.distance === 'number') setLiveDistance(dData.distance);
              if (typeof dData.ppm === 'number') {
                setLivePpm(dData.ppm);
                setLiveAirBad(Boolean(dData.airBad || dData.ppm >= 400));
              }
              // Sync back to cloud server for consistency
              fetch(`/api/iot/c3/update?distance=${dData.distance}&level=${dData.level}&ppm=${dData.ppm}&airBad=${dData.airBad ? '1' : '0'}`).catch(() => {});
              return;
            }
          }
        } catch (e) {
          if (isMounted) setIsDirectConnected(false);
        }
      }

      // 2. Poll server /data
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 800);
        
        const res = await fetch('/data', { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data) {
            setLastSyncTime(new Date().toLocaleTimeString());
            if (typeof data.level === 'number') {
              setLiveFillLevel(data.level);
            }
            if (typeof data.distance === 'number') {
              setLiveDistance(data.distance);
            }
            if (typeof data.ppm === 'number') {
              setLivePpm(data.ppm);
              setLiveAirBad(Boolean(data.airBad || data.ppm >= 400));
            }
          }
        }
      } catch (e) {
        // ignore fast poll errors
      }
    };

    fastPoll();
    const interval = setInterval(fastPoll, 400); // 400ms ultra fast realtime

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [targetIp, device.authToken]);

  const fillLevel = liveFillLevel;
  const distance = liveDistance;
  const sw1State = liveSw1;
  const sw2State = liveSw2;
  const ppm = livePpm;
  const airBad = liveAirBad;
  const telegramSent = Number(device.pins.V6?.value ?? 0) === 1;

  // Toggle Switch 1 (GPIO 8)
  const handleToggleSw1 = async () => {
    const nextVal = sw1State ? 0 : 1;
    setLiveSw1(!sw1State);
    playMechanicalSwitchSound(!sw1State);
    setLocalDispatching('SW1');

    if (dashboardIp) {
      try {
        fetch(`http://${dashboardIp}/led1/${nextVal === 1 ? 'on' : 'off'}`, { mode: 'no-cors' }).catch(() => {});
      } catch (e) {}
    }
    try {
      fetch(`/led1/${nextVal === 1 ? 'on' : 'off'}`).catch(() => {});
    } catch (e) {}

    onUpdatePin('V2', nextVal);
    setTimeout(() => setLocalDispatching(null), 300);
  };

  // Toggle Switch 2 (GPIO 9)
  const handleToggleSw2 = async () => {
    const nextVal = sw2State ? 0 : 1;
    setLiveSw2(!sw2State);
    playMechanicalSwitchSound(!sw2State);
    setLocalDispatching('SW2');

    if (dashboardIp) {
      try {
        fetch(`http://${dashboardIp}/led2/${nextVal === 1 ? 'on' : 'off'}`, { mode: 'no-cors' }).catch(() => {});
      } catch (e) {}
    }
    try {
      fetch(`/led2/${nextVal === 1 ? 'on' : 'off'}`).catch(() => {});
    } catch (e) {}

    onUpdatePin('V3', nextVal);
    setTimeout(() => setLocalDispatching(null), 300);
  };

  // Determine fill color matching the firmware
  const getFillColor = (level: number) => {
    if (level >= 85) return '#e53935'; // Red
    if (level >= 50) return '#fb8c00'; // Orange
    return '#4caf50'; // Green
  };

  return (
    <div id="c3-smartbin-dual-panel" className="space-y-6">
      {/* Quick Info Header Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            C3
          </div>
          <div>
            <div className="font-extrabold text-white flex items-center gap-2">
              <span>{lang === 'km' ? 'ESP32-C3 ប្រព័ន្ធឆ្លាតវៃ: ធុងសំរាម + គុណភាពខ្យល់ (MQ-135) + កុងតាក់ភ្លោះ' : 'ESP32-C3 Smart System: Bin + MQ-135 Air Quality + Dual Wall Switch'}</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                DUAL-MODE (AP + STA)
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              AP: <strong>SmartBin-ESP32 (192.168.4.1)</strong> • Router: <strong>SMART-WIFI-B339</strong> • MQ-135 on <strong>GPIO 0 (PPM)</strong>
            </p>
          </div>
        </div>

        {/* Live ESP32 IP Sync pill & Telegram Status */}
        <div className="flex flex-wrap items-center gap-2">
          {/* IP Input / Direct sync badge */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 px-2.5 py-1 rounded-xl">
            <span className="text-[10px] text-slate-400 font-bold">ESP32 IP:</span>
            <input
              type="text"
              value={targetIp}
              onChange={(e) => {
                setTargetIp(e.target.value);
                localStorage.setItem('sps_esp32_c3_ip', e.target.value);
              }}
              placeholder="192.168.4.1"
              className="bg-slate-900 border border-slate-700 text-amber-300 font-mono text-[11px] px-2 py-0.5 rounded w-28 focus:outline-none focus:border-amber-400 font-bold"
            />
            <span className={`w-2 h-2 rounded-full ${isDirectConnected ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500'}`} title={isDirectConnected ? 'Directly connected to ESP32 IP' : 'Live Syncing via Cloud / Web'} />
            <span className="text-[10px] font-mono text-emerald-400 font-bold ml-0.5">{lastSyncTime}</span>
          </div>

          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold transition-all ${
            airBad || fillLevel >= 100
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}>
            <Send className="w-3.5 h-3.5 text-sky-400" />
            <span>
              {airBad
                ? (lang === 'km' ? '🚨 អាសន្ន! ខ្យល់ពុលខ្លាំង (បានផ្ញើសារ Telegram)' : '🚨 AIR POLLUTION ALERT! Telegram Dispatched')
                : (fillLevel >= 100
                  ? (lang === 'km' ? '🚨 សំរាមពេញ! បានផ្ញើសារ Telegram' : '🚨 FULL BIN! Telegram Dispatched')
                  : (lang === 'km' ? 'Telegram ត្រៀមរួចរាល់ (Bot 8928313450)' : 'Telegram Ready (Bot 8928313450)'))}
            </span>
          </div>
        </div>
      </div>

      {/* Emergency Air Pollution Banner if airBad */}
      {airBad && (
        <div className="bg-rose-950/80 border-2 border-rose-500/60 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-rose-100 shadow-xl animate-bounce-subtle">
          <ShieldAlert className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1">
            <h3 className="font-black text-rose-200 text-base flex items-center gap-2">
              <span>{lang === 'km' ? '⚠️ អាសន្ន! មានខ្យល់ពុលខ្លាំង (' + ppm + ' PPM)' : '⚠️ EMERGENCY! High Air Pollution Level (' + ppm + ' PPM)'}</span>
              <span className="px-2 py-0.5 rounded bg-rose-500 text-white text-[11px] font-bold">AIR QUALITY: BAD</span>
            </h3>
            <p className="text-xs sm:text-sm text-rose-200/90 leading-relaxed font-medium">
              {lang === 'km'
                ? 'សូមប្រុងប្រយ័ត្នចេញក្រៅសូមពាក់ម៉ាស តែបើមិនចាំបាច់សូមនៅក្នុងផ្ទះ ឬកន្លែងដែលមានបរិយាសកាសល្អ!!!'
                : 'Please wear a protective mask when going outside, or stay indoors in a well-ventilated space! Telegram alert notification has been sent.'}
            </p>
          </div>
        </div>
      )}

      {/* Main 3-Card Grid Matching User HTML Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* CARD 1: SMART BIN LEVEL */}
        <div className="bg-white text-slate-800 rounded-3xl p-6 shadow-[0_10px_25px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col items-center justify-between min-h-[380px] relative">
          <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-500 font-bold mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
              HC-SR04 • TRIG 2 / ECHO 3
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold border border-emerald-200">
              V0 ({fillLevel}%)
            </span>
          </div>

          <h2 className="text-xl font-bold text-slate-800 mt-2 mb-2 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-emerald-600" />
            <span>Smart Bin Level</span>
          </h2>

          {/* Bin Container - Designed like sea water with ultrasonic sensor on top */}
          <div className="w-[140px] h-[180px] border-l-4 border-r-4 border-b-4 border-[#333333] rounded-b-[10px] my-4 relative bg-[#e0f7fa] overflow-hidden flex flex-col shadow-inner">
            {/* Ultrasonic Sensor Header (Top) */}
            <div className="absolute top-0 left-0 right-0 h-4 bg-slate-800 flex items-center justify-around z-10 border-b border-slate-900">
              {/* Ultrasonic eyes */}
              <div className="w-2.5 h-2.5 rounded-full bg-slate-600 border border-slate-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-slate-600 border border-slate-400"></div>
            </div>
            
            {/* Beam Ray visual from sensor down to water */}
            <div 
              className="absolute top-4 left-1/2 -translate-x-1/2 w-8 bg-sky-200/40 border-l border-r border-sky-300/30 border-dashed transition-all duration-500 z-0"
              style={{
                height: `${100 - Math.min(100, Math.max(0, fillLevel))}%`
              }}
            ></div>

            <div className="flex-grow"></div>

            {/* Sea Water Level */}
            <div
              className="w-full relative transition-all duration-700 ease-in-out flex-shrink-0"
              style={{
                height: `${Math.min(100, Math.max(0, fillLevel))}%`,
                background: 'linear-gradient(180deg, #4dd0e1 0%, #00acc1 100%)',
                boxShadow: 'inset 0 4px 6px -1px rgba(255, 255, 255, 0.4)'
              }}
            >
               {/* Animated Waves */}
               <div className="absolute -top-1 left-0 right-0 h-2 bg-white/30 rounded-t-full opacity-60"></div>
            </div>
          </div>

          {/* Level Info & Distance */}
          <div className="text-center w-full">
            <div className="text-[24px] font-black text-[#00838f] my-1">
              {Math.round(fillLevel)}%
            </div>
            <div className="text-[15px] font-semibold text-[#666666]">
              ជម្រៅ: <span className="font-bold text-sky-600">{distance.toFixed(1)}</span> cm
            </div>
            <p className="text-[12px] font-bold text-slate-500 mt-2">
              (15cm = 0% • 5cm = 100%)
            </p>
          </div>
        </div>

        {/* CARD 2: AIR QUALITY MONITOR (MQ-135 SEMI-CIRCULAR GAUGE) */}
        <div className="bg-white text-slate-800 rounded-3xl p-6 shadow-[0_10px_25px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col items-center justify-between min-h-[380px] relative">
          <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-500 font-bold mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
              MQ-135 • GPIO 0 (Analog)
            </span>
            <span className={`px-2.5 py-0.5 rounded-full font-bold border transition-colors ${
              airBad ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'
            }`}>
              V4 ({ppm} PPM)
            </span>
          </div>

          <h2 className="text-xl font-bold text-slate-800 mt-2 mb-1 flex items-center gap-2">
            <Wind className={`w-5 h-5 transition-colors duration-500 ${airBad ? 'text-rose-500 animate-spin-slow' : 'text-emerald-600'}`} />
            <span>Air Quality Monitor</span>
          </h2>

          {/* Semi-Circular Arc Gauge (Matching User Image with Dynamic Green -> Red) */}
          <div className="w-full flex flex-col items-center my-auto py-2">
            <div className="relative w-52 sm:w-56 h-32 flex items-center justify-center">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 200 120">
                <defs>
                  {/* Dynamic Gradient for the arc */}
                  <linearGradient id="airQualityGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="35%" stopColor="#84cc16" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="70%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#dc2626" />
                  </linearGradient>

                  {/* Drop glow filter when hazardous */}
                  <filter id="glowAir" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={airBad ? '#dc2626' : '#22c55e'} floodOpacity="0.4" />
                  </filter>
                </defs>

                {/* Background Arc Track (Gray #e5e7eb) */}
                <path
                  d="M 25 100 A 75 75 0 0 1 175 100"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="24"
                  strokeLinecap="butt"
                />

                {/* Foreground Colored Arc with dynamic dashoffset */}
                {(() => {
                  const arcLength = Math.PI * 75; // ~235.62
                  const clampedPpm = Math.max(0, Math.min(1000, ppm));
                  const fillRatio = clampedPpm / 1000;
                  const dashOffset = arcLength * (1 - fillRatio);

                  // Color interpolation function
                  let strokeColor = '#22c55e'; // Green
                  if (clampedPpm >= 600) strokeColor = '#b91c1c'; // Deep Red
                  else if (clampedPpm >= 400) strokeColor = '#dc2626'; // Red
                  else if (clampedPpm >= 300) strokeColor = '#f97316'; // Orange
                  else if (clampedPpm >= 200) strokeColor = '#eab308'; // Amber
                  else if (clampedPpm >= 100) strokeColor = '#84cc16'; // Lime

                  return (
                    <path
                      d="M 25 100 A 75 75 0 0 1 175 100"
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="24"
                      strokeLinecap="butt"
                      strokeDasharray={arcLength}
                      strokeDashoffset={dashOffset}
                      filter="url(#glowAir)"
                      className="transition-all duration-700 ease-out"
                    />
                  );
                })()}

                {/* Start & End Ticks at bottom */}
                <text x="25" y="118" textAnchor="middle" fontSize="12" fontWeight="700" fill="#94a3b8">
                  0
                </text>
                <text x="175" y="118" textAnchor="middle" fontSize="12" fontWeight="700" fill="#94a3b8">
                  1000
                </text>
              </svg>

              {/* Centered Large Number and PPM label (Exact look of user photo) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-8 pointer-events-none">
                <div
                  className="text-4xl sm:text-5xl font-bold tracking-tight transition-colors duration-500"
                  style={{
                    color: ppm >= 600 ? '#b91c1c' : (ppm >= 400 ? '#dc2626' : (ppm >= 300 ? '#ea580c' : (ppm >= 200 ? '#ca8a04' : '#15803d')))
                  }}
                >
                  {ppm}
                </div>
                <div className="text-[12px] font-extrabold text-slate-400 tracking-wider -mt-1">
                  PPM
                </div>
              </div>
            </div>
          </div>

          {/* Air Status Badge (Normal / Bad) */}
          <div className="w-full text-center">
            <div
              className={`text-[19px] font-black px-5 py-2.5 rounded-xl border-2 inline-block transition-all duration-500 shadow-sm ${
                airBad
                  ? 'bg-[#ffebee] text-[#c62828] border-[#c62828] animate-pulse'
                  : 'bg-[#e8f5e9] text-[#2e7d32] border-[#2e7d32]'
              }`}
            >
              {airBad ? 'Air Quality: Bad' : 'Air Quality: Normal'}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              {airBad ? '⚠️ លើសពីកម្រិតកំណត់ (Threshold >= 400 PPM)' : '✅ គុណភាពខ្យល់ល្អ បរិយាកាសធម្មតា (PPM < 400)'}
            </p>
          </div>
        </div>

        {/* CARD 3: WALL SWITCH CONTROL (SGT DUAL ROCKER) */}
        <div className="flex flex-col items-center justify-center">
          <WallSwitchControlCard
            sw1State={sw1State}
            sw2State={sw2State}
            onToggleSw1={handleToggleSw1}
            onToggleSw2={handleToggleSw2}
            title="Wall Switch Control"
            sw1Label={sw1State ? 'SWITCH ON' : 'SWITCH 1'}
            sw2Label={sw2State ? 'SWITCH ON' : 'SWITCH 2'}
            brandText="SGT"
            dashboardIp={dashboardIp}
          />
        </div>

      </div>
    </div>
  );
};

