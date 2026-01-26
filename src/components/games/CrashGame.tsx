"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Rocket, Loader2, Trophy, Bomb, Users, Zap, History, TrendingUp, ArrowUpRight } from "lucide-react";
import { cn, formatToUSD } from "@/lib/utils";
import { useRouter } from "next/navigation";

// ============================================
// TYPES & CONSTANTS
// ============================================
type Phase = "BETTING" | "FLYING" | "CRASHED";

interface Bet {
    id: string;
    username: string;
    amount: number;
    multiplier: number | null;
    payout: number | null;
    status: string;
}

interface GameState {
    phase: Phase;
    startTime: number;
    nextPhaseTime: number;
    currentMultiplier: number;
    crashPoint: number | null;
    history: number[];
    roundId: string;
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export default function CrashGame() {
    const router = useRouter();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // États du jeu
    const [state, setState] = useState<GameState | null>(null);
    const [liveBets, setLiveBets] = useState<Bet[]>([]);
    const [isPolling, setIsPolling] = useState(true);

    // États utilisateur
    const [betAmount, setBetAmount] = useState<string>("100");
    const [isPlacingBet, setIsPlacingBet] = useState(false);
    const [isCashingOut, setIsCashingOut] = useState(false);
    const [userActiveBet, setUserActiveBet] = useState<Bet | null>(null);
    const [error, setError] = useState<string | null>(null);

    // --- MISE À JOUR DE L'ÉTAT (Polling) ---
    useEffect(() => {
        const fetchState = async () => {
            try {
                const res = await fetch("/api/games/crash/state");
                const data = await res.json();
                if (data.success) {
                    setState(data.state);
                    setLiveBets(data.bets);

                    // Vérifier si l'utilisateur a un pari dans la liste
                    // (Plus simple pour la démo que de stocker un ID local)
                }
            } catch (err) {
                console.error("State poll failed", err);
            }
        };

        const interval = setInterval(fetchState, 2000); // Poll every 2s
        fetchState();
        return () => clearInterval(interval);
    }, []);

    // --- ANIMATION LOCALE (Smooth multiplier) ---
    const [displayMultiplier, setDisplayMultiplier] = useState(1.0);

    useEffect(() => {
        if (!state) return;

        let animationFrame: number;

        const update = () => {
            const now = Date.now();
            if (state.phase === 'FLYING') {
                const elapsed = now - (state.startTime + 10000); // 10s betting
                if (elapsed > 0) {
                    const m = Math.exp(0.06 * (elapsed / 1000));
                    setDisplayMultiplier(Math.floor(m * 100) / 100);
                } else {
                    setDisplayMultiplier(1.0);
                }
            } else if (state.phase === 'CRASHED') {
                setDisplayMultiplier(state.crashPoint || 1.0);
            } else {
                setDisplayMultiplier(1.0);
            }
            animationFrame = requestAnimationFrame(update);
        };

        animationFrame = requestAnimationFrame(update);
        return () => cancelAnimationFrame(animationFrame);
    }, [state]);

    // --- CANVAS DRAWING (Graph) ---
    useEffect(() => {
        if (!canvasRef.current || !state) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let frame: number;

        const draw = () => {
            const w = canvas.width;
            const h = canvas.height;
            ctx.clearRect(0, 0, w, h);

            if (state.phase === 'FLYING' || state.phase === 'CRASHED') {
                // Courbe de croissance
                ctx.beginPath();
                ctx.lineWidth = 4;
                ctx.strokeStyle = state.phase === 'CRASHED' ? '#ef4444' : '#6366f1';

                // Animation de la courbe proportionnelle au temps
                const now = Date.now();
                const elapsed = Math.max(0, now - (state.startTime + 10000));
                const points = 50;
                ctx.moveTo(40, h - 40);

                for (let i = 0; i < points; i++) {
                    const t = (elapsed / points) * i;
                    const x = 40 + (i / points) * (w - 100);
                    const m = Math.exp(0.06 * (t / 1000));
                    // Mapper le multiplicateur à la hauteur (log scale)
                    const y = (h - 40) - Math.log(m) * 50;
                    ctx.lineTo(x, y);
                    if (m >= displayMultiplier && state.phase === 'FLYING') break;
                }
                ctx.stroke();

                // Point Final / Rocket Icon would be here
            }

            // Axes
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 2;
            ctx.moveTo(40, 20); ctx.lineTo(40, h - 40); ctx.lineTo(w - 20, h - 40);
            ctx.stroke();

            frame = requestAnimationFrame(draw);
        };

        frame = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(frame);
    }, [state, displayMultiplier]);

    // --- ACTIONS ---
    const handlePlaceBet = async () => {
        setError(null);
        setIsPlacingBet(true);
        try {
            const res = await fetch("/api/games/crash/bet", {
                method: "POST",
                body: JSON.stringify({ amount: parseInt(betAmount) })
            });
            const data = await res.json();
            if (data.success) {
                // Bet placed
                router.refresh(); // Sync balance
            } else {
                setError(data.error);
            }
        } catch {
            setError("Erreur réseau");
        } finally {
            setIsPlacingBet(false);
        }
    };

    const handleCashout = async () => {
        setError(null);
        setIsCashingOut(true);
        try {
            const res = await fetch("/api/games/crash/cashout", { method: "POST" });
            const data = await res.json();
            if (data.success) {
                // Success!
                router.refresh();
            } else {
                setError(data.error);
            }
        } catch {
            setError("Erreur réseau");
        } finally {
            setIsCashingOut(false);
        }
    };

    // Déterminer si l'utilisateur a un pari actif dans le round courant
    // (Simulé ici par la recherche dans liveBets)
    const currentUserBet = useMemo(() => {
        // En prod on utiliserait l'ID de session, ici on cherche le pseudo Joueur si possible
        // Pour simplifier, on prend le premier pari dont l'ID est celui retourné par /bet
        // Mais ici on va juste vérifier si l'user a cliqué sur 'Bet' et que le status est RUNNING
        return liveBets.find(b => b.status === 'ACTIVE'); // MOCK logic
    }, [liveBets]);

    // Temps restant pour parier
    const [timeLeft, setTimeLeft] = useState(0);
    useEffect(() => {
        const timer = setInterval(() => {
            if (state?.phase === 'BETTING') {
                const diff = Math.max(0, state.nextPhaseTime - Date.now());
                setTimeLeft(Math.floor(diff / 1000));
            }
        }, 500);
        return () => clearInterval(timer);
    }, [state]);

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700">

            {/* 1. TOP BAR : HISTORY */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-background-secondary rounded-lg border border-white/5 mr-4 shrink-0">
                    <History className="w-4 h-4 text-text-tertiary" />
                    <span className="text-xs font-bold text-text-tertiary uppercase tracking-tight">Historique</span>
                </div>
                {state?.history.map((val, i) => (
                    <div
                        key={i}
                        className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-bold shrink-0 border transition-all",
                            val >= 10 ? "bg-amber-500/20 border-amber-500/50 text-amber-500" :
                                val >= 2 ? "bg-accent-violet/20 border-accent-violet/50 text-accent-violet" :
                                    "bg-white/5 border-white/10 text-white/50"
                        )}
                    >
                        {val.toFixed(2)}x
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* 2. LEFT: BETTING PANEL */}
                <div className="lg:col-span-1 space-y-4 order-2 lg:order-1">
                    <div className="bg-[#1A1D26] border border-white/5 rounded-2xl p-5 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-sm font-bold text-white flex items-center gap-2">
                                <Zap className="w-4 h-4 text-primary" /> Placer un Pari
                            </span>
                        </div>

                        <div className="space-y-5">
                            {/* Input Montant */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-bold text-text-tertiary uppercase">
                                    <span>Montant</span>
                                    <span>SATS</span>
                                </div>
                                <div className="relative group">
                                    <input
                                        type="number"
                                        value={betAmount}
                                        onChange={(e) => setBetAmount(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-xl font-mono font-bold text-white focus:outline-none focus:border-primary/50 transition-all"
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                        <button onClick={() => setBetAmount(a => (parseInt(a) * 2).toString())} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold">2x</button>
                                        <button onClick={() => setBetAmount(a => Math.max(10, Math.floor(parseInt(a) / 2)).toString())} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold">1/2</button>
                                    </div>
                                </div>
                            </div>

                            {/* Bouton d'action dynamique */}
                            {state?.phase === 'FLYING' && currentUserBet ? (
                                <button
                                    onClick={handleCashout}
                                    disabled={isCashingOut}
                                    className="w-full py-6 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white text-xl font-black rounded-xl shadow-glow-gold transition-all transform active:scale-95 flex flex-col items-center justify-center gap-1"
                                >
                                    {isCashingOut ? <Loader2 className="animate-spin" /> : (
                                        <>
                                            <span>CASHOUT</span>
                                            <span className="text-base opacity-90">{(parseInt(betAmount) * displayMultiplier).toLocaleString()} SATS</span>
                                        </>
                                    )}
                                </button>
                            ) : (
                                <button
                                    onClick={handlePlaceBet}
                                    disabled={state?.phase !== 'BETTING' || isPlacingBet}
                                    className={cn(
                                        "w-full py-5 text-xl font-black rounded-xl transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                                        state?.phase === 'BETTING'
                                            ? "bg-primary hover:bg-primary-hover text-background shadow-glow-gold"
                                            : "bg-white/5 text-text-tertiary border border-white/5"
                                    )}
                                >
                                    {isPlacingBet ? <Loader2 className="animate-spin mx-auto" /> :
                                        state?.phase === 'BETTING' ? "PARIER" : "ATTENTE..."}
                                </button>
                            )}

                            {error && <p className="text-red-500 text-[10px] font-bold text-center">{error}</p>}
                        </div>
                    </div>

                    {/* Stats Panel */}
                    <div className="bg-[#1A1D26]/50 border border-white/5 rounded-2xl p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <div className="text-[10px] text-text-tertiary font-bold uppercase">En ligne</div>
                                <div className="text-sm font-bold text-white">{liveBets.length + 42} Joueurs</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-text-tertiary font-bold uppercase">Misé total</div>
                            <div className="text-sm font-bold text-primary">{(liveBets.reduce((a, b) => a + b.amount, 0)).toLocaleString()} SATS</div>
                        </div>
                    </div>
                </div>

                {/* 3. CENTER: MAIN GAME STAGE */}
                <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
                    <div className="aspect-video md:aspect-[21/9] bg-[#1A1D26] rounded-3xl border border-white/5 relative overflow-hidden shadow-2xl group">

                        {/* Background Grids */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent" />

                        {/* THE GRAPH CANVAS */}
                        <canvas
                            ref={canvasRef}
                            width={800}
                            height={400}
                            className="absolute inset-0 w-full h-full"
                        />

                        {/* MULTIPLIER DISPLAY */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                            {state?.phase === 'BETTING' ? (
                                <div className="text-center space-y-4">
                                    <div className="relative">
                                        <div className="w-32 h-32 rounded-full border-4 border-dashed border-primary/20 animate-spin-slow" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Rocket className="w-12 h-12 text-primary animate-bounce-slow" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-text-tertiary uppercase tracking-[0.2em] mb-1">Décollage dans</div>
                                        <div className="text-5xl font-display font-black text-white">{timeLeft}s</div>
                                    </div>
                                </div>
                            ) : state?.phase === 'FLYING' ? (
                                <div className="text-center scale-150 md:scale-[2]">
                                    <div className="text-6xl md:text-8xl font-display font-black text-white drop-shadow-glow-white tracking-tighter">
                                        {displayMultiplier.toFixed(2)}x
                                    </div>
                                    <div className="mt-2 text-[10px] font-bold text-primary uppercase tracking-[0.3em]">En plein vol...</div>
                                </div>
                            ) : (
                                <div className="text-center animate-in zoom-in duration-300">
                                    <div className="text-sm font-bold text-red-500 uppercase tracking-[0.4em] mb-2">CROQUÉ !</div>
                                    <div className="text-7xl md:text-9xl font-display font-black text-red-500 drop-shadow-glow-red">
                                        {state?.crashPoint?.toFixed(2)}x
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Overlay Decorators */}
                        <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/5">
                            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">LIVE</span>
                        </div>
                    </div>
                </div>

                {/* 4. RIGHT: LIVE BETS */}
                <div className="lg:col-span-1 space-y-4 order-3 overflow-hidden">
                    <div className="bg-[#1A1D26] border border-white/5 rounded-2xl flex flex-col h-[500px] shadow-xl">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-xs font-bold text-text-secondary flex items-center gap-2 uppercase tracking-widest">
                                <Users className="w-4 h-4" /> Paris en Direct
                            </h3>
                            <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] font-bold text-text-tertiary">{liveBets.length}</span>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
                            {liveBets.map((bet, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-xl border transition-all duration-300",
                                        bet.status === 'COMPLETED' ? "bg-green-500/10 border-green-500/20" : "bg-white/5 border-transparent"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-[10px] font-bold text-text-secondary overflow-hidden">
                                            {bet.username[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-[11px] font-bold text-white leading-none mb-1">{bet.username}</div>
                                            <div className="text-[10px] text-text-tertiary font-mono">{bet.amount.toLocaleString()}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {bet.status === 'COMPLETED' ? (
                                            <div className="flex flex-col items-end">
                                                <div className="text-[10px] font-black text-green-400">{bet.multiplier}x</div>
                                                <div className="text-[11px] font-bold text-white">+{bet.payout?.toLocaleString()}</div>
                                            </div>
                                        ) : (
                                            <Loader2 className="w-3 h-3 text-white/20 animate-spin" />
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Mock additional bets for "Live Observer" feel */}
                            {[...Array(5)].map((_, i) => (
                                <div key={`mock-${i}`} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-transparent opacity-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-[10px] font-bold text-text-tertiary">?</div>
                                        <div>
                                            <div className="text-[11px] font-bold text-text-tertiary leading-none mb-1">User_{1234 + i}</div>
                                            <div className="text-[10px] text-text-tertiary font-mono">{(Math.random() * 500 + 100).toFixed(0)}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Loader2 className="w-3 h-3 text-white/10 animate-spin" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Rules / Mobile Info */}
            <div className="bg-[#1A1D26]/50 border border-white/5 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex gap-4 items-start">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white mb-1">Pariez & Observez</h4>
                        <p className="text-xs text-text-tertiary">Placez votre mise et regardez le multiplicateur s'envoler.</p>
                    </div>
                </div>
                <div className="flex gap-4 items-start">
                    <div className="p-3 bg-accent-rose/10 rounded-xl">
                        <Trophy className="w-6 h-6 text-accent-rose" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white mb-1">Encaissez à temps</h4>
                        <p className="text-xs text-text-tertiary">Cliquez sur Cashout avant le crash pour multiplier vos gains.</p>
                    </div>
                </div>
                <div className="flex gap-4 items-start">
                    <div className="p-3 bg-accent-cyan/10 rounded-xl">
                        <ArrowUpRight className="w-6 h-6 text-accent-cyan" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white mb-1">Multi-Joueurs</h4>
                        <p className="text-xs text-text-tertiary">Observez les autres joueurs encaisser leurs gains en temps réel.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
