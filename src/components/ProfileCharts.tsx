"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { cn } from '@/lib/utils';

// Graphique Profit/Loss
interface ProfitChartProps {
  data: Array<{
    date: string;
    profit: number;
    day: string;
  }>;
}

export function ProfitChart({ data }: ProfitChartProps) {
  return (
    <div className="bg-surface rounded-xl p-6 border border-white/5">
      <h3 className="text-lg font-bold text-white mb-4">📈 Profit/Loss (30 derniers jours)</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis 
            dataKey="day" 
            stroke="#64748b"
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <YAxis 
            stroke="#64748b"
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1A1D26',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value: any) => {
              const numValue = Number(value);
              return [`$${numValue.toFixed(2)}`, 'Profit'];
            }}
            labelStyle={{ color: '#94a3b8' }}
          />
          {/* Ligne de référence à 0 */}
          <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
          
          {/* Ligne de profit - vert si positif, rouge si négatif */}
          <Line
            type="monotone"
            dataKey="profit"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Légende */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-success rounded-full" />
          <span className="text-text-tertiary">Profit positif</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-accent-rose rounded-full" />
          <span className="text-text-tertiary">Profit négatif</span>
        </div>
      </div>
    </div>
  );
}

// Graphique Performance par Jeu
interface GamePerformanceChartProps {
  data: Array<{
    name: string;
    profit: number;
    plays: number;
  }>;
}

export function GamePerformanceChart({ data }: GamePerformanceChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-surface rounded-xl p-6 border border-white/5">
        <h3 className="text-lg font-bold text-white mb-4">🎮 Performance par Jeu</h3>
        <p className="text-text-tertiary text-center py-8">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl p-6 border border-white/5">
      <h3 className="text-lg font-bold text-white mb-4">🎮 Performance par Jeu (Top 5)</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis 
            type="number"
            stroke="#64748b"
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickFormatter={(value) => `$${value}`}
          />
          <YAxis 
            type="category"
            dataKey="name"
            stroke="#64748b"
            tick={{ fill: '#fff', fontSize: 13, fontWeight: 600 }}
            width={80}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1A1D26',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value: any, name: any, props: any) => {
              const numValue = Number(value);
              const plays = props?.payload?.plays || 0;
              return [`$${numValue.toFixed(2)} (${plays} parties)`, 'Profit'];
            }}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Bar 
            dataKey="profit" 
            fill="#F59E0B"
            radius={[0, 8, 8, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}