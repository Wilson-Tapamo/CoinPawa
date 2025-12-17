import { Bell, Search, Wallet } from "lucide-react";
import Link from "next/link";

// Simple atomic components for the header to avoid dependency cycles for now
function HeaderButton({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <button className={`p-2 rounded-full hover:bg-white/5 text-text-secondary hover:text-white transition-colors relative ${className}`}>
            {children}
        </button>
    );
}

export function Header() {
    return (
        <header className="sticky top-0 z-30 w-full h-20 flex items-center px-4 md:px-8 border-b border-white/5 bg-background/80 backdrop-blur-md transition-all">
            {/* Mobile: Logo (Sidebar hidden) */}
            <div className="md:hidden flex items-center mr-4">
                {/* Placeholder for optional hamburger if sidebar logic changes */}
                <span className="text-xl font-display font-bold text-white tracking-tight">CoinPawa</span>
            </div>

            {/* Desktop: Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary group-focus-within:text-primary transition-colors" />
                <input
                    type="text"
                    placeholder="Search games, providers..."
                    className="w-full bg-surface/50 border border-white/5 rounded-full py-2.5 pl-10 pr-4 text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-primary/50 focus:bg-surface transition-all"
                />
            </div>

            {/* Right Actions */}
            <div className="ml-auto flex items-center gap-2 md:gap-4">
                {/* Wallet Display (Keep visible for anonymous users too) */}
                <Link href="/wallet">
                    <div className="flex items-center gap-3 bg-surface border border-white/5 rounded-full p-1 pr-4 hover:border-primary/30 transition-colors cursor-pointer group">
                        <div className="bg-primary/10 p-2 rounded-full group-hover:bg-primary/20 transition-colors">
                            <Wallet className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex flex-col md:flex-row md:items-baseline gap-1">
                            <span className="text-xs font-bold text-white font-display uppercase">0.00 BTC</span>
                        </div>
                    </div>
                </Link>

                {/* Login / Sign Up */}
                <div className="flex items-center gap-2">
                    <Link href="/login">
                        <button className="hidden md:block px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg border border-white/10 transition-colors">
                            Log In
                        </button>
                    </Link>
                    <Link href="/login">
                        <button className="px-4 py-2 bg-primary hover:bg-primary-hover text-background text-xs font-bold rounded-lg shadow-glow-gold transition-transform hover:scale-105">
                            Sign Up
                        </button>
                    </Link>
                </div>
            </div>
        </header>
    );
}
