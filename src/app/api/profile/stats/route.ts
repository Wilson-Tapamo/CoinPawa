// src/app/api/profile/stats/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function GET() {
  try {
    // 1. Vérifier l'authentification
    const userId = await verifySession()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // 2. Récupérer le wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      select: {
        balanceSats: true,
        totalDepositedSats: true,
        totalWageredSats: true,
      }
    })

    // 3. Récupérer les infos de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        email: true,
        createdAt: true,
      }
    })

    if (!wallet || !user) {
      return NextResponse.json({ error: 'Wallet ou utilisateur introuvable' }, { status: 404 })
    }

    // 4. Récupérer toutes les transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        wallet: { userId }
      },
      select: {
        type: true,
        amountSats: true,
        status: true,
        createdAt: true,
      }
    })

    // 5. Calculer les statistiques
    const stats = {
      // Dépôts
      totalDeposited: 0,
      depositCount: 0,
      
      // Retraits
      totalWithdrawn: 0,
      withdrawalCount: 0,
      
      // Paris
      totalWagered: 0,
      totalBets: 0,
      
      // Gains
      totalWon: 0,
      winCount: 0,
      maxWin: 0,
      
      // Calculés
      winRate: 0,
      netProfit: 0,
      currentBalance: 0,
    }

    transactions.forEach(tx => {
      const amountUsd = Number(tx.amountSats) / 100_000_000

      switch (tx.type) {
        case 'DEPOSIT':
        case 'DEPOSIT_BONUS':
          if (tx.status === 'COMPLETED') {
            stats.totalDeposited += amountUsd
            stats.depositCount++
          }
          break

        case 'WITHDRAW':
          if (tx.status === 'COMPLETED') {
            stats.totalWithdrawn += amountUsd
            stats.withdrawalCount++
          }
          break

        case 'BET':
          if (tx.status === 'COMPLETED') {
            stats.totalWagered += amountUsd
            stats.totalBets++
          }
          break

        case 'WIN':
          if (tx.status === 'COMPLETED') {
            stats.totalWon += amountUsd
            stats.winCount++
            if (amountUsd > stats.maxWin) {
              stats.maxWin = amountUsd
            }
          }
          break
      }
    })

    // Calculs dérivés
    stats.winRate = stats.totalBets > 0 
      ? (stats.winCount / stats.totalBets) * 100 
      : 0

    stats.netProfit = stats.totalWon - stats.totalWagered

    stats.currentBalance = Number(wallet.balanceSats) / 100_000_000

    // 6. Arrondir les valeurs
    Object.keys(stats).forEach((key) => {
      const statKey = key as keyof typeof stats
      if (
        typeof stats[statKey] === 'number' && 
        statKey !== 'totalBets' && 
        statKey !== 'winCount' && 
        statKey !== 'depositCount' && 
        statKey !== 'withdrawalCount'
      ) {
        stats[statKey] = Math.round(stats[statKey] * 100) / 100
      }
    })

    // 7. Retourner stats + infos user
    return NextResponse.json({
      success: true,
      stats,
      user: {
        username: user.username,
        email: user.email,
        userId: userId,
        joinDate: user.createdAt,
      }
    })

  } catch (error) {
    console.error('Error fetching profile stats:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}