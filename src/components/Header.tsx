// src/components/Header.tsx

import { Zap, Bell, Settings, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import type { InverterData, Alert } from '../types';

interface HeaderProps {
  data: InverterData;
  alerts: Alert[];
  onBellClick?: () => void;
  onSettingsClick?: () => void;
}

export function Header({ data, alerts, onBellClick, onSettingsClick }: HeaderProps) {
  const unackCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between px-6 py-4 border-b border-white/10"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
          <Zap className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">逆变器监控中心</h1>
          <p className="text-gray-400 text-sm flex items-center gap-2">
            <Clock className="w-3 h-3" />
            {new Date().toLocaleString('zh-CN')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${
          data.status === 'normal' ? 'bg-green-500/20 text-green-400' : 
          data.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' : 
          'bg-red-500/20 text-red-400'
        }`}>
          <span className={`w-2 h-2 rounded-full animate-pulse ${
            data.status === 'normal' ? 'bg-green-400' : 
            data.status === 'warning' ? 'bg-yellow-400' : 
            'bg-red-400'
          }`} />
          {data.status === 'normal' ? '系统正常' : data.status === 'warning' ? '注意' : '异常'}
        </div>

        <div className="text-sm text-gray-400">
          设备温度: <span className="text-white font-medium">{data.temperature.toFixed(1)}°C</span>
        </div>

        <button 
          onClick={onBellClick}
          className="relative p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          title="查看告警"
        >
          <Bell className="w-5 h-5 text-gray-400" />
          {unackCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
              {unackCount}
            </span>
          )}
        </button>

        <button 
          onClick={onSettingsClick}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          title="系统设置"
        >
          <Settings className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </motion.header>
  );
}
