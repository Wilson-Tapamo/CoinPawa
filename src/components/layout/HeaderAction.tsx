"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Wallet, LogOut, Loader2, User, Mail, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatToUSD, formatSatsToUSD } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface HeaderActionsProps {
  isLoggedIn: boolean;
  initialBalance: number;
  username?: string;
  email?: string;
}

export function HeaderActions({ isLoggedIn, initialBalance, username, email }: HeaderActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [balance, setBalance] = useState(initialBalance);
  const [isBalanceChanged, setIsBalanceChanged] = useState(false);
  const [balanceChangeType, setBalanceChangeType] = useState<'increase' | 'decrease' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown quand on clique dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Actualisation automatique du wallet toutes les 5 secondes
  useEffect(() => {
    console.log("🔵 useEffect actualisation - isLoggedIn:", isLoggedIn, "balance actuelle:", balance);
    
    if (!isLoggedIn) {
      console.log("⚠️ User pas connecté, arrêt");
      return;
    }

    const fetchBalance = async () => {
      console.log("🔄 [" + new Date().toLocaleTimeString() + "] Fetching balance...");
      try {
        const res = await fetch("/api/wallet/balance");
        console.log("📡 Status:", res.status);
        
        const data = await res.json();
        console.log("📦 Data reçue:", data);
        
        if (data.success) {
          const newBalance = data.balance;
          console.log("💰 Comparaison - Actuel:", balance, "→ Nouveau:", newBalance, "→ Égal?", newBalance === balance);
          
          if (newBalance !== balance) {
            const type = newBalance > balance ? 'increase' : 'decrease';
            console.log("✅ CHANGEMENT DÉTECTÉ! Type:", type);
            
            setBalanceChangeType(type);
            setIsBalanceChanged(true);
            setBalance(newBalance);
            
            setTimeout(() => {
              console.log("⏰ Fin animation");
              setIsBalanceChanged(false);
              setBalanceChangeType(null);
            }, 2000);
          } else {
            console.log("➡️ Pas de changement");
          }
        } else {
          console.log("❌ data.success est false ou manquant");
        }
      } catch (error) {
        console.error("❌ Erreur fetch:", error);
      }
    };

    console.log("🚀 Lancement première actualisation");
    fetchBalance();

    console.log("⏰ Démarrage interval 5s");
    const interval = setInterval(fetchBalance, 5000);

    return () => {
      console.log("🛑 Cleanup interval");
      clearInterval(interval);
    };
  }, [isLoggedIn, balance]);

  const handleLogout = async () => {
    setIsLoading(true);
    setIsDropdownOpen(false);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed", error);
      setIsLoading(false);
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
          <div className={cn(
            "bg-primary/10 p-2 rounded-full group-hover:bg-primary/20 transition-all",
            isBalanceChanged && balanceChangeType === 'increase' && "animate-pulse bg-success/20",
            isBalanceChanged && balanceChangeType === 'decrease' && "animate-pulse bg-accent-rose/20"
          )}>
            <Wallet className={cn(
              "w-4 h-4 transition-colors",
              isBalanceChanged && balanceChangeType === 'increase' ? "text-success" : 
              isBalanceChanged && balanceChangeType === 'decrease' ? "text-accent-rose" : 
              "text-primary"
            )} />
          </div>
          <div className="flex flex-col md:flex-row md:items-baseline gap-1">
            <span className={cn(
              "text-sm font-bold font-display transition-colors",
              isBalanceChanged && balanceChangeType === 'increase' ? "text-success" : 
              isBalanceChanged && balanceChangeType === 'decrease' ? "text-accent-rose" : 
              "text-white"
            )}>
              {formatSatsToUSD(balance)}
            </span>
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        {/* USER DROPDOWN */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={cn(
              "hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all",
              isDropdownOpen
                ? "bg-primary/10 border-primary/30"
                : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
            )}
          >
            <div className="w-6 h-6 bg-accent-purple rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase">
              {username ? username[0] : "U"}
            </div>
            <span className="text-xs font-bold text-white max-w-[100px] truncate">
              {username || "Joueur"}
            </span>
            <ChevronDown 
              className={cn(
                "w-4 h-4 text-text-secondary transition-transform",
                isDropdownOpen && "rotate-180"
              )} 
            />
          </button>

          {/* DROPDOWN MENU */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-surface border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Header avec infos user */}
              <div className="p-4 bg-gradient-to-br from-primary/10 to-accent-violet/10 border-b border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-accent-purple rounded-full flex items-center justify-center text-sm font-bold text-white uppercase">
                    {username ? username[0] : "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {username || "Joueur"}
                    </p>
                    {email && (
                      <p className="text-xs text-text-tertiary truncate flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="p-2">
                <Link
                  href="/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <User className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium text-white">Mon Profil</span>
                </Link>

                <button
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors group disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 text-text-secondary animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4 text-text-secondary group-hover:text-red-500 transition-colors" />
                  )}
                  <span className="text-sm font-medium text-white group-hover:text-red-500 transition-colors">
                    Déconnexion
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <button className="p-2 rounded-full hover:bg-white/5 text-text-secondary hover:text-white transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
        </button>
      </div>
    </div>
  );
}