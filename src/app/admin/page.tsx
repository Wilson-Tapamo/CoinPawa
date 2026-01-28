"use client";

import { useState, useEffect } from "react";
import {
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Gamepad2,
  Wallet,
  AlertTriangle
} from "lucide-react";
import { cn, formatToUSD } from "@/lib/utils";

// Types
interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  todayRevenue: number;
  totalBets: number;
  todayBets: number;
  pendingWithdrawals: number;
  houseEdge: number;
}

interface RecentActivity {
  id: string;
  type: "deposit" | "withdrawal" | "bet" | "win";
  username: string;
  amount: number;
  timestamp: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/dashboard/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setRecentActivity(data.recentActivity);
        }
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-display font-bold text-white">Dashboard</h1>
        <p className="text-text-secondary text-sm mt-1">
          Vue d'ensemble de votre casino
        </p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-[#1A1D26] rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-accent-violet/10 rounded-xl">
                <Users className="w-6 h-6 text-accent-violet" />
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-success">
                <ArrowUpRight className="w-3 h-3" />
                +12%
              </div>
            </div>
            <p className="text-text-tertiary text-sm mb-1">Total Users</p>
            <p className="text-3xl font-display font-bold text-white">
              {stats?.totalUsers.toLocaleString() || "0"}
            </p>
            <p className="text-xs text-text-tertiary mt-2">
              {stats?.activeUsers || 0} active today
            </p>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-[#1A1D26] rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-success">
                <ArrowUpRight className="w-3 h-3" />
                +24%
              </div>
            </div>
            <p className="text-text-tertiary text-sm mb-1">Total Revenue</p>
            <p className="text-3xl font-display font-bold text-white">
              {formatToUSD(stats?.totalRevenue || 0)}
            </p>
            <p className="text-xs text-text-tertiary mt-2">
              {formatToUSD(stats?.todayRevenue || 0)} today
            </p>
          </div>
        </div>

        {/* Total Bets */}
        <div className="bg-[#1A1D26] rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Gamepad2 className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-accent-cyan/10 rounded-xl">
                <Gamepad2 className="w-6 h-6 text-accent-cyan" />
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-success">
                <ArrowUpRight className="w-3 h-3" />
                +8%
              </div>
            </div>
            <p className="text-text-tertiary text-sm mb-1">Total Bets</p>
            <p className="text-3xl font-display font-bold text-white">
              {stats?.totalBets.toLocaleString() || "0"}
            </p>
            <p className="text-xs text-text-tertiary mt-2">
              {stats?.todayBets || 0} today
            </p>
          </div>
        </div>

        {/* Pending Withdrawals */}
        <div className="bg-[#1A1D26] rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-accent-rose/20 transition-colors">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Wallet className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-accent-rose/10 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-accent-rose" />
              </div>
              {stats?.pendingWithdrawals && stats.pendingWithdrawals > 0 && (
                <div className="px-2 py-1 bg-accent-rose/10 rounded text-xs font-bold text-accent-rose">
                  Action needed
                </div>
              )}
            </div>
            <p className="text-text-tertiary text-sm mb-1">Pending Withdrawals</p>
            <p className="text-3xl font-display font-bold text-white">
              {stats?.pendingWithdrawals || 0}
            </p>
            <p className="text-xs text-text-tertiary mt-2">
              Requires approval
            </p>
          </div>
        </div>
      </div>

      {/* HOUSE EDGE & PERFORMANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* House Edge */}
        <div className="bg-[#1A1D26] rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">House Edge</h3>
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-display font-bold text-success">
              {stats?.houseEdge.toFixed(2) || "0.00"}%
            </span>
            <span className="text-sm text-text-tertiary">average</span>
          </div>
          <div className="h-2 bg-background-secondary rounded-full overflow-hidden mt-4">
            <div
              className="h-full bg-gradient-to-r from-success to-primary"
              style={{ width: `${Math.min(stats?.houseEdge || 0, 100)}%` }}
            />
          </div>
          <p className="text-xs text-text-tertiary mt-3">
            Expected: 2-5% • Current performance: Excellent
          </p>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#1A1D26] rounded-2xl p-6 border border-white/5 lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center gap-3 p-3 bg-background-secondary hover:bg-white/5 rounded-xl border border-white/10 transition-colors text-left">
              <div className="p-2 bg-accent-violet/10 rounded-lg">
                <Users className="w-5 h-5 text-accent-violet" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">View Users</p>
                <p className="text-xs text-text-tertiary">Manage accounts</p>
              </div>
            </button>

            <button className="flex items-center gap-3 p-3 bg-background-secondary hover:bg-white/5 rounded-xl border border-white/10 transition-colors text-left">
              <div className="p-2 bg-accent-rose/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-accent-rose" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Withdrawals</p>
                <p className="text-xs text-text-tertiary">
                  {stats?.pendingWithdrawals || 0} pending
                </p>
              </div>
            </button>

            <button className="flex items-center gap-3 p-3 bg-background-secondary hover:bg-white/5 rounded-xl border border-white/10 transition-colors text-left">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Gamepad2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Games Stats</p>
                <p className="text-xs text-text-tertiary">View analytics</p>
              </div>
            </button>

            <button className="flex items-center gap-3 p-3 bg-background-secondary hover:bg-white/5 rounded-xl border border-white/10 transition-colors text-left">
              <div className="p-2 bg-accent-cyan/10 rounded-lg">
                <Activity className="w-5 h-5 text-accent-cyan" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Live Activity</p>
                <p className="text-xs text-text-tertiary">Monitor now</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="bg-[#1A1D26] rounded-2xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Recent Activity</h3>
          <button className="text-xs font-bold text-primary hover:text-primary-hover transition-colors">
            View all →
          </button>
        </div>

        {recentActivity.length === 0 ? (
          <div className="text-center py-12 text-text-tertiary">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.slice(0, 10).map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 bg-background-secondary/50 rounded-lg border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs",
                      activity.type === "deposit" && "bg-success/10 text-success",
                      activity.type === "withdrawal" && "bg-accent-rose/10 text-accent-rose",
                      activity.type === "bet" && "bg-accent-violet/10 text-accent-violet",
                      activity.type === "win" && "bg-primary/10 text-primary"
                    )}
                  >
                    {activity.type === "deposit" && "↓"}
                    {activity.type === "withdrawal" && "↑"}
                    {activity.type === "bet" && "🎲"}
                    {activity.type === "win" && "🎉"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      {activity.username}
                    </p>
                    <p className="text-xs text-text-tertiary capitalize">
                      {activity.type} • {new Date(activity.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "text-sm font-bold font-mono",
                      (activity.type === "deposit" || activity.type === "win") && "text-success",
                      (activity.type === "withdrawal" || activity.type === "bet") && "text-accent-rose"
                    )}
                  >
                    {(activity.type === "deposit" || activity.type === "win") && "+"}
                    {(activity.type === "withdrawal" || activity.type === "bet") && "-"}
                    {formatToUSD(activity.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
