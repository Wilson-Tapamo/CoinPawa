// src/app/api/profile/stats/route.ts
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

    // 2. Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        wallet: {
          select: {
            id: true,
            balanceSats: true,
            totalDepositedSats: true,
            totalWageredSats: true,
            transactions: {
              where: {
                OR: [
                  { type: 'DEPOSIT', status: 'COMPLETED' },
                  { type: 'WITHDRAW', status: 'COMPLETED' }
                ]
              },
              select: {
                type: true,
                amountSats: true
              }
            },
            gameRounds: {
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
              }
            }
          }
        }
      }
    })

    if (!user || !user.wallet) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const wallet = user.wallet
    const gameRounds = wallet.gameRounds || []

    // 3. Calculer les statistiques

    // Balance actuelle
    const currentBalance = Number(wallet.balanceSats) / 100_000_000

    // Total dépôts et retraits
    const totalDeposited = wallet.transactions
      .filter((t: any) => t.type === 'DEPOSIT')
      .reduce((sum: number, t: any) => sum + Number(t.amountSats), 0) / 100_000_000

    const totalWithdrawn = wallet.transactions
      .filter((t: any) => t.type === 'WITHDRAW')
      .reduce((sum: number, t: any) => sum + Number(t.amountSats), 0) / 100_000_000

    // Total misé et gagné
    const totalWagered = gameRounds.reduce((sum: number, r: any) => 
      sum + Number(r.betAmountSats), 0
    ) / 100_000_000

    const totalWon = gameRounds.reduce((sum: number, r: any) => 
      sum + Number(r.payoutAmountSats), 0
    ) / 100_000_000

    // Profit net = Total Gagné - Total Misé
    const netProfit = totalWon - totalWagered

    // Nombre de parties
    const totalBets = gameRounds.length

    // Victoires et défaites (isWin = payout > bet)
    const winCount = gameRounds.filter((r: any) => 
      Number(r.payoutAmountSats) > Number(r.betAmountSats)
    ).length
    const lossCount = totalBets - winCount

    // Taux de victoire
    const winRate = totalBets > 0 ? winCount / totalBets : 0

    // Plus gros gain
    const maxWin = gameRounds.length > 0
      ? Math.max(...gameRounds.map((r: any) => Number(r.payoutAmountSats))) / 100_000_000
      : 0

    // Série actuelle (victoires consécutives)
    let currentStreak = 0
    for (const round of gameRounds) {
      const isWin = Number((round as any).payoutAmountSats) > Number((round as any).betAmountSats)
      if (isWin) {
        currentStreak++
      } else {
        break
      }
    }

    // Meilleure série
    let bestStreak = 0
    let tempStreak = 0
    for (const round of gameRounds) {
      const isWin = Number((round as any).payoutAmountSats) > Number((round as any).betAmountSats)
      if (isWin) {
        tempStreak++
        if (tempStreak > bestStreak) {
          bestStreak = tempStreak
        }
      } else {
        tempStreak = 0
      }
    }

    // Jeu favori (le plus joué)
    const gameCounts: Record<string, number> = {}
    gameRounds.forEach((round: any) => {
      const gameName = round.game.name
      gameCounts[gameName] = (gameCounts[gameName] || 0) + 1
    })

    const favoriteGame = Object.entries(gameCounts).length > 0
      ? Object.entries(gameCounts).reduce((a, b) => a[1] > b[1] ? a : b)
      : null

    // 4. Retourner les statistiques
    return NextResponse.json({
      success: true,
      user: {
        username: user.username,
        email: user.email,
        userId: user.id.substring(0, 8),
        joinDate: user.createdAt.toISOString(),
        avatarUrl: null, // Pas dans le schema actuel
        bannerUrl: null  // Pas dans le schema actuel
      },
      stats: {
        // Balance & Profits
        currentBalance: currentBalance,
        totalDeposited: totalDeposited,
        totalWithdrawn: totalWithdrawn,
        netProfit: netProfit,
        
        // Activity
        totalWagered: totalWagered,
        totalWon: totalWon,
        totalBets: totalBets,
        
        // Performance
        winCount: winCount,
        lossCount: lossCount,
        winRate: winRate,
        maxWin: maxWin,
        
        // Streaks
        currentStreak: currentStreak,
        bestStreak: bestStreak,
        
        // Favorite Game
        favoriteGame: favoriteGame ? {
          name: favoriteGame[0],
          plays: favoriteGame[1]
        } : null
      }
    })

  } catch (error) {
    console.error('Profile stats error:', error)
    return NextResponse.json({ 
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}