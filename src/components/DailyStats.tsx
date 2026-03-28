// src/components/DailyStats.tsx

import { Sun, Plug, TrendingDown, DollarSign, Activity } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DailyStats as DailyStatsType } from '../types';

interface DailyStatsProps {
  stats: DailyStatsType;
}

const StatItem = ({ icon: Icon, label, value, unit, color }: { icon: LucideIcon; label: string; value: number; unit: string; color: string }) => (
  <div className="flex items-center gap-3 px-4 py-2">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <div className="text-gray-400 text-xs">{label}</div>
      <div className="text-lg font-bold text-white">
        {typeof value === 'number' ? value.toFixed(1) : value}
        <span className="text-sm text-gray-500 ml-1">{unit}</span>
      </div>
    </div>
  </div>
);

export function DailyStats({ stats }: DailyStatsProps) {
  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="text-lg font-semibold mb-4 px-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-blue-400" />
        今日统计
      </h3>
      <div className="flex flex-wrap items-center">
        <StatItem icon={Sun} label="光伏发电" value={stats.solarGenerated} unit="kWh" color="bg-yellow-500/80" />
        <StatItem icon={Plug} label="电网购电" value={stats.gridImport} unit="kWh" color="bg-red-500/80" />
        <StatItem icon={TrendingDown} label="电网卖电" value={stats.gridExport} unit="kWh" color="bg-green-500/80" />
        <StatItem icon={DollarSign} label="今日收益" value={stats.savings} unit="¥" color="bg-emerald-500/80" />
        <StatItem icon={Activity} label="CO₂减排" value={stats.co2Saved} unit="kg" color="bg-blue-500/80" />
      </div>
    </div>
  );
}
