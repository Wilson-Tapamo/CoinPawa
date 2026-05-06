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
        // amount: mise en Sats
        // floorsClimbed: nombre d'étages montés (1 à 10)

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: "Montant invalide" }, { status: 400 })
        }

        if (!floorsClimbed || floorsClimbed < 1 || floorsClimbed > 10) {
            return NextResponse.json({ error: "Nombre d'étages invalide" }, { status: 400 })
        }

        const wallet = await prisma.wallet.findUnique({ where: { userId } })
        if (!wallet) return NextResponse.json({ error: "Wallet introuvable" }, { status: 404 })

        if (wallet.balanceSats < BigInt(amount)) {
            return NextResponse.json({ error: "Fonds insuffisants" }, { status: 400 })
        }

        // Tower Rush Logic:
        // À chaque étage, le joueur choisit une porte (gauche ou droite).
        // Une des portes est piégée (probabilité de tomber).
        // Le multiplicateur augmente à chaque étage réussi.
        // Multiplicateurs par étage:
        // 1: 1.2x, 2: 1.5x, 3: 1.9x, 4: 2.5x, 5: 3.3x
        // 6: 4.5x, 7: 6.5x, 8: 10x, 9: 16x, 10: 30x

        const MULTIPLIERS = [1.2, 1.5, 1.9, 2.5, 3.3, 4.5, 6.5, 10, 16, 30]

        // Le joueur a déjà monté X étages (front-end gère le choix).
        // Ce endpoint est appelé au cashout (le joueur a survécu à N étages).
        const multiplier = MULTIPLIERS[floorsClimbed - 1] || 1
        const payout = Math.floor(amount * multiplier)
        const isWin = true // Si on arrive ici, le joueur a survécu et cashout

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
                        multiplier,
                        floorsClimbed,
                        isWin
                    },
                    clientSeed: "tower-rush",
                    serverSeedHash: "tower-rush",
                    nonce: 1
                }
            })

            // 3. Log de la mise
            await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'BET',
                    amountSats: BigInt(-amount),
                    paymentRef: `BET_TOWER_${round.id}`,
                    status: 'COMPLETED',
                    metadata: { roundId: round.id, gameSlug: 'tower-rush' }
                }
            })

            let finalWallet = updatedWalletAfterBet;

            // 4. Créditer le gain
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
                        paymentRef: `WIN_TOWER_${round.id}`,
                        status: 'COMPLETED',
                        metadata: { roundId: round.id, gameSlug: 'tower-rush' }
                    }
                })
            }

            return { payout, newBalanceStr: finalWallet.balanceSats.toString(), multiplier, floorsClimbed, isWin }
        })

        return NextResponse.json({ success: true, result })

    } catch (error) {
        console.error("Tower Rush error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    }
}
