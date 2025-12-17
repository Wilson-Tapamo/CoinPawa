"use client";

import { cn } from "@/lib/utils";
import { Gamepad2, User } from "lucide-react";

const RECENT_WINS = [
    { game: "Sweet Bonanza", user: "MoonWlkr", amount: "0.045 BTC", usd: "$1,240.50", time: "2s ago", isHighRoller: true },
    { game: "Gates of Olympus", user: "CryptoKing", amount: "0.012 BTC", usd: "$340.20", time: "5s ago", isHighRoller: false },
    { game: "Plinko", user: "LuckyDoge", amount: "450.00 USDT", usd: "$450.00", time: "12s ago", isHighRoller: false },
    { game: "Wanted Dead or a Wild", user: "SatoshiFan", amount: "1.50 ETH", usd: "$2,800.00", time: "24s ago", isHighRoller: true },
    { game: "Blackjack", user: "DealerBust", amount: "0.50 SOL", usd: "$45.00", time: "45s ago", isHighRoller: false },
];

export function LiveWinsTable() {
    return (
        <div className="w-full bg-surface/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                    <h3 className="font-display font-bold text-white text-lg">Live Wins</h3>
                </div>
                <span className="text-xs text-text-tertiary">Real-time Feed</span>
            </div>

            <div className="divide-y divide-white/5">
                {RECENT_WINS.map((win, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors group cursor-pointer">
                        {/* Game Info */}
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center border border-white/5 group-hover:border-accent-purple/50 transition-colors">
                                <Gamepad2 className="w-4 h-4 text-text-secondary group-hover:text-accent-purple" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{win.game}</p>
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
                                win.isHighRoller ? "text-success drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "text-white"
                            )}>
                                +{win.amount}
                            </div>
                            <div className="text-[10px] text-text-tertiary">{win.usd}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
