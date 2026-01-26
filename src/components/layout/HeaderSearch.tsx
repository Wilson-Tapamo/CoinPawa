"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function HeaderSearch() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(searchParams.get("query") || "");

    // Sync input with search params (e.g. if cleared from elsewhere)
    useEffect(() => {
        setQuery(searchParams.get("query") || "");
    }, [searchParams]);

    const handleSearch = (val: string) => {
        setQuery(val);
        const params = new URLSearchParams(searchParams);
        if (val) {
            params.set("query", val);
        } else {
            params.delete("query");
        }

        // Only redirect if on home page or games page
        if (pathname === "/" || pathname === "/games") {
            router.replace(`${pathname}?${params.toString()}`);
        }
    };

    return (
        <div className="hidden md:flex flex-1 max-w-md relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary group-focus-within:text-primary transition-colors" />
            <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Rechercher un jeu..."
                className="w-full bg-surface/50 border border-white/5 rounded-full py-2.5 pl-10 pr-4 text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-primary/50 focus:bg-surface transition-all"
            />
        </div>
    );
}
