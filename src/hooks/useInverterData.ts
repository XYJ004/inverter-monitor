// src/hooks/useInverterData.ts

import { useState, useEffect } from 'react';
import type { InverterData, HistoryPoint, DailyStats, Alert, BatteryHistoryPoint } from '../types';

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
  const [stats] = useState<DailyStats>(mockGenerator.getDailyStats());
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
