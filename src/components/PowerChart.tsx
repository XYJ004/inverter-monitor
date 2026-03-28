// src/components/PowerChart.tsx

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts';
import { Activity } from 'lucide-react';
import type { HistoryPoint } from '../types';

interface PowerChartProps {
  data: HistoryPoint[];
}

export function PowerChart({ data }: PowerChartProps) {
  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-blue-400" />
        功率趋势 (24小时)
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data.slice(-72)}>
          <defs>
            <linearGradient id="solarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FFB800" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#FFB800" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="time" stroke="#6b7280" fontSize={11} tickLine={false} />
          <YAxis stroke="#6b7280" fontSize={11} tickLine={false} tickFormatter={(v) => `${v/1000}k`} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.95)', 
              border: 'none', 
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
            }} 
            labelStyle={{ color: '#fff' }}
          />
          <Area type="monotone" dataKey="solar" stroke="#FFB800" fill="url(#solarGradient)" name="太阳能" strokeWidth={2} />
          <Area type="monotone" dataKey="load" stroke="#A855F7" fill="url(#loadGradient)" name="负载" strokeWidth={2} />
          <Line type="monotone" dataKey="grid" stroke="#3B82F6" name="电网" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-gray-400">太阳能</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-gray-400">负载</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-gray-400">电网</span>
        </div>
      </div>
    </div>
  );
}
