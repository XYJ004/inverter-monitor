// src/pages/Analysis.tsx

import { useState, useMemo } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Sun, Calendar, TrendingUp, TrendingDown, Zap, 
  DollarSign, Leaf, BarChart3, Download
} from 'lucide-react';
import type { HistoryPoint, DailyStats } from '../types';

interface AnalysisProps {
  history: HistoryPoint[];
  stats: DailyStats;
}

type TimeRange = 'day' | 'week' | 'month';

export function Analysis({ history, stats }: AnalysisProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('day');

  // 计算发电统计数据
  const analysisData = useMemo(() => {
    const totalSolar = history.reduce((sum, h) => sum + h.solar, 0) / 6000; // 转换为 kWh
    const totalLoad = history.reduce((sum, h) => sum + h.load, 0) / 6000;
    const avgEfficiency = history.reduce((sum, h) => sum + h.efficiency, 0) / history.length;
    const peakSolar = Math.max(...history.map(h => h.solar));
    const peakLoad = Math.max(...history.map(h => h.load));
    
    // 按小时聚合数据
    const hourlyData = history.reduce((acc, h) => {
      const hour = h.time.split(':')[0];
      if (!acc[hour]) {
        acc[hour] = { hour, solar: 0, load: 0, grid: 0, count: 0 };
      }
      acc[hour].solar += h.solar;
      acc[hour].load += h.load;
      acc[hour].grid += h.grid;
      acc[hour].count++;
      return acc;
    }, {} as Record<string, { hour: string; solar: number; load: number; grid: number; count: number }>);

    const hourlyArray = Object.values(hourlyData).map(d => ({
      hour: `${d.hour}:00`,
      solar: Math.round(d.solar / d.count),
      load: Math.round(d.load / d.count),
      grid: Math.round(d.grid / d.count),
    }));

    // 发电时段分析
    const peakHours = hourlyArray.filter(h => h.solar > peakSolar * 0.5).map(h => h.hour);
    
    return {
      totalSolar: totalSolar.toFixed(1),
      totalLoad: totalLoad.toFixed(1),
      avgEfficiency: avgEfficiency.toFixed(1),
      peakSolar,
      peakLoad,
      hourlyData: hourlyArray,
      peakHours,
    };
  }, [history]);

  // 饼图数据
  const pieData = [
    { name: '太阳能自用', value: 65, color: '#FFB800' },
    { name: '电网购电', value: 20, color: '#3B82F6' },
    { name: '卖电收入', value: 15, color: '#22C55E' },
  ];

  // 周数据模拟
  const weekData = [
    { day: '周一', solar: 28.5, load: 22.3, savings: 17.1 },
    { day: '周二', solar: 32.1, load: 24.8, savings: 19.3 },
    { day: '周三', solar: 25.6, load: 21.5, savings: 15.4 },
    { day: '周四', solar: 35.2, load: 26.1, savings: 21.1 },
    { day: '周五', solar: 30.8, load: 23.7, savings: 18.5 },
    { day: '周六', solar: 38.4, load: 28.2, savings: 23.0 },
    { day: '今天', solar: parseFloat(analysisData.totalSolar), load: parseFloat(analysisData.totalLoad), savings: stats.savings },
  ];

  const StatCard = ({ icon: Icon, label, value, unit, color, trend }: { 
    icon: typeof Sun; label: string; value: string | number; unit: string; color: string;
    trend?: 'up' | 'down' | 'stable';
  }) => (
    <div className="glass rounded-xl p-4 hover:bg-white/5 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <span className="text-gray-400 text-sm">{label}</span>
        </div>
        {trend && (
          <div className={`text-xs ${trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'}`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white">
        {value}
        <span className="text-sm text-gray-500 ml-1">{unit}</span>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* 时间范围选择 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-yellow-400" />
          发电分析
        </h2>
        <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
          {(['day', 'week', 'month'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {range === 'day' ? '今日' : range === 'week' ? '本周' : '本月'}
            </button>
          ))}
        </div>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard icon={Sun} label="总发电量" value={analysisData.totalSolar} unit="kWh" color="bg-yellow-500/80" trend="up" />
        <StatCard icon={Zap} label="总用电量" value={analysisData.totalLoad} unit="kWh" color="bg-purple-500/80" />
        <StatCard icon={TrendingUp} label="峰值发电" value={(analysisData.peakSolar / 1000).toFixed(1)} unit="kW" color="bg-orange-500/80" />
        <StatCard icon={TrendingDown} label="峰值负载" value={(analysisData.peakLoad / 1000).toFixed(1)} unit="kW" color="bg-red-500/80" />
        <StatCard icon={DollarSign} label="今日收益" value={stats.savings.toFixed(1)} unit="¥" color="bg-green-500/80" trend="up" />
        <StatCard icon={Leaf} label="CO₂减排" value={stats.co2Saved.toFixed(1)} unit="kg" color="bg-emerald-500/80" />
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 小时发电曲线 */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            今日发电曲线
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={analysisData.hourlyData}>
              <defs>
                <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFB800" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#FFB800" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A855F7" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" stroke="#6b7280" fontSize={11} tickLine={false} interval={2} />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} tickFormatter={(v) => `${v/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '12px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="solar" stroke="#FFB800" fill="url(#solarGrad)" name="太阳能" strokeWidth={2} />
              <Area type="monotone" dataKey="load" stroke="#A855F7" fill="url(#loadGrad)" name="负载" strokeWidth={2} />
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
          </div>
        </div>

        {/* 能源来源饼图 */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">能源来源分布</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '12px' }}
                formatter={(value: number) => [`${value}%`, '']}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => <span className="text-gray-300">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 周对比柱状图 */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-400" />
            本周发电对比
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="#6b7280" fontSize={11} tickLine={false} />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} tickFormatter={(v) => `${v}kWh`} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '12px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="solar" fill="#FFB800" name="发电量" radius={[4, 4, 0, 0]} />
              <Bar dataKey="load" fill="#A855F7" name="用电量" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 收益趋势 */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            本周收益趋势
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="#6b7280" fontSize={11} tickLine={false} />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} tickFormatter={(v) => `¥${v}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '12px' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value: number) => [`¥${value.toFixed(1)}`, '收益']}
              />
              <Line type="monotone" dataKey="savings" stroke="#22C55E" strokeWidth={3} dot={{ fill: '#22C55E', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 分析报告 */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            发电效率分析报告
          </h3>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm">
            <Download className="w-4 h-4" />
            导出报告
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">系统平均效率</div>
            <div className="text-3xl font-bold text-green-400">{analysisData.avgEfficiency}%</div>
            <div className="text-xs text-gray-500 mt-1">较上周 +1.2%</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">最佳发电时段</div>
            <div className="text-xl font-bold text-yellow-400">11:00 - 14:00</div>
            <div className="text-xs text-gray-500 mt-1">峰值功率可达 {(analysisData.peakSolar/1000).toFixed(1)} kW</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">自发自用比例</div>
            <div className="text-3xl font-bold text-blue-400">65%</div>
            <div className="text-xs text-gray-500 mt-1">建议：优化负载时段</div>
          </div>
        </div>
        <div className="mt-4 p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <div className="text-yellow-400 font-medium">优化建议</div>
              <div className="text-gray-400 text-sm mt-1">
                建议将大功率负载（如洗衣机、热水器）安排在 10:00-15:00 时段运行，可提高自发自用比例约 15%，预计月增收 ¥120-180。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
