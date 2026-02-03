import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
        const userId = await verifySession()
        if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

        const body = await request.json()
        const { amount } = body

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: "Montant invalide" }, { status: 400 })
        }

        const wallet = await prisma.wallet.findUnique({ where: { userId } })
        if (!wallet) return NextResponse.json({ error: "Wallet introuvable" }, { status: 404 })

        if (wallet.balanceSats < BigInt(amount)) {
            return NextResponse.json({ error: "Fonds insuffisants" }, { status: 400 })
        }

        // RNG Logic: 3 numbers between 1 and 9
        const numbers = [
            Math.floor(Math.random() * 9) + 1,
            Math.floor(Math.random() * 9) + 1,
            Math.floor(Math.random() * 9) + 1
        ];

        // Match Logic
        let matches = 0;
        if (numbers[0] === numbers[1] && numbers[1] === numbers[2]) {
            matches = 3;
        } else if (numbers[0] === numbers[1] || numbers[1] === numbers[2] || numbers[0] === numbers[2]) {
            matches = 2;
        }

        let multiplier = 0;
        if (matches === 3) multiplier = 100;
        else if (matches === 2) multiplier = 5;

        const payout = Math.floor(amount * multiplier);
        const isWin = payout > 0;

        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const game = await tx.game.upsert({
                where: { slug: 'lottery' },
                update: {},
                create: {
                    slug: 'lottery',
                    name: 'Loterie Rapide',
                    type: 'INSTANT',
                    isActive: true,
                    rules: "Alignez 3 chiffres identiques pour gagner 100x votre mise !",
                    config: { houseEdge: 0.1 }
                }
            })

            // 1. Débiter la mise
            const updatedWalletAfterBet = await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    balanceSats: { decrement: BigInt(amount) },
                    totalWageredSats: { increment: amount }
                }
            })

            // 2. Créer le round
            const round = await tx.gameRound.create({
                data: {
                    walletId: wallet.id,
                    gameId: game.id,
                    betAmountSats: amount,
                    payoutAmountSats: payout,
                    status: 'COMPLETED',
                    gameData: {
                        numbers,
                        matches,
                        multiplier,
                        isWin
                    },
                    clientSeed: "lottery",
                    serverSeedHash: "lottery",
                    nonce: 1
                }
            })

            // 3. Log de la mise
            await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'BET',
                    amountSats: BigInt(-amount),
                    paymentRef: `BET_LOTTERY_${round.id}`,
                    status: 'COMPLETED',
                    metadata: { roundId: round.id, gameSlug: 'lottery' }
                }
            })

            let finalWallet = updatedWalletAfterBet;

            // 4. Créditer le gain si présent
            if (payout > 0) {
                finalWallet = await tx.wallet.update({
                    where: { id: wallet.id },
                    data: {
                        balanceSats: { increment: BigInt(payout) }
                    }
                })

                await tx.transaction.create({
                    data: {
                        walletId: wallet.id,
                        type: 'WIN',
                        amountSats: BigInt(payout),
                        paymentRef: `WIN_LOTTERY_${round.id}`,
                        status: 'COMPLETED',
                        metadata: { roundId: round.id, gameSlug: 'lottery' }
                    }
                })
            }

            return {
                payout,
                newBalanceStr: finalWallet.balanceSats.toString(),
                multiplier,
                numbers,
                isWin
            }
        })

        return NextResponse.json({ success: true, result })

    } catch (error) {
        console.error("Lottery error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    }
}
