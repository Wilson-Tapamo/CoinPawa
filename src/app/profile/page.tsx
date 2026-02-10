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
    Smartphone,
    CheckCircle2,
    ShieldCheck,
    History,
    TrendingUp,
    TrendingDown,
    Trophy,
    Loader2,
    Target,
    Flame
} from "lucide-react";
import { cn, formatToUSD } from "@/lib/utils";
import { AvatarSelector } from "@/components/AvatarSelector";
import { BannerSelector } from "@/components/BannerSelector";
import Image from "next/image";

// Données statiques de secours
const DEFAULT_USER = {
    level: 1,
    xp: 0,
    kycStatus: "Unverified",
    vipTier: "Bronze",
};

interface Stats {
    // Balance & Profits
    currentBalance: number;
    totalDeposited: number;
    totalWithdrawn: number;
    netProfit: number;  // Total Won - Total Wagered
    
    // Activity
    totalWagered: number;
    totalWon: number;
    totalBets: number;
    
    // Performance
    winCount: number;
    lossCount: number;
    winRate: number;
    maxWin: number;
    
    // Streaks
    currentStreak: number;
    bestStreak: number;
    
    // Favorite Game
    favoriteGame: {
        name: string;
        plays: number;
    } | null;
}

interface UserInfo {
    username: string;
    email: string | null;
    userId: string;
    joinDate: string;
    avatarUrl: string | null;
    bannerUrl: string | null;
}

interface GameHistoryEntry {
    id: string;
    type: 'BET' | 'WIN';
    amount: number;
    gameName: string;
    timestamp: string;
    betAmount?: number;
    netProfit?: number;
    isWin: boolean;
}

