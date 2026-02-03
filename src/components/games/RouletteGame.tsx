"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trophy, XCircle, RotateCw, Coins, History, Trash2, ArrowLeft, Info, X, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { cn, formatToUSD, usdToSats, satsToUsd } from "@/lib/utils";
import { RouletteTable } from "./RouletteTable";

// Configuration de la roue (ordre européen des numéros)
const WHEEL_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

export default function RouletteGame() {
    const router = useRouter();

    // États des paris
    const [bets, setBets] = useState<{ [key: string]: number }>({});
    const [activeChip, setActiveChip] = useState<number>(1);
    const CHIPS = [0.1, 0.5, 1, 5, 10, 25, 100];

    // États du jeu
    const [isSpinning, setIsSpinning] = useState(false);
    const [lastResult, setLastResult] = useState<{ number: number, color: string, payout: number } | null>(null);
    const [error, setError] = useState("");
    const [rotation, setRotation] = useState(0);
    const [showRules, setShowRules] = useState(false);

    const totalBet = Object.values(bets).reduce((a, b) => a + b, 0);

    const handlePlaceBet = (type: string) => {
        if (isSpinning) return;
        setBets(prev => ({
            ...prev,
            [type]: (prev[type] || 0) + activeChip
        }));
    };

    const handleClearBets = () => {
        if (isSpinning) return;
        setBets({});
        setError("");
        setLastResult(null);
    };

    const handlePlay = async () => {
        if (totalBet <= 0 || isSpinning) return;

        setIsSpinning(true);
        setLastResult(null);
        setError("");

        try {
            // Convertir les paris en SATS pour l'API
            const betsSats = Object.entries(bets).reduce((acc, [key, val]) => ({
                ...acc,
                [key]: usdToSats(val)
            }), {});

            const res = await fetch("/api/games/roulette/play", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bets: betsSats })
            });

            const data = await res.json();

            if (res.ok) {
                // Trouver l'index du numéro gagnant pour l'angle exact
                const winIndex = WHEEL_NUMBERS.indexOf(data.result.number);
                const sectorAngle = 360 / 37;

                // On calcule la rotation pour que le winIndex soit en haut (0 deg)
                // Position actuelle en deg = winIndex * sectorAngle
                // Pour mettre ça en haut, on doit appliquer une rotation de -(winIndex * sectorAngle)
                // On ajoute 5 tours complets (1800 deg)
                const targetRotation = rotation + 1800 + (360 - (winIndex * sectorAngle));

                setRotation(targetRotation);

                setTimeout(() => {
                    setLastResult({
                        number: data.result.number,
                        color: data.result.color,
                        payout: satsToUsd(data.result.payout) // Convertir SATS -> USD pour l'affichage
                    });
                    setIsSpinning(false);
                    router.refresh(); // Sync balance
                }, 3000); // 3s spin (correspond à la durée de transition CSS)
            } else {
                setError(data.error || "Une erreur est survenue");
                setIsSpinning(false);
            }
        } catch {
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
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">

            {/* 1. HEADER & HISTORIQUE (Simulé) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-4">
                <div className="flex items-center justify-between md:justify-start gap-4 flex-1">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors bg-white/5 px-3 py-2 rounded-xl border border-white/5"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-xs font-bold">Retour</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <RotateCw className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-display font-bold text-white leading-none mb-1">Roulette</h2>
                            <p className="text-[8px] text-text-tertiary uppercase font-bold tracking-widest leading-none">Européenne • Multi-Paris</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-text-tertiary font-bold uppercase mr-2">Derniers :</span>
                        {[32, 15, 0, 19, 4].map((n, i) => (
                            <div key={i} className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white", n === 0 ? "bg-green-600" : [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(n) ? "bg-red-600" : "bg-zinc-800")}>
                                {n}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => setShowRules(true)}
                        className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors bg-white/5 px-3 py-2 rounded-xl border border-white/5"
                    >
                        <Info className="w-4 h-4" />
                        <span className="text-xs font-bold">Règles</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 2. LEFT: WHEEL VISUALIZATION */}
                <div className="lg:col-span-1 bg-[#1A1D26] border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center relative shadow-2xl overflow-hidden min-h-[400px]">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

                    {/* Wheel Pointer */}
                    <div className="absolute top-1/2 -translate-y-1/2 -right-2 w-0 h-0 border-t-[10px] border-t-transparent border-r-[20px] border-r-white border-b-[10px] border-b-transparent z-20 drop-shadow-glow-white" />

                    {/* The Wheel */}
                    <div
                        className="w-64 h-64 md:w-80 md:h-80 rounded-full border-[12px] border-[#2A2E3B] relative transition-transform duration-[3000ms] cubic-bezier(0.1, 0, 0.1, 1) shadow-2xl bg-zinc-900"
                        style={{ transform: `rotate(${rotation}deg)` }}
                    >
                        {/* Segments drawing (simplified CSS) */}
                        <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#10b981_0deg_9.72deg,#ef4444_9.72deg_19.44deg,#18181b_19.44deg_29.16deg,#ef4444_29.16deg_38.88deg,#18181b_38.88deg_48.6deg,#ef4444_48.6deg_58.32deg,#18181b_58.32deg_68.04deg,#ef4444_68.04deg_77.76deg,#18181b_77.76deg_87.48deg,#ef4444_87.48deg_97.2deg,#18181b_97.2deg_106.92deg,#ef4444_106.92deg_116.64deg,#18181b_116.64deg_126.36deg,#ef4444_126.36deg_136.08deg,#18181b_136.08deg_145.8deg,#ef4444_145.8deg_155.52deg,#18181b_155.52deg_165.24deg,#ef4444_165.24deg_174.96deg,#18181b_174.96deg_184.68deg,#18181b_184.68deg_194.4deg,#ef4444_194.4deg_204.12deg,#18181b_204.12deg_213.84deg,#ef4444_213.84deg_223.56deg,#18181b_223.56deg_233.28deg,#ef4444_233.28deg_243deg,#18181b_243deg_252.72deg,#ef4444_252.72deg_262.44deg,#18181b_262.44deg_272.16deg,#ef4444_272.16deg_281.88deg,#18181b_281.88deg_291.6deg,#ef4444_291.6deg_301.32deg,#18181b_301.32deg_311.04deg,#ef4444_311.04deg_320.76deg,#18181b_320.76deg_330.48deg,#ef4444_330.48deg_340.2deg,#18181b_340.2deg_349.92deg,#ef4444_349.92deg_360deg)]" />

                        {/* Numbers on wheel */}
                        <div className="absolute inset-0 z-10">
                            {WHEEL_NUMBERS.map((n, i) => (
                                <div
                                    key={i}
                                    className="absolute top-1 w-4 text-[8px] font-bold text-white text-center"
                                    style={{
                                        left: '50%',
                                        marginLeft: '-8px',
                                        transformOrigin: '50% 150px', // md size
                                        transform: `rotate(${i * (360 / 37)}deg)`
                                    }}
                                >
                                    {n}
                                </div>
                            ))}
                        </div>

                        {/* Central Hub */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-[#2A2E3B] rounded-full shadow-2xl border-4 border-zinc-700 flex items-center justify-center z-20">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-full shadow-inner flex items-center justify-center">
                                <Coins className="w-6 h-6 text-background" />
                            </div>
                        </div>
                    </div>

                    {/* Result Overlay */}
                    {lastResult && !isSpinning && (
                        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md animate-in zoom-in duration-300">
                            <div className={cn(
                                "w-24 h-24 rounded-full flex items-center justify-center text-5xl font-black text-white border-8 shadow-glow-white mb-4 transition-all scale-110",
                                getColorClass(lastResult.color)
                            )}>
                                {lastResult.number}
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-text-tertiary uppercase tracking-widest mb-1">Gain Total</p>
                                <p className={cn("text-4xl font-display font-black", lastResult.payout > 0 ? "text-primary shadow-glow-gold" : "text-white/40")}>
                                    {lastResult.payout > 0 ? "+" : ""}{formatToUSD(lastResult.payout)}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. RIGHT: TABLE & BETTING CONTROLS */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Chip Selection */}
                    <div className="bg-[#1A1D26] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex gap-2">
                            {CHIPS.map(val => (
                                <button
                                    key={val}
                                    onClick={() => setActiveChip(val)}
                                    className={cn(
                                        "w-10 h-10 md:w-12 md:h-12 rounded-full border-4 flex items-center justify-center text-[10px] font-black transition-all transform hover:scale-110 active:scale-90 shadow-lg",
                                        activeChip === val
                                            ? "bg-primary border-white text-background ring-4 ring-primary/20 scale-110"
                                            : "bg-surface border-white/10 text-text-tertiary hover:border-white/30"
                                    )}
                                >
                                    {val >= 1000 ? (val / 1000) + 'k' : val}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleClearBets}
                            className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors"
                            title="Effacer les paris"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Betting Table */}
                    <div className="bg-[#1A1D26] border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                        <RouletteTable
                            bets={bets}
                            onPlaceBet={handlePlaceBet}
                            onClearBets={handleClearBets}
                        />
                    </div>

                    {/* Action Panel */}
                    <div className="bg-[#1A1D26] border border-white/5 rounded-2xl p-6 flex items-center justify-between gap-6 shadow-xl">
                        <div className="flex-1">
                            <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest mb-1">Mise Totale</p>
                            <div className="text-2xl font-display font-black text-white">{formatToUSD(totalBet)}</div>
                        </div>

                        <button
                            onClick={handlePlay}
                            disabled={isSpinning || totalBet <= 0}
                            className={cn(
                                "flex-[2] py-5 rounded-2xl text-xl font-black transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl",
                                isSpinning
                                    ? "bg-white/5 text-text-tertiary"
                                    : "bg-primary hover:bg-primary-hover text-background shadow-glow-gold"
                            )}
                        >
                            {isSpinning ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "LANCER LA BILLES"}
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-bold text-center animate-in shake duration-300">
                    {error}
                </div>
            )}

            {/* Modal des Règles */}
            {showRules && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#1A1D26] border border-white/10 rounded-3xl p-8 max-w-lg w-full relative shadow-2xl animate-in zoom-in duration-300">
                        <button
                            onClick={() => setShowRules(false)}
                            className="absolute top-4 right-4 p-2 text-text-tertiary hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <h3 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-3">
                            <Info className="w-6 h-6 text-primary" /> Règles de Roulette
                        </h3>

                        <div className="space-y-6 text-text-secondary leading-relaxed overflow-y-auto max-h-[70vh] pr-2 no-scrollbar">
                            <section>
                                <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                                    <RotateCw className="w-4 h-4 text-primary" /> Le Jeu
                                </h4>
                                <p className="text-sm">
                                    La roulette européenne comprend 37 numéros (0 à 36). Placez vos jetons sur la table et lancez la bille !
                                </p>
                            </section>

                            <section>
                                <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                                    <Coins className="w-4 h-4 text-primary" /> Types de Paris
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                        <div className="flex justify-between mb-1"><strong>Numéro Plein</strong> <span>x36</span></div>
                                        <div className="flex justify-between mb-1"><strong>Cheval</strong> <span>x18</span></div>
                                        <div className="flex justify-between mb-1"><strong>Carré</strong> <span>x9</span></div>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                        <div className="flex justify-between mb-1"><strong>Rouge/Noir</strong> <span>x2</span></div>
                                        <div className="flex justify-between mb-1"><strong>Pair/Impair</strong> <span>x2</span></div>
                                        <div className="flex justify-between mb-1"><strong>Douzaine</strong> <span>x3</span></div>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <h4 className="text-white font-bold mb-2 text-sm flex items-center gap-2 text-success">
                                    <ShieldCheck className="w-4 h-4" /> Jeu Responsable
                                </h4>
                                <p className="text-xs">
                                    Sélectionnez vos jetons en fonction de votre capital. Vous pouvez effacer vos paris avec l'icône corbeille avant de lancer la bille.
                                </p>
                            </section>
                        </div>

                        <button
                            onClick={() => setShowRules(false)}
                            className="w-full mt-8 py-4 bg-primary hover:bg-primary-hover text-background font-black rounded-xl shadow-glow-gold transition-all"
                        >
                            À VOS JEUX !
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
