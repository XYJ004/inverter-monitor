# 逆变器监控系统 Phase 1 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现分页式逆变器监控界面，包含仪表盘和电池详情两个核心页面

**Architecture:** React 单页应用，使用状态管理 + 组件化设计。每个页面独立组件，通过 Tab 导航切换。数据通过自定义 hook 从后端 API 获取。

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Recharts + Framer Motion

---

## 文件结构

```
src/
├── App.tsx                 # 主应用 (修改: 添加路由和页面切换)
├── index.css               # 全局样式 (修改: 添加新配色)
├── types/
│   └── index.ts            # 创建: TypeScript 类型定义
├── hooks/
│   └── useInverterData.ts  # 创建: 数据获取 hook
├── components/
│   ├── Header.tsx          # 创建: 顶部导航栏
│   ├── TabNav.tsx          # 创建: 分页导航
│   ├── BatteryGauge.tsx    # 创建: 大号电池 SOC 圆盘
│   ├── PowerCard.tsx       # 创建: 功率卡片
│   ├── PowerChart.tsx      # 创建: 功率曲线图
│   └── DailyStats.tsx      # 创建: 今日统计条
└── pages/
    ├── Dashboard.tsx       # 创建: 仪表盘页面
    └── BatteryDetail.tsx   # 创建: 电池详情页面
```

---

## Task 1: TypeScript 类型定义

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: 创建类型定义文件**

```typescript
// src/types/index.ts

export interface SolarData {
  power: number;
  voltage: number;
  current: number;
  efficiency: number;
  temperature: number;
}

export interface BatteryData {
  voltage: number;
  current: number;
  soc: number;
  soh: number;
  temperature: number;
  cycles: number;
  status: 'charging' | 'discharging' | 'idle';
  todayCharge?: number;
  todayDischarge?: number;
}

export interface GridData {
  voltage: number;
  frequency: number;
  power: number;
  import_export: 'import' | 'export' | 'idle';
  quality: 'good' | 'warning' | 'poor';
}

export interface LoadData {
  power: number;
  voltage: number;
  current: number;
}

export interface InverterData {
  timestamp: string;
  solar: SolarData;
  battery: BatteryData;
  grid: GridData;
  load: LoadData;
  status: 'normal' | 'warning' | 'error' | 'offline';
  temperature: number;
  efficiency: number;
}

export interface HistoryPoint {
  time: string;
  fullTime: string;
  solar: number;
  load: number;
  grid: number;
  battery: number;
  efficiency: number;
}

export interface BatteryHistoryPoint {
  time: string;
  soc: number;
  current: number;
  temperature: number;
}

export interface DailyStats {
  solarGenerated: number;
  gridImport: number;
  gridExport: number;
  savings: number;
  co2Saved: number;
}

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export type TabId = 'dashboard' | 'battery' | 'analysis' | 'alerts' | 'settings';
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add TypeScript type definitions"
```

---

## Task 2: 数据获取 Hook

**Files:**
- Create: `src/hooks/useInverterData.ts`

- [ ] **Step 1: 创建数据获取 hook**

