// src/app/api/admin/dashboard/stats/route.ts
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function GET() {
  try {
    // 1. Vérifier que c'est un admin
    const userId = await verifySession()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier le rôle admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // 2. Calculer les stats
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Total users
    const totalUsers = await prisma.user.count()

    // Active users aujourd'hui (au moins une transaction)
    const activeUsers = await prisma.transaction.groupBy({
      by: ['walletId'],
      where: {
        createdAt: { gte: todayStart }
      }
    }).then(result => result.length)

    // Total des transactions
    const allTransactions = await prisma.transaction.findMany({
      where: { status: 'COMPLETED' },
      select: {
        type: true,
        amountSats: true,
        createdAt: true
      }
    })

    // Calculer revenus et paris
    let totalRevenue = 0
    let todayRevenue = 0
    let totalBets = 0
    let todayBets = 0
    let totalWagered = 0
    let totalWon = 0

    allTransactions.forEach(tx => {
      const amountUsd = Number(tx.amountSats) / 100_000_000
      const isToday = tx.createdAt >= todayStart

      if (tx.type === 'BET') {
        totalBets++
        totalWagered += amountUsd
        if (isToday) todayBets++
      } else if (tx.type === 'WIN') {
        totalWon += amountUsd
      } else if (tx.type === 'DEPOSIT') {
        totalRevenue += amountUsd * 0.01 // 1% de frais
        if (isToday) todayRevenue += amountUsd * 0.01
      } else if (tx.type === 'WITHDRAW') {
        totalRevenue += amountUsd * 0.01 // 1% de frais
        if (isToday) todayRevenue += amountUsd * 0.01
      }
    })

    // House edge = (Wagered - Won) / Wagered * 100
    const houseEdge = totalWagered > 0
      ? ((totalWagered - totalWon) / totalWagered) * 100
      : 0

    // Retraits en attente
    const pendingWithdrawals = await prisma.transaction.count({
      where: {
        type: 'WITHDRAW',
        status: 'PENDING'
      }
    })

    // Activité récente
    const recentActivity = await prisma.transaction.findMany({
      where: { status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        wallet: {
          include: {
            user: {
              select: { username: true }
            }
          }
        }
      }
    })

    const formattedActivity = recentActivity.map(tx => ({
      id: tx.id,
      type: tx.type.toLowerCase(),
      username: tx.wallet.user.username,
      amount: Number(tx.amountSats) / 100_000_000,
      timestamp: tx.createdAt.toISOString()
    }))

    // 3. Retourner les stats
    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        todayRevenue: Math.round(todayRevenue * 100) / 100,
        totalBets,
        todayBets,
        pendingWithdrawals,
        houseEdge: Math.round(houseEdge * 100) / 100
      },
      recentActivity: formattedActivity
    })

  } catch (error) {
    console.error('Error fetching admin stats:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
