// src/App.tsx

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Header } from './components/Header';
import { TabNav } from './components/TabNav';
import { Dashboard } from './pages/Dashboard';
import { BatteryDetail } from './pages/BatteryDetail';
import { Analysis } from './pages/Analysis';
import { Alerts } from './pages/Alerts';
import { Settings } from './pages/Settings';
import { useInverterData } from './hooks/useInverterData';
import type { TabId } from './types';
import './index.css';

function App() {
  const { data, history, batteryHistory, stats, alerts, loading } = useInverterData();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">加载中...</p>
        </div>
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
            <Analysis history={history} stats={stats} />
          )}
          {activeTab === 'alerts' && (
            <Alerts alerts={alerts} />
          )}
          {activeTab === 'settings' && (
            <Settings />
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
