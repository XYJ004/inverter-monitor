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
