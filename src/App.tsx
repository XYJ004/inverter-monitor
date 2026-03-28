import { useState, useEffect, useCallback } from 'react'
import { 
  Sun, Battery, Plug, Home, AlertTriangle, RefreshCw,
  TrendingUp, TrendingDown, Minus, Settings, Bell, 
  Activity, DollarSign, Calendar, Download, 
  Thermometer, Clock, ChevronDown, ChevronRight,
  Zap, Gauge, Timer, History, FileText, Users
} from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'

// ==================== 类型定义 ====================
interface InverterData {
  timestamp: string
  solar: { power: number; voltage: number; current: number; efficiency: number; temperature: number }
  battery: { voltage: number; current: number; soc: number; soh: number; temperature: number; cycles: number; status: 'charging' | 'discharging' | 'idle' }
  grid: { voltage: number; frequency: number; power: number; import_export: 'import' | 'export' | 'idle'; quality: 'good' | 'warning' | 'poor' }
  load: { power: number; voltage: number; current: number }
  status: 'normal' | 'warning' | 'error' | 'offline'
  temperature: number
  efficiency: number
}

interface Alert { id: string; type: 'info' | 'warning' | 'error' | 'success'; title: string; message: string; timestamp: string; acknowledged: boolean }
interface HistoryPoint { time: string; fullTime: string; solar: number; load: number; grid: number; battery: number; efficiency: number }

// ==================== 模拟数据生成器 ====================
class MockDataGenerator {
  private historyData: HistoryPoint[] = []
  constructor() { this.generateHistory() }
  
  private getSolarPower(hour: number): number {
    if (hour < 6 || hour > 18) return 0
    return 5500 * Math.sin((hour - 6) / 12 * Math.PI) + (Math.random() - 0.5) * 500
  }
  
  private getBatterySOC(hour: number, solar: number): number {
    const base = 50 + 25 * Math.sin((hour - 6) / 24 * 2 * Math.PI)
    if (solar > 2000) return Math.min(95, base + 15)
    if (solar < 500) return Math.max(10, base - 10)
    return base
  }

  generateRealtime(): InverterData {
    const now = new Date()
    const hour = now.getHours() + now.getMinutes() / 60
    const solar = this.getSolarPower(hour)
    const batterySOC = this.getBatterySOC(hour, solar)
    const batteryCurrent = solar > 2000 ? 15 + Math.random() * 10 : solar < 500 ? -15 - Math.random() * 10 : (Math.random() - 0.5) * 10
    const load = 800 + Math.random() * 1500 + (hour >= 7 && hour <= 9 ? 500 : 0) + (hour >= 18 && hour <= 22 ? 800 : 0)
    const grid = load - solar - batteryCurrent * 48
    const gridVoltage = 220 + (Math.random() - 0.5) * 10
    
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
    }
  }

  private generateHistory() {
    const now = new Date()
    for (let i = 24 * 6; i >= 0; i--) {
      const t = new Date(now.getTime() - i * 10 * 60 * 1000)
      const hour = t.getHours() + t.getMinutes() / 60
      const solar = this.getSolarPower(hour)
      const load = 800 + Math.random() * 1500 + (hour >= 7 && hour <= 9 ? 500 : 0) + (hour >= 18 && hour <= 22 ? 800 : 0)
      this.historyData.push({
        time: `${t.getHours()}:${String(t.getMinutes()).padStart(2, '0')}`,
        fullTime: t.toISOString(),
        solar: Math.max(0, solar),
        load,
        grid: load - solar + (Math.random() - 0.5) * 500,
        battery: this.getBatterySOC(hour, solar),
        efficiency: 95 + (Math.random() - 0.5) * 4,
      })
    }
  }

  getHistory(): HistoryPoint[] { return this.historyData }
  addHistoryPoint(p: HistoryPoint) { this.historyData.push(p); if (this.historyData.length > 145) this.historyData.shift() }
  getDailyStats() { return { solarGenerated: 32.5 + (Math.random() - 0.5) * 5, gridImport: 5.2 + (Math.random() - 0.5) * 2, gridExport: 12.8 + (Math.random() - 0.5) * 3, savings: 687.50 + (Math.random() - 0.5) * 50, co2Saved: 16 + (Math.random() - 0.5) * 2 } }
  generateAlerts(): Alert[] {
    if (Math.random() > 0.7) return [{ id: `a-${Date.now()}`, type: 'warning', title: '电池温度偏高', message: '当前温度38°C，建议检查散热', timestamp: new Date().toISOString(), acknowledged: false }]
    return []
  }
}

const mockGenerator = new MockDataGenerator()