const TABS = [
    { id: "general", label: "Général", icon: User },
    { id: "history", label: "Historique", icon: History },
    { id: "security", label: "Sécurité", icon: Shield },
    { id: "verification", label: "Vérification", icon: BadgeCheck },
];

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState("general");
    const [stats, setStats] = useState<Stats | null>(null);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([]);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    // États pour les modals
    const [showAvatarSelector, setShowAvatarSelector] = useState(false);
    const [showBannerSelector, setShowBannerSelector] = useState(false);
    const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
    const [currentBanner, setCurrentBanner] = useState<string | null>(null);

    // Charger les statistiques et infos user
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/profile/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data.stats);
                    setUserInfo(data.user);
                    setCurrentAvatar(data.user.avatarUrl);
                    setCurrentBanner(data.user.bannerUrl);
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

    const username = userInfo?.username || "Joueur";
    const userId = userInfo?.userId || "-------";

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 1. HEADER PROFILE CARD */}
            <div className="relative rounded-2xl overflow-hidden bg-surface border border-white/5 shadow-2xl">
                {/* Banner */}
                <div className="h-32 bg-gradient-to-r from-accent-violet/20 to-accent-cyan/20 relative group">
                    {currentBanner ? (
                        <Image
                            src={currentBanner}
                            alt="Bannière"
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                    )}
                    <button
                        onClick={() => setShowBannerSelector(true)}
                        className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/50 backdrop-blur text-xs font-bold text-white rounded-lg hover:bg-black/70 transition-colors flex items-center gap-2 opacity-0 group-hover:opacity-100"
                    >
                        <Camera className="w-3 h-3" /> Modifier ma bannière
                    </button>
                </div>

                <div className="px-8 pb-8 flex flex-col md:flex-row items-end md:items-center gap-6 -mt-10">
                    {/* Avatar */}
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full border-4 border-surface bg-gradient-to-br from-accent-violet to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-glow-purple overflow-hidden">
                            {currentAvatar ? (
                                <Image
                                    src={currentAvatar}
                                    alt={username}
                                    width={96}
                                    height={96}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                username[0].toUpperCase()
                            )}
                        </div>
                        <button
                            onClick={() => setShowAvatarSelector(true)}
                            className="absolute bottom-0 right-0 p-1.5 bg-surface border border-white/10 rounded-full text-text-secondary hover:text-white transition-colors"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 mb-2 mt-10 md:mb-0">
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold font-display text-white">{username}</h1>
                            {DEFAULT_USER.kycStatus === "Verified" && (
                                <CheckCircle2 className="w-5 h-5 text-success fill-success/10" />
                            )}
                        </div>
                        <p className="text-text-tertiary text-sm">ID Utilisateur: <span className="text-text-secondary font-mono">{userId}</span></p>
                    </div>

                    {/* Balance Card - NOUVEAU */}
                    {!isLoadingStats && stats && (
                        <div className="bg-background-secondary border border-white/10 rounded-xl px-6 py-4">
                            <p className="text-xs text-text-tertiary uppercase mb-1">Balance</p>
                            <p className="text-2xl font-bold font-display text-white">{formatToUSD(stats.currentBalance)}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={cn(
                                    "text-xs font-bold px-2 py-1 rounded",
                                    stats.netProfit >= 0 ? "text-success bg-success/10" : "text-accent-rose bg-accent-rose/10"
                                )}>
                                    {stats.netProfit >= 0 ? "+" : ""}{formatToUSD(stats.netProfit)}
                                </span>
                                <span className="text-xs text-text-tertiary">Profit Net</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* 2. SIDEBAR NAVIGATION */}
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
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors text-left uppercase font-bold tracking-tight">
                            <LogOut className="w-4 h-4" />
                            Déconnexion
                        </button>
                    </div>
                </div>

                {/* 3. SETTINGS CONTENT AREA */}
                <div className="md:col-span-3 bg-surface border border-white/5 rounded-2xl p-6 min-h-[500px]">

                    {/* === GENERAL TAB === */}
                    {activeTab === "general" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-4">Informations Personnelles</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-text-tertiary uppercase">Pseudo</label>
                                        <div className="flex items-center px-4 py-3 bg-background-secondary border border-white/10 rounded-xl text-white">
                                            {username}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-text-tertiary uppercase">Adresse Email</label>
                                        <div className="flex items-center justify-between px-4 py-3 bg-background-secondary border border-white/10 rounded-xl">
                                            <div className="flex items-center gap-2 text-white">
                                                <Mail className="w-4 h-4 text-text-tertiary" />
                                                {userInfo?.email || 'Non renseigné'}
                                            </div>
                                            <span className="text-xs text-success font-bold bg-success/10 px-2 py-1 rounded">Vérifié</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* STATS PRINCIPALES - AMÉLIORÉES */}
                            <div className="border-t border-white/5 pt-6">
                                <h2 className="text-xl font-bold text-white mb-4">Vue d'Ensemble</h2>
                                {isLoadingStats ? (
                                    <div className="flex justify-center py-10">
                                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                    </div>
                                ) : (
                                    <>
                                        {/* Row 1: Stats principales */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                            <div className="p-4 bg-background-secondary rounded-xl text-center border border-white/5">
                                                <div className="text-2xl font-bold text-primary font-display">
                                                    {formatToUSD(stats?.totalWagered || 0)}
                                                </div>
                                                <div className="text-xs text-text-tertiary uppercase">Total Misé</div>
                                            </div>
                                            <div className="p-4 bg-background-secondary rounded-xl text-center border border-white/5">
                                                <div className={cn(
                                                    "text-2xl font-bold font-display",
                                                    (stats?.netProfit || 0) >= 0 ? "text-success" : "text-accent-rose"
                                                )}>
                                                    {(stats?.netProfit || 0) >= 0 ? "+" : ""}{formatToUSD(stats?.netProfit || 0)}
                                                </div>
                                                <div className="text-xs text-text-tertiary uppercase">Profit Net</div>
                                            </div>
                                            <div className="p-4 bg-background-secondary rounded-xl text-center border border-white/5">
                                                <div className="text-2xl font-bold text-accent-cyan font-display">
                                                    {((stats?.winRate || 0) * 100).toFixed(1)}%
                                                </div>
                                                <div className="text-xs text-text-tertiary uppercase">Taux Victoire</div>
                                            </div>
                                            <div className="p-4 bg-background-secondary rounded-xl text-center border border-white/5 text-xs">
                                                <div className="text-2xl font-bold text-accent-rose font-display">
                                                    {formatToUSD(stats?.maxWin || 0)}
                                                </div>
                                                <div className="text-xs text-text-tertiary uppercase">Record</div>
                                            </div>
                                        </div>

                                        {/* Row 2: Stats secondaires */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="p-4 bg-background-secondary rounded-xl text-center border border-white/5">
                                                <div className="text-xl font-bold text-white font-display">
                                                    {stats?.totalBets || 0}
                                                </div>
                                                <div className="text-xs text-text-tertiary uppercase">Parties Jouées</div>
                                            </div>
                                            <div className="p-4 bg-background-secondary rounded-xl text-center border border-white/5">
                                                <div className="text-xl font-bold text-success font-display">
                                                    {stats?.winCount || 0}
                                                </div>
                                                <div className="text-xs text-text-tertiary uppercase">Victoires</div>
                                            </div>
                                            <div className="p-4 bg-background-secondary rounded-xl border border-white/5">
                                                <div className="flex items-center justify-center gap-1 mb-1">
                                                    <Flame className="w-4 h-4 text-primary" />
                                                    <div className="text-xl font-bold text-primary font-display">
                                                        {stats?.currentStreak || 0}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-text-tertiary uppercase text-center">Série Actuelle</div>
                                            </div>
                                            <div className="p-4 bg-background-secondary rounded-xl border border-white/5">
                                                <div className="flex items-center justify-center gap-1 mb-1">
                                                    <Trophy className="w-4 h-4 text-accent-violet" />
                                                    <div className="text-xl font-bold text-accent-violet font-display">
                                                        {stats?.bestStreak || 0}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-text-tertiary uppercase text-center">Meilleure Série</div>
                                            </div>
                                        </div>

                                        {/* Jeu Favori */}
                                        {stats?.favoriteGame && (
                                            <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-xl">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs text-text-tertiary uppercase mb-1">Jeu Favori</p>
                                                        <p className="text-lg font-bold text-white">{stats.favoriteGame.name}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold text-primary font-display">{stats.favoriteGame.plays}</p>
                                                        <p className="text-xs text-text-tertiary">parties</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* === HISTORY TAB === */}
                    {activeTab === "history" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-bold text-white mb-4">Historique des Jeux</h2>
                            {isLoadingHistory ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                </div>
                            ) : gameHistory.length === 0 ? (
                                <p className="text-text-tertiary text-center py-10">Aucun historique trouvé.</p>
                            ) : (
                                <div className="space-y-3">
                                    {gameHistory.map((item) => (
                                        <div key={item.id} className="p-4 bg-background-secondary rounded-xl border border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-lg flex items-center justify-center",
                                                    item.isWin ? "bg-success/10 text-success" : "bg-accent-rose/10 text-accent-rose"
                                                )}>
                                                    {item.isWin ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white uppercase">{item.gameName}</p>
                                                    <p className="text-[10px] text-text-tertiary">{new Date(item.timestamp).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={cn(
                                                    "font-bold font-mono text-sm",
                                                    item.isWin ? "text-success" : "text-accent-rose"
                                                )}>
                                                    {item.isWin ? "+" : "-"}{formatToUSD(item.amount)}
                                                </p>
                                                {item.betAmount && (
                                                    <p className="text-xs text-text-tertiary">Misé: {formatToUSD(item.betAmount)}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* === VERIFICATION TAB === */}
                    {activeTab === "verification" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white">Vérification d'Identité</h2>
                                <span className="px-3 py-1 bg-success text-background font-bold text-sm rounded-full shadow-glow-cyan flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" /> Vérifié
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-4 p-4 rounded-xl bg-background-secondary border border-white/5 opacity-50">
                                    <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">Niveau 1: Infos de Base</h4>
                                        <p className="text-sm text-text-secondary">Nom complet, date de naissance et adresse.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-r from-success/10 to-transparent border border-success/30">
                                    <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">Niveau 2: Pièce d'Identité</h4>
                                        <p className="text-sm text-text-secondary">Carte d'identité gouvernementale et selfie.</p>
                                        <p className="text-xs text-success font-bold mt-2">Vérifié le 12 Octobre 2023</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 p-4 rounded-xl bg-background-secondary border border-white/5">
                                    <div className="w-8 h-8 rounded-full bg-surface border border-white/10 flex items-center justify-center shrink-0 text-text-tertiary">
                                        3
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-opacity-50">Niveau 3: Justificatif de Domicile</h4>
                                        <p className="text-sm text-text-tertiary">Facture de services publics ou relevé bancaire (Optionnel pour des limites plus élevées).</p>
                                        <button className="mt-3 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg border border-white/10 transition-colors uppercase">
                                            Lancer la vérification
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* === SECURITY TAB === */}
                    {activeTab === "security" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-bold text-white mb-4">Paramètres de Sécurité</h2>
                            <div className="p-6 rounded-xl bg-background-secondary border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Smartphone className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">Authentification à Deux Facteurs (2FA)</h4>
                                        <p className="text-sm text-text-secondary max-w-md">
                                            Sécurisez votre compte avec Google Authenticator. Recommandé pour tous.
                                        </p>
                                    </div>
                                </div>
                                <button className="px-5 py-2 bg-primary hover:bg-primary-hover text-background font-bold rounded-lg shadow-glow-gold transition-colors uppercase text-sm">
                                    Activer la 2FA
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* MODALS */}
            {showAvatarSelector && (
                <AvatarSelector
                    currentAvatar={currentAvatar}
                    onClose={() => setShowAvatarSelector(false)}
                    onSelect={(avatarUrl) => setCurrentAvatar(avatarUrl)}
                />
            )}

            {showBannerSelector && (
                <BannerSelector
                    currentBanner={currentBanner}
                    onClose={() => setShowBannerSelector(false)}
                    onSelect={(bannerUrl) => setCurrentBanner(bannerUrl)}
                />
            )}
        </div>
    );
}
