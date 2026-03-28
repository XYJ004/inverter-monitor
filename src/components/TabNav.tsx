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
