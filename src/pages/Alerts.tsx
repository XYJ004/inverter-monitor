// src/pages/Alerts.tsx

import { useState } from 'react';
import { 
  AlertTriangle, AlertCircle, CheckCircle, X, Bell, 
  Filter, ChevronDown, Clock, Zap, Battery, Thermometer
} from 'lucide-react';
import type { Alert } from '../types';

interface AlertsProps {
  alerts: Alert[];
}

type AlertFilter = 'all' | 'warning' | 'error' | 'info' | 'success';

// 模拟历史告警数据
const mockHistoryAlerts: Alert[] = [
  { id: 'h1', type: 'warning', title: '电池温度偏高', message: '当前温度38°C，建议检查散热系统', timestamp: new Date(Date.now() - 3600000).toISOString(), acknowledged: true },
  { id: 'h2', type: 'error', title: '电网电压异常', message: '电压波动超过10%，已切换到离网模式', timestamp: new Date(Date.now() - 7200000).toISOString(), acknowledged: true },
  { id: 'h3', type: 'info', title: '系统维护提醒', message: '距离上次维护已超过30天，建议安排巡检', timestamp: new Date(Date.now() - 86400000).toISOString(), acknowledged: true },
  { id: 'h4', type: 'success', title: '固件更新完成', message: '逆变器固件已更新至 v2.3.1', timestamp: new Date(Date.now() - 172800000).toISOString(), acknowledged: true },
  { id: 'h5', type: 'warning', title: 'SOC过低警告', message: '电池SOC降至15%，建议减少负载或充电', timestamp: new Date(Date.now() - 259200000).toISOString(), acknowledged: true },
  { id: 'h6', type: 'error', title: '通信中断', message: '与电网监测模块通信中断，请检查连接', timestamp: new Date(Date.now() - 345600000).toISOString(), acknowledged: true },
  { id: 'h7', type: 'info', title: '峰谷电价切换', message: '已切换至谷电时段充电模式', timestamp: new Date(Date.now() - 432000000).toISOString(), acknowledged: true },
  { id: 'h8', type: 'warning', title: '效率下降', message: '系统效率降至92%，建议清洁太阳能板', timestamp: new Date(Date.now() - 518400000).toISOString(), acknowledged: true },
];

export function Alerts({ alerts: currentAlerts }: AlertsProps) {
  const [filter, setFilter] = useState<AlertFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [historyAlerts] = useState<Alert[]>(mockHistoryAlerts);

  const allAlerts = [...currentAlerts, ...historyAlerts];
  
  const filteredAlerts = filter === 'all' 
    ? allAlerts 
    : allAlerts.filter(a => a.type === filter);

  const alertCounts = {
    all: allAlerts.length,
    warning: allAlerts.filter(a => a.type === 'warning').length,
    error: allAlerts.filter(a => a.type === 'error').length,
    info: allAlerts.filter(a => a.type === 'info').length,
    success: allAlerts.filter(a => a.type === 'success').length,
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-400" />;
      default: return <Bell className="w-5 h-5 text-blue-400" />;
    }
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'warning': return 'border-yellow-500/30 bg-yellow-500/10';
      case 'error': return 'border-red-500/30 bg-red-500/10';
      case 'success': return 'border-green-500/30 bg-green-500/10';
      default: return 'border-blue-500/30 bg-blue-500/10';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    return `${days}天前`;
  };

  const AlertCard = ({ alert }: { alert: Alert }) => (
    <div className={`glass rounded-xl p-4 border-l-4 ${getAlertColor(alert.type)} hover:bg-white/5 transition-colors`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-0.5">
          {getAlertIcon(alert.type)}
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium text-white truncate">{alert.title}</h4>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!alert.acknowledged && (
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                  未处理
                </span>
              )}
              <span className="text-gray-500 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(alert.timestamp)}
              </span>
            </div>
          </div>
          <p className="text-gray-400 text-sm mt-1">{alert.message}</p>
        </div>
        {!alert.acknowledged && (
          <button className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* 标题和统计 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Bell className="w-7 h-7 text-orange-400" />
          告警记录
        </h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 glass rounded-lg hover:bg-white/10 transition-colors"
          >
            <Filter className="w-4 h-4" />
            筛选
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* 快速统计 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <button 
          onClick={() => setFilter('all')}
          className={`glass rounded-xl p-4 text-center transition-all ${filter === 'all' ? 'ring-2 ring-blue-500 bg-blue-500/10' : 'hover:bg-white/5'}`}
        >
          <div className="text-3xl font-bold text-white">{alertCounts.all}</div>
          <div className="text-gray-400 text-sm">全部</div>
        </button>
        <button 
          onClick={() => setFilter('warning')}
          className={`glass rounded-xl p-4 text-center transition-all ${filter === 'warning' ? 'ring-2 ring-yellow-500 bg-yellow-500/10' : 'hover:bg-white/5'}`}
        >
          <div className="text-3xl font-bold text-yellow-400">{alertCounts.warning}</div>
          <div className="text-gray-400 text-sm">警告</div>
        </button>
        <button 
          onClick={() => setFilter('error')}
          className={`glass rounded-xl p-4 text-center transition-all ${filter === 'error' ? 'ring-2 ring-red-500 bg-red-500/10' : 'hover:bg-white/5'}`}
        >
          <div className="text-3xl font-bold text-red-400">{alertCounts.error}</div>
          <div className="text-gray-400 text-sm">错误</div>
        </button>
        <button 
          onClick={() => setFilter('info')}
          className={`glass rounded-xl p-4 text-center transition-all ${filter === 'info' ? 'ring-2 ring-blue-500 bg-blue-500/10' : 'hover:bg-white/5'}`}
        >
          <div className="text-3xl font-bold text-blue-400">{alertCounts.info}</div>
          <div className="text-gray-400 text-sm">信息</div>
        </button>
        <button 
          onClick={() => setFilter('success')}
          className={`glass rounded-xl p-4 text-center transition-all ${filter === 'success' ? 'ring-2 ring-green-500 bg-green-500/10' : 'hover:bg-white/5'}`}
        >
          <div className="text-3xl font-bold text-green-400">{alertCounts.success}</div>
          <div className="text-gray-400 text-sm">成功</div>
        </button>
      </div>

      {/* 告警列表 */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <div className="text-gray-400">暂无告警记录</div>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))
        )}
      </div>

      {/* 告警设置快捷入口 */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          快捷告警设置
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Battery className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="flex-grow">
              <div className="text-white font-medium">电池告警</div>
              <div className="text-gray-400 text-sm">SOC &lt; 10% 时警告</div>
            </div>
            <button className="px-3 py-1 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors">
              配置
            </button>
          </div>
          <div className="bg-white/5 rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
              <Thermometer className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-grow">
              <div className="text-white font-medium">温度告警</div>
              <div className="text-gray-400 text-sm">温度 &gt; 45°C 时警告</div>
            </div>
            <button className="px-3 py-1 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors">
              配置
            </button>
          </div>
          <div className="bg-white/5 rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-grow">
              <div className="text-white font-medium">电网告警</div>
              <div className="text-gray-400 text-sm">电压波动 &gt; 10% 时警告</div>
            </div>
            <button className="px-3 py-1 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors">
              配置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
