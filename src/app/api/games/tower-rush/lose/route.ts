import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export async function POST(request: Request) {
    try {
        const userId = await verifySession()
        if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

        const body = await request.json()
        const { amount, floorsClimbed } = body

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: "Montant invalide" }, { status: 400 })
        }

        const wallet = await prisma.wallet.findUnique({ where: { userId } })
        if (!wallet) return NextResponse.json({ error: "Wallet introuvable" }, { status: 404 })

        if (wallet.balanceSats < BigInt(amount)) {
            return NextResponse.json({ error: "Fonds insuffisants" }, { status: 400 })
        }

        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const game = await tx.game.upsert({
                where: { slug: 'tower-rush' },
                update: {},
                create: {
                    slug: 'tower-rush',
                    name: 'Tower Rush',
                    type: 'INSTANT',
                    isActive: true,
                    rules: "Montez la tour étage par étage. Chaque porte peut être piégée. Encaissez vos gains ou risquez tout !",
                    config: { houseEdge: 0.05 }
                }
            })

            // Débiter la mise (perte totale)
            const finalWallet = await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    balanceSats: { decrement: BigInt(amount) },
                    totalWageredSats: { increment: amount }
                }
            })

            // Créer le round (perte)
            const round = await tx.gameRound.create({
                data: {
                    walletId: wallet.id,
                    gameId: game.id,
                    betAmountSats: amount,
                    payoutAmountSats: 0,
                    status: 'COMPLETED',
                    gameData: {
                        multiplier: 0,
                        floorsClimbed: floorsClimbed || 0,
                        isWin: false
                    },
                    clientSeed: "tower-rush",
                    serverSeedHash: "tower-rush",
                    nonce: 1
                }
            })

            // Log de la mise
            await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'BET',
                    amountSats: BigInt(-amount),
                    paymentRef: `BET_TOWER_LOSS_${round.id}`,
                    status: 'COMPLETED',
                    metadata: { roundId: round.id, gameSlug: 'tower-rush' }
                }
            })

            return { payout: 0, newBalanceStr: finalWallet.balanceSats.toString(), multiplier: 0, floorsClimbed, isWin: false }
        })

        return NextResponse.json({ success: true, result })

    } catch (error) {
        console.error("Tower Rush loss error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    }
}
