// src/pages/Dashboard.tsx

import { Sun, Plug, Home, Gauge } from 'lucide-react';
import { BatteryGauge } from '../components/BatteryGauge';
import { PowerCard } from '../components/PowerCard';
import { PowerChart } from '../components/PowerChart';
import { DailyStats } from '../components/DailyStats';
import type { InverterData, HistoryPoint, DailyStats as DailyStatsType } from '../types';

interface DashboardProps {
  data: InverterData;
  history: HistoryPoint[];
  stats: DailyStatsType;
}

export function Dashboard({ data, history, stats }: DashboardProps) {
  return (
    <div className="p-6 space-y-6">
      {/* 顶部功率卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <PowerCard 
          icon={Sun} 
          title="太阳能发电" 
          value={data.solar.power} 
          color="text-yellow-400" 
          bgColor="bg-yellow-500/10"
          trend={data.solar.power > 3000 ? 'up' : 'stable'} 
        />
        <PowerCard 
          icon={Plug} 
          title="电网功率" 
          value={data.grid.power} 
          subtitle={data.grid.power > 0 ? '购电中' : data.grid.power < 0 ? '卖电中' : '平衡'}
          color="text-blue-400" 
          bgColor="bg-blue-500/10"
          trend={data.grid.power > 0 ? 'up' : data.grid.power < 0 ? 'down' : 'stable'} 
        />
        <PowerCard 
          icon={Home} 
          title="负载功率" 
          value={data.load.power} 
          color="text-purple-400" 
          bgColor="bg-purple-500/10"
        />
        <PowerCard 
          icon={Gauge} 
          title="系统效率" 
          value={data.efficiency} 
          color="text-green-400" 
          bgColor="bg-green-500/10"
        />
      </div>

      {/* 电池 + 图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BatteryGauge data={data.battery} size="normal" />
        <PowerChart data={history} />
      </div>

      {/* 今日统计 */}
      <DailyStats stats={stats} />
    </div>
  );
}
