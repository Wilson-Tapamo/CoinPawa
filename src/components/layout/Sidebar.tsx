// components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Wallet, User, Settings, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

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
    const [isOpen, setIsOpen] = useState(false);

    // ❌ NE PAS AFFICHER la sidebar dans /admin
    if (pathname.startsWith('/admin')) {
        return null;
    }

    // Fermer le menu mobile quand on change de page
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Empêcher le scroll quand le menu est ouvert
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <>
            {/* Bouton Burger Mobile */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden fixed top-5 left-4 z-50 p-2 bg-surface rounded-lg border border-white/10 hover:bg-surface-hover transition-colors"
                aria-label="Toggle menu"
            >
                {isOpen ? (
                    <X className="w-6 h-6 text-white" />
                ) : (
                    <Menu className="w-6 h-6 text-white" />
                )}
            </button>

            {/* Overlay Mobile */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Desktop + Mobile */}
            <aside
                className={cn(
                    "flex flex-col w-64 h-screen fixed left-0 top-0 bg-background-secondary border-r border-white/5 z-40 transition-transform duration-300",
                    // Desktop: toujours visible
                    "md:translate-x-0",
                    // Mobile: slide in/out
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
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
        </>
    );
}