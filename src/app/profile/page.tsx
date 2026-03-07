"use client";

import { useEffect, useState } from "react";
import { 
  Wallet, Trophy, Flame, Gamepad2, Sparkles, 
  TrendingUp, ArrowLeft, Loader2, Calendar, Mail, Camera
} from "lucide-react";
import Link from "next/link";
import { formatSatsToUSD, cn } from "@/lib/utils";
import { AvatarSelector } from "@/components/AvatarSelector";
import { BannerSelector } from "@/components/BannerSelector";
import Image from "next/image";
import { GamePerformanceChart, ProfitChart } from "@/components/ProfileCharts";

interface ProfileStats {
  user: {
    username: string;
    email: string;
    userId: string;
    joinDate: string;
    avatarUrl: string | null;
    bannerUrl: string | null;
  };
  stats: {
    currentBalance: number;
    totalDeposited: number;
    totalWithdrawn: number;
    netProfit: number;
    totalWagered: number;
    totalWon: number;
    totalBets: number;
    winCount: number;
    lossCount: number;
    winRate: number;
    maxWin: number;
    currentStreak: number;
    bestStreak: number;
    favoriteGame: {
      name: string;
      plays: number;
    } | null;
  };
}

interface GameHistory {
  id: string;
  type: string;
  amount: number;
  gameName: string;
  timestamp: string;
  betAmount: number;
  netProfit: number;
  isWin: boolean;
}

export default function ProfilePage() {
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // États pour Avatar/Banner
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [showBannerSelector, setShowBannerSelector] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [currentBanner, setCurrentBanner] = useState<string | null>(null);
  
  // États pour les graphiques
  const [chartData, setChartData] = useState<{
    profitData: Array<{ date: string; profit: number; day: string }>;
    gamePerformance: Array<{ name: string; profit: number; plays: number }>;
  } | null>(null);
  const [loadingCharts, setLoadingCharts] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats
        const statsRes = await fetch("/api/profile/stats");
        const statsData = await statsRes.json();
        
        // Fetch history
        const historyRes = await fetch("/api/profile/game-history");
        const historyData = await historyRes.json();

        // Fetch chart data
        const chartRes = await fetch("/api/profile/chart-data");
        const chartDataRes = await chartRes.json();

        if (statsData.success) {
          setStats(statsData);
          setCurrentAvatar(statsData.user.avatarUrl);
          setCurrentBanner(statsData.user.bannerUrl);
        }
        if (historyData.success) setHistory(historyData.history.slice(0, 10));
        if (chartDataRes.success) setChartData(chartDataRes);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
        setLoadingCharts(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-text-secondary">Erreur de chargement</p>
      </div>
    );
  }

  const { user, stats: userStats } = stats;
  const winRate = userStats.winRate * 100;
  const showWinRate = winRate >= 40;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-bold">Retour</span>
        </Link>

        {/* ZONE 1: HEADER PROFIL */}
        <div className="mb-8">
          <div className="bg-surface rounded-2xl overflow-hidden border border-white/5">
            {/* Banner */}
            <div className="h-32 relative">
              {currentBanner ? (
                <Image
                  src={currentBanner}
                  alt="Bannière"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="h-full bg-gradient-to-r from-primary/20 via-accent-violet/20 to-accent-cyan/20" />
              )}
              {/* Overlay gradient - z-index plus bas */}
              <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent z-0" />
              
              {/* Bouton modifier banner - z-index élevé */}
              <button
                onClick={() => {
                  console.log('🔵 Bouton banner cliqué!');
                  console.log('showBannerSelector:', showBannerSelector);
                  setShowBannerSelector(true);
                }}
                className="absolute bottom-4 right-4 px-3 py-2 bg-background/80 backdrop-blur-md text-xs font-bold text-white rounded-lg hover:bg-background transition-colors flex items-center gap-2 border border-white/10 shadow-lg cursor-pointer z-10"
              >
                <Camera className="w-4 h-4" /> Modifier
              </button>
            </div>

            {/* Profile Info */}
            <div className="px-6 pb-6 -mt-16 relative">
              {/* Avatar */}
              <div className="mb-4 relative w-24">
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent-violet rounded-full flex items-center justify-center text-3xl font-bold text-white border-4 border-surface shadow-xl overflow-hidden">
                  {currentAvatar ? (
                    <Image
                      src={currentAvatar}
                      alt={user.username}
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    user.username[0].toUpperCase()
                  )}
                </div>
                
                {/* Bouton modifier avatar - TOUJOURS VISIBLE */}
                <button
                  onClick={() => setShowAvatarSelector(true)}
                  className="absolute bottom-0 right-0 p-2 bg-background border-2 border-white/20 rounded-full text-white hover:bg-primary hover:border-primary transition-all shadow-lg"
                  title="Modifier l'avatar"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* User Info */}
              <div>
                <h1 className="text-3xl font-display font-bold text-white mb-2">
                  {user.username}
                </h1>
                <div className="flex flex-col gap-1 text-sm text-text-tertiary">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Membre depuis {new Date(user.joinDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ZONE 2: STATS GRID */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">📊 Statistiques</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Balance Actuelle */}
            <StatCard
              icon={<Wallet className="w-5 h-5" />}
              label="Balance Actuelle"
              value={`$${userStats.currentBalance.toFixed(2)}`}
              iconColor="text-primary"
              bgColor="bg-primary/10"
            />

            {/* Total Gagné */}
            <StatCard
              icon={<Sparkles className="w-5 h-5" />}
              label="Total Gagné"
              value={`$${userStats.totalWon.toFixed(2)}`}
              subtitle={`Sur ${userStats.totalBets} parties`}
              iconColor="text-success"
              bgColor="bg-success/10"
            />

            {/* Meilleur Gain */}
            <StatCard
              icon={<Trophy className="w-5 h-5" />}
              label="Meilleur Gain"
              value={`$${userStats.maxWin.toFixed(2)}`}
              subtitle={userStats.favoriteGame ? `Sur ${userStats.favoriteGame.name}` : undefined}
              iconColor="text-primary"
              bgColor="bg-primary/10"
            />

            {/* Parties Jouées */}
            <StatCard
              icon={<Gamepad2 className="w-5 h-5" />}
              label="Parties Jouées"
              value={userStats.totalBets.toString()}
              iconColor="text-accent-cyan"
              bgColor="bg-accent-cyan/10"
            />

            {/* Victoires */}
            <StatCard
              icon={<Sparkles className="w-5 h-5" />}
              label="Victoires"
              value={userStats.winCount.toString()}
              subtitle={showWinRate ? `Taux de réussite: ${winRate.toFixed(1)}%` : undefined}
              iconColor="text-success"
              bgColor="bg-success/10"
            />

            {/* Meilleure Série */}
            <StatCard
              icon={<Flame className="w-5 h-5" />}
              label="Meilleure Série"
              value={`${userStats.bestStreak} wins`}
              subtitle="d'affilée"
              iconColor="text-accent-rose"
              bgColor="bg-accent-rose/10"
            />
          </div>
        </div>

        {/* ZONE GRAPHIQUES */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">📈 Évolution</h2>
          
          {loadingCharts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : chartData ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Graphique Profit/Loss - 2/3 de l'espace */}
              <div className="lg:col-span-2">
                <ProfitChart data={chartData.profitData} />
              </div>
              
              {/* Graphique Performance par Jeu - 1/3 de l'espace */}
              <div className="lg:col-span-1">
                <GamePerformanceChart data={chartData.gamePerformance} />
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-text-tertiary">
              <p>Aucune donnée de graphique disponible</p>
            </div>
          )}
        </div>

        {/* ZONE 3: HISTORIQUE ACTIVITÉ */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">📜 Activité Récente</h2>
          
          <div className="bg-surface rounded-2xl border border-white/5 overflow-hidden">
            {history.length === 0 ? (
              <div className="p-8 text-center text-text-tertiary">
                <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune partie jouée pour le moment</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {history.map((game) => (
                  <ActivityItem key={game.id} game={game} />
                ))}
              </div>
            )}

            {history.length > 0 && (
              <div className="p-4 text-center border-t border-white/5">
                <button className="text-sm text-primary hover:text-primary-hover font-bold transition-colors">
                  Voir tout l'historique →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showAvatarSelector && (
        <AvatarSelector
          currentAvatar={currentAvatar}
          onClose={() => setShowAvatarSelector(false)}
          onSelect={(avatarUrl) => setCurrentAvatar(avatarUrl)}
        />
      )}

      {showBannerSelector && (
        <BannerSelector
          currentBanner={currentBanner}
          onClose={() => setShowBannerSelector(false)}
          onSelect={(bannerUrl) => setCurrentBanner(bannerUrl)}
        />
      )}
    </div>
  );
}

// Composant StatCard
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  iconColor: string;
  bgColor: string;
}

