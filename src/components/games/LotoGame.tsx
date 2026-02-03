"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, Timer, Trophy, History, ArrowLeft, Info, X, Coins, Zap, Check, Sparkles, Ticket } from "lucide-react";
import Link from "next/link";
import { cn, formatToUSD } from "@/lib/utils";
import { useRouter } from "next/navigation";

// --- TYPES ---
interface LotoTicket {
    id: string;
    selection: number[];
    amount: number;
    createdAt: string;
}

interface LotoHistory {
    drawId: string;
    numbers: number[];
    time: number;
}

interface LotoState {
    nextDrawTime: number;
    lastWinningNumbers: number[];
    history: LotoHistory[];
    serverTime: number;
}

export default function LotoGame() {
    const router = useRouter();

    // --- ÉTATS ---
    const [state, setState] = useState<LotoState | null>(null);
    const [myTickets, setMyTickets] = useState<LotoTicket[]>([]);
    const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
    const [betAmount, setBetAmount] = useState("100");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [showRules, setShowRules] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawingNumbers, setDrawingNumbers] = useState<number[]>([]);

    // --- POLLING STATE ---
    const fetchState = useCallback(async () => {
        try {
            const res = await fetch("/api/games/loto/state");
            const data = await res.json();
            if (data.success) {
                // Check if a new draw just happened
                if (state && state.nextDrawTime !== data.state.nextDrawTime) {
                    triggerDrawAnimation(data.state.lastWinningNumbers);
                }
                setState(data.state);
                setMyTickets(data.myTickets);
            }
        } catch (err) {
            console.error("Loto state fetch failed", err);
        }
    }, [state]);

    useEffect(() => {
        fetchState();
        const interval = setInterval(fetchState, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [fetchState]);

    // --- DRAW ANIMATION ---
    const triggerDrawAnimation = async (winning: number[]) => {
        setIsDrawing(true);
        setDrawingNumbers([]);
        for (const num of winning) {
            await new Promise(r => setTimeout(r, 1500)); // Dramatic pause
            setDrawingNumbers(prev => [...prev, num]);
        }
        await new Promise(r => setTimeout(r, 3000));
        setIsDrawing(false);
        setDrawingNumbers([]);
        router.refresh(); // Sync balance
    };

    // --- SELECTION LOGIC ---
    const toggleNumber = (num: number) => {
        if (selectedNumbers.includes(num)) {
            setSelectedNumbers(selectedNumbers.filter(n => n !== num));
        } else if (selectedNumbers.length < 5) {
            setSelectedNumbers([...selectedNumbers, num]);
        }
    };

    const handlePlaceBet = async () => {
        if (selectedNumbers.length !== 5) return;
        setIsSubmitting(true);
        setError("");
        try {
            const res = await fetch("/api/games/loto/bet", {
                method: "POST",
                body: JSON.stringify({
                    selection: selectedNumbers,
                    amount: parseInt(betAmount)
                })
            });
            const data = await res.json();
            if (data.success) {
                setSelectedNumbers([]);
                fetchState();
                router.refresh();
            } else {
                setError(data.error);
            }
        } catch {
            setError("Erreur réseau");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- TIMER ---
    const [countdown, setCountdown] = useState("");
    useEffect(() => {
        const timer = setInterval(() => {
            if (!state) return;
            const diff = Math.max(0, state.nextDrawTime - Date.now());
            if (diff === 0 && !isDrawing) fetchState(); // Trigger check when hitting 0

            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            setCountdown(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        }, 1000);
        return () => clearInterval(timer);
    }, [state, isDrawing, fetchState]);

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center justify-between glass-card p-4">
                <Link href="/" className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors px-4 py-2 glass-light font-bold text-sm">
                    <ArrowLeft className="w-4 h-4" /> Retour
                </Link>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl">
                        <Timer className="w-5 h-5 text-primary animate-pulse" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">Prochain Tirage</span>
                            <span className="text-xl font-mono font-black text-white leading-tight">{countdown}</span>
                        </div>
                    </div>
                    <button onClick={() => setShowRules(true)} className="p-2 text-text-tertiary hover:text-white transition-colors">
                        <Info className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-6">
                    <div className="glass-panel p-8 relative overflow-hidden bg-mesh-gradient">
                        {/* Background Glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] pointer-events-none animate-pulse-slow" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-violet/10 blur-[100px] pointer-events-none animate-pulse-slow" />

                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h1 className="text-4xl font-display font-black text-white">LA <span className="text-primary">LOTO</span></h1>
                                    <p className="text-text-secondary text-sm font-medium">Choisissez 5 numéros porte-bonheur</p>
                                </div>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className={cn(
                                            "w-10 h-10 border-2 rounded-full flex items-center justify-center font-bold transition-all duration-300",
                                            selectedNumbers[i - 1] ? "border-primary bg-primary text-background shadow-glow-gold" : "border-white/10 text-text-tertiary"
                                        )}>
                                            {selectedNumbers[i - 1] || "?"}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Numbers Grid */}
                            <div className="grid grid-cols-6 md:grid-cols-9 gap-3">
                                {Array.from({ length: 36 }, (_, i) => i + 1).map(num => {
                                    const isSelected = selectedNumbers.includes(num);
                                    return (
                                        <button
                                            key={num}
                                            onClick={() => toggleNumber(num)}
                                            className={cn(
                                                "aspect-square rounded-2xl flex items-center justify-center font-bold text-lg transition-all transform active:scale-90",
                                                isSelected
                                                    ? "bg-primary text-background shadow-glow-gold scale-105"
                                                    : "bg-white/5 text-white hover:bg-white/10 border border-white/5"
                                            )}
                                        >
                                            {num}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Bottom Controls */}
                            <div className="flex flex-col md:flex-row gap-6 pt-6 border-t border-white/5">
                                <div className="flex-1 space-y-3">
                                    <span className="text-xs font-black text-text-tertiary uppercase tracking-widest px-1">Mise par Ticket</span>
                                    <div className="relative">
                                        <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                                        <input
                                            type="number"
                                            value={betAmount}
                                            onChange={(e) => setBetAmount(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-xl font-mono font-bold text-white focus:outline-none focus:border-primary/50 transition-all"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        {[100, 500, 1000, 5000].map(amt => (
                                            <button key={amt} onClick={() => setBetAmount(amt.toString())} className="flex-1 py-2 text-[10px] font-black bg-white/5 hover:bg-white/10 text-text-secondary rounded-lg border border-white/5 transition-all uppercase">{amt}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex-1 flex items-end">
                                    <button
                                        onClick={handlePlaceBet}
                                        disabled={isSubmitting || selectedNumbers.length !== 5}
                                        className={cn(
                                            "w-full py-6 rounded-2xl font-black text-xl tracking-tight transition-all flex items-center justify-center gap-3",
                                            selectedNumbers.length === 5
                                                ? "bg-primary text-background shadow-glow-gold hover:scale-[1.02] active:scale-[0.98]"
                                                : "bg-white/5 text-text-tertiary cursor-not-allowed"
                                        )}
                                    >
                                        {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Ticket className="w-6 h-6" />}
                                        PLACER LE PARI
                                    </button>
                                </div>
                            </div>
                            {error && <p className="text-error text-center font-bold animate-shake">{error}</p>}
                        </div>
                    </div>

                    {/* Pending Tickets */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-primary" /> Mes Tickets pour le prochain tirage ({myTickets.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {myTickets.map(ticket => (
                                <div key={ticket.id} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-colors">
                                    <div className="flex gap-1.5">
                                        {ticket.selection.map(n => (
                                            <span key={n} className="w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-xs font-bold text-primary">{n}</span>
                                        ))}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-text-tertiary uppercase tracking-tighter">MISE</p>
                                        <p className="text-sm font-mono font-bold text-white">{ticket.amount}</p>
                                    </div>
                                </div>
                            ))}
                            {myTickets.length === 0 && <p className="col-span-2 text-center py-8 text-text-tertiary text-sm italic">Aucun ticket actif. Tentez votre chance !</p>}
                        </div>
                    </div>
                </div>

                {/* Right: History & Live Draw Overlay */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="glass-card p-6 h-full">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <History className="w-5 h-5 text-accent-cyan" /> Historique des Tirages
                        </h3>
                        <div className="space-y-4">
                            {state?.history.map(draw => (
                                <div key={draw.drawId} className="p-4 bg-white/5 rounded-2xl space-y-3 border border-white/5">
                                    <div className="flex justify-between items-center text-[10px] font-black text-text-tertiary uppercase tracking-widest">
                                        <span>TIRAGE #{draw.drawId.slice(-4)}</span>
                                        <span>{new Date(draw.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {draw.numbers.map(n => (
                                            <div key={n} className="flex-1 aspect-square bg-primary/10 rounded-xl flex items-center justify-center text-sm font-black text-primary border border-primary/20">{n}</div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* LIVE DRAW OVERLAY */}
            {isDrawing && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="text-center space-y-12 max-w-2xl w-full px-4">
                        <div className="space-y-4">
                            <Sparkles className="w-16 h-16 text-primary mx-auto animate-spin-slow" />
                            <h2 className="text-5xl md:text-7xl font-display font-black text-white tracking-tighter">
                                TIRAGE <span className="text-primary underline decoration-primary/30">EN DIRECT</span>
                            </h2>
                            <p className="text-text-secondary text-xl font-medium">Les boules sont lancées...</p>
                        </div>

                        <div className="flex justify-center gap-4 md:gap-6">
                            {[0, 1, 2, 3, 4].map(i => (
                                <div key={i} className={cn(
                                    "w-16 h-16 md:w-24 md:h-24 rounded-full border-4 flex items-center justify-center text-3xl md:text-5xl font-black transition-all duration-700",
                                    drawingNumbers[i]
                                        ? "bg-primary border-primary text-background shadow-glow-gold scale-110 rotate-[360deg]"
                                        : "border-white/10 bg-white/5 text-transparent animate-pulse"
                                )}>
                                    {drawingNumbers[i] || "?"}
                                </div>
                            ))}
                        </div>

                        <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] animate-pulse">
                            <p className="text-sm font-black text-primary uppercase tracking-widest">Résultats imminents</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal des Règles */}
            {showRules && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="glass-panel p-8 max-w-md w-full relative animate-in zoom-in duration-300">
                        <button onClick={() => setShowRules(false)} className="absolute top-4 right-4 p-2 text-text-tertiary hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                        <h3 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-3"><Trophy className="w-6 h-6 text-primary" /> La Loto : Gain</h3>
                        <div className="space-y-4">
                            <div className="bg-black/20 p-4 rounded-2xl space-y-2">
                                <div className="flex justify-between font-bold text-sm"><span className="text-white">5 Bons numéros</span><span className="text-primary font-black">X5000</span></div>
                                <div className="flex justify-between font-bold text-sm"><span className="text-white">4 Bons numéros</span><span className="text-primary font-black">X100</span></div>
                                <div className="flex justify-between font-bold text-sm"><span className="text-white">3 Bons numéros</span><span className="text-primary font-black">X10</span></div>
                                <div className="flex justify-between font-bold text-sm"><span className="text-white">2 Bons numéros</span><span className="text-primary font-black">X2</span></div>
                            </div>
                            <p className="text-sm text-text-secondary leading-relaxed pt-2">Un tirage a lieu toutes les heures pile. Les tickets doivent être achetés avant le début du tirage. Les gains sont calculés en fonction du nombre de numéros correspondants à la sélection officielle.</p>
                        </div>
                        <button onClick={() => setShowRules(false)} className="w-full mt-8 py-4 bg-primary text-background font-black rounded-xl hover:bg-primary-hover transition-colors">C'EST COMPRIS !</button>
                    </div>
                </div>
            )}
        </div>
    );
}
