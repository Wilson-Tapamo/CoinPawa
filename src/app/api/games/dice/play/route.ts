import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { Prisma } from '@prisma/client'

// Multiplicateurs
const MULTIPLIERS = {
    under7: 2.0,
    exact7: 6.0,
    over7: 2.0,
};

interface BetInput {
    under7?: number;
    exact7?: number;
    over7?: number;
}

interface BetResult {
    type: "under7" | "exact7" | "over7";
    amount: number;
    isWin: boolean;
    payout: number;
}

export async function POST(request: Request) {
    try {
        // 1. Auth & Validation
        const userId = await verifySession()
        if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

        const body = await request.json()
        const { bets } = body as { bets: BetInput }

        // Valider qu'au moins un pari est placé
        const under7Bet = bets?.under7 || 0;
        const exact7Bet = bets?.exact7 || 0;
        const over7Bet = bets?.over7 || 0;
        const totalBet = under7Bet + exact7Bet + over7Bet;

        if (totalBet <= 0) {
            return NextResponse.json({ error: "Aucun pari placé" }, { status: 400 })
        }

        // Valider que les montants sont positifs
        if (under7Bet < 0 || exact7Bet < 0 || over7Bet < 0) {
            return NextResponse.json({ error: "Montant invalide" }, { status: 400 })
        }

        // 2. Récupération du Wallet
        const wallet = await prisma.wallet.findUnique({ where: { userId } })
        if (!wallet) return NextResponse.json({ error: "Wallet introuvable" }, { status: 404 })

        if (wallet.balanceSats < BigInt(totalBet)) {
            return NextResponse.json({ error: "Fonds insuffisants" }, { status: 400 })
        }

        // 3. Logique du Jeu - Lancer 2 dés
        const dice1 = Math.floor(Math.random() * 6) + 1; // 1-6
        const dice2 = Math.floor(Math.random() * 6) + 1; // 1-6
        const total = dice1 + dice2; // 2-12

        // Déterminer les résultats pour chaque pari
        const betResults: BetResult[] = [];
        let totalPayout = 0;

        if (under7Bet > 0) {
            const isWin = total < 7;
            const payout = isWin ? Math.floor(under7Bet * MULTIPLIERS.under7) : 0;
            totalPayout += payout;
            betResults.push({
                type: "under7",
                amount: under7Bet,
                isWin,
                payout,
            });
        }

        if (exact7Bet > 0) {
            const isWin = total === 7;
            const payout = isWin ? Math.floor(exact7Bet * MULTIPLIERS.exact7) : 0;
            totalPayout += payout;
            betResults.push({
                type: "exact7",
                amount: exact7Bet,
                isWin,
                payout,
            });
        }

        if (over7Bet > 0) {
            const isWin = total > 7;
            const payout = isWin ? Math.floor(over7Bet * MULTIPLIERS.over7) : 0;
            totalPayout += payout;
            betResults.push({
                type: "over7",
                amount: over7Bet,
                isWin,
                payout,
            });
        }

        const hasAnyWin = betResults.some(r => r.isWin);

        // 4. Transaction DB (Atomique)
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // A. Assurer que le jeu "Dice" existe
            const game = await tx.game.upsert({
                where: { slug: 'dice' },
                update: {},
                create: {
                    slug: 'dice',
                    name: 'Dice',
                    type: 'INSTANT',
                    isActive: true,
                    rules: "Lancez 2 dés et pariez sur le total : Moins de 7, Exactement 7, ou Plus de 7.",
                    config: {
                        houseEdge: 0.04,
                        multipliers: MULTIPLIERS
                    }
                }
            })

            // B. Débiter la mise
            const updatedWalletAfterBet = await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    balanceSats: { decrement: BigInt(totalBet) },
                    totalWageredSats: { increment: totalBet }
                }
            })

            // C. Créer le GameRound
            const round = await tx.gameRound.create({
                data: {
                    walletId: wallet.id,
                    gameId: game.id,
                    betAmountSats: totalBet,
                    payoutAmountSats: totalPayout,
                    status: 'COMPLETED',
                    gameData: {
                        dice1,
                        dice2,
                        total,
                        bets: {
                            under7: under7Bet,
                            exact7: exact7Bet,
                            over7: over7Bet,
                        },
                        results: betResults,
                        hasAnyWin,
                        multipliers: MULTIPLIERS
                    } as any,
                    clientSeed: "dice",
                    serverSeedHash: "dice",
                    nonce: 1
                }
            })

            // D. Log de la mise
            await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'BET',
                    amountSats: BigInt(-totalBet),
                    paymentRef: `BET_DICE_${round.id}`,
                    status: 'COMPLETED',
                    metadata: { roundId: round.id, gameSlug: 'dice' }
                }
            })

            let finalWallet = updatedWalletAfterBet;

            // E. Créditer le gain si présent
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
                        paymentRef: `WIN_DICE_${round.id}`,
                        status: 'COMPLETED',
                        metadata: { roundId: round.id, gameSlug: 'dice' }
                    }
                })
            }

            return { updatedWallet: finalWallet, round, dice1, dice2, total, betResults, totalPayout, hasAnyWin }
        })

        return NextResponse.json({
            success: true,
            result: {
                dice1: result.dice1,
                dice2: result.dice2,
                total: result.total,
                betResults: result.betResults,
                totalPayout: result.totalPayout,
                hasAnyWin: result.hasAnyWin,
                newBalance: result.updatedWallet.balanceSats.toString()
            }
        })

    } catch (error) {
        console.error("Dice error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    }
}
