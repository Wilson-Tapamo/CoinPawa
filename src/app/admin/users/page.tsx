"use client";

import { useState, useEffect } from "react";
import {
  Users as UsersIcon,
  Search,
  Filter,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  Loader2,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  Wallet,
  TrendingUp
} from "lucide-react";
import { cn, formatToUSD } from "@/lib/utils";
import Link from "next/link";

interface User {
  id: string;
  username: string;
  email: string | null;
  role: string;
  isBanned: boolean;
  createdAt: string;
  wallet: {
    balanceSats: string;
    totalDepositedSats: string;
    totalWageredSats: string;
  } | null;
}

interface UserStats {
  total: number;
  active: number;
  banned: number;
  newToday: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setStats(data.stats || { total: 0, active: 0, banned: 0, newToday: 0 });
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    const matchesStatus = statusFilter === "ALL" || 
                         (statusFilter === "ACTIVE" && !user.isBanned) ||
                         (statusFilter === "BANNED" && user.isBanned);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleBanToggle = async (userId: string, currentlyBanned: boolean) => {
    const action = currentlyBanned ? "débannir" : "bannir";
    if (!confirm(`Êtes-vous sûr de vouloir ${action} cet utilisateur ?`)) return;

    try {
      const res = await fetch('/api/admin/users/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ban: !currentlyBanned })
      });

      if (res.ok) {
        alert(`Utilisateur ${currentlyBanned ? 'débanni' : 'banni'} avec succès`);
        fetchUsers();
      } else {
        alert('Erreur lors de l\'opération');
      }
    } catch (error) {
      alert('Erreur réseau');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-display font-bold text-white">Utilisateurs</h1>
        <p className="text-text-secondary text-sm mt-1">
          Gérer les utilisateurs de la plateforme
        </p>
      </div>

      {/* STATS */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#1A1D26] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-accent-cyan/10 rounded-lg">
                <UsersIcon className="w-4 h-4 text-accent-cyan" />
              </div>
              <span className="text-xs font-bold text-text-tertiary uppercase">Total</span>
            </div>
            <p className="text-2xl font-display font-bold text-white">
              {(stats.total || 0).toLocaleString()}
            </p>
          </div>

          <div className="bg-[#1A1D26] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-success/10 rounded-lg">
                <UserCheck className="w-4 h-4 text-success" />
              </div>
              <span className="text-xs font-bold text-text-tertiary uppercase">Actifs</span>
            </div>
            <p className="text-2xl font-display font-bold text-white">
              {(stats.active || 0).toLocaleString()}
            </p>
          </div>

          <div className="bg-[#1A1D26] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-accent-rose/10 rounded-lg">
                <UserX className="w-4 h-4 text-accent-rose" />
              </div>
              <span className="text-xs font-bold text-text-tertiary uppercase">Bannis</span>
            </div>
            <p className="text-2xl font-display font-bold text-white">
              {(stats.banned || 0).toLocaleString()}
            </p>
          </div>

          <div className="bg-[#1A1D26] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-bold text-text-tertiary uppercase">Aujourd'hui</span>
            </div>
            <p className="text-2xl font-display font-bold text-white">
              +{stats.newToday || 0}
            </p>
          </div>
        </div>
      )}

      {/* FILTERS */}
      <div className="bg-[#1A1D26] rounded-xl p-4 border border-white/5">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background-secondary border border-white/10 rounded-lg py-2 pl-10 pr-3 text-sm text-white placeholder:text-text-tertiary focus:outline-none focus:border-primary/50"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-background-secondary border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
          >
            <option value="ALL">Tous les rôles</option>
            <option value="USER">Utilisateurs</option>
            <option value="ADMIN">Admins</option>
            <option value="SUPER_ADMIN">Super Admins</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-background-secondary border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIVE">Actifs</option>
            <option value="BANNED">Bannis</option>
          </select>
        </div>

        {/* Results count */}
        <p className="text-xs text-text-tertiary mt-3">
          {filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? 's' : ''} trouvé{filteredUsers.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* USERS LIST */}
      <div className="bg-[#1A1D26] rounded-xl border border-white/5 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 text-text-tertiary">
            <UsersIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background-secondary border-b border-white/5">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-bold text-text-tertiary uppercase">Utilisateur</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-text-tertiary uppercase">Rôle</th>
                  <th className="text-center py-3 px-4 text-xs font-bold text-text-tertiary uppercase">Statut</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-text-tertiary uppercase">Balance</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-text-tertiary uppercase">Total Déposé</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-text-tertiary uppercase">Total Misé</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-text-tertiary uppercase">Inscription</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-text-tertiary uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    {/* User */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-violet to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                          {user.username.substring(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{user.username}</p>
                          <p className="text-xs text-text-tertiary">{user.email || "Aucun email"}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      <span className={cn(
                        "px-2 py-1 rounded text-xs font-bold",
                        user.role === "ADMIN" || user.role === "SUPER_ADMIN"
                          ? "bg-primary/10 text-primary"
                          : "bg-white/5 text-text-secondary"
                      )}>
                        {user.role === "SUPER_ADMIN" ? "Super Admin" : user.role === "ADMIN" ? "Admin" : "Utilisateur"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      {user.isBanned ? (
                        <div className="inline-flex items-center gap-1 text-accent-rose">
                          <XCircle className="w-3 h-3" />
                          <span className="text-xs font-bold">Banni</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 text-success">
                          <CheckCircle className="w-3 h-3" />
                          <span className="text-xs font-bold">Actif</span>
                        </div>
                      )}
                    </td>

                    {/* Balance */}
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm font-mono text-white">
                        {user.wallet ? formatToUSD(Number(user.wallet.balanceSats) / 100_000_000) : "$0.00"}
                      </span>
                    </td>

                    {/* Total Deposited */}
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm font-mono text-success">
                        {user.wallet ? formatToUSD(Number(user.wallet.totalDepositedSats) / 100_000_000) : "$0.00"}
                      </span>
                    </td>

                    {/* Total Wagered */}
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm font-mono text-accent-violet">
                        {user.wallet ? formatToUSD(Number(user.wallet.totalWageredSats) / 100_000_000) : "$0.00"}
                      </span>
                    </td>

                    {/* Created At */}
                    <td className="py-3 px-4">
                      <span className="text-xs text-text-tertiary">
                        {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="p-2 rounded-lg hover:bg-accent-cyan/10 text-accent-cyan transition-colors"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleBanToggle(user.id, user.isBanned)}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            user.isBanned
                              ? "hover:bg-success/10 text-success"
                              : "hover:bg-accent-rose/10 text-accent-rose"
                          )}
                          title={user.isBanned ? "Débannir" : "Bannir"}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
