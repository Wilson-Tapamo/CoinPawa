"use client";

import { useState, useEffect } from "react";
import { Bitcoin, Plus, ArrowUpRight, TrendingUp, Sparkles, Filter, LogIn, UserPlus, LogOut, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GameCard } from "@/components/features/GameCard";
import { LiveWinsTable } from "@/components/features/LiveWinsTable";
import { cn } from "@/lib/utils";

// --- MOCK DATA ---
const FEATURED_GAMES = [
  { title: "Sugar Rush", provider: "Pragmatic Play", image: "from-pink-500 to-rose-500", isHot: true, RTP: "96.5" },
  { title: "Big Bass Splash", provider: "Reel Kingdom", image: "from-blue-600 to-cyan-400", isNew: true, RTP: "95.8" },
  { title: "Razor Returns", provider: "Push Gaming", image: "from-slate-700 to-emerald-600", isHot: true, RTP: "97.2" },
  { title: "Wanted Dead", provider: "Hacksaw", image: "from-gray-800 to-gray-600", isHot: false, RTP: "96.1" },
  { title: "Plinko", provider: "BGaming", image: "from-indigo-600 to-purple-500", isHot: true, RTP: "99.0" },
  { title: "Aviator", provider: "Spribe", image: "from-red-600 to-red-400", isHot: true, RTP: "97.0" },
];

const NEW_GAMES = [
  { title: "Chaos Crew 2", provider: "Hacksaw", image: "from-stone-900 to-stone-700", isNew: true },
  { title: "Zeus vs Hades", provider: "Pragmatic Play", image: "from-blue-900 to-cyan-700", isHot: true },
  { title: "Rip City", provider: "Hacksaw", image: "from-slate-800 to-slate-600", RTP: "96.4" },
  { title: "Money Train 4", provider: "Relax Gaming", image: "from-amber-900 to-yellow-700", isHot: true },
];

