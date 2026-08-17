import React, { useState, useEffect } from 'react';
import { IoTDevice, VirtualPinId, TelemetryPoint, TimeFilter } from '../types';
import { DashboardWidget } from '../types/widgetBuilder';
import { RadialGauge } from './RadialGauge';
import { WaterTankLevel } from './WaterTankLevel';
import { TelemetryChart } from './TelemetryChart';
import { BlynkDashboardEditor } from './BlynkDashboardEditor';
import { SmartSwitch } from './SmartSwitch';
import { GoldenRockerSwitch } from './GoldenRockerSwitch';
import { C3SmartBinDualPanel } from './C3SmartBinDualPanel';
import {
  Thermometer,
  Droplets,
  Sprout,
  Zap,
  Sliders,
  Box,
  Copy,
  Check,
  SlidersHorizontal,
  Download,
  Info,
  Bell,
  Tag,
  User,
  Building,
  Cpu,
  Car,
  Compass,
  Trash2,
  Camera,
  Activity,
  Flame,
  Volume2,
  Wifi,
  Save,
  Radio,
  RefreshCw,
  ZapOff
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { pollDeviceDirectIp } from '../services/iotService';

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
  const [dashboardIp, setDashboardIp] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sps_peh_chip_ip') || device?.ipAddress || '192.168.0.169';
    }
    return device?.ipAddress || '192.168.0.169';
  });
  const [ipSavedToast, setIpSavedToast] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleSaveIp = (newIp: string) => {
    setDashboardIp(newIp);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sps_peh_chip_ip', newIp);
      if (device) {
        localStorage.setItem(`sps_peh_chip_ip_${device.id}`, newIp);
      }
    }
    setIpSavedToast(`✅ បានរក្សាទុក IP: ${newIp} ជោគជ័យ!`);
    setTimeout(() => {
      setIpSavedToast(null);
    }, 2500);
  };

  const handleTestPing = async () => {
    setIsPinging(true);
    setPingResult(null);
    try {
      const res = await pollDeviceDirectIp(dashboardIp);
      if (res.online) {
        setPingResult({
          ok: true,
          message: lang === 'km' ? `ភ្ជាប់ជោគជ័យ! (${res.mode || 'Dual-Mode AP+STA'})` : `Connected! (${res.mode || 'Dual-Mode'})`
        });
      } else {
        setPingResult({
          ok: false,
          message: lang === 'km' ? 'ESP32 មិនឆ្លើយតប (សូមពិនិត្យ Wi-Fi)' : 'ESP32 unreachable (Check WiFi)'
        });
      }
    } catch (e: any) {
      setPingResult({
        ok: false,
        message: lang === 'km' ? 'បរាជ័យ (Timeout)' : 'Failed (Timeout)'
      });
    } finally {
      setIsPinging(false);
      setTimeout(() => setPingResult(null), 4000);
    }
  };

  // Helper to generate default widgets based on template
  const getDefaultWidgetsForDevice = (dev: IoTDevice): DashboardWidget[] => {
    if (dev.templateId === 'TMPL_ALERT_SYSTEM') {
      return [
        { id: 'w_co', type: 'gauge', title: 'CO Level', titleKhmer: 'កម្រិតឧស្ម័ន CO', pin: 'V0', min: 0, max: 500, unit: 'ppm', color: '#f87171', widthCols: 1 },
        { id: 'w_press', type: 'gauge', title: 'Air Pressure', titleKhmer: 'សម្ពាធបរិយាកាស', pin: 'V1', min: 0, max: 120, unit: 'kPa', color: '#34d399', widthCols: 1 },
        { id: 'w_water', type: 'water_tank', title: 'Water Level', titleKhmer: 'កម្រិតទឹកក្នុងអាង', pin: 'V2', min: 0, max: 100, unit: '%', color: '#0ea5e9', widthCols: 1 },
        { id: 'w_siren', type: 'switch', title: 'Siren Alert', titleKhmer: 'ស៊ីរ៉ែនប្រកាសអាសន្ន', pin: 'V6', color: '#ef4444', widthCols: 1 },
        { id: 'w_strobe', type: 'switch', title: 'Strobe Light', titleKhmer: 'ភ្លើងស៊ីញ៉ូ', pin: 'V3', color: '#f59e0b', widthCols: 1 },
        { id: 'w_fan', type: 'slider', title: 'Exhaust Fan Speed', titleKhmer: 'ល្បឿនកង្ហារ', pin: 'V4', min: 0, max: 100, unit: '%', color: '#3b82f6', widthCols: 1 },
      ];
    }
    if (dev.templateId === 'TMPL_TRAFFIC_PARKING') {
      return [
        { id: 'w_lamp', type: 'switch', title: 'Lamp', titleKhmer: 'អំពូលភ្លើង (Lamp)', pin: 'V0', color: '#10b981', widthCols: 1 },
        { id: 'w_parking', type: 'label', title: 'Parking count', titleKhmer: 'ចំនួនចំណតយានយន្ត', pin: 'V1', value: 67, unit: 'Bays', color: '#10b981', widthCols: 1 },
        { id: 'w_road_a', type: 'label', title: 'Road A Car', titleKhmer: 'រថយន្តលើផ្លូវ A', pin: 'V2', value: 92, unit: 'Cars', color: '#3b82f6', widthCols: 1 },
        { id: 'w_road_b', type: 'label', title: 'Road B Car', titleKhmer: 'រថយន្តលើផ្លូវ B', pin: 'V3', value: 13, unit: 'Cars', color: '#8b5cf6', widthCols: 1 },
        { id: 'w_street', type: 'switch', title: 'Street Light', titleKhmer: 'ភ្លើងបំភ្លឺផ្លូវ', pin: 'V4', color: '#f59e0b', widthCols: 1 },
      ];
    }
    if (dev.templateId === 'TMPL_ESP32C3_SMART_BIN_DUAL') {
      return [
        { id: 'w_bin_level', type: 'water_tank', title: 'Smart Bin Level', titleKhmer: 'កម្រិតសំរាមក្នុងធុង', pin: 'V0', min: 0, max: 100, unit: '%', color: '#10b981', widthCols: 1 },
        { id: 'w_dist', type: 'label', title: 'Ultrasonic Distance', titleKhmer: 'ចម្ងាយ (HC-SR04)', pin: 'V1', value: 12.5, unit: 'cm', color: '#06b6d4', widthCols: 1 },
        { id: 'w_sw1', type: 'switch', title: 'SWITCH 1 (LED 1)', titleKhmer: 'កុងតាក់ ១ (LED 1)', pin: 'V2', color: '#eab308', widthCols: 1 },
        { id: 'w_sw2', type: 'switch', title: 'SWITCH 2 (LED 2)', titleKhmer: 'កុងតាក់ ២ (LED 2)', pin: 'V3', color: '#f59e0b', widthCols: 1 },
        { id: 'w_tg_alert', type: 'label', title: 'Telegram Alert', titleKhmer: 'Telegram Alert', pin: 'V4', value: 0, unit: 'Status', color: '#0ea5e9', widthCols: 1 },
      ];
    }
    // Default / ESP32-CAM / Smart Farm
    return [
      { id: 'w_pump', type: 'switch', title: 'Water Pump / Actuator', titleKhmer: 'ម៉ូទ័របូមទឹក / Relay', pin: 'V0', color: '#10b981', widthCols: 1 },
      { id: 'w_moist', type: 'label', title: 'Soil Moisture', titleKhmer: 'សំណើមដី', pin: 'V1', value: 92, unit: '%', color: '#06b6d4', widthCols: 1 },
      { id: 'w_temp', type: 'gauge', title: 'Atmospheric Temp', titleKhmer: 'សីតុណ្ហភាពបរិយាកាស', pin: 'V2', min: 0, max: 60, unit: '°C', color: '#f97316', widthCols: 1 },
      { id: 'w_light', type: 'label', title: 'Ambient Light', titleKhmer: 'ពន្លឺបរិយាកាស', pin: 'V4', value: 6, unit: 'lx', color: '#eab308', widthCols: 1 },
      { id: 'w_auto', type: 'switch', title: 'Auto Mode', titleKhmer: 'មុខងារស្វ័យប្រវត្តិ', pin: 'V3', color: '#3b82f6', widthCols: 1 },
    ];
  };

  const [deviceWidgets, setDeviceWidgets] = useState<DashboardWidget[]>(() => {
    if (!device) return [];
    const saved = localStorage.getItem(`blynk_widgets_${device.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return getDefaultWidgetsForDevice(device);
  });

  useEffect(() => {
    if (device) {
      const saved = localStorage.getItem(`blynk_widgets_${device.id}`);
      if (saved) {
        try {
          setDeviceWidgets(JSON.parse(saved));
          return;
        } catch (e) {}
      }
      setDeviceWidgets(getDefaultWidgetsForDevice(device));
    }
  }, [device?.id, device?.templateId]);

  const handleSaveWidgets = (newWidgets: DashboardWidget[]) => {
    if (!device) return;
    setDeviceWidgets(newWidgets);
    localStorage.setItem(`blynk_widgets_${device.id}`, JSON.stringify(newWidgets));
    setIsEditingLayout(false);
  };

  if (!device) {
    return (
      <div className="p-12 text-center text-slate-500">
        <Cpu className="w-12 h-12 mx-auto mb-3 text-slate-400 dark:text-slate-600 animate-pulse" />
        <p className="text-base font-bold">{lang === 'km' ? 'សូមជ្រើសរើសឧបករណ៍ IoT...' : 'No active device selected...'}</p>
      </div>
    );
  }

  const copyToken = () => {
    navigator.clipboard.writeText(device.authToken);
    setCopiedToken(true);
    confetti({ particleCount: 20, spread: 45, origin: { y: 0.15 } });
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const timeFilterOptions: { key: TimeFilter; label: string; labelKhmer: string }[] = [
    { key: 'live', label: 'Live', labelKhmer: 'ផ្ទាល់' },
    { key: '1h', label: '1h', labelKhmer: '១ ម៉ោង' },
    { key: '6h', label: '6h', labelKhmer: '៦ ម៉ោង' },
    { key: '1d', label: '1d', labelKhmer: '១ ថ្ងៃ' },
    { key: '1w', label: '1w', labelKhmer: '១ សប្តាហ៍' },
  ];

  return (
    <div id="blynk-dashboard-view" className="space-y-4">
      {/* Blynk Device Navigation & Meta Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-xl transition-colors duration-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Cube Icon, Name, Token Pill, Owner, Org */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Green 3D Cube (Blynk Trademark) */}
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm shrink-0">
              <Box className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-sans">
                  {lang === 'km' && device.nameKhmer ? device.nameKhmer : device.name}
                </h1>

                {/* Status Badge */}
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{lang === 'km' ? 'ដំណើរការ (Online)' : 'Online'}</span>
                </span>
              </div>

              {/* Pills Bar: Auth Token, Owner, Organization */}
              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 dark:text-slate-400">
                {/* Auth Token Pill */}
                <button
                  onClick={copyToken}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 transition"
                  title="Click to Copy Auth Token"
                >
                  <span>Token: ••••-{device.authToken.slice(-4)}</span>
                  {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                </button>

                {/* Owner Pill */}
                <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{device.owner.split('@')[0]}</span>
                </span>

                {/* Org Pill */}
                <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>{device.orgId}</span>
                </span>

                {/* Local IP Address & Save Pill */}
                <div className="flex items-center gap-1.5 bg-cyan-50 dark:bg-cyan-950/40 px-2 py-0.5 rounded-xl border border-cyan-300 dark:border-cyan-500/30 text-xs">
                  <Wifi className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span className="text-[11px] font-semibold text-cyan-800 dark:text-cyan-300">ESP32 IP:</span>
                  <input
                    type="text"
                    value={dashboardIp}
                    onChange={(e) => {
                      setDashboardIp(e.target.value);
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('sps_peh_chip_ip', e.target.value);
                      }
                    }}
                    placeholder="192.168.0.169"
                    className="bg-white dark:bg-slate-950 border border-cyan-400/50 dark:border-cyan-500/50 px-2 py-0.5 rounded-lg text-cyan-700 dark:text-cyan-300 font-mono font-bold text-[11px] w-28 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveIp(dashboardIp)}
                    className="px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-[10px] font-bold flex items-center gap-1 shadow-sm cursor-pointer transition"
                    title="Save IP Address"
                  >
                    <Save className="w-3 h-3" />
                    <span>{lang === 'km' ? 'រក្សាទុក' : 'Save'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleTestPing}
                    disabled={isPinging}
                    className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[10px] font-bold flex items-center gap-1 shadow-sm cursor-pointer transition disabled:opacity-50"
                    title="Ping & Test Direct IP"
                  >
                    <RefreshCw className={`w-3 h-3 ${isPinging ? 'animate-spin' : ''}`} />
                    <span>{isPinging ? (lang === 'km' ? 'តេស្ត...' : 'Ping...') : (lang === 'km' ? 'តេស្ត IP' : 'Ping')}</span>
                  </button>
                  {pingResult && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pingResult.ok ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'}`}>
                      {pingResult.message}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Actions Bar (Edit layout, Info, Notification, Export) */}
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
            <button
              onClick={() => setIsEditingLayout(!isEditingLayout)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                isEditingLayout
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>{isEditingLayout ? (lang === 'km' ? 'បញ្ចប់ការកែសម្រួល' : 'Finish Edit') : (lang === 'km' ? 'រៀបចំ Widget' : 'Edit Dashboard')}</span>
            </button>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
              <button className="p-1.5 hover:text-slate-900 dark:hover:text-white transition" title="Device Information">
                <Info className="w-4 h-4" />
              </button>
              <button className="p-1.5 hover:text-slate-900 dark:hover:text-white transition" title="Notifications">
                <Bell className="w-4 h-4" />
              </button>
              <button className="p-1.5 hover:text-slate-900 dark:hover:text-white transition" title="Export Data">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Time Filters Bar */}
        <div className="flex items-center justify-between gap-3 pt-3 mt-3 border-t border-slate-200 dark:border-slate-800/80 overflow-x-auto">
          <div className="flex items-center gap-1 text-xs">
            {timeFilterOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => onTimeFilterChange(opt.key)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  timeFilter === opt.key
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/50'
                }`}
              >
                <span>{lang === 'km' ? opt.labelKhmer : opt.label}</span>
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono font-semibold flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>2000ms Sync</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BLYNK EDIT MODE (When isEditingLayout is true)                            */}
      {/* ========================================================================= */}
      {isEditingLayout ? (
        <BlynkDashboardEditor
          device={device}
          widgets={deviceWidgets}
          onSaveWidgets={handleSaveWidgets}
          onClose={() => setIsEditingLayout(false)}
          onUpdatePin={onUpdatePin}
          lang={lang}
        />
      ) : (
        <>
          {/* ========================================================================= */}
          {/* TEMPLATE 1: ALERT SYSTEM                                                  */}
          {/* ========================================================================= */}
          {device.templateId === 'TMPL_ALERT_SYSTEM' && (
            <div className="space-y-4">
              {/* Top 3 Sensor Cards: Picture 2 Dome Gauges (CO Level & Air Pressure) + Picture 3 Water Tank */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between relative min-h-[220px]">
                  <RadialGauge
                    id="gauge-co-level"
                    value={Number(device.pins.V0?.value ?? 465)}
                    min={0}
                    max={500}
                    unit="ppm"
                    label="CO Level"
                    labelKhmer="កម្រិតឧស្ម័ន CO"
                    color="#ff6b6b"
                    size={260}
                    statusText="DANGER / គ្រោះថ្នាក់"
                    statusColor="#ef4444"
                  />
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between relative min-h-[220px]">
                  <RadialGauge
                    id="gauge-air-pressure"
                    value={Number(device.pins.V1?.value ?? 102.09)}
                    min={0}
                    max={120}
                    unit="kPa"
                    label="Air Pressure"
                    labelKhmer="សម្ពាធបរិយាកាស"
                    color="#34d399"
                    size={260}
                    statusText="NORMAL / ធម្មតា"
                    statusColor="#10b981"
                  />
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between relative min-h-[220px]">
                  <WaterTankLevel
                    id="tank-water-level"
                    value={Number(device.pins.V2?.value ?? 78)}
                    min={0}
                    max={100}
                    unit="%"
                    label="Water Level"
                    labelKhmer="កម្រិតទឹកក្នុងអាង"
                    totalCapacityLiters={2000}
                    highAlarmThreshold={85}
                    lang={lang}
                  />
                </div>
              </div>

              {/* Middle Actuator Row with Tactile Smart Switches & Speed Slider */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SmartSwitch
                  id="switch-siren-alert"
                  title="Siren Alert"
                  titleKhmer="ស៊ីរ៉ែនប្រកាសអាសន្ន"
                  subtitle="Pin V6 • High-Decibel Buzzer"
                  pinLabel="V6"
                  isOn={Number(device.pins.V6?.value) === 1}
                  onToggle={() => onUpdatePin('V6', Number(device.pins.V6?.value) === 1 ? 0 : 1)}
                  variant="siren"
                  lang={lang}
                />

                <SmartSwitch
                  id="switch-strobe-light"
                  title="Strobe Light"
                  titleKhmer="ភ្លើងសញ្ញាស៊ីញ៉ូ"
                  subtitle="Pin V3 • Flashing Warning LED"
                  pinLabel="V3"
                  isOn={Number(device.pins.V3?.value) === 1}
                  onToggle={() => onUpdatePin('V3', Number(device.pins.V3?.value) === 1 ? 0 : 1)}
                  variant="light"
                  lang={lang}
                />

                {/* Slider: Fan Speed (V4) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                        {lang === 'km' ? 'ល្បឿនកង្ហារ (Exhaust Fan)' : 'Exhaust Fan Speed'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">PWM Pin V4 • 0 - 100%</p>
                    </div>
                    <span className="text-base sm:text-lg font-extrabold text-cyan-600 dark:text-cyan-400 font-mono">
                      {device.pins.V4?.value || 80}%
                    </span>
                  </div>

                  <div className="space-y-2 mt-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Number(device.pins.V4?.value || 80)}
                      onChange={(e) => onUpdatePin('V4', Number(e.target.value))}
                      className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>0% (OFF)</span>
                      <span>50%</span>
                      <span>100% (MAX)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Communication Channels: Telegram, Email, VoIP Call */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SmartSwitch
                  id="switch-telegram-alert"
                  title="Telegram Alert"
                  titleKhmer="ការជូនដំណឹង Telegram"
                  subtitle="Bot Channel @blynk_alert_kh"
                  pinLabel="V7"
                  isOn={Number(device.pins.V7?.value ?? 1) === 1}
                  onToggle={() => onUpdatePin('V7', Number(device.pins.V7?.value ?? 1) === 1 ? 0 : 1)}
                  variant="telegram"
                  lang={lang}
                />

                <SmartSwitch
                  id="switch-email-alert"
                  title="Email Dispatch"
                  titleKhmer="ការជូនដំណឹង Email"
                  subtitle="SMTP Notification Service"
                  pinLabel="V8"
                  isOn={Number(device.pins.V8?.value ?? 1) === 1}
                  onToggle={() => onUpdatePin('V8', Number(device.pins.V8?.value ?? 1) === 1 ? 0 : 1)}
                  variant="email"
                  lang={lang}
                />

                <SmartSwitch
                  id="switch-call-alert"
                  title="Phone Call Alert"
                  titleKhmer="ទូរស័ព្ទអាសន្ន (VoIP)"
                  subtitle="Automated Voice Broadcast"
                  pinLabel="V9"
                  isOn={Number(device.pins.V9?.value ?? 0) === 1}
                  onToggle={() => onUpdatePin('V9', Number(device.pins.V9?.value ?? 0) === 1 ? 0 : 1)}
                  variant="call"
                  lang={lang}
                />
              </div>

              {/* Real-Time Telemetry Chart */}
              <TelemetryChart
                data={telemetryData}
                currentFilter={timeFilter}
                onFilterChange={onTimeFilterChange}
                lang={lang}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* TEMPLATE 2: TRAFFIC LIGHT & PARKING                                       */}
          {/* ========================================================================= */}
          {device.templateId === 'TMPL_TRAFFIC_PARKING' && (
            <div className="space-y-4">
              {/* Traffic Metrics Cards: Lamp, Parking, Road A, Road B, Street Light */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Lamp Switch */}
                <SmartSwitch
                  id="switch-traffic-lamp"
                  title="Lamp / Traffic Light"
                  titleKhmer="អំពូលភ្លើង (Lamp)"
                  subtitle="Pin V0 • Traffic Controller"
                  pinLabel="V0"
                  isOn={Number(device.pins.V0?.value ?? 1) === 1}
                  onToggle={() => onUpdatePin('V0', Number(device.pins.V0?.value ?? 1) === 1 ? 0 : 1)}
                  variant="light"
                  lang={lang}
                />

                {/* 2. Street Light Switch */}
                <SmartSwitch
                  id="switch-traffic-street"
                  title="Street Light"
                  titleKhmer="ភ្លើងបំភ្លឺផ្លូវ (Street Light)"
                  subtitle="Pin V4 • Solar Highway LED"
                  pinLabel="V4"
                  isOn={Number(device.pins.V4?.value ?? 1) === 1}
                  onToggle={() => onUpdatePin('V4', Number(device.pins.V4?.value ?? 1) === 1 ? 0 : 1)}
                  variant="light"
                  lang={lang}
                />

                {/* 3. Parking Count (Big Label) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {lang === 'km' ? 'ចំណតយានយន្ត' : 'Parking Count'}
                    </span>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-800">
                      V1
                    </span>
                  </div>
                  <div className="my-3 flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                      {device.pins.V1?.value ?? 67}
                    </span>
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                      {lang === 'km' ? 'កន្លែងទំនេរ' : 'Bays'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                    <span>{lang === 'km' ? 'សមត្ថភាពសរុប: ១០០' : 'Capacity: 100'}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">67% Available</span>
                  </div>
                </div>

                {/* 4. Road A Car (Big Label) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {lang === 'km' ? 'រថយន្តលើផ្លូវ A' : 'Road A Flow'}
                    </span>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-950 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-800">
                      V2
                    </span>
                  </div>
                  <div className="my-3 flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">
                      {device.pins.V2?.value ?? 92}
                    </span>
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Cars/min</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-blue-600 dark:text-blue-400 font-bold">
                    {lang === 'km' ? 'ចរាចរណ៍មធ្យម' : 'Normal Flow'}
                  </div>
                </div>

                {/* 5. Road B Car (Big Label) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {lang === 'km' ? 'រថយន្តលើផ្លូវ B' : 'Road B Flow'}
                    </span>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-950 text-purple-600 dark:text-purple-400 border border-slate-200 dark:border-slate-800">
                      V3
                    </span>
                  </div>
                  <div className="my-3 flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-purple-600 dark:text-purple-400 font-mono tracking-tight">
                      {device.pins.V3?.value ?? 13}
                    </span>
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Cars/min</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-purple-600 dark:text-purple-400 font-bold">
                    {lang === 'km' ? 'ចរាចរណ៍ស្រួល' : 'Free Flow'}
                  </div>
                </div>

                {/* 6. Auto Signal Control Switch */}
                <SmartSwitch
                  id="switch-traffic-auto"
                  title="Auto Traffic Mode"
                  titleKhmer="ប្រព័ន្ធស្វ័យប្រវត្តិ (Auto Mode)"
                  subtitle="AI Adaptive Flow Timing"
                  pinLabel="V6"
                  isOn={Number(device.pins.V6?.value ?? 1) === 1}
                  onToggle={() => onUpdatePin('V6', Number(device.pins.V6?.value ?? 1) === 1 ? 0 : 1)}
                  variant="auto"
                  lang={lang}
                />
              </div>

              {/* Traffic Flow Telemetry Chart */}
              <TelemetryChart
                data={telemetryData}
                currentFilter={timeFilter}
                onFilterChange={onTimeFilterChange}
                lang={lang}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* TEMPLATE 3: SMART BIN                                                     */}
          {/* ========================================================================= */}
          {device.templateId === 'TMPL_SMART_BIN' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Trash Fill Gauge */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between min-h-[220px]">
                  <RadialGauge
                    id="gauge-bin-fill"
                    value={Number(device.pins.V1?.value ?? 68)}
                    min={0}
                    max={100}
                    unit="%"
                    label="Fill Level"
                    labelKhmer="កម្រិតពេញនៃធុងសំរាម"
                    color="#f59e0b"
                    size={260}
                    statusText="68% FULL"
                    statusColor="#f59e0b"
                  />
                </div>

                {/* Trash Lid Smart Switch */}
                <SmartSwitch
                  id="switch-bin-lid"
                  title="Open Trash Lid"
                  titleKhmer="បញ្ជាគម្របធុងសំរាម (Servo)"
                  subtitle="Pin V0 • Smart Servo Latch"
                  pinLabel="V0"
                  isOn={Number(device.pins.V0?.value ?? 0) === 1}
                  onToggle={() => onUpdatePin('V0', Number(device.pins.V0?.value ?? 0) === 1 ? 0 : 1)}
                  variant="trash"
                  lang={lang}
                />

                {/* UV Disinfection Switch */}
                <SmartSwitch
                  id="switch-bin-uv"
                  title="UV-C Disinfection Lamp"
                  titleKhmer="អំពូលកម្ចាត់មេរោគ (UV-C)"
                  subtitle="Pin V3 • Sterilization Bulb"
                  pinLabel="V3"
                  isOn={Number(device.pins.V3?.value ?? 1) === 1}
                  onToggle={() => onUpdatePin('V3', Number(device.pins.V3?.value ?? 1) === 1 ? 0 : 1)}
                  variant="light"
                  lang={lang}
                />
              </div>

              {/* Telemetry */}
              <TelemetryChart
                data={telemetryData}
                currentFilter={timeFilter}
                onFilterChange={onTimeFilterChange}
                lang={lang}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* TEMPLATE 5: SMART LAMP (PIN 12) & MQ135 (PIN 14) ON ESP32-CAM             */}
          {/* ========================================================================= */}
          {device.templateId === 'TMPL_SMART_LAMP_MQ135' && (
            <div className="space-y-6">
              {/* Only 2 Clean Focused Panels as Requested */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Panel 1: Golden Rocker Switch for Smart Lamp on Pin 12 */}
                <GoldenRockerSwitch
                  id="switch-smart-lamp-golden"
                  isOn={Number(device.pins.V0?.value ?? 1) === 1}
                  onToggle={() => {
                    const nextVal = Number(device.pins.V0?.value ?? 1) === 1 ? 0 : 1;
                    // Instant LAN Dispatch if local IP exists
                    const savedIp = typeof window !== 'undefined' ? (localStorage.getItem('sps_peh_chip_ip') || '192.168.0.169') : null;
                    if (savedIp) {
                      try {
                        const ifr = (document.getElementById('esp_hidden_sender') as HTMLIFrameElement) || document.createElement('iframe');
                        ifr.id = 'esp_hidden_sender';
                        ifr.style.display = 'none';
                        if (!document.body.contains(ifr)) document.body.appendChild(ifr);
                        ifr.src = `http://${savedIp}/${nextVal === 1 ? 'on' : 'off'}?t=${Date.now()}`;
                        fetch(`http://${savedIp}/control?pin=v0&val=${nextVal}`, { mode: 'no-cors' }).catch(() => {});
                      } catch (e) {}
                    }
                    onUpdatePin('V0', nextVal);
                  }}
                  lang={lang}
                  gpioPin={12}
                  virtualPin="V0"
                />

                {/* Panel 2: MQ135 Air Quality Sensor on Pin 14 */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm dark:shadow-2xl flex flex-col justify-between relative min-h-[340px] hover:border-emerald-500/40 transition-all duration-300">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 dark:text-slate-500 font-bold mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                      ESP32-CAM GPIO 14 (ADC)
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                      Blynk V1
                    </span>
                  </div>

                  <div className="flex-1 flex items-center justify-center py-2">
                    <RadialGauge
                      id="gauge-mq135-air"
                      value={Number(device.pins.V1?.value ?? 185)}
                      min={0}
                      max={1000}
                      unit="ppm"
                      label="MQ135 Gas & Air Quality"
                      labelKhmer="គុណភាពខ្យល់ & ឧស្ម័ន MQ135"
                      color={Number(device.pins.V1?.value ?? 185) > 400 ? '#ef4444' : '#10b981'}
                      size={260}
                      statusText={Number(device.pins.V1?.value ?? 185) > 400 ? 'HAZARD POLLUTION / ផ្សែងពុល' : 'CLEAN AIR / ខ្យល់ល្អបរិសុទ្ធ'}
                      statusColor={Number(device.pins.V1?.value ?? 185) > 400 ? '#ef4444' : '#10b981'}
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium">
                      {lang === 'km' ? 'កម្រិតសុវត្ថិភាព:' : 'Safety Threshold:'} &lt; 400 ppm
                    </span>
                    <span className={`font-bold px-2.5 py-0.5 rounded-full ${
                      Number(device.pins.V1?.value ?? 185) > 400
                        ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                        : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                    }`}>
                      {Number(device.pins.V1?.value ?? 185) > 400 ? 'ALARM ACTIVE' : 'NORMAL (SAFE)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TEMPLATE 6: ESP32-C3 SMART BIN & DUAL WALL SWITCH (SGT)                   */}
          {/* ========================================================================= */}
          {device.templateId === 'TMPL_ESP32C3_SMART_BIN_DUAL' && (
            <C3SmartBinDualPanel
              device={device}
              lang={lang}
              onUpdatePin={onUpdatePin}
              dashboardIp={dashboardIp}
            />
          )}

          {/* ========================================================================= */}
          {/* TEMPLATE 4: SMART FARM / ESP32-CAM / DEFAULT TEMPLATE                     */}
          {/* ========================================================================= */}
          {(!device.templateId || (
            device.templateId !== 'TMPL_ALERT_SYSTEM' &&
            device.templateId !== 'TMPL_TRAFFIC_PARKING' &&
            device.templateId !== 'TMPL_SMART_BIN' &&
            device.templateId !== 'TMPL_SMART_LAMP_MQ135' &&
            device.templateId !== 'TMPL_ESP32C3_SMART_BIN_DUAL'
          )) && (
            <div className="space-y-4">
              {/* Top Gauges & Telemetry Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Temperature Gauge */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between min-h-[220px]">
                  <RadialGauge
                    id="gauge-farm-temp"
                    value={Number(device.pins.V0?.value ?? 29.4)}
                    min={15}
                    max={45}
                    unit="°C"
                    label="Atmospheric Temp"
                    labelKhmer="សីតុណ្ហភាពបរិយាកាស"
                    color="#f97316"
                    size={260}
                    statusText="OPTIMAL / ល្អប្រសើរ"
                    statusColor="#10b981"
                  />
                </div>

                {/* Soil Moisture Gauge */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between min-h-[220px]">
                  <RadialGauge
                    id="gauge-farm-soil"
                    value={Number(device.pins.V1?.value ?? 92)}
                    min={0}
                    max={100}
                    unit="%"
                    label="Soil Moisture"
                    labelKhmer="សំណើមដី (Soil Moisture)"
                    color="#10b981"
                    size={260}
                    statusText="92% WET / សើមគ្រប់គ្រាន់"
                    statusColor="#10b981"
                  />
                </div>

                {/* Ambient Light Label Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {lang === 'km' ? 'កម្រិតពន្លឺព្រះអាទិត្យ' : 'Ambient Light'}
                    </span>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-950 text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-800">
                      V4
                    </span>
                  </div>
                  <div className="my-3 flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-amber-500 dark:text-amber-400 font-mono tracking-tight">
                      {device.pins.V4?.value ?? 680}
                    </span>
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Lux</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                    <span>{lang === 'km' ? 'ពេលថ្ងៃ' : 'Daylight Condition'}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">Good Light</span>
                  </div>
                </div>
              </div>

              {/* Actuators Row: Water Pump, Auto Mode, Grow Light */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SmartSwitch
                  id="switch-farm-pump"
                  title="Water Pump Actuator"
                  titleKhmer="ម៉ូទ័របូមទឹកកសិកម្ម"
                  subtitle="Pin V0 • High Pressure Solenoid"
                  pinLabel="V0"
                  isOn={Number(device.pins.V0?.value ?? 0) === 1}
                  onToggle={() => onUpdatePin('V0', Number(device.pins.V0?.value ?? 0) === 1 ? 0 : 1)}
                  variant="pump"
                  lang={lang}
                />

                <SmartSwitch
                  id="switch-farm-auto"
                  title="Auto Irrigation Mode"
                  titleKhmer="មុខងារស្រោចទឹកស្វ័យប្រវត្តិ"
                  subtitle="Pin V3 • Sensor-Driven Trigger"
                  pinLabel="V3"
                  isOn={Number(device.pins.V3?.value ?? 1) === 1}
                  onToggle={() => onUpdatePin('V3', Number(device.pins.V3?.value ?? 1) === 1 ? 0 : 1)}
                  variant="auto"
                  lang={lang}
                />

                <SmartSwitch
                  id="switch-farm-light"
                  title="Grow Light / Lamp"
                  titleKhmer="អំពូលភ្លើងជំនួយពន្លឺ"
                  subtitle="Pin V5 • Photosynthesis Spectrum"
                  pinLabel="V5"
                  isOn={Number(device.pins.V5?.value ?? 1) === 1}
                  onToggle={() => onUpdatePin('V5', Number(device.pins.V5?.value ?? 1) === 1 ? 0 : 1)}
                  variant="light"
                  lang={lang}
                />
              </div>

              {/* Live Telemetry History Chart */}
              <TelemetryChart
                data={telemetryData}
                currentFilter={timeFilter}
                onFilterChange={onTimeFilterChange}
                lang={lang}
              />
            </div>
          )}
        </>
      )}

      {/* Toast Notification when IP is saved */}
      {ipSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-emerald-300 border border-emerald-500/50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold font-sans animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{ipSavedToast}</span>
        </div>
      )}
    </div>
  );
};
