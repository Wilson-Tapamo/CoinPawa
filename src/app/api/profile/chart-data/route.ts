// app/api/profile/chart-data/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const userId = await verifySession()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        wallet: {
          select: {
            id: true,
            gameRounds: {
              where: {
                status: 'COMPLETED',
                createdAt: {
                  // 30 derniers jours
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
              },
              select: {
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
                createdAt: 'asc'
              }
            }
          }
        }
      }
    })

    if (!user || !user.wallet) {
      return NextResponse.json({ error: 'Wallet non trouvé' }, { status: 404 })
    }

    const gameRounds = user.wallet.gameRounds

    // 1. Données pour le graphique Profit/Loss (30 jours)
    const profitByDay: Record<string, number> = {}
    
    gameRounds.forEach(round => {
      const date = new Date(round.createdAt).toISOString().split('T')[0]
      const profit = (Number(round.payoutAmountSats) - Number(round.betAmountSats)) / 100_000_000
      
      if (!profitByDay[date]) {
        profitByDay[date] = 0
      }
      profitByDay[date] += profit
    })

    // Créer un array des 30 derniers jours (même sans données)
    const profitData = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      profitData.push({
        date: dateStr,
        profit: profitByDay[dateStr] || 0,
        day: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      })
    }

    // 2. Données pour le graphique Performance par Jeu
    const gameStats: Record<string, { profit: number, plays: number }> = {}
    
    gameRounds.forEach(round => {
      const gameName = round.game.name
      const profit = (Number(round.payoutAmountSats) - Number(round.betAmountSats)) / 100_000_000
      
      if (!gameStats[gameName]) {
        gameStats[gameName] = { profit: 0, plays: 0 }
      }
      
      gameStats[gameName].profit += profit
      gameStats[gameName].plays += 1
    })

    // Convertir en array et trier par profit
    const gamePerformance = Object.entries(gameStats)
      .map(([name, stats]) => ({
        name,
        profit: Number(stats.profit.toFixed(2)),
        plays: stats.plays
      }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5) // Top 5 jeux

    return NextResponse.json({
      success: true,
      profitData,
      gamePerformance
    })

  } catch (error) {
    console.error('Chart data error:', error)
    return NextResponse.json({ 
      error: 'Erreur serveur' 
    }, { status: 500 })
  }
}