"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Sparkles, Trophy, XCircle, ArrowLeft, Info, X, Coins, Zap } from "lucide-react";
import Link from "next/link";
import { cn, formatToUSD } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function LotteryGame() {
    const router = useRouter();
    const [betAmount, setBetAmount] = useState("100");
    const [isPlaying, setIsPlaying] = useState(false);
    const [numbers, setNumbers] = useState([7, 7, 7]);
    const [rolling, setRolling] = useState([false, false, false]);
    const [result, setResult] = useState<{ multiplier: number, payout: number, isWin: boolean } | null>(null);
    const [error, setError] = useState("");
    const [showRules, setShowRules] = useState(false);

    const handlePlay = async () => {
        if (isPlaying) return;

        setError("");
        setResult(null);
        setIsPlaying(true);
        setRolling([true, true, true]);

        try {
            const res = await fetch("/api/games/lottery/play", {
                method: "POST",
                body: JSON.stringify({ amount: parseInt(betAmount) })
            });
            const data = await res.json();

            if (data.success) {
                const finalNumbers = data.result.numbers;

                // Sequence the reveal
                for (let i = 0; i < 3; i++) {
                    await new Promise(r => setTimeout(r, 600 + i * 400));
                    setNumbers(prev => {
                        const next = [...prev];
                        next[i] = finalNumbers[i];
                        return next;
                    });
                    setRolling(prev => {
                        const next = [...prev];
                        next[i] = false;
                        return next;
                    });
                }

                setResult({
                    multiplier: data.result.multiplier,
                    payout: data.result.payout,
                    isWin: data.result.isWin
                });

                if (data.result.isWin) {
                    // Refresh balance
                    router.refresh();
                }
            } else {
                setError(data.error);
                setRolling([false, false, false]);
            }
        } catch (err) {
            setError("Erreur réseau");
            setRolling([false, false, false]);
        } finally {
            setIsPlaying(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-xl border border-white/5"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-bold">Retour</span>
                </Link>

                <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black text-amber-400 uppercase tracking-widest">Jackpot x100</span>
                </div>

                <button
                    onClick={() => setShowRules(true)}
                    className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-xl border border-white/5"
                >
                    <Info className="w-4 h-4" />
                    <span className="text-sm font-bold">Règles</span>
                </button>
            </div>

            {/* Main Game Area */}
            <div className="relative bg-[#1A1D26] border border-white/10 rounded-[2.5rem] p-8 md:p-12 overflow-hidden shadow-2xl">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 blur-[120px] pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center gap-12">
                    <div className="text-center space-y-2">
                        <h1 className="text-4xl md:text-6xl font-display font-black text-white tracking-tighter flex items-center justify-center gap-4">
                            <Zap className="w-12 h-12 text-primary animate-pulse" />
                            LOTTO <span className="text-primary">RAPIDE</span>
                        </h1>
                        <p className="text-text-secondary font-medium">Tentez votre chance et gagnez instantanément !</p>
                    </div>

                    {/* Slots Container */}
                    <div className="flex gap-4 md:gap-8">
                        {numbers.map((num, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "w-24 h-32 md:w-32 md:h-44 bg-black/40 border-2 rounded-3xl flex items-center justify-center relative overflow-hidden transition-all duration-500",
                                    rolling[i] ? "border-primary/50 shadow-[0_0_30px_-10px_rgba(99,102,241,0.5)]" : "border-white/10",
                                    result?.isWin && !rolling[i] && result.multiplier === 100 ? "border-amber-400 shadow-[0_0_40px_-5px_rgba(251,191,36,0.4)]" : ""
                                )}
                            >
                                <div className={cn(
                                    "text-5xl md:text-7xl font-display font-black transition-all transform",
                                    rolling[i] ? "animate-bounce opacity-40 scale-90" : "animate-in zoom-in duration-300",
                                    result?.isWin ? "text-primary" : "text-white"
                                )}>
                                    {rolling[i] ? Math.floor(Math.random() * 9) + 1 : num}
                                </div>
                                {/* Inner Shadow */}
                                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]" />
                            </div>
                        ))}
                    </div>

                    {/* Controls */}
                    <div className="w-full max-w-sm space-y-6">
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-bold text-text-tertiary uppercase tracking-wider px-1">
                                <span>Mise (SATS)</span>
                                <span className="text-white">Solde: —</span>
                            </div>
                            <div className="relative group">
                                <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary group-focus-within:text-primary transition-colors" />
                                <input
                                    type="number"
                                    value={betAmount}
                                    onChange={(e) => setBetAmount(e.target.value)}
                                    disabled={isPlaying}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-xl font-mono font-bold text-white focus:outline-none focus:border-primary/50 transition-all"
                                />
                            </div>
                            {/* Presets */}
                            <div className="grid grid-cols-4 gap-2">
                                {[100, 500, 1000, 5000].map(amt => (
                                    <button
                                        key={amt}
                                        onClick={() => setBetAmount(amt.toString())}
                                        disabled={isPlaying}
                                        className="py-2.5 text-xs font-black bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white rounded-xl border border-white/5 transition-all"
                                    >
                                        {amt >= 1000 ? (amt / 1000) + 'K' : amt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handlePlay}
                            disabled={isPlaying || !betAmount}
                            className={cn(
                                "w-full py-6 rounded-[1.5rem] font-black text-xl tracking-tight transition-all relative overflow-hidden group",
                                isPlaying
                                    ? "bg-white/5 text-text-tertiary cursor-not-allowed"
                                    : "bg-primary hover:bg-primary-hover text-background shadow-[0_20px_40px_-15px_rgba(99,102,241,0.5)] hover:shadow-[0_25px_50px_-12px_rgba(99,102,241,0.6)] hover:-translate-y-1 active:translate-y-0"
                            )}
                        >
                            <div className="relative z-10 flex items-center justify-center gap-3">
                                {isPlaying ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        TIRAGE EN COURS...
                                    </>
                                ) : (
                                    <>
                                        JOUEZ MAINTENANT
                                        <Zap className="w-6 h-6 fill-current" />
                                    </>
                                )}
                            </div>
                        </button>
                    </div>

                    {/* Feedback */}
                    <div className="h-12 flex items-center justify-center">
                        {error && (
                            <div className="flex items-center gap-2 text-error animate-shake">
                                <XCircle className="w-5 h-5" />
                                <span className="font-bold text-sm uppercase tracking-wider">{error}</span>
                            </div>
                        )}
                        {result && (
                            <div className={cn(
                                "flex flex-col items-center animate-in slide-in-from-bottom-4 duration-500",
                                result.isWin ? "text-success" : "text-text-tertiary"
                            )}>
                                {result.isWin ? (
                                    <>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Trophy className="w-8 h-8 text-amber-400 animate-bounce" />
                                            <span className="text-4xl font-display font-black">GAGNÉ !</span>
                                        </div>
                                        <span className="text-lg font-mono font-bold tracking-tight">+{result.payout} SATS (x{result.multiplier})</span>
                                    </>
                                ) : (
                                    <span className="text-sm font-bold uppercase tracking-widest opacity-50 italic">Pas de chance... réessayez !</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal des Règles */}
            {showRules && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#1A1D26] border border-white/10 rounded-3xl p-8 max-w-md w-full relative shadow-2xl animate-in zoom-in duration-300">
                        <button
                            onClick={() => setShowRules(false)}
                            className="absolute top-4 right-4 p-2 text-text-tertiary hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <h3 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-3">
                            <Zap className="w-6 h-6 text-primary" /> Lotto Rapide
                        </h3>

                        <div className="space-y-4 text-text-secondary leading-relaxed">
                            <p>Le Lotto Rapide est un tirage instantané basé sur 3 chiffres entre 1 et 9.</p>
                            <div className="space-y-2 bg-black/20 p-4 rounded-2xl border border-white/5">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-white">3 chiffres identiques</span>
                                    <span className="text-primary font-black">X100</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-white">2 chiffres identiques</span>
                                    <span className="text-primary font-black">X5</span>
                                </div>
                            </div>
                            <ul className="text-xs space-y-2 mt-4">
                                <li>• Les résultats sont générés par un algorithme sécurisé.</li>
                                <li>• Les gains sont crédités instantanément sur votre solde.</li>
                                <li>• Plus vous misez, plus le gain est élevé !</li>
                            </ul>
                        </div>

                        <button
                            onClick={() => setShowRules(false)}
                            className="w-full mt-8 py-4 bg-primary hover:bg-primary-hover text-background font-black rounded-xl"
                        >
                            C'EST COMPRIS !
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
