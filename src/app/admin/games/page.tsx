"use client";

import { useState, useEffect } from "react";
import {
  Gamepad2,
  TrendingUp,
  DollarSign,
  Users,
  Trophy,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Edit
} from "lucide-react";
import { cn, formatToUSD } from "@/lib/utils";

interface Game {
  id: string;
  name: string;
  slug: string;
  type: string;
  isActive: boolean;
  houseEdge: number;
  totalBets: number;
  totalWagered: string;
  totalPayout: string;
  playCount: number;
}

interface GameStats {
  totalGames: number;
  activeGames: number;
  totalBets: number;
  totalWagered: number;
  averageHouseEdge: number;
}

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const res = await fetch('/api/admin/games');
      if (res.ok) {
        const data = await res.json();
        setGames(data.games);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (gameId: string, isActive: boolean) => {
    try {
      const res = await fetch('/api/admin/games/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, isActive: !isActive })
      });

      if (res.ok) {
        fetchGames();
      }
    } catch (error) {
      alert('Erreur');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-display font-bold text-white">Games</h1>
        <p className="text-text-secondary text-sm mt-1">
          Statistiques et gestion des jeux
        </p>
      </div>

      {/* STATS CARDS */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-[#1A1D26] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-accent-violet/10 rounded-lg">
                <Gamepad2 className="w-4 h-4 text-accent-violet" />
              </div>
              <span className="text-xs font-bold text-text-tertiary uppercase">Total Games</span>
            </div>
            <p className="text-2xl font-display font-bold text-white">
              {stats.totalGames}
            </p>
          </div>

          <div className="bg-[#1A1D26] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-success/10 rounded-lg">
                <ToggleRight className="w-4 h-4 text-success" />
              </div>
              <span className="text-xs font-bold text-text-tertiary uppercase">Active</span>
            </div>
            <p className="text-2xl font-display font-bold text-white">
              {stats.activeGames}
            </p>
          </div>

          <div className="bg-[#1A1D26] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-accent-cyan/10 rounded-lg">
                <Trophy className="w-4 h-4 text-accent-cyan" />
              </div>
              <span className="text-xs font-bold text-text-tertiary uppercase">Total Bets</span>
            </div>
            <p className="text-2xl font-display font-bold text-white">
              {stats.totalBets.toLocaleString()}
            </p>
          </div>

          <div className="bg-[#1A1D26] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-bold text-text-tertiary uppercase">Total Wagered</span>
            </div>
            <p className="text-xl font-display font-bold text-white">
              {formatToUSD(stats.totalWagered / 100_000_000)}
            </p>
          </div>

          <div className="bg-[#1A1D26] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-accent-rose/10 rounded-lg">
                <TrendingUp className="w-4 h-4 text-accent-rose" />
              </div>
              <span className="text-xs font-bold text-text-tertiary uppercase">Avg House Edge</span>
            </div>
            <p className="text-2xl font-display font-bold text-white">
              {stats.averageHouseEdge.toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      {/* GAMES LIST */}
      <div className="bg-[#1A1D26] rounded-xl border border-white/5 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-20 text-text-tertiary">
            <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Aucun jeu configuré</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background-secondary border-b border-white/5">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-bold text-text-tertiary uppercase">Game</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-text-tertiary uppercase">Type</th>
                  <th className="text-center py-3 px-4 text-xs font-bold text-text-tertiary uppercase">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-text-tertiary uppercase">House Edge</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-text-tertiary uppercase">Total Bets</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-text-tertiary uppercase">Wagered</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-text-tertiary uppercase">Payout</th>
                  <th className="text-center py-3 px-4 text-xs font-bold text-text-tertiary uppercase">Plays</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-text-tertiary uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {games.map((game) => {
                  const wagered = Number(game.totalWagered) / 100_000_000;
                  const payout = Number(game.totalPayout) / 100_000_000;
                  const actualHouseEdge = wagered > 0 ? ((wagered - payout) / wagered) * 100 : 0;

                  return (
                    <tr key={game.id} className="hover:bg-white/5 transition-colors">
                      {/* Game */}
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-bold text-white">{game.name}</p>
                          <p className="text-xs text-text-tertiary">{game.slug}</p>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-white/5 rounded text-xs font-bold text-text-secondary">
                          {game.type}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {game.isActive ? (
                          <div className="inline-flex items-center gap-1 text-success">
                            <div className="w-2 h-2 rounded-full bg-success"></div>
                            <span className="text-xs font-bold">Active</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 text-accent-rose">
                            <div className="w-2 h-2 rounded-full bg-accent-rose"></div>
                            <span className="text-xs font-bold">Inactive</span>
                          </div>
                        )}
                      </td>

                      {/* House Edge */}
                      <td className="py-3 px-4 text-right">
                        <div>
                          <p className="text-sm font-bold text-white">
                            {game.houseEdge.toFixed(2)}%
                          </p>
                          <p className="text-xs text-text-tertiary">
                            Actual: {actualHouseEdge.toFixed(2)}%
                          </p>
                        </div>
                      </td>

                      {/* Total Bets */}
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-bold text-white">
                          {game.totalBets.toLocaleString()}
                        </span>
                      </td>

                      {/* Wagered */}
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-mono text-white">
                          {formatToUSD(wagered)}
                        </span>
                      </td>

                      {/* Payout */}
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-mono text-white">
                          {formatToUSD(payout)}
                        </span>
                      </td>

                      {/* Plays */}
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-bold text-white">
                          {game.playCount.toLocaleString()}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleActive(game.id, game.isActive)}
                            className={cn(
                              "p-2 rounded-lg transition-colors",
                              game.isActive
                                ? "hover:bg-accent-rose/10 text-accent-rose"
                                : "hover:bg-success/10 text-success"
                            )}
                            title={game.isActive ? "Désactiver" : "Activer"}
                          >
                            {game.isActive ? (
                              <ToggleRight className="w-4 h-4" />
                            ) : (
                              <ToggleLeft className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
