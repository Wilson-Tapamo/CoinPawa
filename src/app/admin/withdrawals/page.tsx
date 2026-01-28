"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Check,
  X,
  Loader2,
  Eye,
  Clock,
  User,
  DollarSign,
  Calendar
} from "lucide-react";
import { cn, formatToUSD } from "@/lib/utils";

interface Withdrawal {
  id: string;
  amountSats: string;
  withdrawalFee: string;
  netAmount: string;
  toAddress: string;
  user: {
    username: string;
    email: string | null;
  };
  createdAt: string;
  riskScore: number;
  isFlagged: boolean;
  flagReason: string | null;
}

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, totalAmount: 0 });

  useEffect(() => {
    fetchWithdrawals();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchWithdrawals, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch('/api/admin/withdrawals');
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data.withdrawals);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading withdrawals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (withdrawalId: string) => {
    if (!confirm('Approuver ce retrait ?')) return;

    try {
      const res = await fetch('/api/admin/withdrawals/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: withdrawalId })
      });

      if (res.ok) {
        alert('Retrait approuvé');
        fetchWithdrawals();
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur');
      }
    } catch (error) {
      alert('Erreur lors de l\'approbation');
    }
  };

  const handleReject = async (withdrawalId: string) => {
    const reason = prompt('Raison du rejet:');
    if (!reason) return;

    try {
      const res = await fetch('/api/admin/withdrawals/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: withdrawalId, reason })
      });

      if (res.ok) {
        alert('Retrait rejeté');
        fetchWithdrawals();
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur');
      }
    } catch (error) {
      alert('Erreur lors du rejet');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-display font-bold text-white">Withdrawals</h1>
        <p className="text-text-secondary text-sm mt-1">
          Valider les demandes de retrait
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#1A1D26] rounded-xl p-6 border border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-accent-rose/10 rounded-xl">
              <Clock className="w-6 h-6 text-accent-rose" />
            </div>
            <span className="text-xs font-bold text-text-tertiary uppercase">Pending Withdrawals</span>
          </div>
          <p className="text-3xl font-display font-bold text-white">
            {stats.pending}
          </p>
        </div>

        <div className="bg-[#1A1D26] rounded-xl p-6 border border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xs font-bold text-text-tertiary uppercase">Total Amount</span>
          </div>
          <p className="text-3xl font-display font-bold text-white">
            {formatToUSD(stats.totalAmount / 100_000_000)}
          </p>
        </div>
      </div>

      {/* WITHDRAWALS LIST */}
      <div className="bg-[#1A1D26] rounded-xl border border-white/5 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="text-center py-20 text-text-tertiary">
            <Check className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Aucun retrait en attente</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {withdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className={cn(
                  "p-6 hover:bg-white/5 transition-colors",
                  withdrawal.isFlagged && "bg-accent-rose/5 border-l-4 border-accent-rose"
                )}
              >
                <div className="flex items-start justify-between gap-6">
                  {/* Left: User & Details */}
                  <div className="flex-1 space-y-3">
                    {/* User */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-violet to-indigo-600 flex items-center justify-center text-white font-bold">
                        {withdrawal.user.username.substring(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {withdrawal.user.username}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          {withdrawal.user.email || "No email"}
                        </p>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-text-tertiary mb-1">Amount</p>
                        <p className="text-sm font-bold font-mono text-white">
                          {formatToUSD(Number(withdrawal.amountSats) / 100_000_000)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-tertiary mb-1">Fee</p>
                        <p className="text-sm font-bold font-mono text-accent-rose">
                          -{formatToUSD(Number(withdrawal.withdrawalFee) / 100_000_000)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-tertiary mb-1">Net Amount</p>
                        <p className="text-sm font-bold font-mono text-success">
                          {formatToUSD(Number(withdrawal.netAmount) / 100_000_000)}
                        </p>
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Destination Address</p>
                      <code className="text-xs font-mono text-white bg-background-secondary px-2 py-1 rounded">
                        {withdrawal.toAddress}
                      </code>
                    </div>

                    {/* Risk */}
                    {withdrawal.isFlagged && (
                      <div className="flex items-center gap-2 p-2 bg-accent-rose/10 rounded-lg border border-accent-rose/20">
                        <AlertTriangle className="w-4 h-4 text-accent-rose" />
                        <div>
                          <p className="text-xs font-bold text-accent-rose">Flagged Transaction</p>
                          <p className="text-xs text-white">
                            {withdrawal.flagReason || "Manual review required"}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Date */}
                    <div className="flex items-center gap-2 text-xs text-text-tertiary">
                      <Calendar className="w-3 h-3" />
                      {new Date(withdrawal.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleApprove(withdrawal.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-lg font-bold text-sm hover:bg-success/90 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(withdrawal.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-accent-rose text-white rounded-lg font-bold text-sm hover:bg-accent-rose/90 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
