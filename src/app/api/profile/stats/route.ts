// src/app/api/profile/stats/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function GET() {
  try {
    const userId = await verifySession()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,  // ✅ AJOUTER (après migration)
        bannerUrl: true,  // ✅ AJOUTER (après migration)
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }

    // Récupérer le wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      select: {
        id: true,  // ✅ AJOUTER
        balanceSats: true,
        totalDepositedSats: true,
        totalWageredSats: true
      }
    })

    // Récupérer toutes les transactions BET
    const betTransactions = await prisma.gameRound.findMany({
      where: { walletId: wallet?.id },
      select: {
        betAmountSats: true,
        payoutAmountSats: true,
        status: true
      }
    })

    // Calculer les stats
    const totalBets = betTransactions.length
    const completedRounds = betTransactions.filter(r => r.status === 'COMPLETED')
    const winCount = completedRounds.filter(r => Number(r.payoutAmountSats) > Number(r.betAmountSats)).length
    
    const totalWagered = Number(wallet?.totalWageredSats || 0)
    const totalWon = completedRounds.reduce((sum, r) => sum + Number(r.payoutAmountSats), 0)
    
    const maxWin = completedRounds.length > 0 
      ? Math.max(...completedRounds.map(r => Number(r.payoutAmountSats) - Number(r.betAmountSats)))
      : 0

    const stats = {
      totalDeposited: Number(wallet?.totalDepositedSats || 0) / 100_000_000,
      totalWithdrawn: 0, // Pas de champ dans votre schema
      totalWagered: totalWagered / 100_000_000,
      totalWon: totalWon / 100_000_000,
      totalBets,
      winCount,
      maxWin: maxWin / 100_000_000,
      winRate: totalBets > 0 ? (winCount / totalBets) * 100 : 0,
      netProfit: (totalWon - totalWagered) / 100_000_000,
      currentBalance: Number(wallet?.balanceSats || 0) / 100_000_000
    }

    return NextResponse.json({
      success: true,
      stats,
      user: {
        username: user.username,
        email: user.email,
        userId: user.id,
        joinDate: user.createdAt.toISOString(),
        avatarUrl: user.avatarUrl,  // ✅ RETOURNER
        bannerUrl: user.bannerUrl   // ✅ RETOURNER
      }
    })

  } catch (error) {
    console.error('Error fetching profile stats:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}