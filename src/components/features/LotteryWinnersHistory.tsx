"use client";

import { useState, useEffect } from "react";
import { cn, formatToUSD } from "@/lib/utils";
import { Trophy, User } from "lucide-react";

export function LotteryWinnersHistory() {
    const [winners, setWinners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch des données réelles
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/games/loto/state");
                const data = await res.json();
                if (data.success && data.state) {
                    if (data.state.recentWinners && data.state.recentWinners.length > 0) {
                        setWinners(data.state.recentWinners);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch lottery state", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh winners every 30s
        return () => clearInterval(interval);
    }, []);

    // Formatage du temps relatif (ex: "2m ago")
    const formatTimeAgo = (timestamp: string | number) => {
        const diff = Date.now() - new Date(timestamp).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "à l'instant";
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        return `${hours}h ago`;
    };

    return (
        <div className="w-full bg-surface/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                    <h3 className="font-display font-bold text-white text-lg">Historique des gagnants de lotterie gagnante</h3>
                </div>
                <span className="text-xs text-text-tertiary">Flux Temps Réel</span>
            </div>

            <div className="divide-y divide-white/5">
                {loading ? (
                    <div className="p-6 text-center text-text-tertiary text-sm">Chargement des données...</div>
                ) : winners.length === 0 ? (
                    <div className="p-6 text-center text-text-tertiary text-sm">Aucun gagnant récent.</div>
                ) : (
                    winners.map((win, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors group cursor-pointer">
                            {/* Game Info */}
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center border border-white/5 group-hover:border-accent-purple/50 transition-colors">
                                    <Trophy className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">Lotterie Gagnante</p>
                                    <div className="flex items-center gap-1 text-xs text-text-tertiary">
                                        <User className="w-3 h-3" />
                                        <span>{win.user}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Win Amount */}
                            <div className="text-right">
                                <div className={cn(
                                    "font-mono font-bold text-sm",
                                    "text-success drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                                )}>
                                    +{formatToUSD(win.amount)}
                                </div>
                                <div className="text-[10px] text-text-tertiary">{formatTimeAgo(win.time)}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
