// src/app/api/profile/game-history/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 1. Vérifier l'authentification
    const userId = await verifySession()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // 2. Récupérer les transactions de jeu (BET et WIN)
    const gameTransactions = await prisma.transaction.findMany({
      where: {
        wallet: { userId },
        type: { in: ['BET', 'WIN'] },
        status: 'COMPLETED'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20, // Dernières 20 transactions
      select: {
        id: true,
        type: true,
        amountSats: true,
        createdAt: true,
        metadata: true,
      }
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
    console.error('Error fetching game history:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}