import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function POST(request: Request) {
    try {
        const userId = await verifySession();
        if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

        const body = await request.json();
        const { amount } = body as { amount: number };

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
        }

        // 1. Récupérer le jeu et son état
        const game = await prisma.game.findUnique({ where: { slug: 'crash' } });
        if (!game) return NextResponse.json({ error: "Jeu Crash non trouvé" }, { status: 404 });

        const config = game.config as any;
        const now = Date.now();
        const startTime = config.lastRoundStartTime;

        // On ne peut parier que pendant la phase BETTING (10s)
        const BETTING_DURATION = 10000;
        if (now > startTime + BETTING_DURATION || config.phase !== 'BETTING') {
            return NextResponse.json({ error: "Les paris sont fermés pour ce round" }, { status: 400 });
        }

        // 2. Vérifier si l'user a déjà parié sur ce round
        const existingBet = await prisma.gameRound.findFirst({
            where: {
                gameId: game.id,
                wallet: { userId },
                createdAt: { gte: new Date(startTime) }
            }
        });

        if (existingBet) {
            return NextResponse.json({ error: "Vous avez déjà parié sur ce round" }, { status: 400 });
        }

        // 3. Valider le solde
        const wallet = await prisma.wallet.findUnique({ where: { userId } });
        if (!wallet || wallet.balanceSats < BigInt(amount)) {
            return NextResponse.json({ error: "Fonds insuffisants" }, { status: 400 });
        }

        // 4. Créer le pari (GameRound)
        const round = await prisma.$transaction(async (tx: any) => {
            // Débiter le wallet
            await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    balanceSats: { decrement: BigInt(amount) },
                    totalWageredSats: { increment: BigInt(amount) }
                }
            });

            // Créer le round "ACTIVE"
            const gameRound = await tx.gameRound.create({
                data: {
                    walletId: wallet.id,
                    gameId: game.id,
                    betAmountSats: BigInt(amount),
                    status: 'ACTIVE',
                    gameData: { roundId: config.activeRoundId },
                    clientSeed: "crash",
                    serverSeedHash: "crash",
                    nonce: 1
                }
            });

            // Log de la mise
            await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'BET',
                    amountSats: BigInt(-amount),
                    paymentRef: `BET_CRASH_${gameRound.id}`,
                    status: 'COMPLETED',
                    metadata: { roundId: gameRound.id, gameSlug: 'crash' }
                }
            })

            return gameRound;
        });

        return NextResponse.json({ success: true, roundId: round.id });

    } catch (error) {
        console.error("Crash Bet Error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
