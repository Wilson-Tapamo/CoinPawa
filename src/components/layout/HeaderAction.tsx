"use client";

import { useState } from "react";
import { Bell, Wallet, LogOut, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatToUSD, formatSatsToUSD } from "@/lib/utils";

// ✅ AJOUT : On définit bien que username est attendu (string ou null/undefined)
interface HeaderActionsProps {
  isLoggedIn: boolean;
  initialBalance: number;
  username?: string;
}

export function HeaderActions({ isLoggedIn, initialBalance, username }: HeaderActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      // Appel API
      await fetch("/api/auth/logout", { method: "POST" });

      // ✅ CORRECTION : On force la redirection vers login au lieu de juste refresh
      // Ça "nettoie" l'état et arrête le spinner car la page change.
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed", error);
      setIsLoading(false); // Arrête le spinner si erreur
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login">
          <button className="hidden md:block px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg border border-white/10 transition-colors">
            Connexion
          </button>
        </Link>
        <Link href="/login?tab=register">
          <button className="px-4 py-2 bg-primary hover:bg-primary-hover text-background text-xs font-bold rounded-lg shadow-glow-gold transition-transform hover:scale-105">
            S'inscrire
          </button>
        </Link>
      </div>
    );
  }

  // MODE CONNECTÉ
  return (
    <div className="flex items-center gap-2 md:gap-4">
      {/* Wallet Display */}
      <Link href="/wallet">
        <div className="flex items-center gap-3 bg-surface border border-white/5 rounded-full p-1 pr-4 hover:border-primary/30 transition-colors cursor-pointer group">
          <div className="bg-primary/10 p-2 rounded-full group-hover:bg-primary/20 transition-colors">
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col md:flex-row md:items-baseline gap-1">
            <span className="text-sm font-bold text-white font-display">
              {formatSatsToUSD(initialBalance)}
            </span>
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        {/* ✅ AFFICHAGE DU PSEUDO */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
          <div className="w-6 h-6 bg-accent-purple rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase">
            {/* On prend la 1ère lettre du pseudo ou 'U' par défaut */}
            {username ? username[0] : "U"}
          </div>
          <span className="text-xs font-bold text-white max-w-[100px] truncate">
            {username || "Joueur"}
          </span>
        </div>

        {/* Notifications */}
        <button className="p-2 rounded-full hover:bg-white/5 text-text-secondary hover:text-white transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
        </button>

        {/* Bouton Logout */}
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-red-500/10 text-text-secondary hover:text-red-500 text-xs font-bold rounded-lg border border-white/10 hover:border-red-500/20 transition-all ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Déconnexion"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          <span className="hidden md:inline">Déconnexion</span>
        </button>
      </div>
    </div>
  );
}