function StatCard({ icon, label, value, subtitle, iconColor, bgColor }: StatCardProps) {
  return (
    <div className="bg-surface rounded-xl p-6 border border-white/5 hover:border-primary/30 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2 rounded-lg", bgColor)}>
          <div className={iconColor}>{icon}</div>
        </div>
      </div>
      
      <p className="text-sm text-text-tertiary mb-1">{label}</p>
      <p className="text-3xl font-display font-bold text-white mb-1">{value}</p>
      
      {subtitle && (
        <p className="text-xs text-text-tertiary">{subtitle}</p>
      )}
    </div>
  );
}

// Composant ActivityItem
interface ActivityItemProps {
  game: GameHistory;
}

function ActivityItem({ game }: ActivityItemProps) {
  const isWin = game.isWin;
  const timeAgo = getTimeAgo(game.timestamp);

  return (
    <div className={cn(
      "p-4 hover:bg-white/5 transition-colors",
      isWin && "border-l-2 border-success"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{getGameIcon(game.gameName)}</span>
            <span className="font-bold text-white">{game.gameName}</span>
            {isWin && (
              <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full font-bold">
                WIN
              </span>
            )}
          </div>
          
          <div className="text-sm text-text-secondary">
            {isWin ? (
              <span>
                Mise <span className="text-white font-medium">${game.betAmount.toFixed(2)}</span>
                {' → '}
                Gain <span className="text-success font-bold">${(game.betAmount + game.netProfit).toFixed(2)}</span>
                {' '}
                <span className="text-success">(+${game.netProfit.toFixed(2)})</span>
              </span>
            ) : (
              <span>
                Partie à <span className="text-white font-medium">${game.betAmount.toFixed(2)}</span>
              </span>
            )}
          </div>
        </div>

        <div className="text-xs text-text-tertiary text-right">
          {timeAgo}
        </div>
      </div>
    </div>
  );
}

// Helpers
function getGameIcon(gameName: string): string {
  const icons: Record<string, string> = {
    'Dice': '🎲',
    'Crash': '🎰',
    'Plinko': '🎯',
    'Slots': '🎰',
    'Roulette': '🎡',
    'Blackjack': '🃏',
  };
  return icons[gameName] || '🎮';
}

function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `Il y a ${diffDays}j`;
}