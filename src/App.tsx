import { useState, useEffect } from 'react'
import { 
  Sun, Battery, Plug, Home, AlertTriangle, RefreshCw,
  TrendingUp, TrendingDown, Minus, Settings, Bell, Menu
} from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'

interface InverterData {
  timestamp: string
  solar: { power: number; voltage: number; current: number }
  battery: { voltage: number; current: number; soc: number; temperature: number }
  grid: { voltage: number; frequency: number; power: number }
  load: { power: number }
  status: 'normal' | 'warning' | 'error'
  alerts: Alert[]
}

interface Alert {
  id: string
  type: 'info' | 'warning' | 'error'
  message: string
  timestamp: string
}

interface HistoryPoint {
  time: string
  solar: number
  load: number
  grid: number
  battery: number
}

const API_URL = 'http://localhost:3002/api'

// 模拟数据生成
const generateMockData = (): InverterData => {
  const hour = new Date().getHours()
  const baseSolar = 6 <= hour && hour <= 18 
    ? 5000 * (1 - Math.abs(hour - 12) / 6) 
    : 0
  
  return {
    timestamp: new Date().toISOString(),
    solar: {
      power: Math.max(0, baseSolar + (Math.random() - 0.5) * 1000),
      voltage: 300 + (Math.random() - 0.5) * 20,
      current: Math.max(0, baseSolar / 300 + (Math.random() - 0.5) * 2),
    },
    battery: {
      voltage: 48 + (Math.random() - 0.5) * 4,
      current: (Math.random() - 0.5) * 40,
      soc: 30 + Math.random() * 60,
      temperature: 25 + Math.random() * 10,
    },
    grid: {
      voltage: 220 + (Math.random() - 0.5) * 10,
      frequency: 50 + (Math.random() - 0.5) * 0.4,
      power: (Math.random() - 0.5) * 2000,
    },
    load: {
      power: 500 + Math.random() * 2500,
    },
    status: Math.random() > 0.95 ? 'warning' : 'normal',
    alerts: Math.random() > 0.9 ? [{
      id: Date.now().toString(),
      type: 'warning',
      message: '电池温度偏高',
      timestamp: new Date().toISOString(),
    }] : [],
  }
}

const generateHistory = (): HistoryPoint[] => {
  const data: HistoryPoint[] = []
  const now = new Date()
  
  for (let i = 24 * 6; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 10 * 60 * 1000)
    const hour = t.getHours()
    const solar = 6 <= hour && hour <= 18 
      ? 5000 * (1 - Math.abs(hour - 12) / 6) + (Math.random() - 0.5) * 1000
      : 0
    
    data.push({
      time: `${t.getHours()}:${String(t.getMinutes()).padStart(2, '0')}`,
      solar: Math.max(0, solar),
      load: 500 + Math.random() * 2000,
      grid: (Math.random() - 0.5) * 1500,
      battery: 20 + Math.random() * 70,
    })
  }
  
  return data
}