```typescript
// src/hooks/useInverterData.ts

import { useState, useEffect } from 'react';
import type { InverterData, HistoryPoint, DailyStats, Alert, BatteryHistoryPoint } from '../types';

const API_BASE = 'http://localhost:3002/api';

// 模拟数据生成器
class MockDataGenerator {
  private historyData: HistoryPoint[] = [];
  private batteryHistory: BatteryHistoryPoint[] = [];
  
  constructor() { 
    this.generateHistory(); 
  }
  
  private getSolarPower(hour: number): number {
    if (hour < 6 || hour > 18) return 0;
    return 5500 * Math.sin((hour - 6) / 12 * Math.PI) + (Math.random() - 0.5) * 500;
  }
  
  private getBatterySOC(hour: number, solar: number): number {
    const base = 50 + 25 * Math.sin((hour - 6) / 24 * 2 * Math.PI);
    if (solar > 2000) return Math.min(95, base + 15);
    if (solar < 500) return Math.max(10, base - 10);
    return base;
  }

  generateRealtime(): InverterData {
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;
    const solar = this.getSolarPower(hour);
    const batterySOC = this.getBatterySOC(hour, solar);
    const batteryCurrent = solar > 2000 ? 15 + Math.random() * 10 : solar < 500 ? -15 - Math.random() * 10 : (Math.random() - 0.5) * 10;
    const load = 800 + Math.random() * 1500 + (hour >= 7 && hour <= 9 ? 500 : 0) + (hour >= 18 && hour <= 22 ? 800 : 0);
    const grid = load - solar - batteryCurrent * 48;
    const gridVoltage = 220 + (Math.random() - 0.5) * 10;
    
    return {
      timestamp: now.toISOString(),
      solar: {
        power: Math.max(0, solar),
        voltage: 300 + (Math.random() - 0.5) * 20,
        current: Math.max(0, solar / 300),
        efficiency: 95 + (Math.random() - 0.5) * 3,
        temperature: 35 + solar / 200 + Math.random() * 5,
      },
      battery: {
        voltage: 48 + batteryCurrent * 0.05 + (Math.random() - 0.5) * 2,
        current: batteryCurrent,
        soc: batterySOC,
        soh: 92 + (Math.random() - 0.5) * 3,
        temperature: 25 + Math.abs(batteryCurrent) * 0.15 + Math.random() * 3,
        cycles: 342,
        status: batteryCurrent > 2 ? 'charging' : batteryCurrent < -2 ? 'discharging' : 'idle',
        todayCharge: 18.3 + Math.random() * 2,
        todayDischarge: 15.6 + Math.random() * 2,
      },
      grid: {
        voltage: gridVoltage,
        frequency: 50 + (Math.random() - 0.5) * 0.3,
        power: grid,
        import_export: grid > 50 ? 'import' : grid < -50 ? 'export' : 'idle',
        quality: Math.abs(220 - gridVoltage) < 5 ? 'good' : Math.abs(220 - gridVoltage) < 10 ? 'warning' : 'poor',
      },
      load: { power: load, voltage: 220 + (Math.random() - 0.5) * 5, current: load / 220 },
      status: batterySOC < 15 || Math.abs(grid) > 2500 ? 'warning' : 'normal',
      temperature: 35 + Math.random() * 10,
      efficiency: 97 + (Math.random() - 0.5) * 2,
    };
  }

  private generateHistory() {
    const now = new Date();
    for (let i = 24 * 6; i >= 0; i--) {
      const t = new Date(now.getTime() - i * 10 * 60 * 1000);
      const hour = t.getHours() + t.getMinutes() / 60;
      const solar = this.getSolarPower(hour);
      const load = 800 + Math.random() * 1500 + (hour >= 7 && hour <= 9 ? 500 : 0) + (hour >= 18 && hour <= 22 ? 800 : 0);
      this.historyData.push({
        time: `${t.getHours()}:${String(t.getMinutes()).padStart(2, '0')}`,
        fullTime: t.toISOString(),
        solar: Math.max(0, solar),
        load,
        grid: load - solar + (Math.random() - 0.5) * 500,
        battery: this.getBatterySOC(hour, solar),
        efficiency: 95 + (Math.random() - 0.5) * 4,
      });
      this.batteryHistory.push({
        time: `${t.getHours()}:${String(t.getMinutes()).padStart(2, '0')}`,
        soc: this.getBatterySOC(hour, solar),
        current: solar > 2000 ? 15 + Math.random() * 5 : -10 + Math.random() * 5,
        temperature: 25 + Math.random() * 10,
      });
    }
  }

  getHistory(): HistoryPoint[] { return this.historyData; }
  getBatteryHistory(): BatteryHistoryPoint[] { return this.batteryHistory; }
  addHistoryPoint(p: HistoryPoint) { this.historyData.push(p); if (this.historyData.length > 145) this.historyData.shift(); }
  
  getDailyStats(): DailyStats {
    return {
      solarGenerated: 32.5 + (Math.random() - 0.5) * 5,
      gridImport: 5.2 + (Math.random() - 0.5) * 2,
      gridExport: 12.8 + (Math.random() - 0.5) * 3,
      savings: 19.50 + (Math.random() - 0.5) * 2,
      co2Saved: 16 + (Math.random() - 0.5) * 2,
    };
  }
  
  generateAlerts(): Alert[] {
    if (Math.random() > 0.7) {
      return [{ 
        id: `a-${Date.now()}`, 
        type: 'warning', 
        title: '电池温度偏高', 
        message: '当前温度38°C，建议检查散热', 
        timestamp: new Date().toISOString(), 
        acknowledged: false 
      }];
    }
    return [];
  }
}

const mockGenerator = new MockDataGenerator();

export function useInverterData() {
  const [data, setData] = useState<InverterData | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [batteryHistory, setBatteryHistory] = useState<BatteryHistoryPoint[]>([]);
  const [stats, setStats] = useState<DailyStats>(mockGenerator.getDailyStats());
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setData(mockGenerator.generateRealtime());
    setHistory(mockGenerator.getHistory());
    setBatteryHistory(mockGenerator.getBatteryHistory());
    setAlerts(mockGenerator.generateAlerts());
    setLoading(false);

    const interval = setInterval(() => {
      const d = mockGenerator.generateRealtime();
      setData(d);
      mockGenerator.addHistoryPoint({
        time: `${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}`,
        fullTime: d.timestamp,
        solar: d.solar.power,
        load: d.load.power,
        grid: d.grid.power,
        battery: d.battery.soc,
        efficiency: d.efficiency,
      });
      setHistory([...mockGenerator.getHistory()]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return { data, history, batteryHistory, stats, alerts, loading };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useInverterData.ts
git commit -m "feat: add useInverterData hook with mock data generator"
```

