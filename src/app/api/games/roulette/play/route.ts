import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export async function POST(request: Request) {
    try {
        const userId = await verifySession()
        if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

        const body = await request.json()
        const { bets } = body as { bets: { [key: string]: number } } // e.g., { "7": 100, "red": 500, "1st12": 200 }

        if (!bets || Object.keys(bets).length === 0) {
            return NextResponse.json({ error: "Aucun pari placé" }, { status: 400 })
        }

        const totalBetAmount = Object.values(bets).reduce((acc, val) => acc + val, 0);

        // 2. Wallet Check
        const wallet = await prisma.wallet.findUnique({ where: { userId } })
        if (!wallet) return NextResponse.json({ error: "Portefeuille introuvable" }, { status: 404 })

        if (wallet.balanceSats < BigInt(totalBetAmount)) {
            return NextResponse.json({ error: "Fonds insuffisants" }, { status: 400 })
        }

        // 3. Logic de la Roulette Européenne (0-36)
        const winningNumber = Math.floor(Math.random() * 37);

        const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
        const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

        let winningColor: 'red' | 'black' | 'green' = 'green';
        if (RED_NUMBERS.includes(winningNumber)) winningColor = 'red';
        else if (BLACK_NUMBERS.includes(winningNumber)) winningColor = 'black';

        // Calcul des gains
        let totalPayout = 0;
        const betResults: any[] = [];

        for (const [betType, amount] of Object.entries(bets)) {
            let isWin = false;
            let multiplier = 0;

            // Simple Numbers (0-36)
            if (!isNaN(Number(betType))) {
                if (Number(betType) === winningNumber) {
                    isWin = true;
                    multiplier = 36;
                }
            }
            // Colors
            else if (betType === 'red' && winningColor === 'red') { isWin = true; multiplier = 2; }
            else if (betType === 'black' && winningColor === 'black') { isWin = true; multiplier = 2; }
            else if (betType === 'green' && winningColor === 'green') { isWin = true; multiplier = 36; }

            // Halves
            else if (betType === '1-18' && winningNumber >= 1 && winningNumber <= 18) { isWin = true; multiplier = 2; }
            else if (betType === '19-36' && winningNumber >= 19 && winningNumber <= 36) { isWin = true; multiplier = 2; }

            // Even/Odd
            else if (betType === 'even' && winningNumber !== 0 && winningNumber % 2 === 0) { isWin = true; multiplier = 2; }
            else if (betType === 'odd' && winningNumber !== 0 && winningNumber % 2 !== 0) { isWin = true; multiplier = 2; }

            // Dozens
            else if (betType === '1st12' && winningNumber >= 1 && winningNumber <= 12) { isWin = true; multiplier = 3; }
            else if (betType === '2nd12' && winningNumber >= 13 && winningNumber <= 24) { isWin = true; multiplier = 3; }
            else if (betType === '3rd12' && winningNumber >= 25 && winningNumber <= 36) { isWin = true; multiplier = 3; }

            // Columns
            else if (betType === 'col1' && winningNumber !== 0 && winningNumber % 3 === 1) { isWin = true; multiplier = 3; }
            else if (betType === 'col2' && winningNumber !== 0 && winningNumber % 3 === 2) { isWin = true; multiplier = 3; }
            else if (betType === 'col3' && winningNumber !== 0 && winningNumber % 3 === 0) { isWin = true; multiplier = 3; }

            const payout = isWin ? Math.floor(amount * multiplier) : 0;
            totalPayout += payout;

            betResults.push({
                type: betType,
                amount,
                isWin,
                payout,
                multiplier
            });
        }

        // 4. Transaction
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const game = await tx.game.upsert({
                where: { slug: 'roulette' },
                update: {},
                create: {
                    slug: 'roulette',
                    name: 'Roulette',
                    type: 'INSTANT',
                    isActive: true,
                    rules: "Roulette européenne complète avec tous les types de paris.",
                    config: { houseEdge: 0.027 }
                }
            })

            // 1. Débiter la mise
            const updatedWalletAfterBet = await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    balanceSats: { decrement: BigInt(totalBetAmount) },
                    totalWageredSats: { increment: totalBetAmount }
                }
            })

            // 2. Créer le round
            const round = await tx.gameRound.create({
                data: {
                    walletId: wallet.id,
                    gameId: game.id,
                    betAmountSats: totalBetAmount,
                    payoutAmountSats: totalPayout,
                    status: 'COMPLETED',
                    gameData: {
                        winningNumber,
                        winningColor,
                        bets,
                        betResults,
                        totalPayout
                    } as any,
                    clientSeed: "roulette",
                    serverSeedHash: "roulette",
                    nonce: 1
                }
            })

            // 3. Log de la mise
            await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'BET',
                    amountSats: BigInt(-totalBetAmount),
                    paymentRef: `BET_ROULETTE_${round.id}`,
                    status: 'COMPLETED',
                    metadata: { roundId: round.id, gameSlug: 'roulette' }
                }
            })

            let finalWallet = updatedWalletAfterBet;

            // 4. Créditer le gain si présent
            if (totalPayout > 0) {
                finalWallet = await tx.wallet.update({
                    where: { id: wallet.id },
                    data: {
                        balanceSats: { increment: BigInt(totalPayout) }
                    }
                })

                await tx.transaction.create({
                    data: {
                        walletId: wallet.id,
                        type: 'WIN',
                        amountSats: BigInt(totalPayout),
                        paymentRef: `WIN_ROULETTE_${round.id}`,
                        status: 'COMPLETED',
                        metadata: { roundId: round.id, gameSlug: 'roulette' }
                    }
                })
            }

            return { updatedWallet: finalWallet, round, winningNumber, winningColor, totalPayout }
        })

        return NextResponse.json({
            success: true,
            result: {
                number: result.winningNumber,
                color: result.winningColor,
                payout: result.totalPayout,
                newBalance: result.updatedWallet.balanceSats.toString()
            }
        })

    } catch (error) {
        console.error("Roulette error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    }
}
