import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils"; // Assuming this helper exists, or I'll implement a simple one or just toLocaleString
import {
    Users,
    ArrowUpRight,
    TrendingUp,
    DollarSign,
    Gamepad2,
    Briefcase
} from "lucide-react";

// Helper for BigInt serialization if passed to client component, 
// but since this is a server component we can render directly.

export const dynamic = 'force-dynamic'; // Ensure real-time data

export default async function AdminDashboard() {
    // 1. Fetch Aggregated Stats
    const totalUsers = await prisma.user.count();

    const walletStats = await prisma.wallet.aggregate({
        _sum: {
            totalDepositedSats: true,
            totalWageredSats: true,
            balanceSats: true
        }
    });

    const gameStats = await prisma.gameRound.aggregate({
        _sum: {
            betAmountSats: true,
            payoutAmountSats: true
        },
        _count: {
            id: true
        }
    });

    // 2. Calculations
    const totalDeposited = Number(walletStats._sum.totalDepositedSats || 0);
    const totalWagered = Number(gameStats._sum.betAmountSats || 0); // Using GameRound for precision on actual plays
    const totalPayouts = Number(gameStats._sum.payoutAmountSats || 0);
    const totalUserBalance = Number(walletStats._sum.balanceSats || 0);

    // GGR = Wagered - Payouts
    const ggr = totalWagered - totalPayouts;
    const ggrMargin = totalWagered > 0 ? (ggr / totalWagered) * 100 : 0;

    // Platform Profit (Simulated: Deposits - Withdrawals - User Balances? No, usually GGR is the profit metric for casino ops)
    // We can also check actual withdrawals if needed, but GGR is "House Revenue".

    return (
        <div className="min-h-screen bg-background p-8 space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white">Admin Dashboard</h1>
                    <p className="text-text-secondary">Overview of platform performance and profitability.</p>
                </div>
            </header>

            {/* ERROR INDICATOR OR NOTIFICATION */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* 1. GGR (House Revenue) */}
                <div className="bg-surface p-6 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-text-tertiary font-bold text-xs uppercase tracking-wider">Gross Gaming Revenue</span>
                        <div className={`p-2 rounded-full ${ggr >= 0 ? 'bg-success/10 text-success' : 'bg-red-500/10 text-red-500'}`}>
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <span className={`text-3xl font-bold ${ggr >= 0 ? 'text-success' : 'text-red-500'}`}>
                            {ggr.toLocaleString()} <span className="text-sm font-normal text-text-tertiary">SATS</span>
                        </span>
                        <div className="text-xs text-text-secondary mt-1">
                            Margin: <span className="text-white font-mono">{ggrMargin.toFixed(2)}%</span>
                        </div>
                    </div>
                </div>

                {/* 2. Total Wagered (Volume) */}
                <div className="bg-surface p-6 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-text-tertiary font-bold text-xs uppercase tracking-wider">Total Wagered</span>
                        <div className="p-2 rounded-full bg-accent-cyan/10 text-accent-cyan">
                            <Gamepad2 className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <span className="text-3xl font-bold text-white">
                            {totalWagered.toLocaleString()} <span className="text-sm font-normal text-text-tertiary">SATS</span>
                        </span>
                        <div className="text-xs text-text-secondary mt-1">
                            {Number(gameStats._count.id).toLocaleString()} Rounds Played
                        </div>
                    </div>
                </div>

                {/* 3. Total Deposited */}
                <div className="bg-surface p-6 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-text-tertiary font-bold text-xs uppercase tracking-wider">Total Deposits</span>
                        <div className="p-2 rounded-full bg-accent-violet/10 text-accent-violet">
                            <Briefcase className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <span className="text-3xl font-bold text-white">
                            {totalDeposited.toLocaleString()} <span className="text-sm font-normal text-text-tertiary">SATS</span>
                        </span>
                        <div className="text-xs text-text-secondary mt-1">
                            Pending User Balance: {totalUserBalance.toLocaleString()} Sats
                        </div>
                    </div>
                </div>

                {/* 4. Total Users */}
                <div className="bg-surface p-6 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-text-tertiary font-bold text-xs uppercase tracking-wider">Total Users</span>
                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <span className="text-3xl font-bold text-white">
                            {totalUsers.toLocaleString()}
                        </span>
                        <div className="text-xs text-text-secondary mt-1">
                            Registered players
                        </div>
                    </div>
                </div>
            </div>

            {/* DETAILED STATS (Future Placeholder) */}
            <div className="bg-surface rounded-2xl border border-white/5 p-8 min-h-[300px] flex items-center justify-center text-text-tertiary">
                <p>Detailed charts and graphs coming soon (Recharts integration needed)</p>
            </div>
        </div>
    );
}