// ==================== 工具函数 ====================
const formatPower = (w: number) => Math.abs(w) >= 1000 ? `${(w / 1000).toFixed(1)} kW` : `${Math.round(w)} W`
const formatCurrency = (y: number) => y >= 10000 ? `¥${(y / 10000).toFixed(1)}万` : `¥${y.toFixed(1)}`

// ==================== 大号电池组件 ====================
function BatteryGauge({ data }: { data: InverterData['battery'] }) {
  const soc = data.soc
  const circumference = 2 * Math.PI * 120
  const strokeDashoffset = circumference - (soc / 100) * circumference
  
  const getColor = () => {
    if (soc > 60) return { main: '#22c55e', glow: 'rgba(34, 197, 94, 0.3)' }
    if (soc > 30) return { main: '#eab308', glow: 'rgba(234, 179, 8, 0.3)' }
    return { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.3)' }
  }
  const color = getColor()
  
  const statusText = data.status === 'charging' ? '充电中' : data.status === 'discharging' ? '放电中' : '待机'
  const statusIcon = data.status === 'charging' ? '↑' : data.status === 'discharging' ? '↓' : '—'
  const statusColor = data.status === 'charging' ? 'text-green-400' : data.status === 'discharging' ? 'text-orange-400' : 'text-gray-400'

  return (
    <div className="glass rounded-3xl p-8 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Battery className="w-6 h-6 text-green-400" />
          电池系统
        </h3>
        <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusColor} bg-white/5`}>
          {statusIcon} {statusText}
        </div>
      </div>

      <div className="flex items-center gap-8">
        {/* 大号 SOC 仪表盘 */}
        <div className="relative w-64 h-64 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 256 256">
            {/* 背景圆环 */}
            <circle cx="128" cy="128" r="120" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
            {/* 进度圆环 */}
            <motion.circle
              cx="128" cy="128" r="120"
              fill="none"
              stroke={color.main}
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ filter: `drop-shadow(0 0 20px ${color.glow})` }}
            />
          </svg>
          
          {/* 中心内容 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-6xl font-bold"
              style={{ color: color.main }}
            >
              {soc.toFixed(0)}%
            </motion.div>
            <div className="text-gray-400 text-sm mt-1">电量</div>
          </div>
        </div>

        {/* 详细信息 */}
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="text-gray-400 text-sm mb-1">电压</div>
            <div className="text-2xl font-bold text-white">{data.voltage.toFixed(1)} <span className="text-sm text-gray-500">V</span></div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="text-gray-400 text-sm mb-1">电流</div>
            <div className={`text-2xl font-bold ${data.current > 0 ? 'text-green-400' : data.current < 0 ? 'text-orange-400' : 'text-white'}`}>
              {data.current > 0 ? '+' : ''}{data.current.toFixed(1)} <span className="text-sm text-gray-500">A</span>
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="text-gray-400 text-sm mb-1">温度</div>
            <div className={`text-2xl font-bold ${data.temperature > 40 ? 'text-red-400' : 'text-white'}`}>
              {data.temperature.toFixed(1)} <span className="text-sm text-gray-500">°C</span>
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="text-gray-400 text-sm mb-1">健康度</div>
            <div className="text-2xl font-bold text-green-400">{data.soh.toFixed(0)}%</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 col-span-2">
            <div className="text-gray-400 text-sm mb-1">累计循环</div>
            <div className="text-2xl font-bold text-white">{data.cycles} <span className="text-sm text-gray-500">次</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== 功率卡片 ====================
function PowerCard({ icon: Icon, title, value, unit, subtitle, color, trend }: {
  icon: React.ElementType; title: string; value: number; unit: string; subtitle?: string; color: string; trend?: 'up' | 'down' | 'stable'
}) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${color}`} />
          <span className="text-gray-400">{title}</span>
        </div>
        {trend && (
          <div className={`p-1.5 rounded-lg ${trend === 'up' ? 'bg-green-500/20' : trend === 'down' ? 'bg-red-500/20' : 'bg-gray-500/20'}`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4 text-green-400" /> : trend === 'down' ? <TrendingDown className="w-4 h-4 text-red-400" /> : <Minus className="w-4 h-4 text-gray-400" />}
          </div>
        )}
      </div>
      <div className={`text-4xl font-bold ${color} mb-1`}>
        {formatPower(value)}
      </div>
      {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
    </div>
  )
}

