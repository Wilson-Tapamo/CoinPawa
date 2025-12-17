"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Gamepad2, Wallet, User, Zap, Trophy, Settings } from "lucide-react";

export const NAV_ITEMS = [
    { label: "Home", href: "/", icon: Home },
    { label: "Games", href: "/games", icon: Gamepad2 },
    { label: "Wallet", href: "/wallet", icon: Wallet },
    { label: "Profile", href: "/profile", icon: User },
];

export const SECONDARY_NAV_ITEMS = [
    { label: "Promotions", href: "/promotions", icon: Zap },
    { label: "Tournaments", href: "/tournaments", icon: Trophy },
    { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-background-secondary border-r border-white/5 z-40">
            {/* Logo Area */}
            <div className="h-20 flex items-center px-6">
                <h1 className="text-3xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light">
                    CoinPawa
                </h1>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                <div className="text-xs font-semibold text-text-tertiary px-4 mb-2 uppercase tracking-wider">
                    Menu
                </div>
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-surface-active text-primary shadow-glow-gold/10"
                                    : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                            )}
                        >
                            <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-text-tertiary group-hover:text-text-primary")} />
                            <span className="font-medium font-sans">{item.label}</span>
                            {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-glow-gold" />
                            )}
                        </Link>
                    );
                })}

                <div className="my-6 border-t border-white/5" />

                <div className="text-xs font-semibold text-text-tertiary px-4 mb-2 uppercase tracking-wider">
                    Explore
                </div>
                {SECONDARY_NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-surface-active text-primary"
                                    : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                            )}
                        >
                            <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-text-tertiary group-hover:text-text-primary")} />
                            <span className="font-medium font-sans">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / CTA Area */}
            <div className="p-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-accent-violet to-accent-violet-glow/20 border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-white/20 blur-2xl rounded-full group-hover:bg-white/30 transition-all" />
                    <h4 className="relative font-bold text-white mb-1">VIP Club</h4>
                    <p className="relative text-xs text-white/80 mb-3">Join for exclusive rewards</p>
                    <button className="relative w-full py-2 bg-white text-accent-violet font-bold text-xs rounded-lg hover:bg-white/90 transition-colors">
                        Upgrade Now
                    </button>
                </div>
            </div>
        </aside>
    );
}
