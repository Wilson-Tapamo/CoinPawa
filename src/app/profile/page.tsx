"use client";

import { useState, useEffect } from "react";
import {
    User,
    Shield,
    BadgeCheck,
    Settings,
    LogOut,
    Camera,
    Mail,
    CheckCircle2,
    ShieldCheck,
    TrendingUp,
    TrendingDown,
    Trophy,
    Loader2
} from "lucide-react";
import { cn, formatToUSD } from "@/lib/utils";

// Mock User Data (juste pour level/xp/vip pour l'instant)
const MOCK_USER = {
    level: 42,
    xp: 75,
    kycStatus: "Verified",
    vipTier: "Gold",
};

const TABS = [
    { id: "general", label: "General", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "verification", label: "Verification", icon: BadgeCheck },
    { id: "preferences", label: "Preferences", icon: Settings },
];

interface Stats {
    totalDeposited: number
    totalWithdrawn: number
    totalWagered: number
    totalWon: number
    totalBets: number
    winCount: number
    maxWin: number
    winRate: number
    netProfit: number
    currentBalance: number
}

interface UserInfo {
    username: string
    email: string | null
    userId: string
    joinDate: string
}

interface GameHistory {
    id: string
    type: 'BET' | 'WIN'
    amount: number
    gameName: string
    timestamp: string
    betAmount?: number
    netProfit?: number
}

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState("general");
    const [stats, setStats] = useState<Stats | null>(null);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    // Charger les statistiques et infos user
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/profile/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data.stats);
                    setUserInfo(data.user);
                }
            } catch (error) {
                console.error('Error loading stats:', error);
            } finally {
                setIsLoadingStats(false);
            }
        };

        fetchStats();
    }, []);

    // Charger l'historique des jeux
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch('/api/profile/game-history');
                if (res.ok) {
                    const data = await res.json();
                    setGameHistory(data.history);
                }
            } catch (error) {
                console.error('Error loading history:', error);
            } finally {
                setIsLoadingHistory(false);
            }
        };

        fetchHistory();
    }, []);

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* HEADER PROFILE CARD */}
            <div className="relative rounded-2xl overflow-hidden bg-surface border border-white/5 shadow-2xl">
                <div className="h-32 bg-gradient-to-r from-accent-violet/20 to-accent-cyan/20 relative">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                    {/* <button className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/50 backdrop-blur text-xs font-bold text-white rounded-lg hover:bg-black/70 transition-colors flex items-center gap-2">
                        <Camera className="w-3 h-3" /> Edit Cover
                    </button> */}
                </div>

                <div className="px-8 pb-8 flex flex-col md:flex-row items-end md:items-center gap-6 -mt-10">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full border-4 border-surface bg-gradient-to-br from-accent-violet to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-glow-purple">
                            K
                        </div>
                        <button className="absolute bottom-0 right-0 p-1.5 bg-surface border border-white/10 rounded-full text-text-secondary hover:text-white transition-colors">
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 mb-2 md:mb-0">
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold font-display text-white">
                                {userInfo?.username || 'Loading...'}
                            </h1>
                            {/* <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-bold uppercase rounded border border-primary/20">
                                {MOCK_USER.vipTier} VIP
                            </span>
                            {MOCK_USER.kycStatus === "Verified" && (
                                <CheckCircle2 className="w-5 h-5 text-success fill-success/10" />
                            )} */}
                        </div>
                        <p className="text-text-tertiary text-sm">
                            User ID: <span className="text-text-secondary font-mono">{userInfo?.userId || '...'}</span>
                        </p>
                    </div>

                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* SIDEBAR NAVIGATION */}
                <div className="md:col-span-1 space-y-2">
                    <nav className="space-y-1">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left",
                                        isActive
                                            ? "bg-surface text-primary border border-primary/20 shadow-lg"
                                            : "text-text-secondary hover:bg-surface/50 hover:text-white"
                                    )}
                                >
                                    <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-text-tertiary")} />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </nav>

                    <div className="pt-4 border-t border-white/5 mt-4">
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors text-left">
                            <LogOut className="w-4 h-4" />
                            Log Out
                        </button>
                    </div>
                </div>

                {/* SETTINGS CONTENT AREA */}
                <div className="md:col-span-3 bg-surface border border-white/5 rounded-2xl p-6 min-h-[500px]">

                    {/* === GENERAL TAB === */}
                    {activeTab === "general" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-4">Personal Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-text-tertiary uppercase">Username</label>
                                        <div className="flex items-center px-4 py-3 bg-background-secondary border border-white/10 rounded-xl text-white">
                                            {userInfo?.username || 'Loading...'}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-text-tertiary uppercase">Email Address</label>
                                        <div className="flex items-center justify-between px-4 py-3 bg-background-secondary border border-white/10 rounded-xl">
                                            <div className="flex items-center gap-2 text-white">
                                                <Mail className="w-4 h-4 text-text-tertiary" />
                                                {userInfo?.email || 'Non renseigné'}
                                            </div>
                                            {userInfo?.email && (
                                                <span className="text-xs text-success font-bold bg-success/10 px-2 py-1 rounded">Verified</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* STATISTICS - DYNAMIQUE */}
                            <div className="border-t border-white/5 pt-6">
                                <h2 className="text-xl font-bold text-white mb-4">Statistics</h2>
                                
                                {isLoadingStats ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    </div>
                                ) : stats ? (
                                    <>
                                        {/* Stats principales */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                            <div className="p-4 bg-background-secondary rounded-xl text-center border border-white/5">
                                                <div className="text-2xl font-bold text-primary font-display">
                                                    {formatToUSD(stats.totalWagered)}
                                                </div>
                                                <div className="text-xs text-text-tertiary uppercase">Wagered</div>
                                            </div>
                                            <div className="p-4 bg-background-secondary rounded-xl text-center border border-white/5">
                                                <div className="text-2xl font-bold text-success font-display">{stats.totalBets}</div>
                                                <div className="text-xs text-text-tertiary uppercase">Total Bets</div>
                                            </div>
                                            <div className="p-4 bg-background-secondary rounded-xl text-center border border-white/5">
                                                <div className="text-2xl font-bold text-accent-cyan font-display">{stats.winCount}</div>
                                                <div className="text-xs text-text-tertiary uppercase">Wins</div>
                                            </div>
                                            <div className="p-4 bg-background-secondary rounded-xl text-center border border-white/5">
                                                <div className="text-2xl font-bold text-accent-rose font-display">
                                                    {formatToUSD(stats.maxWin)}
                                                </div>
                                                <div className="text-xs text-text-tertiary uppercase">Max Win</div>
                                            </div>
                                        </div>

                                        {/* Stats secondaires */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="p-4 bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 rounded-xl">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-bold text-text-tertiary uppercase">Total Deposited</span>
                                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                                </div>
                                                <div className="text-xl font-bold text-green-500">{formatToUSD(stats.totalDeposited)}</div>
                                            </div>

                                            <div className="p-4 bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20 rounded-xl">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-bold text-text-tertiary uppercase">Total Withdrawn</span>
                                                    <TrendingDown className="w-4 h-4 text-red-500" />
                                                </div>
                                                <div className="text-xl font-bold text-red-500">{formatToUSD(stats.totalWithdrawn)}</div>
                                            </div>

                                            <div className={cn(
                                                "p-4 rounded-xl border",
                                                stats.netProfit >= 0 
                                                    ? "bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20"
                                                    : "bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20"
                                            )}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-bold text-text-tertiary uppercase">Net Profit</span>
                                                    <Trophy className={cn(
                                                        "w-4 h-4",
                                                        stats.netProfit >= 0 ? "text-green-500" : "text-red-500"
                                                    )} />
                                                </div>
                                                <div className={cn(
                                                    "text-xl font-bold",
                                                    stats.netProfit >= 0 ? "text-green-500" : "text-red-500"
                                                )}>
                                                    {stats.netProfit >= 0 ? '+' : ''}{formatToUSD(stats.netProfit)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Win Rate */}
                                        <div className="mt-4 p-4 bg-background-secondary/50 rounded-xl border border-white/5">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-bold text-white">Win Rate</span>
                                                <span className="text-sm font-bold text-primary">{stats.winRate.toFixed(1)}%</span>
                                            </div>
                                            <div className="h-2 bg-background-secondary rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-primary to-accent-rose"
                                                    style={{ width: `${Math.min(stats.winRate, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-text-tertiary text-center py-8">Aucune donnée disponible</p>
                                )}
                            </div>

                            {/* GAME HISTORY */}
                            <div className="border-t border-white/5 pt-6">
                                <h2 className="text-xl font-bold text-white mb-4">Recent Game Activity</h2>
                                
                                {isLoadingHistory ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                    </div>
                                ) : gameHistory.length > 0 ? (
                                    <div className="space-y-2">
                                        {gameHistory.slice(0, 10).map(item => (
                                            <div 
                                                key={item.id}
                                                className="flex items-center justify-between p-3 bg-background-secondary/50 rounded-lg border border-white/5 hover:border-white/10 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center",
                                                        item.type === 'WIN' 
                                                            ? "bg-green-500/10 text-green-500"
                                                            : "bg-orange-500/10 text-orange-500"
                                                    )}>
                                                        {item.type === 'WIN' ? '🎉' : '🎲'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{item.gameName}</p>
                                                        <p className="text-xs text-text-tertiary">
                                                            {new Date(item.timestamp).toLocaleDateString('fr-FR', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={cn(
                                                        "text-sm font-bold font-mono",
                                                        item.type === 'WIN' ? "text-green-500" : "text-orange-500"
                                                    )}>
                                                        {item.type === 'WIN' ? '+' : '-'}{formatToUSD(item.amount)}
                                                    </p>
                                                    {item.type === 'WIN' && item.netProfit !== null && (
                                                        <p className="text-xs text-text-tertiary">
                                                            Profit: +{formatToUSD(item.netProfit as number)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-text-tertiary">
                                        <p>Aucune activité de jeu pour le moment</p>
                                        <p className="text-xs mt-2">Commencez à jouer pour voir votre historique ici</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* === VERIFICATION (KYC) TAB === */}
                    {activeTab === "verification" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white">Identity Verification</h2>
                                <span className="px-3 py-1 bg-success text-background font-bold text-sm rounded-full shadow-glow-cyan flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" /> Verified
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-4 p-4 rounded-xl bg-background-secondary border border-white/5 opacity-50">
                                    <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">Level 1: Basic Info</h4>
                                        <p className="text-sm text-text-secondary">Full name, date of birth, and address.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-r from-success/10 to-transparent border border-success/30">
                                    <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">Level 2: ID Verification</h4>
                                        <p className="text-sm text-text-secondary">Government issued ID and selfie.</p>
                                        <p className="text-xs text-success font-bold mt-2">Completed on Oct 12, 2023</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 p-4 rounded-xl bg-background-secondary border border-white/5">
                                    <div className="w-8 h-8 rounded-full bg-surface border border-white/10 flex items-center justify-center shrink-0 text-text-tertiary">
                                        3
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-opacity-50">Level 3: Proof of Address</h4>
                                        <p className="text-sm text-text-tertiary">Utility bill or bank statement (Optional for higher limits).</p>
                                        <button className="mt-3 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg border border-white/10 transition-colors">
                                            Start Verification
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* === SECURITY TAB === */}
                    {activeTab === "security" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-4">Security Settings</h2>
                                <div className="p-6 rounded-xl bg-background-secondary border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                            <Shield className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white">Two-Factor Authentication (2FA)</h4>
                                            <p className="text-sm text-text-secondary max-w-md">
                                                Secure your account with Google Authenticator. Recommended for all users.
                                            </p>
                                        </div>
                                    </div>
                                    <button className="px-5 py-2 bg-primary hover:bg-primary-hover text-background font-bold rounded-lg shadow-glow-gold transition-colors">
                                        Enable 2FA
                                    </button>
                                </div>
                            </div>

                            <div className="border-t border-white/5 pt-6">
                                <h3 className="font-bold text-white mb-4">Active Sessions</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_5px_#10B981]" />
                                            <div>
                                                <p className="text-sm font-bold text-white">Windows 10 - Chrome</p>
                                                <p className="text-xs text-text-tertiary">Paris, France • Current Session</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-success uppercase">Active</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* === PREFERENCES TAB === */}
                    {activeTab === "preferences" && (
                        <div className="flex flex-col items-center justify-center h-full text-center py-10 animate-in fade-in slide-in-from-right-4 duration-300">
                            <Settings className="w-16 h-16 text-text-tertiary opacity-20 mb-4" />
                            <h3 className="text-lg font-bold text-white">Preferences</h3>
                            <p className="text-text-secondary max-w-sm">
                                Language, currency, and notification settings coming soon.
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
