"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  Eye,
  Loader2,
  Calendar,
  DollarSign,
  TrendingUp,
  ArrowDownToLine,
  Gamepad2,
  Trophy
} from "lucide-react";
import { cn, formatToUSD } from "@/lib/utils";

interface Transaction {
  id: string;
  type: string;
  amountSats: string;
  status: string;
  createdAt: string;
  user: {
    username: string;
  };
  cryptoCurrency: string | null;
  paymentRef: string;
}

interface TransactionStats {
  totalTransactions: number;
  totalVolume: number;
  deposits: number;
  withdrawals: number;
  bets: number;
  wins: number;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("7d");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, typeFilter, statusFilter, dateRange, searchQuery]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(typeFilter !== "all" && { type: typeFilter }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(dateRange !== "all" && { dateRange }),
        ...(searchQuery && { search: searchQuery }),
      });

      const res = await fetch(`/api/admin/transactions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);
        setStats(data.stats);
        setTotalPages(Math.ceil(data.total / itemsPerPage));
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        ...(typeFilter !== "all" && { type: typeFilter }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(dateRange !== "all" && { dateRange }),
      });

      const res = await fetch(`/api/admin/transactions/export?${params}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions-${Date.now()}.csv`;
        a.click();
      }
    } catch (error) {
      alert("Erreur lors de l'export");
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Transactions</h1>
          <p className="text-text-secondary text-sm mt-1">
            Historique complet des transactions
          </p>
        </div>
        
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-background font-bold rounded-xl shadow-glow-gold hover:bg-primary-hover transition-colors text-sm"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* STATS CARDS */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-[#1A1D26] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-accent-violet/10 rounded-lg">
                <TrendingUp className="w-4 h-4 text-accent-violet" />
              </div>
              <span className="text-xs font-bold text-text-tertiary uppercase">Total</span>
            </div>
            <p className="text-xl font-display font-bold text-white">
              {stats.totalTransactions.toLocaleString()}
            </p>
          </div>

          <div className="bg-[#1A1D26] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-bold text-text-tertiary uppercase">Volume</span>
            </div>
            <p className="text-xl font-display font-bold text-white">
              {formatToUSD(stats.totalVolume / 100_000_000)}
            </p>
          </div>

          <div className="bg-[#1A1D26] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-success/10 rounded-lg">
                <ArrowDownToLine className="w-4 h-4 text-success" />
              </div>
              <span className="text-xs font-bold text-text-tertiary uppercase">Deposits</span>
            </div>
            <p className="text-xl font-display font-bold text-white">
              {stats.deposits}
            </p>
          </div>

          <div className="bg-[#1A1D26] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-accent-rose/10 rounded-lg">
                <TrendingUp className="w-4 h-4 text-accent-rose" />
              </div>
              <span className="text-xs font-bold text-text-tertiary uppercase">Withdrawals</span>
            </div>
            <p className="text-xl font-display font-bold text-white">
              {stats.withdrawals}
            </p>
          </div>

          <div className="bg-[#1A1D26] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-accent-cyan/10 rounded-lg">
                <Gamepad2 className="w-4 h-4 text-accent-cyan" />
              </div>
              <span className="text-xs font-bold text-text-tertiary uppercase">Bets</span>
            </div>
            <p className="text-xl font-display font-bold text-white">
              {stats.bets}
            </p>
          </div>

          <div className="bg-[#1A1D26] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Trophy className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-bold text-text-tertiary uppercase">Wins</span>
            </div>
            <p className="text-xl font-display font-bold text-white">
              {stats.wins}
            </p>
          </div>
        </div>
      )}

      {/* FILTERS */}
      <div className="bg-[#1A1D26] rounded-xl p-6 border border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search username or ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background-secondary border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-text-tertiary focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-background-secondary border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
            >
              <option value="all">All Types</option>
              <option value="DEPOSIT">Deposits</option>
              <option value="WITHDRAW">Withdrawals</option>
              <option value="BET">Bets</option>
              <option value="WIN">Wins</option>
              <option value="DEPOSIT_BONUS">Bonuses</option>
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
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-background-secondary border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
            >
              <option value="all">All Time</option>
              <option value="1d">Last 24h</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="bg-[#1A1D26] rounded-xl border border-white/5 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-20 text-text-tertiary">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Aucune transaction trouvée</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background-secondary border-b border-white/5">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-bold text-text-tertiary uppercase">Type</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-text-tertiary uppercase">User</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-text-tertiary uppercase">Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-text-tertiary uppercase">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-text-tertiary uppercase">Crypto</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-text-tertiary uppercase">Reference</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-text-tertiary uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                      {/* Type */}
                      <td className="py-3 px-4">
                        <div
                          className={cn(
                            "inline-flex items-center gap-2 px-2 py-1 rounded text-xs font-bold",
                            tx.type === "DEPOSIT" && "bg-success/10 text-success",
                            tx.type === "WITHDRAW" && "bg-accent-rose/10 text-accent-rose",
                            tx.type === "BET" && "bg-accent-violet/10 text-accent-violet",
                            tx.type === "WIN" && "bg-primary/10 text-primary",
                            tx.type === "DEPOSIT_BONUS" && "bg-accent-cyan/10 text-accent-cyan"
                          )}
                        >
                          {tx.type === "DEPOSIT" && "↓"}
                          {tx.type === "WITHDRAW" && "↑"}
                          {tx.type === "BET" && "🎲"}
                          {tx.type === "WIN" && "🎉"}
                          {tx.type === "DEPOSIT_BONUS" && "🎁"}
                          {tx.type.replace("_", " ")}
                        </div>
                      </td>

                      {/* User */}
                      <td className="py-3 px-4">
                        <span className="text-sm font-bold text-white">
                          {tx.user.username}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right">
                        <span
                          className={cn(
                            "text-sm font-bold font-mono",
                            (tx.type === "DEPOSIT" || tx.type === "WIN" || tx.type === "DEPOSIT_BONUS") && "text-success",
                            (tx.type === "WITHDRAW" || tx.type === "BET") && "text-accent-rose"
                          )}
                        >
                          {(tx.type === "DEPOSIT" || tx.type === "WIN" || tx.type === "DEPOSIT_BONUS") && "+"}
                          {(tx.type === "WITHDRAW" || tx.type === "BET") && "-"}
                          {formatToUSD(Number(tx.amountSats) / 100_000_000)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "px-2 py-1 rounded text-xs font-bold",
                            tx.status === "COMPLETED" && "bg-success/10 text-success",
                            tx.status === "PENDING" && "bg-primary/10 text-primary",
                            tx.status === "FAILED" && "bg-accent-rose/10 text-accent-rose",
                            tx.status === "EXPIRED" && "bg-text-tertiary/10 text-text-tertiary"
                          )}
                        >
                          {tx.status}
                        </span>
                      </td>

                      {/* Crypto */}
                      <td className="py-3 px-4">
                        <span className="text-xs text-text-secondary">
                          {tx.cryptoCurrency || "-"}
                        </span>
                      </td>

                      {/* Reference */}
                      <td className="py-3 px-4">
                        <code className="text-xs font-mono text-text-tertiary">
                          {tx.paymentRef.substring(0, 12)}...
                        </code>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4">
                        <span className="text-xs text-text-tertiary">
                          {new Date(tx.createdAt).toLocaleString()}
                        </span>
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
