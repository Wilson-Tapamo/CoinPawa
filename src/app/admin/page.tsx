"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Wallet,
  TrendingUp,
  Activity,
  DollarSign,
  Gamepad2,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Trophy,
  ArrowDownToLine
} from "lucide-react";
import { cn, formatToUSD } from "@/lib/utils";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalWagered: number;
  totalGames: number;
  pendingWithdrawals: number;
  houseProfit: number;
  userGrowth: number;
  revenueGrowth: number;
}

interface ChartData {
  revenueData: Array<{ date: string; revenue: number; deposits: number; withdrawals: number }>;
  userGrowthData: Array<{ date: string; users: number; active: number }>;
  gameStatsData: Array<{ name: string; plays: number; revenue: number }>;
  depositMethodsData: Array<{ name: string; value: number; color: string }>;
}

interface Activity {
  id: string;
  type: string;
  icon: string;
  color: string;
  message: string;
  user: string;
  amount: number;
  timestamp: string;
}

const COLORS = {
  primary: '#F59E0B',
  success: '#10B981',
  error: '#EF4444',
  cyan: '#06B6D4',
  violet: '#8B5CF6',
  rose: '#EC4899'
};

const ICONS = {
  TrendingUp,
  ArrowDownToLine,
  Trophy,
  Gamepad2,
  Activity
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/dashboard?range=${timeRange}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setChartData(data.charts);
        setRecentActivity(data.recentActivity || []);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Utilisateurs Totaux",
      value: stats?.totalUsers || 0,
      change: stats?.userGrowth || 0,
      icon: Users,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10"
    },
    {
      title: "Dépôts Totaux",
      value: formatToUSD(stats?.totalDeposits || 0),
      change: stats?.revenueGrowth || 0,
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10"
    },
    {
      title: "Retraits Totaux",
      value: formatToUSD(stats?.totalWithdrawals || 0),
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Profit Maison",
      value: formatToUSD(stats?.houseProfit || 0),
      change: 12.5,
      icon: Wallet,
      color: "text-violet-500",
      bgColor: "bg-violet-500/10"
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display text-white">Dashboard</h1>
          <p className="text-text-secondary mt-1">Vue d'ensemble de la plateforme</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 bg-background-secondary rounded-xl p-1 border border-white/5">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                timeRange === range
                  ? "bg-primary text-background shadow-glow-gold"
                  : "text-text-secondary hover:text-white"
              )}
            >
              {range === '7d' ? '7 jours' : range === '30d' ? '30 jours' : '90 jours'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          const isPositive = card.change ? card.change > 0 : null;

          return (
            <div
              key={card.title}
              className="bg-surface rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn("p-3 rounded-xl", card.bgColor)}>
                  <Icon className={cn("w-6 h-6", card.color)} />
                </div>
                {card.change !== undefined && (
                  <div
                    className={cn(
                      "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg",
                      isPositive
                        ? "text-success bg-success/10"
                        : "text-error bg-error/10"
                    )}
                  >
                    {isPositive ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {Math.abs(card.change)}%
                  </div>
                )}
              </div>
              <div>
                <p className="text-text-tertiary text-sm mb-1">{card.title}</p>
                <p className="text-2xl font-bold font-display text-white">
                  {card.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Chart */}
        <div className="bg-surface rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-bold text-white mb-6">Revenus & Transactions</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData?.revenueData || []}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1A1D26',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#fff'
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={COLORS.primary}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Revenus"
              />
              <Area
                type="monotone"
                dataKey="deposits"
                stroke={COLORS.success}
                fillOpacity={1}
                fill="url(#colorDeposits)"
                name="Dépôts"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth Chart */}
        <div className="bg-surface rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-bold text-white mb-6">Croissance Utilisateurs</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData?.userGrowthData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1A1D26',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#fff'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="users"
                stroke={COLORS.cyan}
                strokeWidth={3}
                dot={{ fill: COLORS.cyan, r: 4 }}
                name="Utilisateurs totaux"
              />
              <Line
                type="monotone"
                dataKey="active"
                stroke={COLORS.violet}
                strokeWidth={3}
                dot={{ fill: COLORS.violet, r: 4 }}
                name="Utilisateurs actifs"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Game Stats Chart */}
        <div className="bg-surface rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-bold text-white mb-6">Statistiques Jeux</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData?.gameStatsData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1A1D26',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#fff'
                }}
              />
              <Legend />
              <Bar dataKey="plays" fill={COLORS.cyan} name="Parties jouées" radius={[8, 8, 0, 0]} />
              <Bar dataKey="revenue" fill={COLORS.primary} name="Revenus" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-surface rounded-2xl p-6 border border-white/5">
        <h3 className="text-lg font-bold text-white mb-4">Activité Récente</h3>
        <div className="space-y-3">
          {recentActivity.map((activity) => {
            const Icon = ICONS[activity.icon as keyof typeof ICONS] || Activity;
            const colorClass = {
              success: 'bg-success/10 text-success',
              primary: 'bg-primary/10 text-primary',
              violet: 'bg-violet-500/10 text-violet-500',
              cyan: 'bg-cyan-500/10 text-cyan-500'
            }[activity.color] || 'bg-white/10 text-white';

            const amountClass = activity.type === 'deposit' || activity.type === 'win' 
              ? 'text-success' 
              : 'text-primary';

            return (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 bg-background-secondary rounded-xl border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colorClass)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{activity.message}</p>
                    <p className="text-xs text-text-tertiary">{activity.user} • {activity.timestamp}</p>
                  </div>
                </div>
                <p className={cn("text-sm font-bold font-mono", amountClass)}>
                  {activity.type === 'withdrawal' ? '-' : '+'}${activity.amount.toFixed(2)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
