import { useState, useEffect, useCallback } from 'react'
import { 
  Sun, Battery, Plug, Home, AlertTriangle, RefreshCw,
  TrendingUp, TrendingDown, Minus, Settings, Bell, Menu,
  Zap, Thermometer, Clock, ChevronDown, ChevronUp,
  Activity, DollarSign, Calendar, Download, Filter,
  Moon, Sun as SunIcon, User, LogOut, HelpCircle
} from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'

// ==================== 类型定义 ====================
interface SolarData {
  power: number
  voltage: number
  current: number
  efficiency: number
  temperature: number
}

interface BatteryData {
  voltage: number
  current: number
  soc: number
  soh: number
  temperature: number
  cycles: number
  status: 'charging' | 'discharging' | 'idle'
}

interface GridData {
  voltage: number
  frequency: number
  power: number
  import_export: 'import' | 'export' | 'idle'
  quality: 'good' | 'warning' | 'poor'
}

interface LoadData {
  power: number
  voltage: number
  current: number
}

interface InverterData {
  timestamp: string
  solar: SolarData
  battery: BatteryData
  grid: GridData
  load: LoadData
  status: 'normal' | 'warning' | 'error' | 'offline'
  temperature: number
  efficiency: number
}

interface Alert {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  timestamp: string
  acknowledged: boolean
}

interface HistoryPoint {
  time: string
  fullTime: string
  solar: number
  load: number
  grid: number
  battery: number
  efficiency: number
}

interface DailyStats {
  solarGenerated: number
  gridImport: number
  gridExport: number
  batteryCharge: number
  batteryDischarge: number
  loadConsumed: number
  savings: number
  co2Saved: number
}

// ==================== 模拟数据生成器 ====================
class MockDataGenerator {
  private baseTime = Date.now()
  private historyData: HistoryPoint[] = []

  constructor() {
    this.generateHistory()
  }

  private getSolarPower(hour: number): number {
    // 日出6点，日落18点，正午12点峰值
    if (hour < 6 || hour > 18) return 0
    const progress = (hour - 6) / 12
    const curve = Math.sin(progress * Math.PI)
    return 5500 * curve + (Math.random() - 0.5) * 500
  }

  private getBatterySOC(hour: number, solarPower: number): number {
    // 白天充电，晚上放电
    const baseSOC = 50 + 25 * Math.sin((hour - 6) / 24 * 2 * Math.PI)
    if (solarPower > 2000) return Math.min(95, baseSOC + 15)
    if (solarPower < 500) return Math.max(10, baseSOC - 10)
    return baseSOC
  }

  generateRealtime(): InverterData {
    const now = new Date()
    const hour = now.getHours() + now.getMinutes() / 60
    
    const solarPower = this.getSolarPower(hour)
    const solarVoltage = 300 + (Math.random() - 0.5) * 20
    const solarCurrent = solarPower / solarVoltage
    const solarEfficiency = 95 + (Math.random() - 0.5) * 3
    
    const batterySOC = this.getBatterySOC(hour, solarPower)
    const batteryCurrent = solarPower > 2000 ? 15 + Math.random() * 10 : 
                           solarPower < 500 ? -15 - Math.random() * 10 : 
                           (Math.random() - 0.5) * 10
    const batteryStatus = batteryCurrent > 2 ? 'charging' : 
                          batteryCurrent < -2 ? 'discharging' : 'idle'

    const loadPower = 800 + Math.random() * 1500 + 
                      (hour >= 7 && hour <= 9 ? 500 : 0) +  // 早高峰
                      (hour >= 18 && hour <= 22 ? 800 : 0)  // 晚高峰

    const gridPower = loadPower - solarPower - batteryCurrent * 48
    
    const gridQuality = Math.abs(220 - (220 + (Math.random() - 0.5) * 10)) < 5 ? 'good' : 
                        Math.abs(220 - (220 + (Math.random() - 0.5) * 10)) < 10 ? 'warning' : 'poor'

    const status: InverterData['status'] = 
      batterySOC < 15 ? 'warning' :
      Math.abs(gridPower) > 2500 ? 'warning' :
      gridQuality === 'poor' ? 'warning' : 'normal'

    return {
      timestamp: now.toISOString(),
      solar: {
        power: Math.max(0, solarPower),
        voltage: solarVoltage,
        current: Math.max(0, solarCurrent),
        efficiency: solarEfficiency,
        temperature: 35 + solarPower / 200 + Math.random() * 5,
      },
      battery: {
        voltage: 48 + batteryCurrent * 0.05 + (Math.random() - 0.5) * 2,
        current: batteryCurrent,
        soc: batterySOC,
        soh: 92 + (Math.random() - 0.5) * 3,
        temperature: 25 + Math.abs(batteryCurrent) * 0.15 + Math.random() * 3,
        cycles: 342,
        status: batteryStatus,
      },
      grid: {
        voltage: 220 + (Math.random() - 0.5) * 10,
        frequency: 50 + (Math.random() - 0.5) * 0.3,
        power: gridPower,
        import_export: gridPower > 50 ? 'import' : gridPower < -50 ? 'export' : 'idle',
        quality: gridQuality,
      },
      load: {
        power: loadPower,
        voltage: 220 + (Math.random() - 0.5) * 5,
        current: loadPower / 220,
      },
      status,
      temperature: 35 + Math.random() * 10,
      efficiency: 97 + (Math.random() - 0.5) * 2,
    }
  }

