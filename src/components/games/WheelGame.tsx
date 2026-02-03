"use client";

import { useState } from "react";
import { Loader2, Sparkles, AlertCircle, ArrowLeft, Info, X, Coins, Trophy } from "lucide-react";
import Link from "next/link";
import { cn, formatToUSD } from "@/lib/utils";

export default function WheelGame() {
    const [betAmount, setBetAmount] = useState<string>("10");
    const [isSpinning, setIsSpinning] = useState(false);
    const [lastResult, setLastResult] = useState<{ multiplier: number, segmentLabel: string, payout: number } | null>(null);
    const [error, setError] = useState("");
    const [rotation, setRotation] = useState(0);
    const [showRules, setShowRules] = useState(false);

    const handlePlay = async () => {
        setIsSpinning(true);
        setLastResult(null);
        setError("");

        try {
            const res = await fetch("/api/games/wheel/play", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: parseInt(betAmount)
                })
            });

            const data = await res.json();

            if (res.ok) {
                // Animation Logic
                // On a le résultat (multiplier). On doit mapper ce multiplier à un angle visuel.
                // Segments virtuels : 
                // 0x (30%), 1.5x (40%), 3x (20%), 10x (9%), 50x (1%)
                // Pour simplifier l'affichage, on va dire que la roue a 8 segments graphiques égaux (45deg chacun)
                // 0x, 1.5x, 0x, 3x, 0x, 1.5x, 10x, 50x

                // Mappage approximatif pour l'effet visuel :
                let targetAngle = 0;
                // Random variation inside segment (+- 15deg)
                const fuzz = Math.random() * 30 - 15;

                if (data.result.multiplier === 0) targetAngle = 0 + fuzz; // Top
                else if (data.result.multiplier === 1.5) targetAngle = 45 + fuzz;
                else if (data.result.multiplier === 3) targetAngle = 135 + fuzz;
                else if (data.result.multiplier === 10) targetAngle = 225 + fuzz;
                else if (data.result.multiplier === 50) targetAngle = 315 + fuzz;
                else targetAngle = 90 + fuzz; // Fallback

                // Spin effect: Add multiple full rotations (5 * 360 = 1800)
                // Note: CSS rotation direction vs Wheel values. 
                // If we want value X at Top, we need to rotate Wheel so X is at Top.
                // Usually Top is 0deg.

                const spin = 1800 + (360 - targetAngle); // Invert angle to put it at top
                setRotation(rotation + spin);

                setTimeout(() => {
                    setLastResult({
                        multiplier: data.result.multiplier,
                        segmentLabel: data.result.segmentLabel,
                        payout: data.result.payout
                    });
                    setIsSpinning(false);
                }, 3000); // 3s spin
            } else {
                setError(data.error || "Une erreur est survenue");
                setIsSpinning(false);
            }

        } catch {
            setError("Erreur de connexion");
            setIsSpinning(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">

            <div className="bg-[#1A1D26]/80 backdrop-blur-md border border-white/5 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-2xl">
                {/* Background FX */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/5 to-fuchsia-500/5 pointer-events-none" />

                {/* Header Controls */}
                <div className="relative z-20 flex items-center justify-between mb-8">
                    <Link
                        href="/games"
                        className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-xl border border-white/5"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-bold">Retour</span>
                    </Link>

                    <button
                        onClick={() => setShowRules(true)}
                        className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-xl border border-white/5"
                    >
                        <Info className="w-4 h-4" />
                        <span className="text-sm font-bold">Règles</span>
                    </button>
                </div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

                    {/* LEFT: CONTROLS */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
                                <Sparkles className="w-8 h-8 text-amber-400" /> Spin Wheel
                            </h2>
                            <p className="text-text-secondary">Spin the wheel and multiply your bet up to 50x!</p>
                        </div>

                        {/* Bet Amount */}
                        <div className="bg-background-secondary p-4 rounded-2xl border border-white/5 shadow-inner">
                            <label className="text-xs font-bold text-text-tertiary uppercase mb-2 block">Bet Amount (Sats)</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={betAmount}
                                    onChange={(e) => setBetAmount(e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white font-mono font-bold focus:outline-none focus:border-amber-400/50 transition-colors"
                                />
                                <button onClick={() => setBetAmount((prev) => (parseInt(prev || "0") * 2).toString())} className="px-4 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-xs text-text-secondary transition-colors border border-white/5">2x</button>
                                <button onClick={() => setBetAmount((prev) => Math.max(10, Math.floor(parseInt(prev || "0") / 2)).toString())} className="px-4 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-xs text-text-secondary transition-colors border border-white/5">/2</button>
                            </div>
                            {/* PRESET AMOUNTS */}
                            <div className="flex flex-wrap gap-2 mt-4">
                                {[100, 500, 1000, 5000].map((amt) => (
                                    <button
                                        key={amt}
                                        onClick={() => setBetAmount(amt.toString())}
                                        className="flex-1 py-2 text-[11px] font-bold bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white rounded-lg border border-white/5 transition-all"
                                    >
                                        {amt >= 1000 ? (amt / 1000) + 'k' : amt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Multiplier Info */}
                        <div className="grid grid-cols-5 gap-2 text-center text-xs text-text-tertiary">
                            <div className="p-2 rounded-lg bg-white/5 border border-white/5">0x</div>
                            <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/50 text-blue-200 font-bold">1.5x</div>
                            <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/50 text-green-200 font-bold">3x</div>
                            <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/50 text-purple-200 font-bold">10x</div>
                            <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-200 font-bold shadow-glow-gold">50x</div>
                        </div>

                        <button
                            onClick={handlePlay}
                            disabled={isSpinning || !betAmount || parseInt(betAmount) <= 0}
                            className={cn(
                                "w-full py-5 text-lg font-bold rounded-2xl shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 border border-white/10",
                                isSpinning
                                    ? "bg-surface text-text-tertiary"
                                    : "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-glow-gold"
                            )}
                        >
                            {isSpinning ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "SPIN NOW"}
                        </button>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-bold text-center flex items-center justify-center gap-2">
                                <AlertCircle className="w-4 h-4" /> {error}
                            </div>
                        )}
                    </div>

                    {/* RIGHT: WHEEL VISUALIZATION */}
                    <div className="flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">

                        {/* THE WHEEL */}
                        <div className="relative">
                            {/* Pointer */}
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[16px] border-l-transparent border-t-[32px] border-t-white border-r-[16px] border-r-transparent z-30 drop-shadow-xl" />

                            <div
                                className="w-80 h-80 rounded-full border-[8px] border-gray-800 shadow-2xl relative transition-transform duration-[3000ms] cubic-bezier(0.2, 0.8, 0.2, 1)"
                                style={{ transform: `rotate(${rotation}deg)` }}
                            >
                                {/* Generating segments with conic-gradient for visual simplicity */}
                                <div className="w-full h-full rounded-full bg-[conic-gradient(#ef4444_0deg_45deg,#3b82f6_45deg_90deg,#ef4444_90deg_135deg,#22c55e_135deg_180deg,#ef4444_180deg_225deg,#a855f7_225deg_270deg,#ef4444_270deg_315deg,#f59e0b_315deg_360deg)] shadow-inner" />

                                <div className="absolute inset-0 rounded-full border-4 border-white/10" />

                                {/* Center Hub */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gray-900 rounded-full shadow-2xl border-4 border-gray-700 flex items-center justify-center z-20">
                                    <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-700 rounded-full flex items-center justify-center">
                                        <span className="text-xs font-black text-white uppercase tracking-widest">CoinPawa</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Result Popup */}
                        {lastResult && !isSpinning && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-40 animate-in zoom-in fade-in duration-300">
                                <div className="bg-black/80 backdrop-blur-xl border border-white/20 p-8 rounded-3xl text-center shadow-2xl skew-y-0 hover:skew-y-1 transition-transform">
                                    <div className="text-sm font-bold text-text-secondary uppercase tracking-widest mb-1">Result</div>
                                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 mb-2">
                                        {lastResult.multiplier}x
                                    </div>

                                    {lastResult.payout > 0 ? (
                                        <div className="text-2xl font-bold text-amber-400 shadow-glow-gold">
                                            +{formatToUSD(lastResult.payout)}
                                        </div>
                                    ) : (
                                        <div className="text-lg font-bold text-red-400">
                                            Try Again
                                        </div>
                                    )}
                                </div>
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
                            <Info className="w-6 h-6 text-amber-400" /> Règles de Spin Wheel
                        </h3>

                        <div className="space-y-4 text-text-secondary leading-relaxed">
                            <p>
                                Spin Wheel est un jeu de chance instantané. Misez et faites tourner la roue pour multiplier votre mise !
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                                    <span className="text-white font-bold">1.5x</span>
                                    <span className="text-blue-400 text-xs text-right">40% chance</span>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                                    <span className="text-white font-bold">3x</span>
                                    <span className="text-green-400 text-xs text-right">20% chance</span>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                                    <span className="text-white font-bold">10x</span>
                                    <span className="text-purple-400 text-xs text-right">9% chance</span>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                                    <span className="text-white font-bold">50x</span>
                                    <span className="text-amber-400 text-xs text-right">1% chance</span>
                                </div>
                            </div>
                            <p className="text-sm">
                                • Le segment 0x correspond à une perte totale de la mise (30% de chance).<br />
                                • Les résultats sont basés sur un générateur de nombres aléatoires sécurisé.<br />
                                • Cliquez sur le bouton "SPIN NOW" pour lancer la roue.
                            </p>
                        </div>

                        <button
                            onClick={() => setShowRules(false)}
                            className="w-full mt-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl shadow-glow-gold transition-all"
                        >
                            EN ROUTE !
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
