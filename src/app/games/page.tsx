"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, Gamepad2, Dices, Zap, Tv } from "lucide-react"; // Icons for categories
import { GameCard } from "@/components/features/GameCard";
import { cn } from "@/lib/utils";

// Mock Data
const ALL_GAMES = [
    { id: 1, title: "Sugar Rush", provider: "Pragmatic Play", category: "Slots", image: "from-pink-500 to-rose-500", isHot: true, RTP: "96.5" },
    { id: 2, title: "Aviator", provider: "Spribe", category: "Crash", image: "from-red-600 to-red-400", isHot: true, RTP: "97.0" },
    { id: 3, title: "Crazy Time", provider: "Evolution", category: "Live", image: "from-purple-600 to-indigo-600", isNew: false, RTP: "95.4" },
    { id: 4, title: "Plinko", provider: "BGaming", category: "Crash", image: "from-indigo-600 to-purple-500", isHot: true, RTP: "99.0" },
    { id: 5, title: "Gates of Olympus", provider: "Pragmatic Play", category: "Slots", image: "from-yellow-600 to-amber-500", isHot: true, RTP: "96.5" },
    { id: 6, title: "Blackjack Live", provider: "Evolution", category: "Live", image: "from-slate-800 to-slate-900", isNew: false, RTP: "99.2" },
    { id: 7, title: "Big Bass Splash", provider: "Reel Kingdom", category: "Slots", image: "from-blue-600 to-cyan-400", isNew: true, RTP: "95.8" },
    { id: 8, title: "Wanted Dead or a Wild", provider: "Hacksaw", category: "Slots", image: "from-gray-800 to-gray-600", isHot: false, RTP: "96.1" },
    { id: 9, title: "Space XY", provider: "BGaming", category: "Crash", image: "from-violet-900 to-fuchsia-800", isNew: true, RTP: "97.0" },
    { id: 10, title: "Roulette Lobby", provider: "Pragmatic Live", category: "Live", image: "from-green-800 to-emerald-900", isHot: false, RTP: "97.3" },
    { id: 11, title: "Sweet Bonanza", provider: "Pragmatic Play", category: "Slots", image: "from-pink-400 to-purple-400", isHot: true, RTP: "96.5" },
    { id: 12, title: "Mines", provider: "Spribe", category: "Crash", image: "from-slate-700 to-slate-500", RTP: "97.0" },
    { id: 13, title: "Chaos Crew 2", provider: "Hacksaw", category: "Slots", image: "from-stone-900 to-stone-700", isNew: true, RTP: "96.2" },
    { id: 14, title: "Monopoly Live", provider: "Evolution", category: "Live", image: "from-teal-800 to-cyan-800", isHot: true, RTP: "96.0" },
    { id: 15, title: "Zeus vs Hades", provider: "Pragmatic Play", category: "Slots", image: "from-blue-900 to-cyan-700", isHot: true, RTP: "96.0" },
];

const CATEGORIES = [
    { id: "All", label: "All Games", icon: Gamepad2 },
    { id: "Slots", label: "Slots", icon: Dices },       // Using Dice as placeholder for Slots
    { id: "Crash", label: "Crash Games", icon: Zap },
    { id: "Live", label: "Live Casino", icon: Tv },
];

export default function GamesPage() {
    const [activeCategory, setActiveCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    // Filter Logic
    const filteredGames = ALL_GAMES.filter((game) => {
        const matchesCategory = activeCategory === "All" || game.category === activeCategory;
        const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            game.provider.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="space-y-6">
            {/* 1. Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-display text-white mb-1">Casino Games</h1>
                    <p className="text-text-tertiary text-sm">Explore over 3000+ premium crypto games.</p>
                </div>

                {/* Search & Filter - Mobile optimized */}
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                        <input
                            type="text"
                            placeholder="Search games..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-surface border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-primary/50 transition-all"
                        />
                    </div>
                    <button className="p-2.5 bg-surface border border-white/5 rounded-xl text-text-secondary hover:text-white hover:border-primary/30 transition-colors">
                        <SlidersHorizontal className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* 2. Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = activeCategory === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all border",
                                isActive
                                    ? "bg-primary text-background border-primary shadow-glow-gold"
                                    : "bg-surface text-text-secondary border-white/5 hover:bg-surface-hover hover:text-white"
                            )}
                        >
                            <Icon className={cn("w-4 h-4", isActive ? "text-background" : "text-text-tertiary")} />
                            {cat.label}
                        </button>
                    );
                })}
            </div>

            {/* 3. Games Grid */}
            {filteredGames.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {filteredGames.map((game) => (
                        <GameCard
                            key={game.id}
                            {...game}
                        />
                    ))}
                </div>
            ) : (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-20 text-text-tertiary">
                    <Dices className="w-16 h-16 opacity-20 mb-4" />
                    <p className="text-lg font-medium">No games found</p>
                    <p className="text-sm">Try exploring other categories.</p>
                </div>
            )}
        </div>
    );
}