  private generateHistory() {
    const now = new Date()
    for (let i = 24 * 6; i >= 0; i--) {
      const t = new Date(now.getTime() - i * 10 * 60 * 1000)
      const hour = t.getHours() + t.getMinutes() / 60
      
      const solar = this.getSolarPower(hour)
      const load = 800 + Math.random() * 1500 + 
                   (hour >= 7 && hour <= 9 ? 500 : 0) + 
                   (hour >= 18 && hour <= 22 ? 800 : 0)
      const grid = load - solar + (Math.random() - 0.5) * 500
      const battery = this.getBatterySOC(hour, solar)
      
      this.historyData.push({
        time: `${t.getHours()}:${String(t.getMinutes()).padStart(2, '0')}`,
        fullTime: t.toISOString(),
        solar: Math.max(0, solar),
        load,
        grid,
        battery,
        efficiency: 95 + (Math.random() - 0.5) * 4,
      })
    }
  }

  getHistory(): HistoryPoint[] {
    return this.historyData
  }

  addHistoryPoint(point: HistoryPoint) {
    this.historyData.push(point)
    if (this.historyData.length > 24 * 6 + 1) {
      this.historyData.shift()
    }
  }

  getDailyStats(): DailyStats {
    const solarGenerated = 32.5 + (Math.random() - 0.5) * 5
    const gridImport = 5.2 + (Math.random() - 0.5) * 2
    const gridExport = 12.8 + (Math.random() - 0.5) * 3
    const loadConsumed = solarGenerated + gridImport - gridExport
    
    return {
      solarGenerated,
      gridImport,
      gridExport,
      batteryCharge: 18.3 + (Math.random() - 0.5) * 3,
      batteryDischarge: 15.6 + (Math.random() - 0.5) * 3,
      loadConsumed,
      savings: solarGenerated * 0.6 + gridExport * 0.45,
      co2Saved: solarGenerated * 0.5,
    }
  }

  getMonthlyStats() {
    return {
      solarGenerated: 892.3 + (Math.random() - 0.5) * 50,
      gridImport: 145.6 + (Math.random() - 0.5) * 20,
      gridExport: 342.1 + (Math.random() - 0.5) * 30,
      savings: 687.50 + (Math.random() - 0.5) * 50,
      co2Saved: 446 + (Math.random() - 0.5) * 25,
    }
  }