---

## Task 3: 全局样式更新

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: 更新全局样式**

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root { 
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif; 
}

body { 
  margin: 0; 
  min-height: 100vh; 
  background: #0f172a;
  color: #fff;
}

/* Custom scrollbar */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 4px; }
::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }

/* Glass effect */
.glass {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Tab styles */
.tab-active {
  background: rgba(255, 255, 255, 0.1);
  border-bottom: 2px solid #3B82F6;
}

/* Selection */
::selection { background: rgba(59, 130, 246, 0.5); color: white; }
```

- [ ] **Step 2: Commit**

```bash
git add src/index.css
git commit -m "style: update global styles for industrial theme"
```

---

## Task 4: Header 组件

**Files:**
- Create: `src/components/Header.tsx`

- [ ] **Step 1: 创建 Header 组件**

```typescript
// src/components/Header.tsx

import { Zap, Bell, Settings, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import type { InverterData, Alert } from '../types';

interface HeaderProps {
  data: InverterData;
  alerts: Alert[];
}

export function Header({ data, alerts }: HeaderProps) {
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
          <span className={`w-2 h-2 rounded-full ${
            data.status === 'normal' ? 'bg-green-400' : 
            data.status === 'warning' ? 'bg-yellow-400' : 
            'bg-red-400'
          }`} />
          {data.status === 'normal' ? '系统正常' : data.status === 'warning' ? '注意' : '异常'}
        </div>

        <div className="text-sm text-gray-400">
          设备温度: <span className="text-white font-medium">{data.temperature.toFixed(1)}°C</span>
        </div>

        <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
          <Bell className="w-5 h-5 text-gray-400" />
          {unackCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
              {unackCount}
            </span>
          )}
        </button>

        <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
          <Settings className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </motion.header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Header.tsx
git commit -m "feat: add Header component"
```

---

## Task 5: TabNav 组件

**Files:**
- Create: `src/components/TabNav.tsx`

- [ ] **Step 1: 创建 TabNav 组件**

```typescript
// src/components/TabNav.tsx

import { LayoutDashboard, Battery, BarChart3, Bell, Settings } from 'lucide-react';
import type { TabId } from '../types';

interface TabNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard },
  { id: 'battery', label: '电池详情', icon: Battery },
  { id: 'analysis', label: '发电分析', icon: BarChart3 },
  { id: 'alerts', label: '告警记录', icon: Bell },
  { id: 'settings', label: '系统设置', icon: Settings },
];

export function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <nav className="flex items-center gap-1 px-6 py-2 border-b border-white/10 bg-slate-900/50">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive 
                ? 'bg-white/10 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            } ${isActive ? 'border-b-2 border-blue-500 -mb-[2px]' : ''}`}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TabNav.tsx
