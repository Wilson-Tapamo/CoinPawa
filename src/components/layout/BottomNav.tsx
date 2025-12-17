"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./Sidebar";

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background-secondary/90 backdrop-blur-xl border-t border-white/5 flex items-center justify-around z-50 px-2 pb-safe">
            {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors relative",
                            isActive ? "text-primary" : "text-text-tertiary hover:text-text-secondary"
                        )}
                    >
                        {/* Active Indicator Glow */}
                        {isActive && (
                            <div className="absolute -top-[1px] w-12 h-[2px] bg-primary shadow-[0_0_10px_#F59E0B]" />
                        )}

                        <Icon className={cn("w-6 h-6 transition-transform", isActive && "scale-110")} />
                        <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
