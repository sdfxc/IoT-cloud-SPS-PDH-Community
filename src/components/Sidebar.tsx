import React from 'react';
import { NavigationTab } from '../types';
import {
  LayoutDashboard,
  Cpu,
  LineChart,
  Zap,
  Terminal,
  Code2,
  Sliders,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Server
} from 'lucide-react';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  lang: 'km' | 'en';
  activeDeviceCount: number;
  automationsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  lang,
  activeDeviceCount,
  automationsCount,
}) => {
  const navItems: {
    id: NavigationTab;
    label: string;
    labelKhmer: string;
    icon: React.ReactNode;
    badge?: string | number;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboards',
      labelKhmer: 'ផ្ទាំងគ្រប់គ្រង (Dashboard)',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'devices',
      label: 'Devices & Tokens',
      labelKhmer: 'ឧបករណ៍ & Auth Tokens',
      icon: <Cpu className="w-4 h-4" />,
      badge: activeDeviceCount,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    },
    {
      id: 'analytics',
      label: 'Analytics & Charts',
      labelKhmer: 'វិភាគទិន្នន័យ (Analytics)',
      icon: <LineChart className="w-4 h-4" />,
    },
    {
      id: 'automations',
      label: 'Automations',
      labelKhmer: 'ក្បួនស្វ័យប្រវត្ត (Rules)',
      icon: <Zap className="w-4 h-4" />,
      badge: automationsCount,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'logs',
      label: 'Device Logs & Serial',
      labelKhmer: 'កំណត់ត្រាទិន្នន័យ (Logs)',
      icon: <Terminal className="w-4 h-4" />,
      badge: 'LIVE',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    },
    {
      id: 'firmware',
      label: 'ESP32 Firmware C++',
      labelKhmer: 'កូដ ESP32 Arduino C++',
      icon: <Code2 className="w-4 h-4 text-emerald-400" />,
      badge: 'PRO',
      badgeColor: 'bg-emerald-500 text-slate-950 font-bold',
    },
    {
      id: 'simulator',
      label: 'ESP32 Virtual Lab',
      labelKhmer: 'បន្ទប់ពិសោធន៍ ESP32',
      icon: <Sliders className="w-4 h-4" />,
    }
  ];

  return (
    <aside id="sidebar-navigation" className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-40 select-none">
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/30">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-white tracking-wide">BLYNK.CLOUD</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">IoT Console & ESP32 Hub</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            {lang === 'km' ? 'ម៉ឺនុយចម្បង (Console Menu)' : 'Console Navigation'}
          </div>

          {navItems.map(item => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`${isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {item.icon}
                  </span>
                  <span>{lang === 'km' ? item.labelKhmer : item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="p-3 m-3 bg-slate-900/90 rounded-xl border border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cloud REST Engine</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
            HTTP 200
          </span>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          {lang === 'km'
            ? 'គាំទ្រ ESP32, ESP8266, Arduino ភ្ជាប់តាមរយៈ Blynk REST API ឬ MQTT'
            : 'Supports ESP32, ESP8266, Arduino via REST API & Blynk Token'}
        </p>

        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> TLS / SSL Secured
          </span>
          <span className="font-mono">v2.4-KH</span>
        </div>
      </div>
    </aside>
  );
};
