import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function POST(request: Request) {
    try {
        const userId = await verifySession()
        if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

        const body = await request.json()
        const { amount } = body // amount: Sats, segment: string (risk level: 'low' | 'medium' | 'high') or specific multiplier?

        // Spin Wheel Logic Simplifiée :
        // Segments: 10x, 2x, 50x, 0x, ...
        // On va faire un mode "Dream Catcher" simplifié
        // Multiplicateurs disponibles : 1x (40%), 2x (30%), 5x (15%), 10x (10%), 20x (5%)

        // Pour simplifier l'UX "Spin Wheel", l'utilisateur mise et lance la roue. Il ne choisit pas de segment "précis" (comme le Crazy Time),
        // ou alors il parie sur une couleur/segment.
        // Approche choisie : "Roue de la Fortune" classique. Mise -> Spin -> Résultat (Multiplicateur aléatoire pondéré).
        // house edge intégré dans les probabilités.

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: "Montant invalide" }, { status: 400 })
        }

        const wallet = await prisma.wallet.findUnique({ where: { userId } })
        if (!wallet) return NextResponse.json({ error: "Wallet introuvable" }, { status: 404 })

        if (wallet.balanceSats < BigInt(amount)) {
            return NextResponse.json({ error: "Fonds insuffisants" }, { status: 400 })
        }

        // RNG Logic (Segments pondérés)
        // Segments virtuels (Total 100)
        // 0x (Perte) : 30%
        // 1.5x : 40%
        // 3x : 20%
        // 10x : 9%
        // 50x : 1%

        const random = Math.random() * 100;
        let multiplier = 0;
        let segmentLabel = "0x";

        // Détermination résultat
        if (random < 30) {
            multiplier = 0;
            segmentLabel = "0x (Try Again)";
        } else if (random < 70) {
            multiplier = 1.5;
            segmentLabel = "1.5x";
        } else if (random < 90) {
            multiplier = 3;
            segmentLabel = "3x";
        } else if (random < 99) {
            multiplier = 10;
            segmentLabel = "10x";
        } else {
            multiplier = 50;
            segmentLabel = "JACKPOT 50x";
        }

        const payout = Math.floor(amount * multiplier);
        const isWin = payout > amount; // On considère Win si on récupère plus que la mise, sinon c'est partiel ou perte? 
        // Ici multiplier 1.5x > 1x donc Win. 0x = Loss.

        const result = await prisma.$transaction(async (tx: any) => {
            const game = await tx.game.upsert({
                where: { slug: 'wheel' },
                update: {},
                create: {
                    slug: 'wheel',
                    name: 'Spin Wheel',
                    type: 'INSTANT',
                    isActive: true,
                    rules: "Tournez la roue pour gagner jusqu'à 50x votre mise !",
                    config: { houseEdge: 0.05 }
                }
            })

            const netChange = BigInt(payout) - BigInt(amount)

            await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    balanceSats: { increment: netChange },
                    totalWageredSats: { increment: amount }
                }
            })

            await tx.gameRound.create({
                data: {
                    walletId: wallet.id,
                    gameId: game.id,
                    betAmountSats: amount,
                    payoutAmountSats: payout,
                    status: 'COMPLETED',
                    gameData: {
                        multiplier,
                        segmentLabel,
                        isWin
                    },
                    clientSeed: "TODO",
                    serverSeedHash: "TODO",
                    nonce: 1
                }
            })

            return { payout, newBalanceStr: (wallet.balanceSats + netChange).toString(), multiplier, segmentLabel, isWin }
        })

        return NextResponse.json({ success: true, result })

    } catch (error) {
        console.error("Wheel error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    }
}
