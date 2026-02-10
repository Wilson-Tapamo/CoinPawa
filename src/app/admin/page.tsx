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
  ArrowDownToLine,
  TrendingDown
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

// Types
interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalWagered: number;
  houseRevenue: number;
  totalGames: number;
  pendingWithdrawals: number;
  houseProfit: number;
  userGrowth: number;
  revenueGrowth: number;
}

interface RevenueData {
  date: string;
  revenue: number;
  wagered: number;
  payout: number;
}

interface UserGrowthData {
  date: string;
  users: number;
  active: number;
}

interface GameStats {
  name: string;
  plays: number;
  revenue: number;
  wagered: number;
}

interface PaymentMethod {
  name: string;
  value: number;
  color: string;
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

interface ChartData {
  revenueData: RevenueData[];
  userGrowthData: UserGrowthData[];
  gameStatsData: GameStats[];
  depositMethodsData: PaymentMethod[];
}

// Couleurs
const COLORS = {
  primary: '#F59E0B',
  success: '#10B981',
  error: '#EF4444',
  cyan: '#06B6D4',
  violet: '#8B5CF6',
  rose: '#EC4899'
};

// Icônes
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
      } else {
        console.error('Dashboard API error:', await res.text());
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-text-secondary">Chargement du dashboard...</p>
        </div>
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
      title: "Revenus (House Edge)",
      value: formatToUSD(stats?.houseRevenue || 0),
      change: stats?.revenueGrowth || 0,
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10"
    },
    {
      title: "Total Misé",
      value: formatToUSD(stats?.totalWagered || 0),
      icon: Gamepad2,
      color: "text-violet-500",
      bgColor: "bg-violet-500/10"
    },
    {
      title: "Dépôts Users",
      value: formatToUSD(stats?.totalDeposits || 0),
      icon: Wallet,
      color: "text-primary",
      bgColor: "bg-primary/10"
    }
  ];

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-white">Tableau de Bord</h1>
          <p className="text-text-secondary mt-1">Vue d'ensemble de la plateforme</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 bg-surface rounded-xl p-1 border border-white/5">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                timeRange === range
                  ? "bg-primary text-background shadow-lg"
                  : "text-text-secondary hover:text-white hover:bg-surface-hover"
              )}
            >
              {range === '7d' ? '7 jours' : range === '30d' ? '30 jours' : '90 jours'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
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
                    {Math.abs(card.change).toFixed(1)}%
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
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Revenus & Mises
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData?.revenueData || []}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorWagered" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.violet} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.violet} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#fff'
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={COLORS.success}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Revenus (House Edge)"
              />
              <Area
                type="monotone"
                dataKey="wagered"
                stroke={COLORS.violet}
                fillOpacity={1}
                fill="url(#colorWagered)"
                name="Total Misé"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth Chart */}
        <div className="bg-surface rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-500" />
            Croissance Utilisateurs
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData?.userGrowthData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
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
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-violet-500" />
            Statistiques Jeux
          </h3>
          {chartData?.gameStatsData && chartData.gameStatsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.gameStatsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Bar dataKey="plays" fill={COLORS.cyan} name="Parties jouées" radius={[8, 8, 0, 0]} />
                <Bar dataKey="revenue" fill={COLORS.success} name="Revenus ($)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-text-tertiary">
              Aucune partie jouée dans cette période
            </div>
          )}
        </div>

        {/* Deposit Methods Chart - CORRIGÉ */}
        <div className="bg-surface rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Méthodes de Dépôt
          </h3>
          {chartData?.depositMethodsData && chartData.depositMethodsData.length > 0 && chartData.depositMethodsData[0].value > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.depositMethodsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : '0'}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.depositMethodsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-text-tertiary">
              Aucun dépôt enregistré
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-surface rounded-2xl p-6 border border-white/5">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-rose" />
          Activité Récente
        </h3>
        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((activity) => {
              const Icon = ICONS[activity.icon as keyof typeof ICONS] || Activity;
              const colorClass = {
                success: 'bg-success/10 text-success',
                primary: 'bg-primary/10 text-primary',
                violet: 'bg-violet-500/10 text-violet-500',
                cyan: 'bg-cyan-500/10 text-cyan-500'
              }[activity.color] || 'bg-white/10 text-white';

              const amountClass = activity.type === 'DEPOSIT' ? 'text-success' : 'text-primary';

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
                    {activity.type === 'WITHDRAW' ? '-' : '+'}${activity.amount.toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-text-tertiary">
            Aucune activité récente
          </div>
        )}
      </div>
    </div>
  );
}
