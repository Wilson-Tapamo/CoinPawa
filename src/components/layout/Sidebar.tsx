// Sidebar
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Gamepad2, Wallet, User, Zap, Trophy, Settings } from "lucide-react";

export const NAV_ITEMS = [
    { label: "Accueil", href: "/", icon: Home },
    { label: "Portefeuille", href: "/wallet", icon: Wallet },
    { label: "Profil", href: "/profile", icon: User },
];

export const SECONDARY_NAV_ITEMS = [
    { label: "Paramètres", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    // ❌ NE PAS AFFICHER la sidebar dans /admin
    if (pathname.startsWith('/admin')) {
        return null;
    }

    return (
        <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-background-secondary border-r border-white/5 z-40">
            {/* Logo Area */}
            <div className="h-20 flex items-center px-6">
                <h1 className="text-3xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light">
                    CoinPower
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
                    Explorer
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
        </aside>
    );
}
