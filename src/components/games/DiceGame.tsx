"use client";

import { useState } from "react";
import { Dices, Loader2, Trophy, XCircle } from "lucide-react";
import { cn, formatToUSD } from "@/lib/utils";

export default function DiceGame() {
    const [prediction, setPrediction] = useState<'even' | 'odd'>('even');
    const [betAmount, setBetAmount] = useState<string>("10"); // Default bet
    const [isRolling, setIsRolling] = useState(false);
    const [lastResult, setLastResult] = useState<{ roll: number, isWin: boolean, payout: number } | null>(null);
    const [error, setError] = useState("");

    const handlePlay = async () => {
        setIsRolling(true);
        setLastResult(null);
        setError("");

        try {
            const res = await fetch("/api/games/dice/play", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: parseInt(betAmount), // Send as number (Sats/USD unit)
                    prediction
                })
            });

            const data = await res.json();

            if (res.ok) {
                // Simulate delay for animation
                setTimeout(() => {
                    setLastResult({
                        roll: data.result.roll,
                        isWin: data.result.isWin,
                        payout: data.result.payout
                    });
                    setIsRolling(false);
                }, 800);
            } else {
                setError(data.error || "Une erreur est survenue");
                setIsRolling(false);
            }

        } catch (_) {
            setError("Erreur de connexion");
            setIsRolling(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">

            {/* Game Container */}
            <div className="bg-[#1A1D26] border border-white/5 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-2xl">
                {/* Background FX */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

                    {/* LEFT: CONTROLS */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
                                <Dices className="w-8 h-8 text-primary" /> Dice
                            </h2>
                            <p className="text-text-secondary">Double your money by guessing if the dice roll will be Even or Odd.</p>
                        </div>

                        {/* Bet Amount Input */}
                        <div className="bg-background-secondary p-4 rounded-2xl border border-white/5">
                            <label className="text-xs font-bold text-text-tertiary uppercase mb-2 block">Bet Amount</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={betAmount}
                                    onChange={(e) => setBetAmount(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white font-mono font-bold focus:outline-none focus:border-primary/50 transition-colors"
                                />
                                <button onClick={() => setBetAmount((prev) => (parseInt(prev || "0") * 2).toString())} className="px-4 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-xs text-text-secondary transition-colors">2x</button>
                                <button onClick={() => setBetAmount((prev) => Math.floor(parseInt(prev || "0") / 2).toString())} className="px-4 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-xs text-text-secondary transition-colors">max</button>
                            </div>
                        </div>

                        {/* Prediction Toggle */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setPrediction('even')}
                                className={cn(
                                    "p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                                    prediction === 'even'
                                        ? "bg-blue-600/20 border-blue-500 text-white shadow-glow-blue"
                                        : "bg-background-secondary border-transparent text-text-tertiary hover:bg-white/5"
                                )}
                            >
                                <span className="text-2xl font-bold">2 4 6</span>
                                <span className="uppercase text-xs font-bold tracking-wider">Even (Pair)</span>
                            </button>

                            <button
                                onClick={() => setPrediction('odd')}
                                className={cn(
                                    "p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                                    prediction === 'odd'
                                        ? "bg-purple-600/20 border-purple-500 text-white shadow-glow-purple"
                                        : "bg-background-secondary border-transparent text-text-tertiary hover:bg-white/5"
                                )}
                            >
                                <span className="text-2xl font-bold">1 3 5</span>
                                <span className="uppercase text-xs font-bold tracking-wider">Odd (Impair)</span>
                            </button>
                        </div>

                        <button
                            onClick={handlePlay}
                            disabled={isRolling || !betAmount || parseInt(betAmount) <= 0}
                            className="w-full py-5 bg-primary hover:bg-primary-hover text-background text-lg font-bold rounded-2xl shadow-glow-gold transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                        >
                            {isRolling ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Roll Dice"}
                        </button>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-bold text-center">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* RIGHT: VISUALIZATION */}
                    <div className="flex flex-col items-center justify-center min-h-[300px] relative">

                        {/* THE DICE CUBE */}
                        <div className={cn(
                            "w-32 h-32 bg-gradient-to-br from-white to-gray-300 rounded-3xl flex items-center justify-center shadow-2xl relative z-10 transition-all duration-300 transform",
                            isRolling ? "animate-bounce rotate-180" : "rotate-0"
                        )}>
                            {isRolling ? (
                                <span className="text-6xl font-black text-black opacity-20 relative animate-pulse">?</span>
                            ) : lastResult ? (
                                <span className={cn("text-7xl font-black", lastResult.isWin ? "text-green-600" : "text-red-500")}>
                                    {lastResult.roll}
                                </span>
                            ) : (
                                <Dices className="w-16 h-16 text-black/20" />
                            )}
                        </div>

                        {/* RESULT DISPLAY */}
                        {lastResult && !isRolling && (
                            <div className="mt-8 text-center animate-in slide-in-from-top-4 fade-in duration-300">
                                <div className={cn(
                                    "inline-flex items-center gap-2 px-6 py-2 rounded-full mb-2 border",
                                    lastResult.isWin
                                        ? "bg-green-500/20 border-green-500/50 text-green-400"
                                        : "bg-red-500/20 border-red-500/50 text-red-400"
                                )}>
                                    {lastResult.isWin ? <Trophy className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                    <span className="font-bold uppercase tracking-wider text-sm">
                                        {lastResult.isWin ? "You Won!" : "You Lost"}
                                    </span>
                                </div>
                                {lastResult.isWin && (
                                    <div className="text-4xl font-display font-bold text-white shadow-glow-green">
                                        +{formatToUSD(lastResult.payout)}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Decoration */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -z-10" />
                    </div>

                </div>
            </div>
        </div>
    );
}
