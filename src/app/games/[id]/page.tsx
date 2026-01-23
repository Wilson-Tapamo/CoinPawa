"use client";

import { useState } from "react";
import { Play, Info, ShieldCheck, Maximize2, Share2, Heart, History } from "lucide-react";
import { LiveWinsTable } from "@/components/features/LiveWinsTable"; // Reusing global wins for demo, or could filter
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Mock Data Structure for a single game
const GAME_DATA = {
    id: "sugar-rush",
    title: "Sugar Rush",
    provider: "Pragmatic Play",
    rtp: "96.50%",
    volatility: "High",
    maxWin: "5,000x",
    minBet: "$0.20",
    maxBet: "$100.00",
    tags: ["Slots", "Buy Feature", "High Volatility"],
    description: "Get ready for a sugar overdose! Sugar Rush is a 7x7 cluster pays slot featuring multipliers up to 128x, free spins, and tumble mechanics. Match different sweets to win big in this colorful adventure.",
};

import DiceGame from "@/components/games/DiceGame";
import RouletteGame from "@/components/games/RouletteGame";

export default function GameDetailsPage({ params }: { params: { id: string } }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);

    // --- GAME MAPPING ---
    if (params.id === 'dice') return <DiceGame />;
    if (params.id === 'roulette') return <RouletteGame />;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* 1. BREADCRUMBS / HEADER */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-text-tertiary">
                    <span className="hover:text-white cursor-pointer">Home</span>
                    <span>/</span>
                    <span className="hover:text-white cursor-pointer">Slots</span>
                    <span>/</span>
                    <span className="text-white font-bold">{GAME_DATA.title}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsFavorite(!isFavorite)}
                        className="p-2 rounded-full bg-surface hover:bg-surface-hover border border-white/5 transition-colors group"
                    >
                        <Heart className={cn("w-5 h-5 transition-colors", isFavorite ? "fill-accent-rose text-accent-rose" : "text-text-secondary group-hover:text-white")} />
                    </button>
                    <button className="p-2 rounded-full bg-surface hover:bg-surface-hover border border-white/5 transition-colors text-text-secondary hover:text-white">
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* 2. GAME STAGE (Cinematic Area) */}
            <div className="relative w-full aspect-video md:aspect-[21/9] bg-black rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 group">
                {!isPlaying ? (
                    /* Placeholder / Cover State */
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background-secondary relative">
                        {/* Background Image Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-600/20 to-purple-900/20 z-0" />
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0" />

                        <div className="relative z-10 text-center space-y-6 animate-in fade-in zoom-in duration-500">
                            <div className="w-24 h-24 mx-auto bg-primary rounded-full flex items-center justify-center shadow-glow-gold mb-4 cursor-pointer hover:scale-110 transition-transform" onClick={() => setIsPlaying(true)}>
                                <Play className="w-10 h-10 text-background fill-current ml-1" />
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-2">{GAME_DATA.title}</h1>
                                <p className="text-text-secondary text-lg">{GAME_DATA.provider}</p>
                            </div>
                            <button
                                onClick={() => setIsPlaying(true)}
                                className="px-8 py-3 bg-primary hover:bg-primary-hover text-background font-bold rounded-full shadow-glow-gold transition-transform hover:scale-105"
                            >
                                Play Now
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Actual Game Iframe Placeholder */
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
                        <div className="w-full h-full p-4 space-y-4 max-w-2xl mx-auto flex flex-col justify-center">
                            <div className="flex items-center space-x-4">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-[250px]" />
                                    <Skeleton className="h-4 w-[200px]" />
                                </div>
                            </div>
                            <Skeleton className="h-[300px] w-full rounded-xl" />
                            <p className="text-center text-xs text-text-tertiary animate-pulse">Establishing Secure Connection to Pragmatic Play...</p>
                        </div>
                    </div>
                )}

                {/* Fullscreen Toggle (Always visible) */}
                <button className="absolute bottom-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white backdrop-blur-sm transition-colors z-20">
                    <Maximize2 className="w-5 h-5" />
                </button>
            </div>

            {/* 3. GAME STATS & INFO BAR */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-surface/50 border border-white/5 rounded-xl backdrop-blur-sm">
                <div className="flex flex-col gap-1 px-4 border-r border-white/5 last:border-0">
                    <span className="text-xs text-text-tertiary uppercase font-bold tracking-wider">RTP</span>
                    <span className="text-lg font-bold text-success">{GAME_DATA.rtp}</span>
                </div>
                <div className="flex flex-col gap-1 px-4 border-r border-white/5 last:border-0">
                    <span className="text-xs text-text-tertiary uppercase font-bold tracking-wider">Min Bet</span>
                    <span className="text-lg font-bold text-white">{GAME_DATA.minBet}</span>
                </div>
                <div className="flex flex-col gap-1 px-4 border-r border-white/5 last:border-0">
                    <span className="text-xs text-text-tertiary uppercase font-bold tracking-wider">Max Bet</span>
                    <span className="text-lg font-bold text-white">{GAME_DATA.maxBet}</span>
                </div>
                <div className="flex flex-col gap-1 px-4 border-r border-white/5 last:border-0">
                    <span className="text-xs text-text-tertiary uppercase font-bold tracking-wider">Max Win</span>
                    <span className="text-lg font-bold text-accent-cyan">{GAME_DATA.maxWin}</span>
                </div>
            </div>

            {/* 4. CONTENT SECTIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main: Description & Tags */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-surface/30 p-6 rounded-2xl border border-white/5">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Info className="w-5 h-5 text-primary" /> About {GAME_DATA.title}
                        </h3>
                        <p className="text-text-secondary leading-relaxed mb-6">
                            {GAME_DATA.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {GAME_DATA.tags.map(tag => (
                                <span key={tag} className="px-3 py-1 bg-white/5 rounded-full text-xs font-medium text-text-secondary border border-white/5">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Provably Fair Badge */}
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-success/10 to-transparent border border-success/20">
                        <ShieldCheck className="w-8 h-8 text-success" />
                        <div>
                            <h4 className="font-bold text-white text-sm">Provably Fair</h4>
                            <p className="text-xs text-text-secondary">This game utilizes cryptography to ensure transparent and verifiable results.</p>
                        </div>
                    </div>
                </div>

                {/* Sidebar: Recent Bets / History */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <History className="w-4 h-4 text-accent-cyan" /> Game History
                        </h3>
                        <div className="flex gap-2 text-xs">
                            <button className="text-primary font-bold">All Bets</button>
                            <button className="text-text-tertiary hover:text-white">My Bets</button>
                        </div>
                    </div>
                    {/* Reusing the table but constrained height */}
                    <div className="h-[400px] overflow-hidden rounded-2xl border border-white/5 relative">
                        <div className="absolute inset-0 overflow-y-auto no-scrollbar">
                            <LiveWinsTable />
                        </div>
                        {/* Fade out bottom */}
                        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background-secondary to-transparent pointer-events-none" />
                    </div>
                </div>
            </div>
        </div>
    );
}
