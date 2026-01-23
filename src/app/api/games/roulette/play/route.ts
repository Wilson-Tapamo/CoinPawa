import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function POST(request: Request) {
    try {
        // 1. Auth & Validation
        const userId = await verifySession()
        if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

        const body = await request.json()
        const { amount, color } = body // amount in Sats/USD, color: 'red' | 'black' | 'green'

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: "Montant invalide" }, { status: 400 })
        }
        if (!['red', 'black', 'green'].includes(color)) {
            return NextResponse.json({ error: "Couleur invalide (red/black/green)" }, { status: 400 })
        }

        // 2. Wallet Check
        const wallet = await prisma.wallet.findUnique({ where: { userId } })
        if (!wallet) return NextResponse.json({ error: "Wallet introuvable" }, { status: 404 })

        if (wallet.balanceSats < BigInt(amount)) {
            return NextResponse.json({ error: "Fonds insuffisants" }, { status: 400 })
        }

        // 3. Game Logic (European Roulette: 0-36)
        // 0 = Green
        // 1-10, 19-28: Odd=Red, Even=Black
        // 11-18, 29-36: Odd=Black, Even=Red
        // Simplification pour l'instant : Array mapping
        const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
        const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

        const winningNumber = Math.floor(Math.random() * 37); // 0 to 36

        let winningColor = 'green';
        if (RED_NUMBERS.includes(winningNumber)) winningColor = 'red';
        else if (BLACK_NUMBERS.includes(winningNumber)) winningColor = 'black';

        const isWin = color === winningColor;

        // Multipliers: Red/Black = x2, Green (0) = x36 (Standard Roulette usually x36 for straight up, but x14 for color bet on green is not standard, usually you bet on number. 
        // Assuming simple color betting here: Red/Black x2, Green x14 (Home brew rule or standard is usually 35:1 for single number)
        // Let's stick to simple Color Game: Red/Black x2. Green x14 (Probability 1/37 ~ 2.7%, 14x is safe for house)

        let multiplier = 0;
        if (isWin) {
            if (color === 'green') multiplier = 14; // High risk high reward for green
            else multiplier = 2; // Standard double for Red/Black
        }

        const payout = isWin ? Math.floor(amount * multiplier) : 0

        // 4. Transaction
        const result = await prisma.$transaction(async (tx) => {
            // Upsert Game
            const game = await tx.game.upsert({
                where: { slug: 'roulette' },
                update: {},
                create: {
                    slug: 'roulette',
                    name: 'Roulette',
                    type: 'INSTANT',
                    isActive: true,
                    rules: "Pariez sur Rouge (x2), Noir (x2) ou Vert (x14).",
                    config: { houseEdge: 0.027 }
                }
            })

            const netChange = BigInt(payout) - BigInt(amount)

            const updatedWallet = await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    balanceSats: { increment: netChange },
                    totalWageredSats: { increment: amount }
                }
            })

            const round = await tx.gameRound.create({
                data: {
                    walletId: wallet.id,
                    gameId: game.id,
                    betAmountSats: amount,
                    payoutAmountSats: payout,
                    status: 'COMPLETED',
                    gameData: {
                        winningNumber,
                        winningColor,
                        betColor: color,
                        isWin,
                        multiplier
                    },
                    clientSeed: "TODO",
                    serverSeedHash: "TODO",
                    nonce: 1
                }
            })

            return { updatedWallet, round, winningNumber, winningColor, isWin, payout }
        })

        return NextResponse.json({
            success: true,
            result: {
                number: result.winningNumber,
                color: result.winningColor,
                isWin: result.isWin,
                payout: result.payout,
                newBalance: result.updatedWallet.balanceSats.toString()
            }
        })

    } catch (error) {
        console.error("Roulette error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    }
}