  generateAlerts(): Alert[] {
    const alerts: Alert[] = []
    const now = new Date()
    
    if (Math.random() > 0.7) {
      alerts.push({
        id: `alert-${Date.now()}-1`,
        type: 'warning',
        title: '电池温度偏高',
        message: '电池温度达到38°C，建议检查散热系统',
        timestamp: new Date(now.getTime() - Math.random() * 3600000).toISOString(),
        acknowledged: false,
      })
    }
    
    if (Math.random() > 0.9) {
      alerts.push({
        id: `alert-${Date.now()}-2`,
        type: 'info',
        title: '电网电压波动',
        message: '检测到电网电压波动，系统已自动调整',
        timestamp: new Date(now.getTime() - Math.random() * 7200000).toISOString(),
        acknowledged: false,
      })
    }

    return alerts
  }
}

const mockGenerator = new MockDataGenerator()

// ==================== 工具函数 ====================
const formatPower = (w: number): string => {
  if (Math.abs(w) >= 1000) return `${(w / 1000).toFixed(1)} kW`
  return `${Math.round(w)} W`
}

const formatEnergy = (kwh: number): string => {
  if (kwh >= 1000) return `${(kwh / 1000).toFixed(1)} MWh`
  return `${kwh.toFixed(1)} kWh`
}

const formatCurrency = (yuan: number): string => {
  if (yuan >= 10000) return `¥${(yuan / 10000).toFixed(1)}万`
  return `¥${yuan.toFixed(1)}`
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'normal': return 'text-green-400'
    case 'warning': return 'text-yellow-400'
    case 'error': return 'text-red-400'
    default: return 'text-gray-400'
  }
}

const getStatusBg = (status: string) => {
  switch (status) {
    case 'normal': return 'bg-green-500/20'
    case 'warning': return 'bg-yellow-500/20'
    case 'error': return 'bg-red-500/20'
    default: return 'bg-gray-500/20'
  }
}

// ==================== 组件 ====================

