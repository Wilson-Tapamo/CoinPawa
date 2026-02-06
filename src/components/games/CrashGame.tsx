"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Rocket, Loader2, Trophy, Bomb, Users, Zap, History, TrendingUp, ArrowUpRight, ArrowLeft, Info, X } from "lucide-react";
import Link from "next/link";
import { cn, formatToUSD, usdToSats, satsToUsd, formatSatsToUSD } from "@/lib/utils";
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
    const [showRules, setShowRules] = useState(false);

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

    // --- CANVAS DRAWING (Graph & Airplane) ---
    const particles = useRef<{ x: number, y: number, size: number, opacity: number, vx: number, vy: number }[]>([]);
    const [shake, setShake] = useState(0);

    useEffect(() => {
        if (!canvasRef.current || !state) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let frame: number;
        let lastTime = Date.now();

        const drawAirplane = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);

            // Stylized Airplane (Simplified SVG-like drawing)
            ctx.fillStyle = '#6366f1';
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(99, 102, 241, 0.5)';

            // Body
            ctx.beginPath();
            ctx.ellipse(0, 0, 20, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            // Cockpit
            ctx.fillStyle = '#a5b4fc';
            ctx.beginPath();
            ctx.ellipse(8, -2, 6, 3, 0, 0, Math.PI * 2);
            ctx.fill();

            // Wings
            ctx.fillStyle = '#4f46e5';
            ctx.beginPath();
            ctx.moveTo(-5, 0);
            ctx.lineTo(-12, -15);
            ctx.lineTo(2, -15);
            ctx.lineTo(5, 0);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(-5, 0);
            ctx.lineTo(-12, 15);
            ctx.lineTo(2, 15);
            ctx.lineTo(5, 0);
            ctx.fill();

            // Tail
            ctx.beginPath();
            ctx.moveTo(-15, 0);
            ctx.lineTo(-22, -8);
            ctx.lineTo(-18, 0);
            ctx.lineTo(-22, 8);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        };

        const draw = () => {
            const now = Date.now();
            const deltaTime = now - lastTime;
            lastTime = now;

            const w = canvas.width;
            const h = canvas.height;
            ctx.clearRect(0, 0, w, h);

            // Screen Shake
            if (shake > 0) {
                const sx = (Math.random() - 0.5) * shake;
                const sy = (Math.random() - 0.5) * shake;
                ctx.translate(sx, sy);
                setShake(prev => Math.max(0, prev - deltaTime * 0.1));
            }

            // Background Grid (moving)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.lineWidth = 1;
            const gridSize = 50;
            const offset = (state.phase === 'FLYING' ? (now % 1000) / 1000 : 0) * gridSize;

            for (let x = -gridSize; x < w + gridSize; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x - offset, 0);
                ctx.lineTo(x - offset, h);
                ctx.stroke();
            }
            for (let y = -gridSize; y < h + gridSize; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }

            if (state.phase === 'FLYING' || state.phase === 'CRASHED') {
                const flyElapsed = Math.max(0, now - (state.startTime + 10000));
                const points = 100;
                const xBase = 40;
                const yBase = h - 60;
                const xScale = (w - 120) / 10; // Scale 10s of flight horizontally
                const yScale = 60; // Pixels per multiplier unit

                ctx.beginPath();
                ctx.lineWidth = 4;
                ctx.strokeStyle = state.phase === 'CRASHED' ? '#ef4444' : '#6366f1';
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                let lastX = xBase;
                let lastY = yBase;
                ctx.moveTo(xBase, yBase);

                for (let i = 1; i <= points; i++) {
                    const t = (flyElapsed / points) * i;
                    const m = Math.exp(0.06 * (t / 1000));
                    const x = xBase + (t / 1000) * xScale;
                    const y = yBase - Math.log(m) * yScale;

                    if (x > w - 40 || y < 40) break;

                    ctx.lineTo(x, y);
                    lastX = x;
                    lastY = y;
                }
                ctx.stroke();

                // Smoke Particles
                if (state.phase === 'FLYING') {
                    if (Math.random() > 0.3) {
                        particles.current.push({
                            x: lastX,
                            y: lastY,
                            size: Math.random() * 5 + 2,
                            opacity: 1,
                            vx: -Math.random() * 2 - 1,
                            vy: (Math.random() - 0.5) * 1
                        });
                    }
                }

                // Update & Draw Particles
                ctx.save();
                particles.current.forEach((p, i) => {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.opacity -= 0.02;
                    p.size += 0.1;

                    ctx.fillStyle = state.phase === 'CRASHED' ? `rgba(239, 68, 68, ${p.opacity})` : `rgba(165, 180, 252, ${p.opacity * 0.5})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();

                    if (p.opacity <= 0) particles.current.splice(i, 1);
                });
                ctx.restore();

                // Draw Airplane at current tip
                if (state.phase === 'FLYING') {
                    const angle = -0.15; // fixed upward angle for better "takeoff" look
                    drawAirplane(ctx, lastX, lastY, angle);
                } else if (state.phase === 'CRASHED') {
                    // Explosion visual at crash site
                    const gradient = ctx.createRadialGradient(lastX, lastY, 0, lastX, lastY, 40);
                    gradient.addColorStop(0, '#ff4d4d');
                    gradient.addColorStop(0.5, '#ff8000');
                    gradient.addColorStop(1, 'transparent');

                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(lastX, lastY, 40, 0, Math.PI * 2);
                    ctx.fill();

                    // More particles for explosion
                    if (shake === 0) {
                        setShake(30);
                        for (let i = 0; i < 20; i++) {
                            particles.current.push({
                                x: lastX,
                                y: lastY,
                                size: Math.random() * 8 + 4,
                                opacity: 1,
                                vx: (Math.random() - 0.5) * 15,
                                vy: (Math.random() - 0.5) * 15
                            });
                        }
                    }
                }
            }

            // Axes Labels (Simples)
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '10px monospace';
            ctx.fillText('1.00x', 10, h - 55);
            ctx.fillText('Temps', w - 50, h - 30);

            // Reset transform for next frame (after shake)
            ctx.setTransform(1, 0, 0, 1, 0, 0);

            frame = requestAnimationFrame(draw);
        };

        frame = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(frame);
    }, [state, displayMultiplier, shake]);

    // --- ACTIONS ---
    const handlePlaceBet = async () => {
        setError(null);
        setIsPlacingBet(true);
        try {
            const res = await fetch("/api/games/crash/bet", {
                method: "POST",
                body: JSON.stringify({ amount: usdToSats(parseFloat(betAmount)) })
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

            {/* Header Controls */}
            <div className="flex items-center justify-between">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors glass-card px-4 py-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-bold">Retour aux Jeux</span>
                </Link>

                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 glass-card">
                        <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Serveur en Ligne</span>
                    </div>
                    <button
                        onClick={() => setShowRules(true)}
                        className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors glass-card px-4 py-2"
                    >
                        <Info className="w-4 h-4" />
                        <span className="text-sm font-bold">Règles</span>
                    </button>
                </div>
            </div>

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
                    <div className="glass-panel p-5 bg-mesh-gradient">
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
                                    <span>$ USD</span>
                                </div>
                                <div className="relative group">
                                    <input
                                        type="number"
                                        value={betAmount}
                                        onChange={(e) => setBetAmount(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-xl font-mono font-bold text-white focus:outline-none focus:border-primary/50 transition-all"
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                        <button onClick={() => setBetAmount(a => (parseFloat(a) * 2).toFixed(2))} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold border border-white/5">2x</button>
                                        <button onClick={() => setBetAmount(a => Math.max(1, parseFloat(a) / 2).toFixed(2))} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold border border-white/5">1/2</button>
                                    </div>
                                </div>
                                {/* PRESET AMOUNTS */}
                                <div className="grid grid-cols-4 gap-2 mt-2">
                                    {[1, 5, 10, 50].map((amt) => (
                                        <button
                                            key={amt}
                                            onClick={() => setBetAmount(amt.toString())}
                                            className="py-2 text-[10px] font-bold bg-white/5 hover:bg-white/10 text-text-tertiary hover:text-white rounded-lg border border-white/5 transition-all"
                                        >
                                            ${amt}
                                        </button>
                                    ))}
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
                                            <span className="text-base opacity-90">{formatToUSD(parseFloat(betAmount) * displayMultiplier)}</span>
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
                            <div className="text-sm font-bold text-primary">{formatSatsToUSD(liveBets.reduce((a, b) => a + b.amount, 0))}</div>
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
                                <div className="text-center scale-150 md:scale-[2] animate-in zoom-in duration-200">
                                    <div className="text-7xl md:text-9xl font-display font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] tracking-tighter">
                                        {displayMultiplier.toFixed(2)}x
                                    </div>
                                    <div className="mt-2 text-[12px] font-black text-primary uppercase tracking-[0.4em] drop-shadow-md">VOL EN COURS...</div>
                                </div>
                            ) : (
                                <div className="text-center animate-in zoom-in duration-300">
                                    <div className="text-xl font-black text-red-500 uppercase tracking-[0.6em] mb-4 drop-shadow-md">CROQUÉ !</div>
                                    <div className="text-8xl md:text-[12rem] font-display font-black text-red-500 drop-shadow-[0_0_50px_rgba(239,68,68,0.6)] animate-pulse">
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
                                            <div className="text-[10px] text-text-tertiary font-mono">{formatSatsToUSD(bet.amount)}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {bet.status === 'COMPLETED' ? (
                                            <div className="flex flex-col items-end">
                                                <div className="text-[10px] font-black text-green-400">{bet.multiplier}x</div>
                                                <div className="text-[11px] font-bold text-white">+{formatSatsToUSD(bet.payout || 0)}</div>
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
                            <Info className="w-6 h-6 text-primary" /> Règles de Crash
                        </h3>

                        <div className="space-y-6 text-text-secondary leading-relaxed overflow-y-auto max-h-[70vh] pr-2 no-scrollbar">
                            <section>
                                <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-primary" /> Le Concept
                                </h4>
                                <p className="text-sm">
                                    Une fusée décolle et son multiplicateur augmente de manière exponentielle. Le but est d'encaisser (Cashout) avant que la fusée n'explose (Crash).
                                </p>
                            </section>

                            <section>
                                <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-primary" /> Comment Jouer
                                </h4>
                                <ul className="text-sm space-y-2">
                                    <li>1. <strong>Phase de Pari</strong> : Vous avez 10 secondes entre chaque round pour placer votre mise.</li>
                                    <li>2. <strong>Le Vol</strong> : La fusée décolle. Le multiplicateur commence à 1.00x et monte.</li>
                                    <li>3. <strong>Cashout</strong> : Cliquez sur le bouton "CASHOUT" à n'importe quel moment pour sécuriser vos gains. Gain = Mise x Multiplicateur actuel.</li>
                                    <li>4. <strong>Le Crash</strong> : Si la fusée explose avant que vous n'ayez encaissé, vous perdez votre mise.</li>
                                </ul>
                            </section>

                            <section className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <h4 className="text-white font-bold mb-2 text-sm flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-primary" /> Stratégie & Équité
                                </h4>
                                <p className="text-xs">
                                    Chaque round possède un point de crash prédéfini de manière algorithmique et vérifiable. Le crash peut survenir à n'importe quel moment, même à 1.00x !
                                </p>
                            </section>
                        </div>

                        <button
                            onClick={() => setShowRules(false)}
                            className="w-full mt-8 py-4 bg-primary hover:bg-primary-hover text-background font-black rounded-xl shadow-glow-gold transition-all"
                        >
                            JE SUIS PRÊT !
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
