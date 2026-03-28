// src/components/PowerCard.tsx

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface PowerCardProps {
  icon: LucideIcon;
  title: string;
  value: number;
  subtitle?: string;
  color: string;
  trend?: 'up' | 'down' | 'stable';
  bgColor?: string;
}

export function PowerCard({ icon: Icon, title, value, subtitle, color, trend, bgColor = 'bg-white/5' }: PowerCardProps) {
  const formatPower = (w: number) => {
    if (Math.abs(w) >= 1000) return `${(w / 1000).toFixed(1)} kW`;
    return `${Math.round(w)} W`;
  };

  return (
    <div className={`${bgColor} rounded-xl p-4 hover:bg-white/10 transition-colors`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${color}`} />
          <span className="text-gray-400 text-sm">{title}</span>
        </div>
        {trend && (
          <div className={`p-1.5 rounded-lg ${
            trend === 'up' ? 'bg-green-500/20' : 
            trend === 'down' ? 'bg-red-500/20' : 
            'bg-gray-500/20'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4 text-green-400" /> : 
             trend === 'down' ? <TrendingDown className="w-4 h-4 text-red-400" /> : 
             <Minus className="w-4 h-4 text-gray-400" />}
          </div>
        )}
      </div>
      <div className={`text-3xl font-bold ${color}`}>
        {formatPower(value)}
      </div>
      {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
}