git commit -m "feat: add TabNav component"
```

---

## Task 6: BatteryGauge 组件

**Files:**
- Create: `src/components/BatteryGauge.tsx`

- [ ] **Step 1: 创建大号电池仪表盘组件**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/BatteryGauge.tsx
git commit -m "feat: add BatteryGauge component with normal and large sizes"
```

---

## Task 7: PowerCard 组件

**Files:**
- Create: `src/components/PowerCard.tsx`

- [ ] **Step 1: 创建 PowerCard 组件**

```typescript
// src/components/PowerCard.tsx

import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

interface PowerCardProps {
  icon: LucideIcon;
  title: string;
  value: number;
  subtitle?: string;
  color: string;
  trend?: 'up' | 'down' | 'stable';
  bgColor?: string;
}

export function PowerCard({ icon: Icon, title, value, subtitle, color, trend, bgColor = 'bg-white/5' }: PowerCardProps) {
  const formatPower = (w: number) => {
    if (Math.abs(w) >= 1000) return `${(w / 1000).toFixed(1)} kW`;
    return `${Math.round(w)} W`;
  };

  return (
    <div className={`${bgColor} rounded-xl p-4 hover:bg-white/10 transition-colors`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${color}`} />
          <span className="text-gray-400 text-sm">{title}</span>
        </div>
        {trend && (
          <div className={`p-1.5 rounded-lg ${
            trend === 'up' ? 'bg-green-500/20' : 
            trend === 'down' ? 'bg-red-500/20' : 
            'bg-gray-500/20'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4 text-green-400" /> : 
             trend === 'down' ? <TrendingDown className="w-4 h-4 text-red-400" /> : 
             <Minus className="w-4 h-4 text-gray-400" />}
          </div>
        )}
      </div>
      <div className={`text-3xl font-bold ${color}`}>
        {formatPower(value)}
      </div>
      {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PowerCard.tsx
git commit -m "feat: add PowerCard component"
```

---

## Task 8: PowerChart 组件

**Files:**
- Create: `src/components/PowerChart.tsx`

- [ ] **Step 1: 创建 PowerChart 组件**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PowerChart.tsx
git commit -m "feat: add PowerChart component"
```

---

## Task 9: DailyStats 组件

**Files:**
- Create: `src/components/DailyStats.tsx`

- [ ] **Step 1: 创建 DailyStats 组件**

```typescript
// src/components/DailyStats.tsx

import { Sun, Plug, TrendingDown, DollarSign, Activity, LucideIcon } from 'lucide-react';
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DailyStats.tsx
git commit -m "feat: add DailyStats component"
```

---

## Task 10: Dashboard 页面

**Files:**
- Create: `src/pages/Dashboard.tsx`

- [ ] **Step 1: 创建 Dashboard 页面**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: add Dashboard page"
```

---

## Task 11: BatteryDetail 页面

**Files:**
- Create: `src/pages/BatteryDetail.tsx`

- [ ] **Step 1: 创建 BatteryDetail 页面**

```typescript
// src/pages/BatteryDetail.tsx

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts';
import { Activity, Settings } from 'lucide-react';
import { BatteryGauge } from '../components/BatteryGauge';
import type { BatteryData, BatteryHistoryPoint } from '../types';

interface BatteryDetailProps {
  battery: BatteryData;
  batteryHistory: BatteryHistoryPoint[];
}

export function BatteryDetail({ battery, batteryHistory }: BatteryDetailProps) {
  return (
    <div className="p-6 space-y-6">
      {/* 大号电池仪表盘 */}
      <div className="flex justify-center">
        <BatteryGauge data={battery} size="large" />
      </div>

      {/* SOC 历史趋势 */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-400" />
          电池 SOC 历史趋势 (24小时)
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={batteryHistory.slice(-72)}>
            <defs>
              <linearGradient id="socGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="time" stroke="#6b7280" fontSize={11} tickLine={false} />
            <YAxis stroke="#6b7280" fontSize={11} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                border: 'none', 
                borderRadius: '12px' 
              }} 
            />
            <Area type="monotone" dataKey="soc" stroke="#22c55e" fill="url(#socGradient)" name="SOC" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 告警阈值设置 */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-400" />
          告警阈值设置
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-xl p-4">
            <label className="text-gray-400 text-sm block mb-2">SOC 低限</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                defaultValue={10} 
                className="bg-white/10 rounded-lg px-3 py-2 w-20 text-white"
              />
              <span className="text-gray-500">%</span>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <label className="text-gray-400 text-sm block mb-2">SOC 高限</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                defaultValue={95} 
                className="bg-white/10 rounded-lg px-3 py-2 w-20 text-white"
              />
              <span className="text-gray-500">%</span>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <label className="text-gray-400 text-sm block mb-2">温度上限</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                defaultValue={45} 
                className="bg-white/10 rounded-lg px-3 py-2 w-20 text-white"
              />
              <span className="text-gray-500">°C</span>
            </div>
          </div>
        </div>
        <button className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-medium transition-colors">
          保存设置
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/BatteryDetail.tsx
git commit -m "feat: add BatteryDetail page with SOC history and threshold settings"
```

---

## Task 12: 更新 App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: 重写 App.tsx 整合所有组件**

```typescript
// src/App.tsx

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Header } from './components/Header';
import { TabNav } from './components/TabNav';
import { Dashboard } from './pages/Dashboard';
import { BatteryDetail } from './pages/BatteryDetail';
import { useInverterData } from './hooks/useInverterData';
import type { TabId } from './types';
import './index.css';

function App() {
  const { data, history, batteryHistory, stats, alerts, loading } = useInverterData();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <RefreshCw className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-[1800px] mx-auto">
        <Header data={data} alerts={alerts} />
        <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main>
          {activeTab === 'dashboard' && (
            <Dashboard data={data} history={history} stats={stats} />
          )}
          {activeTab === 'battery' && (
            <BatteryDetail battery={data.battery} batteryHistory={batteryHistory} />
          )}
          {activeTab === 'analysis' && (
            <div className="p-6 text-center text-gray-400">
              <p className="text-xl">发电分析页面</p>
              <p className="text-sm mt-2">Phase 2 即将实现</p>
            </div>
          )}
          {activeTab === 'alerts' && (
            <div className="p-6 text-center text-gray-400">
              <p className="text-xl">告警记录页面</p>
              <p className="text-sm mt-2">Phase 2 即将实现</p>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="p-6 text-center text-gray-400">
              <p className="text-xl">系统设置页面</p>
              <p className="text-sm mt-2">Phase 3 即将实现</p>
            </div>
          )}
        </main>

        <footer className="text-center text-gray-500 text-sm py-4 border-t border-white/10">
          逆变器监控系统 v2.0 | 最后更新: {new Date(data.timestamp).toLocaleTimeString('zh-CN')}
        </footer>
      </div>
    </div>
  );
}

export default App;
```

- [ ] **Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: integrate all components with tab navigation"
```

---

## Task 13: 创建组件索引文件

**Files:**
- Create: `src/components/index.ts`

- [ ] **Step 1: 创建组件索引**

```typescript
// src/components/index.ts
export { Header } from './Header';
export { TabNav } from './TabNav';
export { BatteryGauge } from './BatteryGauge';
export { PowerCard } from './PowerCard';
export { PowerChart } from './PowerChart';
export { DailyStats } from './DailyStats';
```

- [ ] **Step 2: Commit**

```bash
git add src/components/index.ts
git commit -m "feat: add components index file"
```

---

## Task 14: 最终测试和推送

- [ ] **Step 1: 验证前端可以正常启动**

```bash
cd /root/clawd/projects/inverter-monitor && npm run dev
```

Expected: 前端在 http://localhost:3000 正常运行，无编译错误

- [ ] **Step 2: 推送所有提交到 GitHub**

```bash
cd /root/clawd/projects/inverter-monitor && git push origin main
```

Expected: 所有提交成功推送到远程仓库

---

## 验收清单

- [ ] 顶部导航 + 分页切换正常工作
- [ ] 仪表盘页面显示大号电池 SOC 圆盘
- [ ] 功率卡片实时更新 (2秒刷新)
- [ ] 24小时功率曲线图正常显示
- [ ] 电池详情页面独立展示
- [ ] 电池详情页显示所有参数
- [ ] SOC 历史趋势图正常
- [ ] 响应式布局 (桌面/平板)
- [ ] GitHub 代码提交
