import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * LOGIQUE LOTO HORAIRE
 * Tirage toutes les heures pile (ex: 14:00, 15:00)
 */

function getNextDrawTime() {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d.getTime();
}

function generateLotoNumbers() {
    const nums: number[] = [];
    while (nums.length < 5) {
        const n = Math.floor(Math.random() * 36) + 1;
        if (!nums.includes(n)) nums.push(n);
    }
    return nums.sort((a, b) => a - b);
}

function calculateMatches(selection: number[], winning: number[]) {
    return selection.filter(n => winning.includes(n)).length;
}

export async function GET() {
    try {
        const userId = await verifySession();

        // 1. Récupérer ou Créer le jeu Loto
        let game = await prisma.game.findUnique({ where: { slug: 'loto' } });

        if (!game) {
            game = await prisma.game.create({
                data: {
                    slug: 'loto',
                    name: 'La Loto',
                    type: 'SESSION',
                    isActive: true,
                    rules: "Choisissez 5 numéros (1-36). Tirage toutes les heures pile !",
                    config: {
                        nextDrawTime: getNextDrawTime(),
                        history: []
                    }
                }
            });
        }

        const config = game.config as any;
        const now = Date.now();
        let nextDrawTime = config.nextDrawTime;

        // 2. VÉRIFIER SI TIRAGE NÉCESSAIRE
        if (now > nextDrawTime) {
            const currentDrawId = nextDrawTime.toString();
            const winningNumbers = generateLotoNumbers();

            // Perform draw in transaction
            await prisma.$transaction(async (tx: any) => {
                // A. Trouver tous les paris pour ce tirage
                const participants = await tx.gameRound.findMany({
                    where: {
                        gameId: game!.id,
                        status: 'ACTIVE',
                        createdAt: { lt: new Date(nextDrawTime) }
                    }
                });

                // B. Calculer gains et mettre à jour
                for (const bet of participants) {
                    const selection = (bet.gameData as any).selection;
                    const matches = calculateMatches(selection, winningNumbers);

                    let multiplier = 0;
                    if (matches === 5) multiplier = 5000;
                    else if (matches === 4) multiplier = 100;
                    else if (matches === 3) multiplier = 10;
                    else if (matches === 2) multiplier = 2;

                    const payout = BigInt(Math.floor(Number(bet.betAmountSats) * multiplier));

                    // Mettre à jour le round
                    await tx.gameRound.update({
                        where: { id: bet.id },
                        data: {
                            status: 'COMPLETED',
                            payoutAmountSats: payout,
                            gameData: {
                                ...(bet.gameData as any),
                                winningNumbers,
                                matches,
                                multiplier
                            }
                        }
                    });

                    // Créditer le wallet si gagné
                    if (payout > 0) {
                        await tx.wallet.update({
                            where: { id: bet.walletId },
                            data: { balanceSats: { increment: payout } }
                        });

                        await tx.transaction.create({
                            data: {
                                walletId: bet.walletId,
                                type: 'WIN',
                                amountSats: payout,
                                paymentRef: `WIN_LOTO_${bet.id}`,
                                status: 'COMPLETED',
                                metadata: { roundId: bet.id, gameSlug: 'loto' }
                            }
                        });
                    }
                }

                // C. Mettre à jour l'état du jeu pour la prochaine heure
                const newDrawTime = getNextDrawTime();
                const drawRecord = {
                    drawId: currentDrawId,
                    numbers: winningNumbers,
                    time: nextDrawTime
                };

                await tx.game.update({
                    where: { id: game!.id },
                    data: {
                        config: {
                            ...config,
                            nextDrawTime: newDrawTime,
                            lastWinningNumbers: winningNumbers,
                            history: [drawRecord, ...(config.history || []).slice(0, 9)]
                        }
                    }
                });

                // Update local variables for response
                nextDrawTime = newDrawTime;
            });

            // Refetch game to get updated config after transaction
            game = await prisma.game.findUnique({ where: { slug: 'loto' } });
        }

        // 3. Récupérer les tickets de l'utilisateur pour le tirage en cours
        let myTickets = [];
        if (userId) {
            myTickets = await prisma.gameRound.findMany({
                where: {
                    gameId: game!.id,
                    wallet: { userId },
                    status: 'ACTIVE',
                    createdAt: { gte: new Date(now - 3600000) } // Safety window
                },
                orderBy: { createdAt: 'desc' }
            });
        }

        const updatedConfig = game!.config as any;

        return NextResponse.json({
            success: true,
            state: {
                nextDrawTime: updatedConfig.nextDrawTime,
                lastWinningNumbers: updatedConfig.lastWinningNumbers || [],
                history: updatedConfig.history || [],
                serverTime: Date.now()
            },
            myTickets: myTickets.map((t: any) => ({
                id: t.id,
                selection: t.gameData.selection,
                amount: Number(t.betAmountSats),
                createdAt: t.createdAt
            }))
        });

    } catch (error) {
        console.error("Loto State Error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
