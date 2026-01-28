"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  UserX,
  UserCheck,
  Eye,
  MoreVertical,
  Shield,
  Ban,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  TrendingUp,
  Wallet
} from "lucide-react";
import { cn, formatToUSD } from "@/lib/utils";
import Link from "next/link";

// Types
interface User {
  id: string;
  username: string;
  email: string | null;
  role: string;
  isBanned: boolean;
  isEmailVerified: boolean;
  gamesPlayed: number;
  createdAt: string;
  lastLoginAt: string | null;
  wallet: {
    balanceSats: bigint;
    totalDepositedSats: bigint;
    totalWageredSats: bigint;
  } | null;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  verifiedUsers: number;
  totalBalance: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  // Charger les utilisateurs
  useEffect(() => {
    fetchUsers();
  }, [currentPage, roleFilter, statusFilter, searchQuery]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(roleFilter !== "all" && { role: roleFilter }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setStats(data.stats);
        setTotalPages(Math.ceil(data.total / itemsPerPage));
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Actions utilisateur
  const handleBanUser = async (userId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir bannir cet utilisateur ?")) return;

    const reason = prompt("Raison du ban:");
    if (!reason) return;

    try {
      const res = await fetch("/api/admin/users/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, reason }),
      });

      if (res.ok) {
        alert("Utilisateur banni avec succès");
        fetchUsers();
      }
    } catch (error) {
      alert("Erreur lors du ban");
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const res = await fetch("/api/admin/users/unban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        alert("Utilisateur débanni avec succès");
        fetchUsers();
      }
    } catch (error) {
      alert("Erreur lors du déban");
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Users</h1>
          <p className="text-text-secondary text-sm mt-1">
            Gérer tous les utilisateurs de la plateforme
          </p>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-background font-bold rounded-xl shadow-glow-gold hover:bg-primary-hover transition-colors text-sm">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* STATS CARDS */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-[#1A1D26] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-accent-violet/10 rounded-lg">
                <Shield className="w-4 h-4 text-accent-violet" />
              </div>
              <span className="text-xs font-bold text-text-tertiary uppercase">Total</span>
            </div>
            <p className="text-2xl font-display font-bold text-white">
              {stats.totalUsers.toLocaleString()}
            </p>
          </div>

          <div className="bg-[#1A1D26] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-success/10 rounded-lg">
                <UserCheck className="w-4 h-4 text-success" />
              </div>
              <span className="text-xs font-bold text-text-tertiary uppercase">Active</span>
            </div>
            <p className="text-2xl font-display font-bold text-white">
              {stats.activeUsers.toLocaleString()}
            </p>
          </div>

          <div className="bg-[#1A1D26] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-accent-rose/10 rounded-lg">
                <UserX className="w-4 h-4 text-accent-rose" />
              </div>
              <span className="text-xs font-bold text-text-tertiary uppercase">Banned</span>
            </div>
            <p className="text-2xl font-display font-bold text-white">
              {stats.bannedUsers.toLocaleString()}
            </p>
          </div>

          <div className="bg-[#1A1D26] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CheckCircle className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-bold text-text-tertiary uppercase">Verified</span>
            </div>
            <p className="text-2xl font-display font-bold text-white">
              {stats.verifiedUsers.toLocaleString()}
            </p>
          </div>

          <div className="bg-[#1A1D26] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-accent-cyan/10 rounded-lg">
                <Wallet className="w-4 h-4 text-accent-cyan" />
              </div>
              <span className="text-xs font-bold text-text-tertiary uppercase">Total Balance</span>
            </div>
            <p className="text-xl font-display font-bold text-accent-cyan">
              {formatToUSD((stats.totalBalance || 0) / 100_000_000)}
            </p>
          </div>
        </div>
      )}

      {/* FILTERS & SEARCH */}
      <div className="bg-[#1A1D26] rounded-xl p-6 border border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background-secondary border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-text-tertiary focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full bg-background-secondary border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
            >
              <option value="all">All Roles</option>
              <option value="USER">User</option>
              <option value="MODERATOR">Moderator</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-background-secondary border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="banned">Banned</option>
              <option value="verified">Verified</option>
            </select>
          </div>
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="bg-[#1A1D26] rounded-xl border border-white/5 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 text-text-tertiary">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background-secondary border-b border-white/5">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-bold text-text-tertiary uppercase">User</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-text-tertiary uppercase">Role</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-text-tertiary uppercase">Status</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-text-tertiary uppercase">Balance</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-text-tertiary uppercase">Deposited</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-text-tertiary uppercase">Wagered</th>
                    <th className="text-center py-3 px-4 text-xs font-bold text-text-tertiary uppercase">Games</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-text-tertiary uppercase">Joined</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-text-tertiary uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                      {/* User */}
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-bold text-white flex items-center gap-2">
                            {user.username}
                            {user.isEmailVerified && (
                              <CheckCircle className="w-3 h-3 text-success" />
                            )}
                          </p>
                          <p className="text-xs text-text-tertiary">{user.email || "No email"}</p>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "px-2 py-1 rounded text-xs font-bold",
                            user.role === "ADMIN" && "bg-primary/10 text-primary",
                            user.role === "MODERATOR" && "bg-accent-violet/10 text-accent-violet",
                            user.role === "USER" && "bg-white/5 text-text-secondary"
                          )}
                        >
                          {user.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {user.isBanned ? (
                          <div className="flex items-center gap-1 text-accent-rose">
                            <XCircle className="w-4 h-4" />
                            <span className="text-xs font-bold">Banned</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-success">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs font-bold">Active</span>
                          </div>
                        )}
                      </td>

                      {/* Balance */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Wallet className="w-3 h-3 text-primary" />
                          <span className="text-sm font-mono font-bold text-primary">
                            {user.wallet 
                              ? formatToUSD(Number(user.wallet.balanceSats) / 100_000_000)
                              : "$0.00"
                            }
                          </span>
                        </div>
                      </td>

                      {/* Deposited */}
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-mono text-white">
                          {user.wallet 
                            ? formatToUSD(Number(user.wallet.totalDepositedSats) / 100_000_000)
                            : "$0.00"
                          }
                        </span>
                      </td>

                      {/* Wagered */}
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-mono text-white">
                          {user.wallet 
                            ? formatToUSD(Number(user.wallet.totalWageredSats) / 100_000_000)
                            : "$0.00"
                          }
                        </span>
                      </td>

                      {/* Games */}
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-bold text-white">
                          {user.gamesPlayed}
                        </span>
                      </td>

                      {/* Joined */}
                      <td className="py-3 px-4">
                        <span className="text-xs text-text-tertiary">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-text-secondary hover:text-white"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          
                          {user.isBanned ? (
                            <button
                              onClick={() => handleUnbanUser(user.id)}
                              className="p-2 hover:bg-success/10 rounded-lg transition-colors text-success"
                              title="Unban user"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBanUser(user.id)}
                              className="p-2 hover:bg-accent-rose/10 rounded-lg transition-colors text-accent-rose"
                              title="Ban user"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-white/5">
                <p className="text-xs text-text-tertiary">
                  Page {currentPage} sur {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-background-secondary hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-background-secondary hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
