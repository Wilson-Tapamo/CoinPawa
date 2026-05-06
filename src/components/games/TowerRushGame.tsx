"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Info, X, Trophy, Bomb, Building2, DoorOpen, ShieldCheck, Zap, TrendingUp } from "lucide-react";
import Link from "next/link";
import { cn, formatToUSD, usdToSats, satsToUsd } from "@/lib/utils";

const MULTIPLIERS = [1.2, 1.5, 1.9, 2.5, 3.3, 4.5, 6.5, 10, 16, 30];
const FLOOR_COLORS = [
    "from-emerald-500/30 to-emerald-600/10",
    "from-emerald-500/30 to-emerald-600/10",
    "from-cyan-500/30 to-cyan-600/10",
    "from-cyan-500/30 to-cyan-600/10",
    "from-blue-500/30 to-blue-600/10",
    "from-blue-500/30 to-blue-600/10",
    "from-violet-500/30 to-violet-600/10",
    "from-purple-500/30 to-purple-600/10",
    "from-amber-500/30 to-amber-600/10",
    "from-rose-500/30 to-rose-600/10",
];
const GLOW_COLORS = [
    "shadow-emerald-500/20", "shadow-emerald-500/20",
    "shadow-cyan-500/20", "shadow-cyan-500/20",
    "shadow-blue-500/20", "shadow-blue-500/20",
    "shadow-violet-500/20", "shadow-purple-500/20",
    "shadow-amber-500/30", "shadow-rose-500/30",
];

type GamePhase = "IDLE" | "CLIMBING" | "WON" | "LOST";

