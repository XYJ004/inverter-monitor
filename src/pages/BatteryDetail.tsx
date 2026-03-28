// src/pages/BatteryDetail.tsx

import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Settings, Save, Check } from 'lucide-react';
import { BatteryGauge } from '../components/BatteryGauge';
import type { BatteryData, BatteryHistoryPoint } from '../types';

interface BatteryDetailProps {
  battery: BatteryData;
  batteryHistory: BatteryHistoryPoint[];
}

export function BatteryDetail({ battery, batteryHistory }: BatteryDetailProps) {
  const [socLow, setSocLow] = useState(10);
  const [socHigh, setSocHigh] = useState(95);
  const [tempHigh, setTempHigh] = useState(45);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // 模拟保存
    await new Promise(resolve => setTimeout(resolve, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
                value={socLow}
                onChange={(e) => setSocLow(Number(e.target.value))}
                className="bg-white/10 rounded-lg px-3 py-2 w-20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">%</span>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <label className="text-gray-400 text-sm block mb-2">SOC 高限</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={socHigh}
                onChange={(e) => setSocHigh(Number(e.target.value))}
                className="bg-white/10 rounded-lg px-3 py-2 w-20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">%</span>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <label className="text-gray-400 text-sm block mb-2">温度上限</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={tempHigh}
                onChange={(e) => setTempHigh(Number(e.target.value))}
                className="bg-white/10 rounded-lg px-3 py-2 w-20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">°C</span>
            </div>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className={`mt-4 px-4 py-2 rounded-lg text-white font-medium transition-all flex items-center gap-2 ${
            saved ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'
          } disabled:opacity-50`}
        >
          {saving ? (
            <>
              <Save className="w-4 h-4 animate-pulse" />
              保存中...
            </>
          ) : saved ? (
            <>
              <Check className="w-4 h-4" />
              已保存！
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              保存设置
            </>
          )}
        </button>
      </div>
    </div>
  );
}
