// src/app/api/profile/game-history/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    // 1. Vérifier la session
    const userId = await verifySession()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // 2. Récupérer le wallet de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        wallet: {
          select: { id: true }
        }
      }
    })

    if (!user || !user.wallet) {
      return NextResponse.json({ error: 'Wallet non trouvé' }, { status: 404 })
    }

    // 3. Récupérer les 50 derniers GameRounds
    const gameRounds = await prisma.gameRound.findMany({
      where: {
        walletId: user.wallet.id,
        status: 'COMPLETED' // Seulement les parties terminées
      },
      select: {
        id: true,
        betAmountSats: true,
        payoutAmountSats: true,
        createdAt: true,
        game: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    })

    // 4. Formater l'historique
    const history = gameRounds.map(round => {
      const betAmount = Number(round.betAmountSats) / 100_000_000
      const payoutAmount = Number(round.payoutAmountSats) / 100_000_000
      const isWin = payoutAmount > betAmount
      const netProfit = payoutAmount - betAmount

      return {
        id: round.id,
        type: isWin ? 'WIN' : 'BET',
        amount: Math.abs(netProfit),
        gameName: round.game.name,
        timestamp: round.createdAt.toISOString(),
        betAmount: betAmount,
        payoutAmount: payoutAmount,
        netProfit: netProfit,
        isWin: isWin
      }
    })

    return NextResponse.json({
      success: true,
      history
    })

  } catch (error) {
    console.error('Game history error:', error)
    return NextResponse.json({ 
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}