// 顶部导航栏
function Header({ alerts, onToggleAlerts, showUserMenu }: { alerts: Alert[], onToggleAlerts: () => void, showUserMenu?: boolean }) {
  const [showMenu, setShowMenu] = useState(false)
  const now = new Date()

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between mb-6 px-4 py-3 glass rounded-2xl relative z-10"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center shadow-lg">
          <Zap className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            逆变器监控中心
          </h1>
          <p className="text-sm text-gray-400 flex items-center gap-2">
            <Clock className="w-3 h-3" />
            {now.toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {/* 告警按钮 */}
        <button 
          onClick={onToggleAlerts}
          className="relative p-2.5 rounded-xl hover:bg-white/10 transition-all group"
        >
          <Bell className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          {alerts.filter(a => !a.acknowledged).length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>

        {/* 用户菜单 */}
        {showUserMenu && (
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              onBlur={() => setTimeout(() => setShowMenu(false), 200)}
              className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/10 transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-48 glass rounded-xl p-2 z-[200] shadow-xl"
                >
                  <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition text-left">
                    <Settings className="w-4 h-4" />
                    <span>系统设置</span>
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition text-left">
                    <HelpCircle className="w-4 h-4" />
                    <span>帮助文档</span>
                  </button>
                  <hr className="my-2 border-white/10" />
                  <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition text-left text-red-400">
                    <LogOut className="w-4 h-4" />
                    <span>退出登录</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.header>
  )
}

// 状态指示器
function StatusBadge({ status }: { status: string }) {
  const statusText = {
    normal: '运行正常',
    warning: '注意',
    error: '故障',
    offline: '离线',
  }

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${getStatusBg(status)}`}>
      <span className={`w-2.5 h-2.5 rounded-full ${
        status === 'normal' ? 'bg-green-400 animate-pulse' :
        status === 'warning' ? 'bg-yellow-400' :
        status === 'error' ? 'bg-red-400 animate-pulse' : 'bg-gray-400'
      }`} />
      <span className={`text-sm font-medium ${getStatusColor(status)}`}>
        {statusText[status as keyof typeof statusText] || status}
      </span>
    </div>
  )
}

// 数据卡片
function DataCard({ 
  icon: Icon, 
  title, 
  value, 
  unit, 
  subValues, 
  color, 
  glow, 
  trend 
}: { 
  icon: React.ElementType
  title: string
  value: string | number
  unit?: string
  subValues?: { label: string; value: string | number }[]
  color: string
  glow?: string
  trend?: 'up' | 'down' | 'stable'
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className={`glass rounded-2xl p-5 ${glow}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${color}`} />
          <span className="text-gray-400 text-sm">{title}</span>
        </div>
        {trend && (
          <div className={`p-1 rounded-lg ${trend === 'up' ? 'bg-green-500/20' : trend === 'down' ? 'bg-red-500/20' : 'bg-gray-500/20'}`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4 text-green-400" /> : 
             trend === 'down' ? <TrendingDown className="w-4 h-4 text-red-400" /> : 
             <Minus className="w-4 h-4 text-gray-400" />}
          </div>
        )}
      </div>
      <div className={`text-3xl font-bold ${color} mb-2`}>
        {value}{unit && <span className="text-lg ml-1 opacity-70">{unit}</span>}
      </div>
      {subValues && (
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
          {subValues.map((sv, i) => (
            <div key={i}>
              {sv.label}: <span className="text-gray-300">{sv.value}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// 主图表
function MainChart({ data, timeRange, onTimeRangeChange }: { 
  data: HistoryPoint[], 
  timeRange: '1h' | '6h' | '12h' | '24h',
  onTimeRangeChange: (range: '1h' | '6h' | '12h' | '24h') => void
}) {
  const filteredData = data.slice(-(timeRange === '1h' ? 6 : timeRange === '6h' ? 36 : timeRange === '12h' ? 72 : 144))

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          功率曲线
        </h2>
        {/* 时间范围选择 */}
        <div className="flex items-center gap-1">
          {(['1h', '6h', '12h', '24h'] as const).map(range => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className={`px-3 py-1.5 rounded-md text-sm transition ${
                timeRange === range ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={filteredData}>
          <defs>
            <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FFB800" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#FFB800" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#A855F7" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="gridGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="time" stroke="#6b7280" fontSize={11} tickLine={false} />
          <YAxis stroke="#6b7280" fontSize={11} tickLine={false} tickFormatter={(v) => `${v/1000}k`} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.95)', 
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}
            labelStyle={{ color: '#fff', marginBottom: 8 }}
          />
          <Area type="monotone" dataKey="solar" stroke="#FFB800" fill="url(#solarGrad)" name="太阳能" strokeWidth={2} />
          <Area type="monotone" dataKey="load" stroke="#A855F7" fill="url(#loadGrad)" name="负载" strokeWidth={2} />
          <Line type="monotone" dataKey="grid" stroke="#3B82F6" name="电网" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )
}

// 电池图表
function BatteryChart({ data }: { data: HistoryPoint[] }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5"
    >
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Battery className="w-5 h-5 text-green-400" />
        电池电量
      </h2>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data.slice(-72)}>
          <defs>
            <linearGradient id="batteryGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="time" stroke="#6b7280" fontSize={10} tickLine={false} />
          <YAxis domain={[0, 100]} stroke="#6b7280" fontSize={10} tickLine={false} tickFormatter={(v) => `${v}%`} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.95)', 
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px'
            }}
            formatter={(v: number) => [`${v.toFixed(0)}%`, 'SOC']}
          />
          <Area type="monotone" dataKey="battery" stroke="#22C55E" fill="url(#batteryGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )
}

