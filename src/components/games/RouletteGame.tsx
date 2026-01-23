"use client";

import { useState } from "react";
import { Loader2, Trophy, XCircle, RotateCw } from "lucide-react";
import { cn, formatToUSD } from "@/lib/utils";

// Roue simplifiée pour l'animation (ordre standard européen approx ou juste visuel)
const WHEEL_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

export default function RouletteGame() {
    const [betColor, setBetColor] = useState<'red' | 'black' | 'green' | null>(null);
    const [betAmount, setBetAmount] = useState<string>("10");
    const [isSpinning, setIsSpinning] = useState(false);
    const [lastResult, setLastResult] = useState<{ number: number, color: string, isWin: boolean, payout: number } | null>(null);
    const [error, setError] = useState("");
    const [rotation, setRotation] = useState(0);

    const handlePlay = async () => {
        if (!betColor) return;
        setIsSpinning(true);
        setLastResult(null);
        setError("");

        try {
            const res = await fetch("/api/games/roulette/play", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: parseInt(betAmount),
                    color: betColor
                })
            });

            const data = await res.json();

            if (res.ok) {
                // Animation Logic
                // On fait tourner la roue de +1440deg (4 tours) + l'angle du nombre gagnant
                // Simplification : On tourne aléatoirement fort pour l'effet visuel
                const newRotation = rotation + 1440 + Math.random() * 360;
                setRotation(newRotation);

                setTimeout(() => {
                    setLastResult({
                        number: data.result.number,
                        color: data.result.color,
                        isWin: data.result.isWin,
                        payout: data.result.payout
                    });
                    setIsSpinning(false);
                }, 2000); // 2s spin
            } else {
                setError(data.error || "Une erreur est survenue");
                setIsSpinning(false);
            }

        } catch (e) {
            setError("Erreur de connexion");
            setIsSpinning(false);
        }
    };

    const getColorClass = (color: string) => {
        if (color === 'red') return "bg-red-600 border-red-500";
        if (color === 'black') return "bg-zinc-800 border-zinc-700";
        return "bg-green-600 border-green-500";
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">

            <div className="bg-[#1A1D26] border border-white/5 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-600/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

                    {/* LEFT: CONTROLS */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
                                <RotateCw className="w-8 h-8 text-primary" /> Roulette
                            </h2>
                            <p className="text-text-secondary">Bet on Red (x2), Black (x2) or Green (x14).</p>
                        </div>

                        {/* Bet Amount */}
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
                            </div>
                        </div>

                        {/* Color Selection */}
                        <div className="flex gap-4">
                            <button
                                onClick={() => setBetColor('red')}
                                className={cn(
                                    "flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1",
                                    betColor === 'red'
                                        ? "bg-red-600/20 border-red-500 text-white shadow-glow-red"
                                        : "bg-background-secondary border-transparent text-text-tertiary hover:bg-white/5"
                                )}
                            >
                                <span className="w-8 h-8 rounded-full bg-red-500 shadow-lg mb-1" />
                                <span className="uppercase text-xs font-bold">Red (x2)</span>
                            </button>

                            <button
                                onClick={() => setBetColor('green')}
                                className={cn(
                                    "flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1",
                                    betColor === 'green'
                                        ? "bg-green-600/20 border-green-500 text-white shadow-glow-green"
                                        : "bg-background-secondary border-transparent text-text-tertiary hover:bg-white/5"
                                )}
                            >
                                <span className="w-8 h-8 rounded-full bg-green-500 shadow-lg mb-1" />
                                <span className="uppercase text-xs font-bold">Green (x14)</span>
                            </button>

                            <button
                                onClick={() => setBetColor('black')}
                                className={cn(
                                    "flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1",
                                    betColor === 'black'
                                        ? "bg-zinc-800/50 border-zinc-600 text-white shadow-lg"
                                        : "bg-background-secondary border-transparent text-text-tertiary hover:bg-white/5"
                                )}
                            >
                                <span className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 shadow-lg mb-1" />
                                <span className="uppercase text-xs font-bold">Black (x2)</span>
                            </button>
                        </div>

                        <button
                            onClick={handlePlay}
                            disabled={isSpinning || !betAmount || parseInt(betAmount) <= 0 || !betColor}
                            className="w-full py-5 bg-primary hover:bg-primary-hover text-background text-lg font-bold rounded-2xl shadow-glow-gold transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                        >
                            {isSpinning ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Spin Roulette"}
                        </button>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-bold text-center">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* RIGHT: VISUALIZATION */}
                    <div className="flex flex-col items-center justify-center min-h-[300px] relative">

                        {/* THE WHEEL (CSS Representation) */}
                        <div
                            className="w-64 h-64 rounded-full border-8 border-[#2A2E3B] shadow-2xl relative transition-transform duration-[2000ms] ease-out flex items-center justify-center bg-zinc-900"
                            style={{ transform: `rotate(${rotation}deg)` }}
                        >
                            <div className="absolute inset-0 rounded-full border-4 border-dashed border-white/10" />
                            {/* Central Hub */}
                            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-700 rounded-full shadow-lg z-20 flex items-center justify-center border-4 border-[#2A2E3B]">
                                <span className="text-background font-bold text-xs uppercase">Spin</span>
                            </div>

                            {/* Mock Sectors (Just visual decoration) */}
                            <div className="absolute top-0 left-12 w-2 h-10 bg-red-600 rounded-full" />
                            <div className="absolute bottom-0 right-12 w-2 h-10 bg-red-600 rounded-full" />
                            <div className="absolute top-12 right-0 w-10 h-2 bg-zinc-800 rounded-full" />
                            <div className="absolute bottom-12 left-0 w-10 h-2 bg-zinc-800 rounded-full" />
                        </div>

                        {/* RESULT OVERLAY */}
                        {lastResult && !isSpinning && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-3xl animate-in fade-in z-30">
                                <div className="text-center">
                                    <div className={cn(
                                        "w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl font-bold border-4 text-white mb-4 shadow-2xl",
                                        getColorClass(lastResult.color)
                                    )}>
                                        {lastResult.number}
                                    </div>

                                    <div className="space-y-1">
                                        {lastResult.isWin ? (
                                            <>
                                                <div className="text-xl font-bold text-green-400 flex items-center justify-center gap-2">
                                                    <Trophy className="w-5 h-5" /> WIN
                                                </div>
                                                <div className="text-3xl font-display font-bold text-white shadow-glow-green">
                                                    +{formatToUSD(lastResult.payout)}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-xl font-bold text-red-400 flex items-center justify-center gap-2">
                                                <XCircle className="w-5 h-5" /> REKT
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
