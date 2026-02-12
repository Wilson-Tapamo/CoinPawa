// src/app/api/profile/game-history/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

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
    const history = gameTransactions.map(tx => {
      const amountUsd = Number(tx.amountSats) / 100_000_000
      const metadata = tx.metadata as any // Cast pour accéder aux propriétés

      return {
        id: tx.id,
        type: tx.type,
        amount: amountUsd,
        gameName: metadata?.gameName || 'Unknown Game',
        gameId: metadata?.gameId || null,
        timestamp: tx.createdAt,
        // Pour WIN, inclure le montant du pari original
        betAmount: tx.type === 'WIN' ? metadata?.betAmount : null,
        // Calculer le profit net pour les wins
        netProfit: tx.type === 'WIN' && metadata?.betAmount
          ? amountUsd - metadata.betAmount
          : null
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