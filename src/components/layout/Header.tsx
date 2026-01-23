import { Search } from "lucide-react";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HeaderActions } from "./HeaderAction";

export async function Header() {
    const userId = await verifySession();
    let balance = 0;
    let username = ""; // Variable par défaut vide
    let isLoggedIn = false;

    if (userId) {
        isLoggedIn = true;
        
        try {
            // ✅ CORRECTION : On demande le wallet ET les infos User
            const wallet = await prisma.wallet.findUnique({
                where: { userId },
                include: { user: true } // <-- INDISPENSABLE pour avoir le pseudo
            });

            if (wallet) {
                balance = Number(wallet.balanceSats);
                username = wallet.user.username; // On remplit la variable
            }
        } catch (error) {
            console.error("⚠️ Erreur Header BDD", error);
        }
    }

    return (
        <header className="sticky top-0 z-30 w-full h-20 flex items-center px-4 md:px-8 border-b border-white/5 bg-background/80 backdrop-blur-md transition-all">
             {/* Logo Mobile */}
             <div className="md:hidden flex items-center mr-4">
                <span className="text-xl font-display font-bold text-white tracking-tight">CoinPower</span>
            </div>

            {/* Barre de recherche */}
            <div className="hidden md:flex flex-1 max-w-md relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary group-focus-within:text-primary transition-colors" />
                <input
                    type="text"
                    placeholder="Search games..."
                    className="w-full bg-surface/50 border border-white/5 rounded-full py-2.5 pl-10 pr-4 text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-primary/50 focus:bg-surface transition-all"
                />
            </div>

            <div className="ml-auto">
                {/* ✅ IMPORTANT : On passe bien 'username' ici */}
                <HeaderActions 
                    isLoggedIn={isLoggedIn} 
                    initialBalance={balance} 
                    username={username} 
                />
            </div>
        </header>
    );
}