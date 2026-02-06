"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Timer, Trophy, ArrowRight, Sparkles, Coins, Crown, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const RECENT_LOTTERY_WINNERS = [
    { user: "LuckyDragon", amount: "$5,000", time: "2m ago" },
    { user: "CryptoWhale", amount: "$150", time: "5m ago" },
    { user: "SatoshiDream", amount: "$50", time: "12m ago" },
    { user: "MoonWalker", amount: "$1,200", time: "18m ago" },
];

export function LotteryFeature() {
    // Compte à rebours simulé pour le prochain tirage (ex: toutes les 10 min)
    const [timeLeft, setTimeLeft] = useState<{ m: number; s: number }>({ m: 4, s: 59 });

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev.s === 0) {
                    if (prev.m === 0) return { m: 9, s: 59 }; // Reset
                    return { m: prev.m - 1, s: 59 };
                }
                return { m: prev.m, s: prev.s - 1 };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="relative w-full rounded-3xl overflow-hidden border border-white/5 shadow-2xl group">
            {/* BACKGROUND */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/games/lottery_bg.png" // Assure-toi d'avoir une image, sinon fallback css
                    alt="Lottery Background"
                    fill
                    className="object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-accent-purple/90 via-indigo-900/80 to-transparent" />
                {/* Noise texture */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            </div>

            {/* CONTENT GRID */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 md:p-12 items-center">

                {/* LEFT: HERO TEXT & COUNTDOWN */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-400 border border-amber-400/20 rounded-full w-fit">
                        <Crown className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Tirage Quotidien</span>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-4xl md:text-5xl font-display font-black text-white leading-tight">
                            Gagnez le <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">JACKPOT</span> <br />
                            de $100,000
                        </h2>
                        <p className="text-text-secondary text-lg max-w-md">
                            Choisissez vos numéros chanceux et tentez de remporter le gros lot. Tirages toutes les 10 minutes !
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4 min-w-[200px]">
                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                <Timer className="w-6 h-6 text-primary animate-pulse" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-text-tertiary uppercase">Prochain Tirage</p>
                                <p className="text-2xl font-mono font-bold text-white tabular-nums">
                                    00:{timeLeft.m.toString().padStart(2, '0')}:{timeLeft.s.toString().padStart(2, '0')}
                                </p>
                            </div>
                        </div>

                        <Link
                            href="/games/lottery"
                            className="flex-1 min-w-[180px] h-20 flex items-center justify-center gap-3 bg-primary hover:bg-primary-hover text-background text-lg font-black rounded-2xl transition-all shadow-glow-gold hover:-translate-y-1"
                        >
                            <Zap className="w-6 h-6 fill-current" />
                            JOUEZ MAINTENANT
                        </Link>
                    </div>
                </div>

                {/* RIGHT: TICKET / WINNERS VISUAL */}
                <div className="relative hidden lg:block">
                    {/* Floating Tickets Visual (CSS only abstraction) */}
                    <div className="absolute top-0 right-10 w-64 h-40 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl transform rotate-6 border-4 border-white/10 shadow-2xl flex items-center justify-center flex-col z-0 opacity-80 animate-float">
                        <div className="text-white/20 font-black text-6xl">777</div>
                    </div>
                    <div className="absolute top-10 right-28 w-64 h-40 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl transform -rotate-6 border-4 border-white/10 shadow-2xl flex items-center justify-center flex-col z-10 animate-float-delayed">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-5 h-5 text-amber-300" />
                            <span className="font-bold text-white tracking-widest uppercase">Golden Ticket</span>
                        </div>
                        <div className="text-5xl font-black text-white font-mono tracking-widest">
                            24 • 07 • 19
                        </div>
                    </div>

                    {/* Winners Ticker */}
                    <div className="absolute -bottom-10 right-0 w-80 bg-surface/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl z-20">
                        <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                            <span className="text-xs font-bold text-white flex items-center gap-2">
                                <Trophy className="w-3 h-3 text-amber-400" /> Derniers Gagnants
                            </span>
                        </div>
                        <div className="space-y-3">
                            {RECENT_LOTTERY_WINNERS.map((w, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-text-secondary">
                                            {w.user.charAt(0)}
                                        </div>
                                        <span className="text-text-secondary">{w.user}</span>
                                    </div>
                                    <span className="font-bold text-success">{w.amount}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