// ==================== 主图表 ====================
function PowerChart({ data }: { data: HistoryPoint[] }) {
  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-blue-400" />
        功率趋势
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data.slice(-72)}>
          <defs>
            <linearGradient id="solarG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FFB800" stopOpacity={0.3}/><stop offset="95%" stopColor="#FFB800" stopOpacity={0}/></linearGradient>
            <linearGradient id="loadG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#A855F7" stopOpacity={0.3}/><stop offset="95%" stopColor="#A855F7" stopOpacity={0}/></linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="time" stroke="#6b7280" fontSize={11} tickLine={false} />
          <YAxis stroke="#6b7280" fontSize={11} tickLine={false} tickFormatter={(v) => `${v/1000}k`} />
          <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '12px' }} />
          <Area type="monotone" dataKey="solar" stroke="#FFB800" fill="url(#solarG)" name="太阳能" strokeWidth={2} />
          <Area type="monotone" dataKey="load" stroke="#A855F7" fill="url(#loadG)" name="负载" strokeWidth={2} />
          <Line type="monotone" dataKey="grid" stroke="#3B82F6" name="电网" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ==================== 统计卡片 ====================
function StatCard({ icon: Icon, label, value, unit, color }: { icon: React.ElementType; label: string; value: number; unit: string; color: string }) {
  return (
    <div className="glass rounded-xl p-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <div className="text-gray-400 text-sm">{label}</div>
        <div className="text-xl font-bold text-white">{typeof value === 'number' ? value.toFixed(1) : value}{unit}</div>
      </div>
    </div>
  )
}

// ==================== 主应用 ====================
function App() {
  const [data, setData] = useState<InverterData | null>(null)
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [stats, setStats] = useState(mockGenerator.getDailyStats())
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setData(mockGenerator.generateRealtime())
    setHistory(mockGenerator.getHistory())
    setAlerts(mockGenerator.generateAlerts())
    setLoading(false)

    const interval = setInterval(() => {
      const d = mockGenerator.generateRealtime()
      setData(d)
      mockGenerator.addHistoryPoint({ time: `${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}`, fullTime: d.timestamp, solar: d.solar.power, load: d.load.power, grid: d.grid.power, battery: d.battery.soc, efficiency: d.efficiency })
      setHistory([...mockGenerator.getHistory()])
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  if (loading || !data) {
    return <div className="min-h-screen flex items-center justify-center"><RefreshCw className="w-12 h-12 animate-spin text-blue-500" /></div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">逆变器监控系统</h1>
              <p className="text-gray-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {new Date().toLocaleString('zh-CN')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-full ${data.status === 'normal' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              <span className={`w-2 h-2 rounded-full inline-block mr-2 ${data.status === 'normal' ? 'bg-green-400' : 'bg-yellow-400'}`} />
              {data.status === 'normal' ? '系统正常' : '注意'}
            </div>
            <button className="relative p-3 rounded-xl hover:bg-white/10">
              <Bell className="w-5 h-5 text-gray-400" />
              {alerts.filter(a => !a.acknowledged).length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />}
            </button>
            <button className="p-3 rounded-xl hover:bg-white/10">
              <Settings className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </header>

        {/* 主要功率指标 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <PowerCard icon={Sun} title="太阳能发电" value={data.solar.power} unit="W" color="text-yellow-400" trend={data.solar.power > 3000 ? 'up' : 'stable'} />
          <PowerCard icon={Plug} title="电网功率" value={data.grid.power} unit="W" subtitle={data.grid.power > 0 ? '购电中' : data.grid.power < 0 ? '卖电中' : '平衡'} color="text-blue-400" trend={data.grid.power > 0 ? 'up' : data.grid.power < 0 ? 'down' : 'stable'} />
          <PowerCard icon={Home} title="负载功率" value={data.load.power} unit="W" color="text-purple-400" />
          <PowerCard icon={Gauge} title="系统效率" value={data.efficiency} unit="%" color="text-green-400" />
        </div>

        {/* 电池系统 + 图表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <BatteryGauge data={data.battery} />
          <PowerChart data={history} />
        </div>

        {/* 今日统计 */}
        <div className="glass rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            今日统计
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard icon={Sun} label="光伏发电" value={stats.solarGenerated} unit=" kWh" color="bg-yellow-500/20" />
            <StatCard icon={Plug} label="电网购电" value={stats.gridImport} unit=" kWh" color="bg-red-500/20" />
            <StatCard icon={TrendingDown} label="电网卖电" value={stats.gridExport} unit=" kWh" color="bg-green-500/20" />
            <StatCard icon={DollarSign} label="今日收益" value={stats.savings} unit=" ¥" color="bg-emerald-500/20" />
            <StatCard icon={Activity} label="CO₂减排" value={stats.co2Saved} unit=" kg" color="bg-blue-500/20" />
          </div>
        </div>

        {/* 底部 */}
        <footer className="text-center text-gray-500 text-sm">
          逆变器监控系统 v2.0 | 设备温度: {data.temperature.toFixed(1)}°C | 最后更新: {new Date(data.timestamp).toLocaleTimeString('zh-CN')}
        </footer>
      </div>
    </div>
  )
}

export default App
