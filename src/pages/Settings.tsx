// src/pages/Settings.tsx

import { useState } from 'react';
import { 
  Settings as SettingsIcon, User, Bell, Shield, Database, 
  Wifi, Save, RefreshCw, Moon, Sun
} from 'lucide-react';

interface SettingsProps {
  // 可以传入一些配置
}

export function Settings({}: SettingsProps) {
  const [saving, setSaving] = useState(false);
  
  // 系统设置
  const [settings, setSettings] = useState({
    // 基本信息
    systemName: '家庭光伏电站',
    location: '北京市海淀区',
    installedCapacity: '10',
    
    // 通知设置
    emailNotify: true,
    smsNotify: false,
    pushNotify: true,
    soundNotify: true,
    
    // 告警阈值
    socLowLimit: 10,
    socHighLimit: 95,
    tempHighLimit: 45,
    tempLowLimit: 0,
    voltageDeviation: 10,
    
    // 高级设置
    dataRefreshInterval: 2,
    historyRetention: 30,
    autoBackup: true,
    darkMode: true,
    language: 'zh-CN',
  });

  const handleSave = async () => {
    setSaving(true);
    // 模拟保存
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    alert('设置已保存！');
  };

  const SettingSection = ({ title, icon: Icon, children }: { 
    title: string; icon: typeof SettingsIcon; children: React.ReactNode;
  }) => (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Icon className="w-5 h-5 text-blue-400" />
        {title}
      </h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );

  const InputField = ({ label, value, onChange, unit, type = 'text', placeholder }: {
    label: string; value: string | number; onChange: (v: string) => void; 
    unit?: string; type?: string; placeholder?: string;
  }) => (
    <div className="flex items-center justify-between py-2">
      <label className="text-gray-400">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-white/10 rounded-lg px-3 py-2 w-32 text-white text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {unit && <span className="text-gray-500 text-sm w-12">{unit}</span>}
      </div>
    </div>
  );

  const Toggle = ({ label, value, onChange, description }: {
    label: string; value: boolean; onChange: (v: boolean) => void; description?: string;
  }) => (
    <div className="flex items-center justify-between py-2">
      <div>
        <label className="text-white">{label}</label>
        {description && <div className="text-gray-500 text-sm">{description}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full transition-colors ${value ? 'bg-blue-500' : 'bg-gray-600'}`}
      >
        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${value ? 'translate-x-6' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <SettingsIcon className="w-7 h-7 text-gray-400" />
          系统设置
        </h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 rounded-lg text-white font-medium transition-colors"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              保存设置
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 基本信息设置 */}
        <SettingSection title="基本信息" icon={User}>
          <InputField 
            label="系统名称" 
            value={settings.systemName} 
            onChange={(v) => setSettings({...settings, systemName: v})} 
          />
          <InputField 
            label="安装地点" 
            value={settings.location} 
            onChange={(v) => setSettings({...settings, location: v})} 
          />
          <InputField 
            label="装机容量" 
            value={settings.installedCapacity} 
            onChange={(v) => setSettings({...settings, installedCapacity: v})} 
            unit="kW" 
          />
        </SettingSection>

        {/* 通知设置 */}
        <SettingSection title="通知设置" icon={Bell}>
          <Toggle 
            label="邮件通知" 
            value={settings.emailNotify} 
            onChange={(v) => setSettings({...settings, emailNotify: v})} 
            description="接收告警邮件" 
          />
          <Toggle 
            label="短信通知" 
            value={settings.smsNotify} 
            onChange={(v) => setSettings({...settings, smsNotify: v})} 
            description="紧急告警短信提醒" 
          />
          <Toggle 
            label="推送通知" 
            value={settings.pushNotify} 
            onChange={(v) => setSettings({...settings, pushNotify: v})} 
            description="App推送消息" 
          />
          <Toggle 
            label="声音提醒" 
            value={settings.soundNotify} 
            onChange={(v) => setSettings({...settings, soundNotify: v})} 
            description="告警声音提示" 
          />
        </SettingSection>

        {/* 告警阈值设置 */}
        <SettingSection title="告警阈值" icon={Shield}>
          <InputField 
            label="SOC 低限" 
            value={settings.socLowLimit} 
            onChange={(v) => setSettings({...settings, socLowLimit: Number(v)})} 
            unit="%" 
            type="number" 
          />
          <InputField 
            label="SOC 高限" 
            value={settings.socHighLimit} 
            onChange={(v) => setSettings({...settings, socHighLimit: Number(v)})} 
            unit="%" 
            type="number" 
          />
          <InputField 
            label="温度上限" 
            value={settings.tempHighLimit} 
            onChange={(v) => setSettings({...settings, tempHighLimit: Number(v)})} 
            unit="°C" 
            type="number" 
          />
          <InputField 
            label="温度下限" 
            value={settings.tempLowLimit} 
            onChange={(v) => setSettings({...settings, tempLowLimit: Number(v)})} 
            unit="°C" 
            type="number" 
          />
          <InputField 
            label="电压偏差阈值" 
            value={settings.voltageDeviation} 
            onChange={(v) => setSettings({...settings, voltageDeviation: Number(v)})} 
            unit="%" 
            type="number" 
          />
        </SettingSection>

        {/* 高级设置 */}
        <SettingSection title="高级设置" icon={Database}>
          <InputField 
            label="数据刷新间隔" 
            value={settings.dataRefreshInterval} 
            onChange={(v) => setSettings({...settings, dataRefreshInterval: Number(v)})} 
            unit="秒" 
            type="number" 
          />
          <InputField 
            label="历史数据保留" 
            value={settings.historyRetention} 
            onChange={(v) => setSettings({...settings, historyRetention: Number(v)})} 
            unit="天" 
            type="number" 
          />
          <Toggle 
            label="自动备份" 
            value={settings.autoBackup} 
            onChange={(v) => setSettings({...settings, autoBackup: v})} 
            description="每日自动备份配置" 
          />
        </SettingSection>
      </div>

      {/* 显示设置 */}
      <SettingSection title="显示设置" icon={Moon}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between py-2">
            <label className="text-gray-400">主题模式</label>
            <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1">
              <button 
                onClick={() => setSettings({...settings, darkMode: true})}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors ${settings.darkMode ? 'bg-blue-500 text-white' : 'text-gray-400'}`}
              >
                <Moon className="w-4 h-4" />
                深色
              </button>
              <button 
                onClick={() => setSettings({...settings, darkMode: false})}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors ${!settings.darkMode ? 'bg-blue-500 text-white' : 'text-gray-400'}`}
              >
                <Sun className="w-4 h-4" />
                浅色
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <label className="text-gray-400">语言</label>
            <select 
              value={settings.language}
              onChange={(e) => setSettings({...settings, language: e.target.value})}
              className="bg-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="zh-CN" className="bg-slate-800">简体中文</option>
              <option value="zh-TW" className="bg-slate-800">繁體中文</option>
              <option value="en" className="bg-slate-800">English</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-2">
            <label className="text-gray-400">时区</label>
            <select 
              className="bg-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option className="bg-slate-800">UTC+8 北京</option>
              <option className="bg-slate-800">UTC+0 伦敦</option>
              <option className="bg-slate-800">UTC-5 纽约</option>
            </select>
          </div>
        </div>
      </SettingSection>

      {/* 系统信息 */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Wifi className="w-5 h-5 text-green-400" />
          系统信息
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">固件版本</div>
            <div className="text-white font-medium">v2.3.1</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">运行时间</div>
            <div className="text-white font-medium">127 天 14 小时</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">上次维护</div>
            <div className="text-white font-medium">2026-03-01</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">设备状态</div>
            <div className="text-green-400 font-medium flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              在线
            </div>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center justify-center gap-4 py-4">
        <button className="flex items-center gap-2 px-4 py-2 glass rounded-lg hover:bg-white/10 transition-colors">
          <RefreshCw className="w-4 h-4" />
          重置为默认
        </button>
        <button className="flex items-center gap-2 px-4 py-2 glass rounded-lg hover:bg-white/10 transition-colors">
          <Database className="w-4 h-4" />
          导出配置
        </button>
        <button className="flex items-center gap-2 px-4 py-2 glass rounded-lg hover:bg-white/10 transition-colors">
          <Shield className="w-4 h-4" />
          系统诊断
        </button>
      </div>
    </div>
  );
}