function App() {
  const [data, setData] = useState<InverterData | null>(null)
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [showAlerts, setShowAlerts] = useState(false)
  const [darkMode, setDarkMode] = useState(true)

  useEffect(() => {
    // 初始加载
    const loadData = () => {
      setData(generateMockData())
      setLoading(false)
    }
    
    loadData()
    setHistory(generateHistory())
    
    // 定时更新
    const interval = setInterval(() => {
      setData(generateMockData())
    }, 2000)
    
    const historyInterval = setInterval(() => {
      setHistory(prev => {
        const newPoint = {
          time: `${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}`,
          solar: Math.max(0, 5000 * (1 - Math.abs(new Date().getHours() - 12) / 6) + (Math.random() - 0.5) * 1000),
          load: 500 + Math.random() * 2000,
          grid: (Math.random() - 0.5) * 1500,
          battery: 20 + Math.random() * 70,
        }
        return [...prev.slice(1), newPoint]
      })
    }, 10000)
    
    return () => {
      clearInterval(interval)
      clearInterval(historyInterval)
    }
  }, [])

  const formatPower = (w: number) => {
    if (Math.abs(w) >= 1000) return `${(w / 1000).toFixed(1)} kW`
    return `${Math.round(w)} W`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white p-4 md:p-6">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
            <Sun className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">逆变器监控中心</h1>
            <p className="text-sm text-gray-400">实时能源管理系统</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
            data?.status === 'normal' ? 'bg-green-500/20 text-green-400' :
            data?.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              data?.status === 'normal' ? 'bg-green-400 animate-pulse' :
              data?.status === 'warning' ? 'bg-yellow-400' :
              'bg-red-400'
            }`} />
            <span className="text-sm font-medium">
              {data?.status === 'normal' ? '运行正常' : 
               data?.status === 'warning' ? '警告' : '故障'}
            </span>
          </div>
          
          <button 
            onClick={() => setShowAlerts(!showAlerts)}
            className="relative p-2 rounded-lg hover:bg-white/5 transition"
          >
            <Bell className="w-5 h-5" />
            {data?.alerts && data.alerts.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
          
          <button className="p-2 rounded-lg hover:bg-white/5 transition">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </motion.header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Solar Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-5 glow-solar"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-400">太阳能发电</span>
            </div>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-yellow-400 mb-2">
            {formatPower(data?.solar.power || 0)}
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
            <div>电压: <span className="text-gray-300">{data?.solar.voltage.toFixed(1)}V</span></div>
            <div>电流: <span className="text-gray-300">{data?.solar.current.toFixed(2)}A</span></div>
          </div>
        </motion.div>

        {/* Battery Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-5 glow-battery"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Battery className="w-5 h-5 text-green-400" />
              <span className="text-gray-400">电池状态</span>
            </div>
            <span className={`text-sm ${
              (data?.battery.soc || 0) > 50 ? 'text-green-400' :
              (data?.battery.soc || 0) > 20 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {(data?.battery.current || 0) > 0 ? '充电中' : '放电中'}
            </span>
          </div>
          <div className="text-3xl font-bold text-green-400 mb-2">
            {(data?.battery.soc || 0).toFixed(0)}%
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${data?.battery.soc}%` }}
              className={`h-full rounded-full ${
                (data?.battery.soc || 0) > 50 ? 'bg-green-500' :
                (data?.battery.soc || 0) > 20 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm text-gray-500">
            <div>电压: <span className="text-gray-300">{data?.battery.voltage.toFixed(1)}V</span></div>
            <div>电流: <span className="text-gray-300">{data?.battery.current.toFixed(1)}A</span></div>
            <div>温度: <span className="text-gray-300">{data?.battery.temperature.toFixed(0)}°C</span></div>
          </div>
        </motion.div>

        {/* Grid Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-5 glow-grid"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Plug className="w-5 h-5 text-blue-400" />
              <span className="text-gray-400">电网状态</span>
            </div>
            {(data?.grid.power || 0) > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
          </div>
          <div className="text-3xl font-bold text-blue-400 mb-2">
            {formatPower(Math.abs(data?.grid.power || 0))}
            <span className="text-sm ml-2">
              {(data?.grid.power || 0) > 0 ? '购电' : '卖电'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
            <div>电压: <span className="text-gray-300">{data?.grid.voltage.toFixed(1)}V</span></div>
            <div>频率: <span className="text-gray-300">{data?.grid.frequency.toFixed(2)}Hz</span></div>
          </div>
        </motion.div>

        {/* Load Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-5 glow-load"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-purple-400" />
              <span className="text-gray-400">负载功率</span>
            </div>
            <Minus className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-purple-400 mb-2">
            {formatPower(data?.load.power || 0)}
          </div>
          <div className="text-sm text-gray-500">
            当前总用电负载
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Main Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 glass rounded-2xl p-5"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            功率曲线 (24小时)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={history.slice(-72)}>
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: 'none',
                  borderRadius: '8px'
                }}
              />
              <Area type="monotone" dataKey="solar" stroke="#FFB800" fill="url(#solarGradient)" name="太阳能" />
              <Area type="monotone" dataKey="load" stroke="#A855F7" fill="url(#loadGradient)" name="负载" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Battery Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-2xl p-5"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Battery className="w-5 h-5 text-green-400" />
            电池电量
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={history.slice(-36)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="time" stroke="#6b7280" fontSize={10} />
              <YAxis domain={[0, 100]} stroke="#6b7280" fontSize={10} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: 'none',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="battery" 
                stroke="#22C55E" 
                strokeWidth={2}
                dot={false}
                name="SOC %"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Energy Flow */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="glass rounded-2xl p-5"
      >
        <h2 className="text-lg font-semibold mb-4">⚡ 能源流向</h2>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400/20 to-orange-500/20 flex items-center justify-center mb-2">
              <Sun className="w-8 h-8 text-yellow-400" />
            </div>
            <span className="text-sm text-gray-400">光伏</span>
            <span className="font-bold text-yellow-400">{formatPower(data?.solar.power || 0)}</span>
          </div>
          
          <div className="flex-1 h-1 bg-gradient-to-r from-yellow-400/50 via-green-400/50 to-purple-400/50 relative">
            <motion.div 
              animate={{ x: [0, 100, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"
            />
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400/20 to-emerald-500/20 flex items-center justify-center mb-2">
              <Battery className="w-8 h-8 text-green-400" />
            </div>
            <span className="text-sm text-gray-400">电池</span>
            <span className="font-bold text-green-400">{(data?.battery.soc || 0).toFixed(0)}%</span>
          </div>
          
          <div className="flex-1 h-1 bg-gradient-to-r from-green-400/50 via-blue-400/50 to-purple-400/50 relative">
            <motion.div 
              animate={{ x: [0, 100, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"
            />
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400/20 to-cyan-500/20 flex items-center justify-center mb-2">
              <Plug className="w-8 h-8 text-blue-400" />
            </div>
            <span className="text-sm text-gray-400">电网</span>
            <span className="font-bold text-blue-400">{formatPower(Math.abs(data?.grid.power || 0))}</span>
          </div>
          
          <div className="flex-1 h-1 bg-gradient-to-r from-blue-400/50 to-purple-400/50 relative">
            <motion.div 
              animate={{ x: [0, 100, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"
            />
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400/20 to-pink-500/20 flex items-center justify-center mb-2">
              <Home className="w-8 h-8 text-purple-400" />
            </div>
            <span className="text-sm text-gray-400">负载</span>
            <span className="font-bold text-purple-400">{formatPower(data?.load.power || 0)}</span>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="mt-6 text-center text-sm text-gray-500">
        最后更新: {new Date().toLocaleString('zh-CN')}
      </div>
    </div>
  )
}

export default App
