import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function POST() {
    try {
        const userId = await verifySession();
        if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

        // 1. Récupérer le jeu et son état
        const game = await prisma.game.findUnique({ where: { slug: 'crash' } });
        if (!game) return NextResponse.json({ error: "Jeu Crash non trouvé" }, { status: 404 });

        const config = game.config as any;
        const now = Date.now();
        const startTime = config.lastRoundStartTime;
        const BETTING_DURATION = 10000;

        if (config.phase !== 'FLYING') {
            return NextResponse.json({ error: "L'avion n'est pas en vol" }, { status: 400 });
        }

        // 2. Calculer le multiplicateur actuel
        const elapsed = now - (startTime + BETTING_DURATION);
        const currentMultiplier = Math.exp(0.06 * (elapsed / 1000));
        const crashPoint = config.lastCrashPoint;

        // VÉRIFIER SI CRASHÉ
        // On vérifie une deuxième fois côté serveur par rapport au point réel
        if (currentMultiplier >= crashPoint) {
            return NextResponse.json({ error: "CRASHÉ! Trop tard" }, { status: 400 });
        }

        // 3. Trouver le pari actif de l'utilisateur
        const activeBet = await prisma.gameRound.findFirst({
            where: {
                gameId: game.id,
                wallet: { userId },
                status: 'ACTIVE',
                createdAt: { gte: new Date(startTime) }
            },
            include: { wallet: true }
        });

        if (!activeBet) {
            return NextResponse.json({ error: "Aucun pari actif trouvé pour ce round" }, { status: 400 });
        }

        // 4. Calculer le gain
        const multiplier = Math.floor(currentMultiplier * 100) / 100;
        const payout = BigInt(Math.floor(Number(activeBet.betAmountSats) * multiplier));

        // 5. Transaction DB
        const result = await prisma.$transaction(async (tx: any) => {
            // Mettre à jour le statut du round
            const updatedRound = await tx.gameRound.update({
                where: { id: activeBet.id },
                data: {
                    status: 'COMPLETED',
                    payoutAmountSats: payout,
                    gameData: {
                        ...(activeBet.gameData as any),
                        cashoutMultiplier: multiplier,
                        crashedAt: crashPoint
                    }
                }
            });

            // Créditer le wallet
            const updatedWallet = await tx.wallet.update({
                where: { id: activeBet.walletId },
                data: {
                    balanceSats: { increment: payout }
                }
            });

            // Log du gain
            await tx.transaction.create({
                data: {
                    walletId: activeBet.walletId,
                    type: 'WIN',
                    amountSats: payout,
                    paymentRef: `WIN_CRASH_${updatedRound.id}`,
                    status: 'COMPLETED',
                    metadata: { roundId: updatedRound.id, gameSlug: 'crash' }
                }
            })

            return { updatedRound, updatedWallet };
        });

        return NextResponse.json({
            success: true,
            payout: result.updatedRound.payoutAmountSats.toString(),
            multiplier,
            newBalance: result.updatedWallet.balanceSats.toString()
        });

    } catch (error) {
        console.error("Crash Cashout Error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
