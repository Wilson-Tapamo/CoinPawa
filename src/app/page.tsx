"use client";

import { useState, useEffect, useMemo } from "react";
import { Bitcoin, Plus, ArrowUpRight, TrendingUp, Sparkles, Filter, LogIn, UserPlus, LogOut, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GameCard } from "@/components/features/GameCard";
import { LiveWinsTable } from "@/components/features/LiveWinsTable";
import { cn } from "@/lib/utils";

// --- DONNÉES DES JEUX ---
const ALL_GAMES = [
  { title: "Dice", provider: "CoinPower Originals", image: "from-blue-600 to-indigo-600", imageSrc: "/games/dice.png", isHot: true, RTP: "99.0", link: "/games/dice", category: "originals" },
  { title: "Roulette", provider: "CoinPower Originals", image: "from-red-600 to-rose-600", imageSrc: "/games/roulette.png", isHot: true, RTP: "97.3", link: "/games/roulette", category: "originals" },
  { title: "Spin Wheel", provider: "CoinPower Originals", image: "from-purple-600 to-violet-500", imageSrc: "/games/wheel.png", isNew: true, RTP: "95.0", link: "/games/wheel", category: "originals" },
  { title: "Crash", provider: "CoinPower Originals", image: "from-orange-600 to-amber-500", imageSrc: "/games/crash.png", isHot: false, RTP: "99.0", link: "/games/crash", category: "originals" },
  { title: "Chaos Crew 2", provider: "Hacksaw", image: "from-stone-900 to-stone-700", isNew: true, category: "slots" },
  { title: "Zeus vs Hades", provider: "Pragmatic Play", image: "from-blue-900 to-cyan-700", isHot: true, category: "slots" },
  { title: "Rip City", provider: "Hacksaw", image: "from-slate-800 to-slate-600", RTP: "96.4", category: "slots" },
  { title: "Money Train 4", provider: "Relax Gaming", image: "from-amber-900 to-yellow-700", isHot: true, category: "slots" },
  { title: "Blackjack VIP", provider: "Evolution", image: "from-emerald-800 to-green-600", category: "table" },
  { title: "Baccarat", provider: "Evolution", image: "from-red-800 to-rose-600", category: "table" },
  { title: "Mega Roulette", provider: "Pragmatic Live", image: "from-purple-800 to-fuchsia-600", isHot: true, category: "live" },
  { title: "Crazy Time", provider: "Evolution", image: "from-yellow-600 to-orange-500", isHot: true, category: "live" },
];

// Catégories avec mapping
const CATEGORIES = [
  { id: "lobby", label: "Lobby" },
  { id: "slots", label: "Machines à Sous" },
  { id: "live", label: "Casino Live" },
  { id: "table", label: "Jeux de Table" },
  { id: "originals", label: "Originaux" },
  { id: "new", label: "Nouveautés" },
];

