// src/components/BatteryGauge.tsx

import { motion } from 'framer-motion';
import { Battery, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { BatteryData } from '../types';

interface BatteryGaugeProps {
  data: BatteryData;
  size?: 'normal' | 'large';
}

export function BatteryGauge({ data, size = 'normal' }: BatteryGaugeProps) {
  const soc = data.soc;
  const circumference = 2 * Math.PI * (size === 'large' ? 150 : 100);
  const strokeDashoffset = circumference - (soc / 100) * circumference;
  const radius = size === 'large' ? 150 : 100;
  const center = size === 'large' ? 160 : 110;
  const svgSize = size === 'large' ? 320 : 220;

  const getColor = () => {
    if (soc > 60) return { main: '#22c55e', glow: 'rgba(34, 197, 94, 0.3)' };
    if (soc > 30) return { main: '#eab308', glow: 'rgba(234, 179, 8, 0.3)' };
    return { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.3)' };
  };
  const color = getColor();

  const statusText = data.status === 'charging' ? '充电中' : data.status === 'discharging' ? '放电中' : '待机';
  const StatusIcon = data.status === 'charging' ? TrendingUp : data.status === 'discharging' ? TrendingDown : Minus;
  const statusColor = data.status === 'charging' ? 'text-green-400' : data.status === 'discharging' ? 'text-orange-400' : 'text-gray-400';

  return (
    <div className={`glass rounded-2xl p-6 ${size === 'large' ? 'flex flex-col items-center' : ''}`}>
      {size === 'normal' && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Battery className="w-5 h-5 text-green-400" />
            电池系统
          </h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor} bg-white/5 flex items-center gap-1`}>
            <StatusIcon className="w-4 h-4" />
            {statusText}
          </div>
        </div>
      )}

      {size === 'large' && (
        <div className={`px-4 py-1.5 rounded-full text-sm font-medium ${statusColor} bg-white/5 flex items-center gap-1 mb-4`}>
          <StatusIcon className="w-4 h-4" />
          {statusText}
        </div>
      )}

      <div className={`relative ${size === 'large' ? 'w-80 h-80' : 'w-56 h-56'} flex-shrink-0`}>
        <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${svgSize} ${svgSize}`}>
          <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
          <motion.circle
            cx={center} cy={center} r={radius}
            fill="none"
            stroke={color.main}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 20px ${color.glow})` }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${size === 'large' ? 'text-7xl' : 'text-5xl'} font-bold`}
            style={{ color: color.main }}
          >
            {soc.toFixed(0)}%
          </motion.div>
          <div className="text-gray-400 text-sm mt-1">电量</div>
        </div>
      </div>

      {size === 'normal' && (
        <div className="grid grid-cols-3 gap-2 mt-4 w-full">
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <div className="text-gray-400 text-xs mb-1">电压</div>
            <div className="text-lg font-bold">{data.voltage.toFixed(1)}<span className="text-xs text-gray-500 ml-1">V</span></div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <div className="text-gray-400 text-xs mb-1">电流</div>
            <div className={`text-lg font-bold ${data.current > 0 ? 'text-green-400' : data.current < 0 ? 'text-orange-400' : ''}`}>
              {data.current > 0 ? '+' : ''}{data.current.toFixed(1)}<span className="text-xs text-gray-500 ml-1">A</span>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <div className="text-gray-400 text-xs mb-1">温度</div>
            <div className={`text-lg font-bold ${data.temperature > 40 ? 'text-red-400' : ''}`}>
              {data.temperature.toFixed(1)}<span className="text-xs text-gray-500 ml-1">°C</span>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <div className="text-gray-400 text-xs mb-1">健康度</div>
            <div className="text-lg font-bold text-green-400">{data.soh.toFixed(0)}%</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <div className="text-gray-400 text-xs mb-1">循环</div>
            <div className="text-lg font-bold">{data.cycles}<span className="text-xs text-gray-500 ml-1">次</span></div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <div className="text-gray-400 text-xs mb-1">状态</div>
            <div className={`text-lg font-bold ${data.soh > 80 ? 'text-green-400' : 'text-yellow-400'}`}>
              {data.soh > 80 ? '健康' : '良好'}
            </div>
          </div>
        </div>
      )}

      {size === 'large' && (
        <div className="grid grid-cols-4 gap-3 mt-6 w-full max-w-2xl">
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-gray-400 text-sm mb-1">电压</div>
            <div className="text-2xl font-bold">{data.voltage.toFixed(1)}<span className="text-sm text-gray-500 ml-1">V</span></div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-gray-400 text-sm mb-1">电流</div>
            <div className={`text-2xl font-bold ${data.current > 0 ? 'text-green-400' : data.current < 0 ? 'text-orange-400' : ''}`}>
              {data.current > 0 ? '+' : ''}{data.current.toFixed(1)}<span className="text-sm text-gray-500 ml-1">A</span>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-gray-400 text-sm mb-1">温度</div>
            <div className={`text-2xl font-bold ${data.temperature > 40 ? 'text-red-400' : ''}`}>
              {data.temperature.toFixed(1)}<span className="text-sm text-gray-500 ml-1">°C</span>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-gray-400 text-sm mb-1">健康度</div>
            <div className="text-2xl font-bold text-green-400">{data.soh.toFixed(0)}%</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-gray-400 text-sm mb-1">循环次数</div>
            <div className="text-2xl font-bold">{data.cycles}<span className="text-sm text-gray-500 ml-1">次</span></div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-gray-400 text-sm mb-1">额定容量</div>
            <div className="text-2xl font-bold">10<span className="text-sm text-gray-500 ml-1">kWh</span></div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-gray-400 text-sm mb-1">今日充电</div>
            <div className="text-2xl font-bold text-green-400">{data.todayCharge?.toFixed(1) || '0.0'}<span className="text-sm text-gray-500 ml-1">kWh</span></div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-gray-400 text-sm mb-1">今日放电</div>
            <div className="text-2xl font-bold text-orange-400">{data.todayDischarge?.toFixed(1) || '0.0'}<span className="text-sm text-gray-500 ml-1">kWh</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
