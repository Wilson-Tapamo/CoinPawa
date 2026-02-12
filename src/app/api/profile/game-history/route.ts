// src/app/api/profile/game-history/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { satsToUsd } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET() {
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

    // 3. Formater les données
    const history = gameRounds.map(round => {
      const isWin = Number(round.payoutAmountSats) > 0
      const betAmountSats = Number(round.betAmountSats)
      const payoutAmountSats = Number(round.payoutAmountSats)

      return {
        id: round.id,
        type: isWin ? 'WIN' : 'BET',
        // Frontend uses formatSatsToUSD for this field, so keep it in SATS
        amount: isWin ? payoutAmountSats : betAmountSats,
        gameName: round.game.name,
        gameId: null,
        timestamp: round.createdAt,
        // Frontend uses formatToUSD for these, so convert to USD
        betAmount: satsToUsd(betAmountSats),
        netProfit: satsToUsd(payoutAmountSats - betAmountSats),
        isWin
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