import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
        const userId = await verifySession();
        if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

        const body = await request.json();
        const { selection, amount } = body; // selection = [n1, n2, n3, n4, n5]

        // 1. Validation de l'entrée
        if (!Array.isArray(selection) || selection.length !== 5) {
            return NextResponse.json({ error: "Vous devez choisir exactement 5 numéros" }, { status: 400 });
        }

        const uniqueNums = new Set(selection);
        if (uniqueNums.size !== 5 || selection.some(n => n < 1 || n > 36)) {
            return NextResponse.json({ error: "Sélection invalide" }, { status: 400 });
        }

        if (!amount || amount < 100) {
            return NextResponse.json({ error: "Mise minimum 100 SATS" }, { status: 400 });
        }

        const betAmount = parseInt(amount);

        // 2. Vérifier le wallet
        const wallet = await prisma.wallet.findUnique({ where: { userId } });
        if (!wallet) return NextResponse.json({ error: "Wallet introuvable" }, { status: 404 });

        if (wallet.balanceSats < BigInt(betAmount)) {
            return NextResponse.json({ error: "Fonds insuffisants" }, { status: 400 });
        }

        // 3. Récupérer le jeu Loto
        const game = await prisma.game.findUnique({ where: { slug: 'loto' } });
        if (!game) return NextResponse.json({ error: "Jeu Loto non initialisé" }, { status: 404 });

        // 4. TRANSACTION DB
        const result = await prisma.$transaction(async (tx: any) => {
            // Débiter
            const updatedWallet = await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    balanceSats: { decrement: BigInt(betAmount) },
                    totalWageredSats: { increment: betAmount }
                }
            });

            // Créer le round (Ticket)
            const round = await tx.gameRound.create({
                data: {
                    walletId: wallet.id,
                    gameId: game.id,
                    status: 'ACTIVE',
                    betAmountSats: betAmount,
                    payoutAmountSats: 0,
                    clientSeed: "loto",
                    serverSeedHash: "loto",
                    nonce: 1,
                    gameData: {
                        selection: selection.sort((a, b) => a - b),
                        drawId: (game.config as any).nextDrawTime.toString()
                    }
                }
            });

            // Log de la transaction
            await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'BET',
                    amountSats: BigInt(-betAmount),
                    paymentRef: `BET_LOTO_${round.id}`,
                    status: 'COMPLETED',
                    metadata: { roundId: round.id, gameSlug: 'loto' }
                }
            });

            return { round, balance: updatedWallet.balanceSats.toString() };
        });

        return NextResponse.json({ success: true, ticket: result.round, newBalance: result.balance });

    } catch (error) {
        console.error("Loto Bet Error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
