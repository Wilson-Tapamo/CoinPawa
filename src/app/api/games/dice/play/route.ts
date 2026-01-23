import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function POST(request: Request) {
    try {
        // 1. Auth & Validation
        const userId = await verifySession()
        if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

        const body = await request.json()
        const { amount, prediction } = body // amount in Sats/USD (integers), prediction: 'even' | 'odd'

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: "Montant invalide" }, { status: 400 })
        }
        if (!['even', 'odd'].includes(prediction)) {
            return NextResponse.json({ error: "Prédiction invalide (even/odd requis)" }, { status: 400 })
        }

        // 2. Récupération du Wallet
        const wallet = await prisma.wallet.findUnique({ where: { userId } })
        if (!wallet) return NextResponse.json({ error: "Wallet introuvable" }, { status: 404 })

        if (wallet.balanceSats < BigInt(amount)) {
            return NextResponse.json({ error: "Fonds insuffisants" }, { status: 400 })
        }

        // 3. Logique du Jeu (RNG)
        // Simulation d'un dé à 6 faces
        const roll = Math.floor(Math.random() * 6) + 1 // 1 à 6
        const isEven = roll % 2 === 0
        const isWin = (prediction === 'even' && isEven) || (prediction === 'odd' && !isEven)

        // Multiplicateur : x1.96 (Exemple classique avec marche de 4%)
        const multiplier = 1.96
        const payout = isWin ? Math.floor(amount * multiplier) : 0

        // 4. Transaction DB (Atomique)
        const result = await prisma.$transaction(async (tx: any) => {
            // A. Assurer que le jeu "Dice" existe
            const game = await tx.game.upsert({
                where: { slug: 'dice' },
                update: {},
                create: {
                    slug: 'dice',
                    name: 'Dice',
                    type: 'INSTANT',
                    isActive: true,
                    rules: "Devinez si le dé tombera sur un nombre Pair ou Impair.",
                    config: { houseEdge: 0.04 }
                }
            })

            // B. Debit (Mise)
            // On déduit la mise quoi qu'il arrive
            // Si victoire, on recrédite (Mise + Gain) ou juste le Gain ? 
            // Standard : On débite la mise, et on crédite le Payout total (Mise * Multiplier)

            // 1. Update Wallet (Debit mise + Credit win)
            const netChange = BigInt(payout) - BigInt(amount)

            const updatedWallet = await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    balanceSats: { increment: netChange },
                    totalWageredSats: { increment: amount }
                }
            })

            // 2. Create GameRound
            const round = await tx.gameRound.create({
                data: {
                    walletId: wallet.id,
                    gameId: game.id,
                    betAmountSats: amount,
                    payoutAmountSats: payout,
                    status: 'COMPLETED',
                    gameData: {
                        roll,
                        prediction,
                        isWin,
                        multiplier
                    },
                    clientSeed: "TODO", // Pour phase Provably Fair plus tard
                    serverSeedHash: "TODO",
                    nonce: 1 // TODO: Incrementer nonce
                }
            })

            return { updatedWallet, round, roll, isWin, payout }
        })

        return NextResponse.json({
            success: true,
            result: {
                roll: result.roll,
                isWin: result.isWin,
                payout: result.payout,
                newBalance: result.updatedWallet.balanceSats.toString()
            }
        })

    } catch (error) {
        console.error("Dice error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    }
}
