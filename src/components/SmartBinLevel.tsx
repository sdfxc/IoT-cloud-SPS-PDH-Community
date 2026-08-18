import React from 'react';
import { Trash2 } from 'lucide-react';

interface SmartBinLevelProps {
  id: string;
  wetValue: number; // 0 to 100
  dryValue: number; // 0 to 100
  label?: string;
  labelKhmer?: string;
  lang?: 'km' | 'en';
}

export const SmartBinLevel: React.FC<SmartBinLevelProps> = ({
  id,
  wetValue,
  dryValue,
  label = 'Smart Bin Level',
  labelKhmer = 'កម្រិតសំរាម',
  lang = 'en'
}) => {
  // Convert percentage to CM assuming Full = 5cm, Empty = 20cm
  const pctToCm = (pct: number) => {
    return (20 - (pct / 100) * 15).toFixed(1);
  };

  const wetCm = pctToCm(wetValue);
  const dryCm = pctToCm(dryValue);

  return (
    <div className="flex flex-col h-full items-center justify-between py-2">
      {/* Header */}
      <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2 mb-6">
        <Trash2 className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600 dark:text-emerald-500" />
        {lang === 'km' && labelKhmer ? labelKhmer : label}
      </h3>

      <div className="flex items-end justify-center gap-8 md:gap-12 w-full max-w-sm px-4">
        
        {/* Wet Bin (Left) */}
        <div className="flex flex-col items-center">
          <div className="relative w-28 h-40 sm:w-32 sm:h-48 border-4 sm:border-[5px] border-slate-700 dark:border-slate-300 rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-inner">
            {/* Fill Level */}
            <div 
              className="absolute bottom-0 left-0 right-0 bg-emerald-500 dark:bg-emerald-500 transition-all duration-700 ease-out"
              style={{ height: `${Math.max(5, wetValue)}%` }}
            />
          </div>
          
          {/* Stats below bin */}
          <div className="mt-4 sm:mt-5 text-center">
            <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-1">
              {Math.round(wetValue)}% Full
            </h4>
            <p className="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-400">
              Distance: <span className="text-sky-500">{wetCm}</span> cm
            </p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1 uppercase font-bold">
              {lang === 'km' ? 'សំរាមសើម' : 'Wet Trash'}
            </p>
          </div>
        </div>

        {/* Dry Bin (Right) */}
        <div className="flex flex-col items-center">
          <div className="relative w-28 h-40 sm:w-32 sm:h-48 border-4 sm:border-[5px] border-slate-700 dark:border-slate-300 rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-inner">
            {/* Fill Level */}
            <div 
              className="absolute bottom-0 left-0 right-0 bg-emerald-500 dark:bg-emerald-500 transition-all duration-700 ease-out"
              style={{ height: `${Math.max(5, dryValue)}%` }}
            />
          </div>
          
          {/* Stats below bin */}
          <div className="mt-4 sm:mt-5 text-center">
            <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-1">
              {Math.round(dryValue)}% Full
            </h4>
            <p className="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-400">
              Distance: <span className="text-sky-500">{dryCm}</span> cm
            </p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1 uppercase font-bold">
              {lang === 'km' ? 'សំរាមស្ងួត' : 'Dry Trash'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Legend Footer */}
      <p className="mt-6 text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 font-medium">
        (Empty: 20cm = 0%  •  Full: 5cm = 100%)
      </p>
    </div>
  );
};
