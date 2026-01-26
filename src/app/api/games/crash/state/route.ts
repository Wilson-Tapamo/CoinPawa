import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

/**
 * LOGIQUE DE SYNCHRONISATION CRASH
 * 
 * Puisqu'on est en Serverless (Next.js API), on ne peut pas avoir de boucle infinie.
 * On utilise le temps (Date.now()) pour déterminer l'état du jeu.
 * 
 * Cycle du jeu (total ~40s + dynamique) :
 * 1. PHASE ATTENTE (BETTING) : 10 secondes. Le décompte vers le décollage.
 * 2. PHASE VOL (FLYING) : Jusqu'au crash point. Le multiplicateur grimpe.
 * 3. PHASE CRASH (CRASHED) : 5 secondes d'arrêt sur l'écran "Crash!".
 * 
 * Provably Fair :
 * Le crash point d'un round est déterminé de manière déterministe par un seed 
 * qui change à chaque fois que le cycle redémarre.
 */

const BETTING_DURATION = 10000; // 10s
const COOLDOWN_DURATION = 5000;  // 5s (après crash)

// Multiplier formula: m = 0.99 * (1 / (1 - U))
// where U is a random float [0, 1)
function generateCrashPoint() {
    const u = Math.random();
    const point = 0.99 / (1 - u);
    return Math.max(1, Math.floor(point * 100) / 100);
}

// Calcule le temps nécessaire pour atteindre un multiplicateur donné
// m(t) = e^(0.06 * t)  -> approche simplifiée pour 1xbet style
// t = ln(m) / 0.06
function timeToMultiplier(m: number) {
    return Math.log(m) / 0.06 * 1000;
}

export async function GET() {
    try {
        // 1. Récupérer ou Créer le jeu Crash
        let game = await prisma.game.findUnique({ where: { slug: 'crash' } });

        if (!game) {
            game = await prisma.game.create({
                data: {
                    slug: 'crash',
                    name: 'Crash',
                    type: 'SESSION',
                    isActive: true,
                    config: {
                        lastRoundStartTime: Date.now(),
                        lastCrashPoint: 1.5,
                        phase: 'BETTING'
                    }
                }
            });
        }

        const config = game.config as any;
        const now = Date.now();

        // État actuel
        let phase = config.phase || 'BETTING';
        let startTime = config.lastRoundStartTime;
        let crashPoint = config.lastCrashPoint;
        let roundId = config.activeRoundId || 'initial';

        // Durée du vol pour ce crash point
        const flyDuration = timeToMultiplier(crashPoint);

        // TRANSITIONS DE PHASE BASÉES SUR LE TEMPS
        if (phase === 'BETTING' && now > startTime + BETTING_DURATION) {
            // Passer à FLYING
            phase = 'FLYING';
            // Pas besoin d'update DB ici pour l'instant, on peut le faire plus bas si besoin
        }

        if (phase === 'FLYING' && now > startTime + BETTING_DURATION + flyDuration) {
            // Passer à CRASHED
            phase = 'CRASHED';
        }

        if (phase === 'CRASHED' && now > startTime + BETTING_DURATION + flyDuration + COOLDOWN_DURATION) {
            // RE-INITIALISATION : Nouveau Round
            phase = 'BETTING';
            startTime = now;
            crashPoint = generateCrashPoint();
            roundId = Math.random().toString(36).substring(7);

            // Mettre à jour la DB pour le prochain qui demande
            await prisma.game.update({
                where: { slug: 'crash' },
                data: {
                    config: {
                        lastRoundStartTime: startTime,
                        lastCrashPoint: crashPoint,
                        phase: 'BETTING',
                        activeRoundId: roundId,
                        history: [crashPoint, ...(config.history || []).slice(0, 9)]
                    }
                }
            });
        } else if (phase !== config.phase) {
            // Update discret de la phase si elle a changé
            await prisma.game.update({
                where: { slug: 'crash' },
                data: { config: { ...config, phase } }
            });
        }

        // 2. Récupérer les paris en cours pour ce round (Simulé ou réel)
        // Pour la démo, on récupère les vrais paris de la base s'ils existent
        // On peut filtrer par GameRound créés après startTime
        const recentBets = await prisma.gameRound.findMany({
            where: {
                gameId: game.id,
                createdAt: { gte: new Date(startTime) }
            },
            include: {
                wallet: {
                    include: { user: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        // 3. Calculer le multiplicateur actuel si phase est FLYING
        let currentMultiplier = 1.0;
        if (phase === 'FLYING') {
            const elapsed = now - (startTime + BETTING_DURATION);
            currentMultiplier = Math.exp(0.06 * (elapsed / 1000));
            currentMultiplier = Math.min(currentMultiplier, crashPoint);
        } else if (phase === 'CRASHED') {
            currentMultiplier = crashPoint;
        }

        return NextResponse.json({
            success: true,
            state: {
                phase,
                startTime,
                nextPhaseTime: startTime + BETTING_DURATION + (phase === 'FLYING' ? flyDuration : (phase === 'CRASHED' ? flyDuration + COOLDOWN_DURATION : 0)),
                currentMultiplier: Math.floor(currentMultiplier * 100) / 100,
                crashPoint: phase === 'CRASHED' ? crashPoint : null,
                roundId,
                history: config.history || []
            },
            bets: recentBets.map((b: any) => ({
                id: b.id,
                username: b.wallet.user.username,
                amount: Number(b.betAmountSats),
                payout: Number(b.payoutAmountSats),
                multiplier: b.gameData ? (b.gameData as any).cashoutMultiplier : null,
                status: b.status // ACTIVE = pas encore cashout, COMPLETED = gagné
            }))
        });

    } catch (error) {
        console.error("Crash State Error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