// 统计卡片
function StatCard({ icon: Icon, title, value, unit, change, color }: {
  icon: React.ElementType
  title: string
  value: number
  unit: string
  change?: number
  color: string
}) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-sm text-gray-400">{title}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>
        {typeof value === 'number' ? value.toFixed(1) : value}{unit}
      </div>
      {change !== undefined && (
        <div className={`text-xs mt-1 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}% 较昨日
        </div>
      )}
    </div>
  )
}

// 能源流向图
function EnergyFlow({ data }: { data: InverterData }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5"
    >
      <h2 className="text-lg font-semibold mb-6">⚡ 能源流向</h2>
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* 太阳能 */}
        <div className="flex flex-col items-center">
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400/20 to-orange-500/20 flex items-center justify-center mb-3 border border-yellow-400/30"
          >
            <Sun className="w-10 h-10 text-yellow-400" />
          </motion.div>
          <span className="text-sm text-gray-400 mb-1">光伏</span>
          <span className="font-bold text-yellow-400 text-lg">{formatPower(data.solar.power)}</span>
          <span className="text-xs text-gray-500">效率 {data.solar.efficiency.toFixed(1)}%</span>
        </div>

        {/* 流动箭头 */}
        <div className="flex-1 min-w-[60px] h-2 bg-gradient-to-r from-yellow-400/50 via-green-400/50 to-purple-400/50 rounded-full relative overflow-hidden">
          <motion.div 
            animate={{ x: ['0%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="absolute top-0 w-4 h-2 bg-white rounded-full shadow-lg"
          />
        </div>

        {/* 电池 */}
        <div className="flex flex-col items-center">
          <motion.div 
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-3 border ${
              data.battery.status === 'charging' ? 'bg-green-500/20 border-green-400/30' :
              data.battery.status === 'discharging' ? 'bg-orange-500/20 border-orange-400/30' :
              'bg-gray-500/20 border-gray-400/30'
            }`}
          >
            <Battery className={`w-10 h-10 ${
              data.battery.status === 'charging' ? 'text-green-400' :
              data.battery.status === 'discharging' ? 'text-orange-400' :
              'text-gray-400'
            }`} />
          </motion.div>
          <span className="text-sm text-gray-400 mb-1">电池</span>
          <span className={`font-bold text-lg ${
            data.battery.status === 'charging' ? 'text-green-400' :
            data.battery.status === 'discharging' ? 'text-orange-400' :
            'text-gray-300'
          }`}>{data.battery.soc.toFixed(0)}%</span>
          <span className="text-xs text-gray-500">
            {data.battery.status === 'charging' ? '充电中' : 
             data.battery.status === 'discharging' ? '放电中' : '待机'}
          </span>
        </div>

        {/* 流动箭头 */}
        <div className="flex-1 min-w-[60px] h-2 bg-gradient-to-r from-green-400/50 via-blue-400/50 to-purple-400/50 rounded-full relative overflow-hidden">
          <motion.div 
            animate={{ x: ['0%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: 0.5 }}
            className="absolute top-0 w-4 h-2 bg-white rounded-full shadow-lg"
          />
        </div>

        {/* 电网 */}
        <div className="flex flex-col items-center">
          <motion.div 
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400/20 to-cyan-500/20 flex items-center justify-center mb-3 border border-blue-400/30"
          >
            <Plug className="w-10 h-10 text-blue-400" />
          </motion.div>
          <span className="text-sm text-gray-400 mb-1">电网</span>
          <span className={`font-bold text-lg ${
            data.grid.power > 0 ? 'text-red-400' : data.grid.power < 0 ? 'text-green-400' : 'text-gray-300'
          }`}>{formatPower(Math.abs(data.grid.power))}</span>
          <span className="text-xs text-gray-500">
            {data.grid.power > 50 ? '购电' : data.grid.power < -50 ? '卖电' : '平衡'}
          </span>
        </div>

        {/* 流动箭头 */}
        <div className="flex-1 min-w-[60px] h-2 bg-gradient-to-r from-blue-400/50 to-purple-400/50 rounded-full relative overflow-hidden">
          <motion.div 
            animate={{ x: ['0%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: 1 }}
            className="absolute top-0 w-4 h-2 bg-white rounded-full shadow-lg"
          />
        </div>

        {/* 负载 */}
        <div className="flex flex-col items-center">
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-400/20 to-pink-500/20 flex items-center justify-center mb-3 border border-purple-400/30"
          >
            <Home className="w-10 h-10 text-purple-400" />
          </motion.div>
          <span className="text-sm text-gray-400 mb-1">负载</span>
          <span className="font-bold text-purple-400 text-lg">{formatPower(data.load.power)}</span>
          <span className="text-xs text-gray-500">用电负载</span>
        </div>
      </div>
    </motion.div>
  )
}

// 今日统计
function DailyStatistics({ stats }: { stats: DailyStats }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-400" />
          今日统计
        </h2>
        <button className="p-2 rounded-lg hover:bg-white/10 transition">
          <Download className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Sun}
          title="光伏发电"
          value={stats.solarGenerated}
          unit=" kWh"
          change={5.2}
          color="text-yellow-400"
        />
        <StatCard
          icon={Plug}
          title="电网购电"
          value={stats.gridImport}
          unit=" kWh"
          change={-2.1}
          color="text-red-400"
        />
        <StatCard
          icon={TrendingDown}
          title="电网卖电"
          value={stats.gridExport}
          unit=" kWh"
          change={12.5}
          color="text-green-400"
        />
        <StatCard
          icon={Home}
          title="负载用电"
          value={stats.loadConsumed}
          unit=" kWh"
          change={3.8}
          color="text-purple-400"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">今日收益</span>
          </div>
          <div className="text-2xl font-bold text-green-400">
            {formatCurrency(stats.savings)}
          </div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-400">CO₂ 减排</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {stats.co2Saved.toFixed(1)} kg
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// 告警面板
function AlertPanel({ alerts, onClose, onAcknowledge }: { 
  alerts: Alert[], 
  onClose: () => void,
  onAcknowledge: (id: string) => void 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-4 top-24 w-96 glass rounded-2xl p-4 z-[150] max-h-[80vh] overflow-y-auto shadow-2xl"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="w-5 h-5 text-yellow-400" />
          告警通知
        </h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
          <span className="text-gray-400 text-xl">×</span>
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          暂无告警
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-xl ${
                alert.type === 'error' ? 'bg-red-500/10 border border-red-500/20' :
                alert.type === 'warning' ? 'bg-yellow-500/10 border border-yellow-500/20' :
                alert.type === 'success' ? 'bg-green-500/10 border border-green-500/20' :
                'bg-blue-500/10 border border-blue-500/20'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className={`w-4 h-4 ${
                      alert.type === 'error' ? 'text-red-400' :
                      alert.type === 'warning' ? 'text-yellow-400' :
                      alert.type === 'success' ? 'text-green-400' : 'text-blue-400'
                    }`} />
                    <span className="font-medium">{alert.title}</span>
                  </div>
                  <p className="text-sm text-gray-400">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(alert.timestamp).toLocaleString('zh-CN')}
                  </p>
                </div>
                {!alert.acknowledged && (
                  <button 
                    onClick={() => onAcknowledge(alert.id)}
                    className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition"
                  >
                    确认
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// 主应用
function App() {
  const [data, setData] = useState<InverterData | null>(null)
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [showAlerts, setShowAlerts] = useState(false)
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '12h' | '24h'>('24h')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 初始加载
    setData(mockGenerator.generateRealtime())
    setHistory(mockGenerator.getHistory())
    setDailyStats(mockGenerator.getDailyStats())
    setAlerts(mockGenerator.generateAlerts())
    setLoading(false)

    // 实时更新
    const dataInterval = setInterval(() => {
      const newData = mockGenerator.generateRealtime()
      setData(newData)
      
      // 添加历史点
      const newPoint: HistoryPoint = {
        time: `${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}`,
        fullTime: new Date().toISOString(),
        solar: newData.solar.power,
        load: newData.load.power,
        grid: newData.grid.power,
        battery: newData.battery.soc,
        efficiency: newData.efficiency,
      }
      mockGenerator.addHistoryPoint(newPoint)
      setHistory([...mockGenerator.getHistory()])
    }, 2000)

    // 统计更新
    const statsInterval = setInterval(() => {
      setDailyStats(mockGenerator.getDailyStats())
    }, 60000)

    return () => {
      clearInterval(dataInterval)
      clearInterval(statsInterval)
    }
  }, [])

  const handleAcknowledge = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, acknowledged: true } : a
    ))
  }, [])

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw className="w-12 h-12 text-blue-500" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white p-4 md:p-6 max-w-[1600px] mx-auto">
      <Header alerts={alerts} onToggleAlerts={() => setShowAlerts(!showAlerts)} showUserMenu={true} />

      {/* 状态栏 */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <StatusBadge status={data.status} />
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Thermometer className="w-4 h-4" />
          <span>设备温度: {data.temperature.toFixed(1)}°C</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Activity className="w-4 h-4" />
          <span>系统效率: {data.efficiency.toFixed(1)}%</span>
        </div>
      </div>

      {/* 主要数据卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <DataCard
          icon={Sun}
          title="太阳能发电"
          value={formatPower(data.solar.power)}
          subValues={[
            { label: '电压', value: `${data.solar.voltage.toFixed(1)}V` },
            { label: '电流', value: `${data.solar.current.toFixed(2)}A` },
            { label: '效率', value: `${data.solar.efficiency.toFixed(1)}%` },
            { label: '温度', value: `${data.solar.temperature.toFixed(1)}°C` },
          ]}
          color="text-yellow-400"
          glow="glow-solar"
          trend={data.solar.power > 3000 ? 'up' : data.solar.power > 0 ? 'stable' : 'down'}
        />
        <DataCard
          icon={Battery}
          title="电池状态"
          value={data.battery.soc.toFixed(0)}
          unit="%"
          subValues={[
            { label: '电压', value: `${data.battery.voltage.toFixed(1)}V` },
            { label: '电流', value: `${data.battery.current.toFixed(1)}A` },
            { label: 'SOH', value: `${data.battery.soh.toFixed(0)}%` },
            { label: '温度', value: `${data.battery.temperature.toFixed(1)}°C` },
          ]}
          color={`${
            data.battery.soc > 50 ? 'text-green-400' :
            data.battery.soc > 20 ? 'text-yellow-400' : 'text-red-400'
          }`}
          glow={`${
            data.battery.status === 'charging' ? 'glow-battery' :
            data.battery.status === 'discharging' ? 'glow-load' : ''
          }`}
          trend={data.battery.status === 'charging' ? 'up' : data.battery.status === 'discharging' ? 'down' : 'stable'}
        />
        <DataCard
          icon={Plug}
          title="电网状态"
          value={formatPower(Math.abs(data.grid.power))}
          subValues={[
            { label: '电压', value: `${data.grid.voltage.toFixed(1)}V` },
            { label: '频率', value: `${data.grid.frequency.toFixed(2)}Hz` },
            { label: '状态', value: data.grid.import_export === 'import' ? '购电' : data.grid.import_export === 'export' ? '卖电' : '平衡' },
            { label: '质量', value: data.grid.quality === 'good' ? '良好' : data.grid.quality === 'warning' ? '一般' : '较差' },
          ]}
          color="text-blue-400"
          glow="glow-grid"
          trend={data.grid.power > 0 ? 'up' : data.grid.power < 0 ? 'down' : 'stable'}
        />
        <DataCard
          icon={Home}
          title="负载功率"
          value={formatPower(data.load.power)}
          subValues={[
            { label: '电压', value: `${data.load.voltage.toFixed(1)}V` },
            { label: '电流', value: `${data.load.current.toFixed(2)}A` },
          ]}
          color="text-purple-400"
          glow="glow-load"
        />
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <MainChart data={history} timeRange={timeRange} onTimeRangeChange={setTimeRange} />
        </div>
        <BatteryChart data={history} />
      </div>

      {/* 能源流向 */}
      <div className="mb-6">
        <EnergyFlow data={data} />
      </div>

      {/* 今日统计 */}
      {dailyStats && <DailyStatistics stats={dailyStats} />}

      {/* 底部信息 */}
      <div className="mt-6 text-center text-sm text-gray-500 flex items-center justify-center gap-4">
        <span>最后更新: {new Date(data.timestamp).toLocaleString('zh-CN')}</span>
        <span>|</span>
        <span>逆变器监控系统 v2.0</span>
      </div>

      {/* 告警面板 */}
      <AnimatePresence>
        {showAlerts && (
          <AlertPanel 
            alerts={alerts} 
            onClose={() => setShowAlerts(false)}
            onAcknowledge={handleAcknowledge}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