export default function TowerRushGame() {
    const router = useRouter();
    const [betAmount, setBetAmount] = useState<string>("5");
    const [phase, setPhase] = useState<GamePhase>("IDLE");
    const [currentFloor, setCurrentFloor] = useState(0);
    const [trapDoors, setTrapDoors] = useState<number[]>([]);
    const [selectedDoors, setSelectedDoors] = useState<number[]>([]);
    const [revealedTraps, setRevealedTraps] = useState<Set<number>>(new Set());
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState("");
    const [showRules, setShowRules] = useState(false);
    const [lastPayout, setLastPayout] = useState(0);
    const [shakeFloor, setShakeFloor] = useState(-1);
    const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);

    const currentMultiplier = currentFloor > 0 ? MULTIPLIERS[currentFloor - 1] : 0;
    const nextMultiplier = currentFloor < 10 ? MULTIPLIERS[currentFloor] : null;
    const potentialWin = parseFloat(betAmount) * currentMultiplier;

    const generateTraps = useCallback(() => {
        const traps: number[] = [];
        for (let i = 0; i < 10; i++) {
            traps.push(Math.random() < 0.5 ? 0 : 1);
        }
        return traps;
    }, []);

    const startGame = () => {
        if (!betAmount || parseFloat(betAmount) <= 0) {
            setError("Montant invalide");
            return;
        }
        setError("");
        setPhase("CLIMBING");
        setCurrentFloor(0);
        setTrapDoors(generateTraps());
        setSelectedDoors([]);
        setRevealedTraps(new Set());
        setLastPayout(0);
        setShakeFloor(-1);
    };

    const chooseDoor = async (doorIndex: number) => {
        if (phase !== "CLIMBING" || isProcessing) return;
        setIsProcessing(true);

        const floorIdx = currentFloor;
        const trapDoor = trapDoors[floorIdx];
        const isTrap = doorIndex === trapDoor;

        setSelectedDoors(prev => [...prev, doorIndex]);

        if (isTrap) {
            setShakeFloor(floorIdx);
            setRevealedTraps(prev => new Set(prev).add(floorIdx));

            setTimeout(async () => {
                setPhase("LOST");
                try {
                    await fetch("/api/games/tower-rush/lose", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            amount: usdToSats(parseFloat(betAmount)),
                            floorsClimbed: currentFloor,
                        }),
                    });
                    router.refresh();
                } catch { /* silent */ }
                setIsProcessing(false);
            }, 800);
        } else {
            const newFloor = currentFloor + 1;
            // Add particles
            const newParticles = Array.from({ length: 6 }, (_, i) => ({
                id: Date.now() + i,
                x: Math.random() * 100,
                y: Math.random() * 100,
            }));
            setParticles(newParticles);
            setTimeout(() => setParticles([]), 1000);

            setTimeout(() => {
                setCurrentFloor(newFloor);
                if (newFloor >= 10) {
                    handleCashout(newFloor);
                }
                setIsProcessing(false);
            }, 400);
        }
    };

    const handleCashout = async (floors?: number) => {
        const floorsToSend = floors || currentFloor;
        if (floorsToSend < 1) return;
        setIsProcessing(true);
        try {
            const res = await fetch("/api/games/tower-rush/play", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: usdToSats(parseFloat(betAmount)),
                    floorsClimbed: floorsToSend,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setLastPayout(satsToUsd(data.result.payout));
                setPhase("WON");
                router.refresh();
            } else {
                setError(data.error || "Erreur");
            }
        } catch {
            setError("Erreur réseau");
        } finally {
            setIsProcessing(false);
        }
    };

    const renderFloor = (floorIdx: number) => {
        const isReached = floorIdx < currentFloor;
        const isCurrent = floorIdx === currentFloor && phase === "CLIMBING";
        const isAbove = floorIdx > currentFloor;
        const selectedDoor = selectedDoors[floorIdx];
        const isTrapped = revealedTraps.has(floorIdx);
        const isShaking = shakeFloor === floorIdx;
        const mult = MULTIPLIERS[floorIdx];

        return (
            <div
                key={floorIdx}
                className={cn(
                    "relative flex items-center gap-3 p-3 rounded-2xl border transition-all duration-500",
                    isReached && "bg-gradient-to-r border-white/10 opacity-60 scale-[0.97]",
                    isReached && FLOOR_COLORS[floorIdx],
                    isCurrent && "bg-gradient-to-r border-white/20 scale-100 shadow-xl",
                    isCurrent && FLOOR_COLORS[floorIdx],
                    isCurrent && GLOW_COLORS[floorIdx],
                    isAbove && "bg-white/[0.02] border-white/5 opacity-40 scale-[0.95]",
                    isTrapped && "bg-red-500/10 border-red-500/30",
                    isShaking && "animate-shake",
                )}
            >
                {/* Floor number */}
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 border transition-all",
                    isReached ? "bg-white/10 border-white/10 text-white/60" :
                    isCurrent ? "bg-white/20 border-white/20 text-white" :
                    "bg-white/5 border-white/5 text-white/30"
                )}>
                    {floorIdx + 1}
                </div>

                {/* Doors */}
                <div className="flex-1 flex gap-2">
                    {[0, 1].map(doorIdx => {
                        const wasSelected = selectedDoor === doorIdx;
                        const isTrapDoor = trapDoors[floorIdx] === doorIdx && isTrapped;
                        const isSafe = isReached && wasSelected && !isTrapDoor;

                        return (
                            <button
                                key={doorIdx}
                                onClick={() => isCurrent && chooseDoor(doorIdx)}
                                disabled={!isCurrent || isProcessing}
                                className={cn(
                                    "flex-1 py-3 rounded-xl border-2 text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5",
                                    isCurrent && !isProcessing && "cursor-pointer hover:scale-[1.03] active:scale-95",
                                    isCurrent && !isProcessing && "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20",
                                    isCurrent && isProcessing && "bg-white/5 border-white/5 text-white/30 cursor-wait",
                                    isSafe && "bg-emerald-500/20 border-emerald-500/40 text-emerald-400",
                                    isTrapDoor && "bg-red-500/20 border-red-500/40 text-red-400",
                                    isReached && !wasSelected && "bg-white/[0.02] border-white/5 text-white/20",
                                    isAbove && "bg-white/[0.02] border-white/5 text-white/15 cursor-default",
                                )}
                            >
                                {isTrapDoor ? (
                                    <><Bomb className="w-3.5 h-3.5" /> Piège</>
                                ) : isSafe ? (
                                    <><ShieldCheck className="w-3.5 h-3.5" /> OK</>
                                ) : isCurrent ? (
                                    <><DoorOpen className="w-3.5 h-3.5" /> Porte {doorIdx === 0 ? "A" : "B"}</>
                                ) : (
                                    <DoorOpen className="w-3 h-3" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Multiplier */}
                <div className={cn(
                    "text-xs font-black px-3 py-1.5 rounded-lg shrink-0 border transition-all",
                    isReached ? "bg-white/5 border-white/5 text-white/50" :
                    isCurrent ? "bg-primary/20 border-primary/30 text-primary shadow-glow-gold/20" :
                    "bg-white/[0.03] border-white/5 text-white/20"
                )}>
                    {mult}x
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors glass-card px-4 py-2">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-bold">Retour</span>
                </Link>
                <button onClick={() => setShowRules(true)} className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors glass-card px-4 py-2">
                    <Info className="w-4 h-4" />
                    <span className="text-sm font-bold">Règles</span>
                </button>
            </div>

            {/* Title */}
            <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-2 flex items-center justify-center gap-3">
                    <Building2 className="w-8 h-8 text-cyan-400" /> Tower Rush
                </h2>
                <p className="text-text-secondary text-sm">Montez la tour, choisissez la bonne porte à chaque étage. Jusqu&apos;à 30x !</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: Controls */}
                <div className="lg:col-span-1 space-y-4 order-2 lg:order-1">
                    <div className="glass-panel p-5 bg-mesh-gradient">
                        <div className="flex items-center gap-2 mb-5">
                            <Zap className="w-4 h-4 text-primary" />
                            <span className="text-sm font-bold text-white">Mise</span>
                        </div>

                        {/* Bet input */}
                        <div className="space-y-3">
                            <div className="flex justify-between text-[10px] font-bold text-text-tertiary uppercase">
                                <span>Montant</span>
                                <span>$ USD</span>
                            </div>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={betAmount}
                                    onChange={(e) => setBetAmount(e.target.value)}
                                    disabled={phase === "CLIMBING"}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-lg font-mono font-bold text-white focus:outline-none focus:border-primary/50 transition-all disabled:opacity-50"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                    <button onClick={() => setBetAmount(a => (parseFloat(a) * 2).toFixed(2))} disabled={phase === "CLIMBING"} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold border border-white/5 disabled:opacity-30">2x</button>
                                    <button onClick={() => setBetAmount(a => Math.max(1, parseFloat(a) / 2).toFixed(2))} disabled={phase === "CLIMBING"} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold border border-white/5 disabled:opacity-30">1/2</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {[1, 5, 10, 50].map(amt => (
                                    <button key={amt} onClick={() => setBetAmount(amt.toString())} disabled={phase === "CLIMBING"}
                                        className="py-2 text-[10px] font-bold bg-white/5 hover:bg-white/10 text-text-tertiary hover:text-white rounded-lg border border-white/5 transition-all disabled:opacity-30">
                                        ${amt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Action button */}
                        <div className="mt-5 space-y-3">
                            {phase === "IDLE" || phase === "WON" || phase === "LOST" ? (
                                <button onClick={startGame} className="w-full py-5 text-lg font-black rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 transition-all active:scale-95">
                                    {phase === "IDLE" ? "COMMENCER" : "REJOUER"}
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleCashout()}
                                    disabled={currentFloor < 1 || isProcessing}
                                    className="w-full py-5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-lg font-black rounded-xl shadow-glow-gold transition-all active:scale-95 disabled:opacity-50 flex flex-col items-center gap-1"
                                >
                                    {isProcessing ? <Loader2 className="animate-spin" /> : (
                                        <>
                                            <span>ENCAISSER</span>
                                            <span className="text-sm opacity-90">{formatToUSD(potentialWin)}</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {error && <p className="text-red-500 text-[10px] font-bold text-center mt-3">{error}</p>}
                    </div>

                    {/* Current status */}
                    <div className="bg-[#1A1D26]/50 border border-white/5 rounded-2xl p-4 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-text-tertiary font-bold uppercase">Étage actuel</span>
                            <span className="text-lg font-black text-white">{currentFloor}/10</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-text-tertiary font-bold uppercase">Multiplicateur</span>
                            <span className="text-lg font-black text-primary">{currentMultiplier > 0 ? `${currentMultiplier}x` : "-"}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-text-tertiary font-bold uppercase">Gain potentiel</span>
                            <span className="text-lg font-black text-cyan-400">{currentFloor > 0 ? formatToUSD(potentialWin) : "-"}</span>
                        </div>
                        {/* Progress bar */}
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-primary rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${(currentFloor / 10) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT: Tower */}
                <div className="lg:col-span-2 order-1 lg:order-2">
                    <div className="glass-panel p-4 md:p-6 relative overflow-hidden bg-mesh-gradient">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" />

                        {/* Particles */}
                        {particles.map(p => (
                            <div key={p.id} className="absolute w-2 h-2 bg-primary rounded-full animate-ping pointer-events-none z-30" style={{ left: `${p.x}%`, top: `${p.y}%` }} />
                        ))}

                        {/* Win/Loss overlay */}
                        {phase === "WON" && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in duration-500">
                                <div className="text-center space-y-4 p-8">
                                    <Trophy className="w-16 h-16 text-amber-400 mx-auto animate-bounce" />
                                    <div className="text-4xl font-display font-black text-white">{currentMultiplier}x</div>
                                    <div className="text-3xl font-black text-amber-400">+{formatToUSD(lastPayout)}</div>
                                    <div className="text-sm text-text-secondary">Étage {currentFloor} atteint !</div>
                                </div>
                            </div>
                        )}
                        {phase === "LOST" && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in duration-500">
                                <div className="text-center space-y-4 p-8">
                                    <Bomb className="w-16 h-16 text-red-500 mx-auto animate-pulse" />
                                    <div className="text-3xl font-display font-black text-red-500">PIÉGÉ !</div>
                                    <div className="text-lg text-text-secondary">Vous avez perdu {formatToUSD(parseFloat(betAmount))}</div>
                                </div>
                            </div>
                        )}

                        {/* Tower floors - reversed so floor 10 is at top */}
                        <div className="relative z-10 space-y-2">
                            {Array.from({ length: 10 }, (_, i) => 9 - i).map(floorIdx => renderFloor(floorIdx))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Rules section */}
            <div className="bg-[#1A1D26]/50 border border-white/5 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex gap-4 items-start">
                    <div className="p-3 bg-cyan-500/10 rounded-xl"><Building2 className="w-6 h-6 text-cyan-400" /></div>
                    <div>
                        <h4 className="text-sm font-bold text-white mb-1">Montez la Tour</h4>
                        <p className="text-xs text-text-tertiary">Choisissez une porte à chaque étage. Une seule est sûre !</p>
                    </div>
                </div>
                <div className="flex gap-4 items-start">
                    <div className="p-3 bg-amber-500/10 rounded-xl"><TrendingUp className="w-6 h-6 text-amber-400" /></div>
                    <div>
                        <h4 className="text-sm font-bold text-white mb-1">Multiplicateurs croissants</h4>
                        <p className="text-xs text-text-tertiary">Plus vous montez, plus le multiplicateur augmente (jusqu&apos;à 30x).</p>
                    </div>
                </div>
                <div className="flex gap-4 items-start">
                    <div className="p-3 bg-emerald-500/10 rounded-xl"><Trophy className="w-6 h-6 text-emerald-400" /></div>
                    <div>
                        <h4 className="text-sm font-bold text-white mb-1">Encaissez à temps</h4>
                        <p className="text-xs text-text-tertiary">Vous pouvez encaisser vos gains à n&apos;importe quel étage.</p>
                    </div>
                </div>
            </div>

            {/* Rules modal */}
            {showRules && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#1A1D26] border border-white/10 rounded-3xl p-8 max-w-md w-full relative shadow-2xl animate-in zoom-in duration-300">
                        <button onClick={() => setShowRules(false)} className="absolute top-4 right-4 p-2 text-text-tertiary hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                        <h3 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-3">
                            <Info className="w-6 h-6 text-cyan-400" /> Règles de Tower Rush
                        </h3>
                        <div className="space-y-4 text-text-secondary leading-relaxed">
                            <p>Tower Rush est un jeu de risque progressif. Montez la tour étage par étage en choisissant la bonne porte.</p>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-white font-bold">Étages 1-2</span><span className="text-emerald-400 font-bold">1.2x - 1.5x</span></div>
                                <div className="flex justify-between"><span className="text-white font-bold">Étages 3-4</span><span className="text-cyan-400 font-bold">1.9x - 2.5x</span></div>
                                <div className="flex justify-between"><span className="text-white font-bold">Étages 5-6</span><span className="text-blue-400 font-bold">3.3x - 4.5x</span></div>
                                <div className="flex justify-between"><span className="text-white font-bold">Étages 7-8</span><span className="text-violet-400 font-bold">6.5x - 10x</span></div>
                                <div className="flex justify-between"><span className="text-white font-bold">Étages 9-10</span><span className="text-amber-400 font-bold">16x - 30x</span></div>
                            </div>
                            <p className="text-sm">• 2 portes par étage, une seule est sûre (50/50).<br/>• Encaissez vos gains à tout moment.<br/>• Si vous tombez dans un piège, vous perdez votre mise.</p>
                        </div>
                        <button onClick={() => setShowRules(false)} className="w-full mt-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black rounded-xl transition-all">
                            C&apos;EST PARTI !
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
