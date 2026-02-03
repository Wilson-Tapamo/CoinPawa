"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Dices, Loader2, Trophy, XCircle, Plus, Minus, ArrowLeft, Info, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ============================================
// COMPOSANT DÉ 3D
// ============================================
interface Dice3DProps {
    value: number;
    isRolling: boolean;
    index: number;
}

function Dice3D({ value, isRolling, index }: Dice3DProps) {
    const [rotation, setRotation] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (!isRolling && value) {
            // Rotation finale basée sur la valeur du dé
            const rotations: Record<number, { x: number; y: number }> = {
                1: { x: 0, y: 0 },
                2: { x: 0, y: -90 },
                3: { x: -90, y: 0 },
                4: { x: 90, y: 0 },
                5: { x: 0, y: 90 },
                6: { x: 180, y: 0 },
            };
            setRotation(rotations[value] || { x: 0, y: 0 });
        }
    }, [isRolling, value]);

    // Points du dé
    const DotPattern = ({ count }: { count: number }) => {
        const patterns: Record<number, string[]> = {
            1: ["center"],
            2: ["top-right", "bottom-left"],
            3: ["top-right", "center", "bottom-left"],
            4: ["top-left", "top-right", "bottom-left", "bottom-right"],
            5: ["top-left", "top-right", "center", "bottom-left", "bottom-right"],
            6: ["top-left", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-right"],
        };

        const positions: Record<string, string> = {
            "top-left": "top-2 left-2",
            "top-right": "top-2 right-2",
            "middle-left": "top-1/2 -translate-y-1/2 left-2",
            "middle-right": "top-1/2 -translate-y-1/2 right-2",
            "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            "bottom-left": "bottom-2 left-2",
            "bottom-right": "bottom-2 right-2",
        };

        return (
            <>
                {(patterns[count] || []).map((pos, i) => (
                    <div
                        key={i}
                        className={cn(
                            "absolute w-3 h-3 md:w-4 md:h-4 bg-gray-800 rounded-full shadow-inner",
                            positions[pos]
                        )}
                    />
                ))}
            </>
        );
    };

    return (
        <div
            className="w-20 h-20 md:w-24 md:h-24 relative"
            style={{
                perspective: "400px",
                perspectiveOrigin: "50% 50%",
            }}
        >
            <div
                className={cn(
                    "w-full h-full relative transition-transform duration-700 ease-out",
                    isRolling && "animate-dice-roll"
                )}
                style={{
                    transformStyle: "preserve-3d",
                    transform: isRolling
                        ? undefined
                        : `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                    animationDelay: `${index * 100}ms`,
                }}
            >
                {/* Face 1 (avant) */}
                <div
                    className="absolute inset-0 bg-gradient-to-br from-white to-gray-200 rounded-xl border-2 border-gray-300 shadow-lg"
                    style={{ transform: "translateZ(40px)" }}
                >
                    <DotPattern count={1} />
                </div>
                {/* Face 6 (arrière) */}
                <div
                    className="absolute inset-0 bg-gradient-to-br from-white to-gray-200 rounded-xl border-2 border-gray-300"
                    style={{ transform: "rotateY(180deg) translateZ(40px)" }}
                >
                    <DotPattern count={6} />
                </div>
                {/* Face 2 (droite) */}
                <div
                    className="absolute inset-0 bg-gradient-to-br from-white to-gray-200 rounded-xl border-2 border-gray-300"
                    style={{ transform: "rotateY(90deg) translateZ(40px)" }}
                >
                    <DotPattern count={2} />
                </div>
                {/* Face 5 (gauche) */}
                <div
                    className="absolute inset-0 bg-gradient-to-br from-white to-gray-200 rounded-xl border-2 border-gray-300"
                    style={{ transform: "rotateY(-90deg) translateZ(40px)" }}
                >
                    <DotPattern count={5} />
                </div>
                {/* Face 3 (haut) */}
                <div
                    className="absolute inset-0 bg-gradient-to-br from-white to-gray-200 rounded-xl border-2 border-gray-300"
                    style={{ transform: "rotateX(90deg) translateZ(40px)" }}
                >
                    <DotPattern count={3} />
                </div>
                {/* Face 4 (bas) */}
                <div
                    className="absolute inset-0 bg-gradient-to-br from-white to-gray-200 rounded-xl border-2 border-gray-300"
                    style={{ transform: "rotateX(-90deg) translateZ(40px)" }}
                >
                    <DotPattern count={4} />
                </div>
            </div>
        </div>
    );
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
interface BetResult {
    type: "under7" | "exact7" | "over7";
    amount: number;
    isWin: boolean;
    payout: number;
}

export default function DiceGame() {
    const router = useRouter();
    // États des paris
    const [bets, setBets] = useState({
        under7: 0,
        exact7: 0,
        over7: 0,
    });

    // États du jeu
    const [isRolling, setIsRolling] = useState(false);
    const [diceValues, setDiceValues] = useState<[number, number] | null>(null);
    const [lastResults, setLastResults] = useState<BetResult[] | null>(null);
    const [error, setError] = useState("");
    const [totalPayout, setTotalPayout] = useState(0);
    const [showRules, setShowRules] = useState(false);

    // Multiplicateurs
    const MULTIPLIERS = {
        under7: 2.0,  // ~41.67% chance
        exact7: 6.0,  // ~16.67% chance
        over7: 2.0,   // ~41.67% chance
    };

    // Ajustement du montant du pari
    const adjustBet = (type: keyof typeof bets, delta: number) => {
        setBets((prev) => ({
            ...prev,
            [type]: Math.max(0, prev[type] + delta),
        }));
    };

    const setBetAmount = (type: keyof typeof bets, value: string) => {
        const num = parseInt(value) || 0;
        setBets((prev) => ({
            ...prev,
            [type]: Math.max(0, num),
        }));
    };

    // Total misé
    const totalBet = bets.under7 + bets.exact7 + bets.over7;

    // Lancer les dés
    const handleRoll = async () => {
        if (totalBet <= 0) {
            setError("Placez au moins un pari !");
            return;
        }

        setIsRolling(true);
        setLastResults(null);
        setError("");
        setTotalPayout(0);

        try {
            const res = await fetch("/api/games/dice/play", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bets }),
            });

            const data = await res.json();

            if (res.ok) {
                // Attendre l'animation
                setTimeout(() => {
                    setDiceValues([data.result.dice1, data.result.dice2]);
                    setLastResults(data.result.betResults);
                    setTotalPayout(data.result.totalPayout);
                    setIsRolling(false);
                    router.refresh();
                }, 1500);
            } else {
                setError(data.error || "Une erreur est survenue");
                setIsRolling(false);
            }
        } catch {
            setError("Erreur de connexion");
            setIsRolling(false);
        }
    };

    // Réinitialiser les paris
    const resetBets = () => {
        setBets({ under7: 0, exact7: 0, over7: 0 });
    };

    const total = diceValues ? diceValues[0] + diceValues[1] : null;
    const hasWon = lastResults?.some((r) => r.isWin);

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in zoom-in duration-500">
            {/* Container Principal */}
            <div className="bg-[#1A1D26] border border-white/5 rounded-3xl p-6 md:p-10 relative overflow-hidden shadow-2xl">
                {/* Background FX */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10">
                    {/* Header Controls */}
                    <div className="flex items-center justify-between mb-8">
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

                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-4xl font-display font-bold text-white mb-2 flex items-center justify-center gap-3">
                            <Dices className="w-10 h-10 text-primary" /> Dice
                        </h2>
                        <p className="text-text-secondary">
                            Lancez 2 dés et pariez sur le total : Moins de 7, Exactement 7, ou Plus de 7
                        </p>
                    </div>

                    {/* Zone des Dés 3D */}
                    <div className="flex justify-center items-center gap-6 mb-8 min-h-[140px]">
                        {isRolling || diceValues ? (
                            <>
                                <Dice3D
                                    value={diceValues?.[0] || 1}
                                    isRolling={isRolling}
                                    index={0}
                                />
                                <Dice3D
                                    value={diceValues?.[1] || 1}
                                    isRolling={isRolling}
                                    index={1}
                                />
                            </>
                        ) : (
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 md:w-24 md:h-24 bg-white/5 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center">
                                    <Dices className="w-10 h-10 text-white/20" />
                                </div>
                                <div className="w-20 h-20 md:w-24 md:h-24 bg-white/5 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center">
                                    <Dices className="w-10 h-10 text-white/20" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Résultat du Total */}
                    {total !== null && !isRolling && (
                        <div className="text-center mb-8 animate-in slide-in-from-top-4 fade-in duration-300">
                            <div className={cn(
                                "inline-flex items-center gap-3 px-6 py-3 rounded-2xl border-2",
                                hasWon
                                    ? "bg-green-500/20 border-green-500/50"
                                    : "bg-red-500/20 border-red-500/50"
                            )}>
                                <span className="text-4xl font-display font-bold text-white">
                                    {diceValues?.[0]} + {diceValues?.[1]} = {total}
                                </span>
                                {hasWon ? (
                                    <Trophy className="w-8 h-8 text-green-400" />
                                ) : (
                                    <XCircle className="w-8 h-8 text-red-400" />
                                )}
                            </div>

                            {totalPayout > 0 && (
                                <div className="mt-4 text-3xl font-display font-bold text-green-400">
                                    +{totalPayout.toLocaleString()} SATS
                                </div>
                            )}
                        </div>
                    )}

                    {/* Panneau des Paris */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {/* MOINS DE 7 */}
                        <div className={cn(
                            "p-5 rounded-2xl border-2 transition-all",
                            bets.under7 > 0
                                ? "bg-blue-600/20 border-blue-500 shadow-glow-blue"
                                : "bg-background-secondary border-white/10 hover:border-white/20"
                        )}>
                            <div className="text-center mb-3">
                                <span className="text-lg font-bold text-white">Moins de 7</span>
                                <div className="text-xs text-text-tertiary mt-1">
                                    2-6 • Multiplicateur x{MULTIPLIERS.under7}
                                </div>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <button
                                    onClick={() => adjustBet("under7", -10)}
                                    className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <input
                                    type="number"
                                    value={bets.under7 || ""}
                                    onChange={(e) => setBetAmount("under7", e.target.value)}
                                    placeholder="0"
                                    className="w-24 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-center text-white font-mono font-bold focus:outline-none focus:border-blue-500/50"
                                />
                                <button
                                    onClick={() => adjustBet("under7", 10)}
                                    className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            {/* PRESET AMOUNTS */}
                            <div className="flex flex-wrap justify-center gap-2 mt-4">
                                {[100, 500, 1000, 5000].map((amt) => (
                                    <button
                                        key={amt}
                                        onClick={() => setBetAmount("under7", amt.toString())}
                                        className="px-2 py-1 text-[10px] font-bold bg-white/5 hover:bg-white/10 text-text-tertiary hover:text-white rounded-md border border-white/5 transition-all"
                                    >
                                        {amt >= 1000 ? (amt / 1000) + 'k' : amt}
                                    </button>
                                ))}
                            </div>

                            {lastResults?.find((r) => r.type === "under7") && (
                                <div className={cn(
                                    "mt-3 text-center text-sm font-bold",
                                    lastResults.find((r) => r.type === "under7")?.isWin ? "text-green-400" : "text-red-400"
                                )}>
                                    {lastResults.find((r) => r.type === "under7")?.isWin ? "GAGNÉ !" : "PERDU"}
                                </div>
                            )}
                        </div>

                        {/* EXACTEMENT 7 */}
                        <div className={cn(
                            "p-5 rounded-2xl border-2 transition-all",
                            bets.exact7 > 0
                                ? "bg-yellow-600/20 border-yellow-500 shadow-glow-gold"
                                : "bg-background-secondary border-white/10 hover:border-white/20"
                        )}>
                            <div className="text-center mb-3">
                                <span className="text-lg font-bold text-white">Exactement 7</span>
                                <div className="text-xs text-text-tertiary mt-1">
                                    7 uniquement • Multiplicateur x{MULTIPLIERS.exact7}
                                </div>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <button
                                    onClick={() => adjustBet("exact7", -10)}
                                    className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <input
                                    type="number"
                                    value={bets.exact7 || ""}
                                    onChange={(e) => setBetAmount("exact7", e.target.value)}
                                    placeholder="0"
                                    className="w-24 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-center text-white font-mono font-bold focus:outline-none focus:border-yellow-500/50"
                                />
                                <button
                                    onClick={() => adjustBet("exact7", 10)}
                                    className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            {/* PRESET AMOUNTS */}
                            <div className="flex flex-wrap justify-center gap-2 mt-4">
                                {[100, 500, 1000, 5000].map((amt) => (
                                    <button
                                        key={amt}
                                        onClick={() => setBetAmount("exact7", amt.toString())}
                                        className="px-2 py-1 text-[10px] font-bold bg-white/5 hover:bg-white/10 text-text-tertiary hover:text-white rounded-md border border-white/5 transition-all"
                                    >
                                        {amt >= 1000 ? (amt / 1000) + 'k' : amt}
                                    </button>
                                ))}
                            </div>

                            {lastResults?.find((r) => r.type === "exact7") && (
                                <div className={cn(
                                    "mt-3 text-center text-sm font-bold",
                                    lastResults.find((r) => r.type === "exact7")?.isWin ? "text-green-400" : "text-red-400"
                                )}>
                                    {lastResults.find((r) => r.type === "exact7")?.isWin ? "GAGNÉ !" : "PERDU"}
                                </div>
                            )}
                        </div>

                        {/* PLUS DE 7 */}
                        <div className={cn(
                            "p-5 rounded-2xl border-2 transition-all",
                            bets.over7 > 0
                                ? "bg-purple-600/20 border-purple-500 shadow-glow-purple"
                                : "bg-background-secondary border-white/10 hover:border-white/20"
                        )}>
                            <div className="text-center mb-3">
                                <span className="text-lg font-bold text-white">Plus de 7</span>
                                <div className="text-xs text-text-tertiary mt-1">
                                    8-12 • Multiplicateur x{MULTIPLIERS.over7}
                                </div>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <button
                                    onClick={() => adjustBet("over7", -10)}
                                    className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <input
                                    type="number"
                                    value={bets.over7 || ""}
                                    onChange={(e) => setBetAmount("over7", e.target.value)}
                                    placeholder="0"
                                    className="w-24 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-center text-white font-mono font-bold focus:outline-none focus:border-purple-500/50"
                                />
                                <button
                                    onClick={() => adjustBet("over7", 10)}
                                    className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            {/* PRESET AMOUNTS */}
                            <div className="flex flex-wrap justify-center gap-2 mt-4">
                                {[100, 500, 1000, 5000].map((amt) => (
                                    <button
                                        key={amt}
                                        onClick={() => setBetAmount("over7", amt.toString())}
                                        className="px-2 py-1 text-[10px] font-bold bg-white/5 hover:bg-white/10 text-text-tertiary hover:text-white rounded-md border border-white/5 transition-all"
                                    >
                                        {amt >= 1000 ? (amt / 1000) + 'k' : amt}
                                    </button>
                                ))}
                            </div>

                            {lastResults?.find((r) => r.type === "over7") && (
                                <div className={cn(
                                    "mt-3 text-center text-sm font-bold",
                                    lastResults.find((r) => r.type === "over7")?.isWin ? "text-green-400" : "text-red-400"
                                )}>
                                    {lastResults.find((r) => r.type === "over7")?.isWin ? "GAGNÉ !" : "PERDU"}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Total et Actions */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-background-secondary rounded-2xl border border-white/5">
                        <div className="text-center md:text-left">
                            <div className="text-xs text-text-tertiary uppercase mb-1">Total Misé</div>
                            <div className="text-2xl font-display font-bold text-white">
                                {totalBet.toLocaleString()} <span className="text-text-secondary text-lg">SATS</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={resetBets}
                                disabled={isRolling}
                                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                            >
                                Réinitialiser
                            </button>
                            <button
                                onClick={handleRoll}
                                disabled={isRolling || totalBet <= 0}
                                className="px-8 py-3 bg-primary hover:bg-primary-hover text-background text-lg font-bold rounded-xl shadow-glow-gold transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 min-w-[160px]"
                            >
                                {isRolling ? (
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                ) : (
                                    "Lancer les Dés"
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Erreur */}
                    {error && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-bold text-center">
                            {error}
                        </div>
                    )}
                </div>
            </div>

            {/* Règles du jeu */}
            <div className="bg-[#1A1D26] border border-white/5 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Règles du Jeu</h3>
                <ul className="space-y-2 text-text-secondary text-sm">
                    <li>• <strong>Moins de 7</strong> : Gagnez si la somme des 2 dés est entre 2 et 6 (x{MULTIPLIERS.under7})</li>
                    <li>• <strong>Exactement 7</strong> : Gagnez si la somme est exactement 7 (x{MULTIPLIERS.exact7})</li>
                    <li>• <strong>Plus de 7</strong> : Gagnez si la somme est entre 8 et 12 (x{MULTIPLIERS.over7})</li>
                    <li>• Vous pouvez placer plusieurs paris simultanément sur différentes options</li>
                </ul>
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
                            <Info className="w-6 h-6 text-primary" /> Règles de Dice
                        </h3>

                        <div className="space-y-4 text-text-secondary leading-relaxed">
                            <p>
                                Dice est un jeu simple où vous lancez deux dés et pariez sur le résultat total.
                            </p>
                            <div className="space-y-2 bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-white">Moins de 7 (2-6)</span>
                                    <span className="text-primary font-bold">x2.0</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-white">Exactement 7</span>
                                    <span className="text-primary font-bold">x6.0</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-white">Plus de 7 (8-12)</span>
                                    <span className="text-primary font-bold">x2.0</span>
                                </div>
                            </div>
                            <p className="text-sm">
                                • Choisissez votre montant de pari pour une ou plusieurs options.<br />
                                • Les résultats sont générés de manière aléatoire et équitable.<br />
                                • Le multiplicateur s'applique uniquement à la mise correspondante.
                            </p>
                        </div>

                        <button
                            onClick={() => setShowRules(false)}
                            className="w-full mt-8 py-4 bg-primary hover:bg-primary-hover text-background font-black rounded-xl transition-all"
                        >
                            COMPRIS !
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