export default function Home() {
  const router = useRouter();

  // --- ÉTATS ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [balance, setBalance] = useState("0");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("lobby");
  const [searchQuery, setSearchQuery] = useState("");

  // --- VÉRIFICATION DE LA CONNEXION ---
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/wallet/balance");
        if (res.ok) {
          const data = await res.json();
          setBalance(data.balance);
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch {
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // --- FILTRAGE DES JEUX ---
  const filteredGames = useMemo(() => {
    let games = ALL_GAMES;

    // Filtre par catégorie
    if (selectedCategory !== "lobby") {
      if (selectedCategory === "new") {
        games = games.filter((g) => g.isNew);
      } else {
        games = games.filter((g) => g.category === selectedCategory);
      }
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      games = games.filter(
        (g) =>
          g.title.toLowerCase().includes(query) ||
          g.provider.toLowerCase().includes(query)
      );
    }

    return games;
  }, [selectedCategory, searchQuery]);

  // Jeux vedettes (pour la section principale)
  const featuredGames = useMemo(() => {
    return filteredGames.filter((g) => g.category === "originals" || g.isHot).slice(0, 6);
  }, [filteredGames]);

  // Nouveautés
  const newGames = useMemo(() => {
    return filteredGames.filter((g) => g.isNew || g.category === "slots").slice(0, 4);
  }, [filteredGames]);

  // --- DÉCONNEXION ---
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

      {/* 1. HERO SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* --- CARTE PRINCIPALE (Balance OU Login) --- */}
        <div className="lg:col-span-2 relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-glow-purple/20 group transition-all">
          <div className="absolute inset-0 bg-gradient-to-r from-accent-violet to-indigo-900" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
          <div className="absolute -right-10 -top-10 w-64 h-64 bg-accent-cyan/30 blur-[100px] rounded-full mix-blend-screen animate-pulse-slow" />

          {isLoading ? (
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-white/50 animate-spin" />
            </div>
          ) : isLoggedIn ? (
            <div className="relative z-10 w-full h-full p-6 md:p-10 flex flex-col justify-center animate-in fade-in duration-500">
              <div className="flex justify-between items-start">
                <h2 className="text-text-secondary text-sm md:text-base font-medium mb-1 flex items-center gap-2">
                  <span className="w-2 h-2 bg-success rounded-full" /> Portefeuille
                </h2>

                <button
                  onClick={handleLogout}
                  className="text-xs font-bold text-white/50 hover:text-white flex items-center gap-1 bg-black/20 hover:bg-black/40 px-3 py-1.5 rounded-full transition-colors"
                >
                  <LogOut className="w-3 h-3" /> Déconnexion
                </button>
              </div>

              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl md:text-6xl font-display font-bold text-white">{parseInt(balance).toLocaleString()}</span>
                <span className="text-2xl md:text-4xl font-display text-white/50">SATS</span>
              </div>

              <div className="flex items-center gap-3">
                <Link href="/wallet" className="flex-1 max-w-[160px] h-12 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-background font-bold rounded-full transition-all shadow-glow-gold hover:scale-105 active:scale-95">
                  <Plus className="w-5 h-5" />
                  Déposer
                </Link>
                <Link href="/wallet" className="flex-1 max-w-[160px] h-12 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full border border-white/5 backdrop-blur-md transition-all">
                  <ArrowUpRight className="w-5 h-5" />
                  Retirer
                </Link>
              </div>

              <div className="absolute bottom-6 right-6 hidden md:block">
                <Bitcoin className="w-24 h-24 text-white/10 rotate-12" />
              </div>
            </div>
          ) : (
            <div className="relative z-10 w-full h-full p-6 md:p-10 flex flex-col justify-center animate-in fade-in duration-500">
              <h2 className="text-white text-3xl md:text-5xl font-display font-bold mb-4">
                Bienvenue sur <span className="text-primary">CoinPower</span>
              </h2>
              <p className="text-text-secondary text-lg mb-8 max-w-md">
                Le casino crypto nouvelle génération. Dépôts instantanés, retraits rapides et jeu anonyme.
              </p>

              <div className="flex items-center gap-3">
                <Link href="/login" className="flex-1 max-w-[160px] h-12 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-background font-bold rounded-full transition-all shadow-glow-gold hover:scale-105">
                  <LogIn className="w-5 h-5" />
                  Connexion
                </Link>
                <Link href="/login?tab=register" className="flex-1 max-w-[160px] h-12 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full border border-white/5 backdrop-blur-md transition-all">
                  <UserPlus className="w-5 h-5" />
                  S'inscrire
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Promotions / Mini Banner */}
        <div className="hidden lg:block h-80 rounded-2xl bg-gradient-to-br from-surface to-background-secondary border border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-10" />
          <div className="absolute inset-0 bg-gradient-to-tr from-accent-rose/20 to-orange-500/20" />

          <div className="relative z-20 h-full p-6 flex flex-col justify-end">
            <div className="px-3 py-1 bg-accent-rose text-white text-xs font-bold uppercase tracking-wide rounded-full w-fit mb-3">
              Bonus
            </div>
            <h3 className="text-2xl font-bold font-display text-white mb-2 leading-tight">
              Doublez Votre <br /> Premier Dépôt
            </h3>
            <p className="text-text-secondary text-sm mb-4">Jusqu'à 1 BTC + 50 Tours Gratuits</p>
            <Link href="/wallet" className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-bold transition-colors flex items-center justify-center">
              {isLoggedIn ? "Déposer Maintenant" : "Réclamer le Bonus"}
            </Link>
          </div>
        </div>
      </section>

      {/* 2. BARRE DE RECHERCHE + CATÉGORIES */}
      <section className="space-y-4">
        {/* Barre de recherche mobile */}
        <div className="md:hidden relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Rechercher un jeu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface/50 border border-white/5 rounded-full py-2.5 pl-10 pr-4 text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-primary/50 focus:bg-surface transition-all"
          />
        </div>

        {/* Catégories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border",
                selectedCategory === cat.id
                  ? "bg-white text-background border-white"
                  : "bg-surface text-text-secondary border-white/5 hover:bg-surface-hover hover:text-white"
              )}
            >
              {cat.label}
            </button>
          ))}
          <button className="ml-auto px-3 py-2 rounded-lg bg-surface border border-white/5 text-text-secondary hover:text-white">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 3. JEUX VEDETTES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-white font-display">Nos Jeux Vedettes</h2>
          </div>
          <a href="#" className="text-xs font-bold text-text-tertiary hover:text-text-primary uppercase tracking-wider">Voir Tout</a>
        </div>

        {featuredGames.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredGames.map((game, i) => (
              <Link key={i} href={game.link || '#'}>
                <GameCard {...game} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-text-secondary">
            Aucun jeu trouvé pour cette catégorie.
          </div>
        )}
      </section>

      {/* 4. GAINS EN DIRECT & NOUVEAUTÉS */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <LiveWinsTable />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-accent-cyan" />
            <h2 className="text-xl font-bold text-white font-display">Nouveautés</h2>
          </div>
          {newGames.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {newGames.map((game, i) => (
                <Link key={i} href={game.link || '#'}>
                  <GameCard {...game} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-text-secondary">
              Aucune nouveauté disponible.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}