export default function Home() {
  const router = useRouter();
  
  // --- ÉTATS  ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [balance, setBalance] = useState("0");
  const [isLoading, setIsLoading] = useState(true);

  // --- 1. VÉRIFICATION LA CONNEXION AU CHARGEMENT ---
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // On tente de récupérer la balance. Si ça marche = Connecté.
        const res = await fetch("/api/wallet/balance");
        if (res.ok) {
          const data = await res.json();
          setBalance(data.balance); 
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // ---  DÉCONNEXION ---
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setIsLoggedIn(false);
      setBalance("0");
      router.refresh(); 
    } catch (error) {
      console.error("Erreur logout", error);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* 1. HERO SECTION (Dynamique) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- CARTE PRINCIPALE (Balance OU Login) --- */}
        <div className="lg:col-span-2 relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-glow-purple/20 group transition-all">
          <div className="absolute inset-0 bg-gradient-to-r from-accent-violet to-indigo-900" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
          {/* Abstract Shapes */}
          <div className="absolute -right-10 -top-10 w-64 h-64 bg-accent-cyan/30 blur-[100px] rounded-full mix-blend-screen animate-pulse-slow" />

          {isLoading ? (
            // SQUELETTE DE CHARGEMENT
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-white/50 animate-spin" />
            </div>
          ) : isLoggedIn ? (
            // --- MODE CONNECTÉ : AFFICHER BALANCE ---
            <div className="relative z-10 w-full h-full p-6 md:p-10 flex flex-col justify-center animate-in fade-in duration-500">
              <div className="flex justify-between items-start">
                <h2 className="text-text-secondary text-sm md:text-base font-medium mb-1 flex items-center gap-2">
                  <span className="w-2 h-2 bg-success rounded-full" /> Live Wallet
                </h2>
                
                {/* Bouton Logout */}
                <button 
                  onClick={handleLogout}
                  className="text-xs font-bold text-white/50 hover:text-white flex items-center gap-1 bg-black/20 hover:bg-black/40 px-3 py-1.5 rounded-full transition-colors"
                >
                  <LogOut className="w-3 h-3" /> Logout
                </button>
              </div>

              <div className="flex items-baseline gap-2 mb-6">
                {/* BALANCE  */}
                <span className="text-4xl md:text-6xl font-display font-bold text-white">{parseInt(balance).toLocaleString()}</span>
                <span className="text-2xl md:text-4xl font-display text-white/50">SATS</span>
              </div>

              <div className="flex items-center gap-3">
                <Link href="/wallet" className="flex-1 max-w-[160px] h-12 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-background font-bold rounded-full transition-all shadow-glow-gold hover:scale-105 active:scale-95">
                  <Plus className="w-5 h-5" />
                  Deposit
                </Link>
                <Link href="/wallet" className="flex-1 max-w-[160px] h-12 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full border border-white/5 backdrop-blur-md transition-all">
                  <ArrowUpRight className="w-5 h-5" />
                  Withdraw
                </Link>
              </div>

              <div className="absolute bottom-6 right-6 hidden md:block">
                <Bitcoin className="w-24 h-24 text-white/10 rotate-12" />
              </div>
            </div>
          ) : (
            // --- MODE NON CONNECTÉ : AFFICHER LOGIN/REGISTER ---
            <div className="relative z-10 w-full h-full p-6 md:p-10 flex flex-col justify-center animate-in fade-in duration-500">
              <h2 className="text-white text-3xl md:text-5xl font-display font-bold mb-4">
                Welcome to <span className="text-primary">CoinPawa</span>
              </h2>
              <p className="text-text-secondary text-lg mb-8 max-w-md">
                The next generation crypto casino. Instant deposits, fast withdrawals, and anonymous play.
              </p>

              <div className="flex items-center gap-3">
                <Link href="/login" className="flex-1 max-w-[160px] h-12 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-background font-bold rounded-full transition-all shadow-glow-gold hover:scale-105">
                  <LogIn className="w-5 h-5" />
                  Log In
                </Link>
                <Link href="/login?tab=register" className="flex-1 max-w-[160px] h-12 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full border border-white/5 backdrop-blur-md transition-all">
                  <UserPlus className="w-5 h-5" />
                  Register
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Promotions / Mini Banner  */}
        <div className="hidden lg:block h-80 rounded-2xl bg-gradient-to-br from-surface to-background-secondary border border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-10" />
          <div className="absolute inset-0 bg-gradient-to-tr from-accent-rose/20 to-orange-500/20" />

          <div className="relative z-20 h-full p-6 flex flex-col justify-end">
            <div className="px-3 py-1 bg-accent-rose text-white text-xs font-bold uppercase tracking-wide rounded-full w-fit mb-3">
              Bonus
            </div>
            <h3 className="text-2xl font-bold font-display text-white mb-2 leading-tight">
              Double Your <br /> First Deposit
            </h3>
            <p className="text-text-secondary text-sm mb-4">Up to 1 BTC + 50 Free Spins</p>
            <Link href="/wallet" className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-bold transition-colors flex items-center justify-center">
              {isLoggedIn ? "Deposit Now" : "Claim Bonus"}
            </Link>
          </div>
        </div>
      </section>

      {/* 2. GAME CATEGORIES  */}
      <section className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {["Lobby", "Slots", "Live Casino", "Table Games", "Originals", "New Releases"].map((cat, i) => (
          <button
            key={cat}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border",
              i === 0
                ? "bg-white text-background border-white"
                : "bg-surface text-text-secondary border-white/5 hover:bg-surface-hover hover:text-white"
            )}
          >
            {cat}
          </button>
        ))}
        <button className="ml-auto px-3 py-2 rounded-lg bg-surface border border-white/5 text-text-secondary hover:text-white">
          <Filter className="w-4 h-4" />
        </button>
      </section>

      {/* 3. FEATURED GAMES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-white font-display">Featured Slots</h2>
          </div>
          <a href="#" className="text-xs font-bold text-text-tertiary hover:text-text-primary uppercase tracking-wider">View All</a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {FEATURED_GAMES.map((game, i) => (
            <GameCard key={i} {...game} />
          ))}
        </div>
      </section>

      {/* 4. LIVE WINS & NEW GAMES */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <LiveWinsTable />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-accent-cyan" />
            <h2 className="text-xl font-bold text-white font-display">New Arrivals</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {NEW_GAMES.map((game, i) => (
              <GameCard key={i} {...game} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}