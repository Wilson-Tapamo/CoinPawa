// src/app/api/admin/dashboard/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    // 1. Vérifier que c'est un admin
    const adminId = await verifySession()
    if (!adminId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true }
    })

    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // 2. Récupérer la période demandée
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'
    const daysAgo = range === '7d' ? 7 : range === '30d' ? 30 : 90

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)
    startDate.setHours(0, 0, 0, 0)

    // ========== STATS GLOBALES ==========

    // Total utilisateurs
    const totalUsers = await prisma.user.count()

    // Utilisateurs actifs (ont joué dans la période)
    const activeUsersCount = await prisma.gameRound.groupBy({
      by: ['walletId'],
      where: { createdAt: { gte: startDate } }
    })
    const activeUsers = activeUsersCount.length

    // Total dépôts
    const depositsData = await prisma.transaction.aggregate({
      where: {
        type: 'DEPOSIT',
        status: 'COMPLETED'
      },
      _sum: { amountSats: true }
    })
    const totalDeposits = Number(depositsData._sum.amountSats || 0) / 100_000_000

    // Total retraits
    const withdrawalsData = await prisma.transaction.aggregate({
      where: {
        type: 'WITHDRAW',
        status: 'COMPLETED'
      },
      _sum: { amountSats: true }
    })
    const totalWithdrawals = Number(withdrawalsData._sum.amountSats || 0) / 100_000_000

    // Total wagered
    const wageredData = await prisma.wallet.aggregate({
      _sum: { totalWageredSats: true }
    })
    const totalWagered = Number(wageredData._sum.totalWageredSats || 0) / 100_000_000

    // Profit maison
    const houseProfit = totalDeposits - totalWithdrawals

    // Retraits en attente
    const pendingWithdrawals = await prisma.transaction.count({
      where: {
        type: 'WITHDRAW',
        status: 'PENDING'
      }
    })

    // Total jeux
    const totalGames = await prisma.game.count()

    // ========== CROISSANCE ==========

    const prevStartDate = new Date(startDate)
    prevStartDate.setDate(prevStartDate.getDate() - daysAgo)

    // Croissance utilisateurs
    const usersThisPeriod = await prisma.user.count({
      where: { createdAt: { gte: startDate } }
    })
    const usersPrevPeriod = await prisma.user.count({
      where: {
        createdAt: { gte: prevStartDate, lt: startDate }
      }
    })
    const userGrowth = usersPrevPeriod > 0 
      ? ((usersThisPeriod - usersPrevPeriod) / usersPrevPeriod) * 100 
      : 0

    // Croissance revenus
    const depositsThisPeriod = await prisma.transaction.aggregate({
      where: {
        type: 'DEPOSIT',
        status: 'COMPLETED',
        createdAt: { gte: startDate }
      },
      _sum: { amountSats: true }
    })
    const depositsPrevPeriod = await prisma.transaction.aggregate({
      where: {
        type: 'DEPOSIT',
        status: 'COMPLETED',
        createdAt: { gte: prevStartDate, lt: startDate }
      },
      _sum: { amountSats: true }
    })

    const revenueThis = Number(depositsThisPeriod._sum.amountSats || 0)
    const revenuePrev = Number(depositsPrevPeriod._sum.amountSats || 0)
    const revenueGrowth = revenuePrev > 0
      ? ((revenueThis - revenuePrev) / revenuePrev) * 100
      : 0

    // ========== GRAPHIQUE REVENUS (par jour) ==========

    const revenueData = []
    
    for (let i = 0; i < daysAgo; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      // Dépôts du jour
      const dayDeposits = await prisma.transaction.aggregate({
        where: {
          type: 'DEPOSIT',
          status: 'COMPLETED',
          createdAt: { gte: date, lt: nextDate }
        },
        _sum: { amountSats: true }
      })

      // Retraits du jour
      const dayWithdrawals = await prisma.transaction.aggregate({
        where: {
          type: 'WITHDRAW',
          status: 'COMPLETED',
          createdAt: { gte: date, lt: nextDate }
        },
        _sum: { amountSats: true }
      })

      const deposits = Number(dayDeposits._sum.amountSats || 0) / 100_000_000
      const withdrawals = Number(dayWithdrawals._sum.amountSats || 0) / 100_000_000

      revenueData.push({
        date: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        revenue: Math.round(deposits - withdrawals),
        deposits: Math.round(deposits),
        withdrawals: Math.round(withdrawals)
      })
    }

    // ========== GRAPHIQUE UTILISATEURS (par jour) ==========

    const userGrowthData = []
    
    for (let i = 0; i < daysAgo; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      // Total users à cette date
      const usersAtDate = await prisma.user.count({
        where: { createdAt: { lte: nextDate } }
      })

      // Users actifs ce jour
      const activeDayCount = await prisma.gameRound.groupBy({
        by: ['walletId'],
        where: { createdAt: { gte: date, lt: nextDate } }
      })

      userGrowthData.push({
        date: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        users: usersAtDate,
        active: activeDayCount.length
      })
    }

    // ========== STATS JEUX ==========

    const games = await prisma.game.findMany({
      include: {
        rounds: {
          where: { createdAt: { gte: startDate } },
          select: {
            betAmountSats: true,
            payoutAmountSats: true
          }
        }
      }
    })

    const gameStatsData = games
      .map(game => {
        const totalBet = game.rounds.reduce((sum, r) => sum + Number(r.betAmountSats), 0)
        const totalPayout = game.rounds.reduce((sum, r) => sum + Number(r.payoutAmountSats), 0)
        
        return {
          name: game.name,
          plays: game.rounds.length,
          revenue: Math.round((totalBet - totalPayout) / 100_000_000)
        }
      })
      .filter(g => g.plays > 0)

    // ========== MÉTHODES DE PAIEMENT (✅ CORRIGÉ : cryptoCurrency) ==========

    const cryptoData = await prisma.transaction.groupBy({
      by: ['cryptoCurrency'], // ✅ CHANGÉ DE crypto À cryptoCurrency
      where: {
        type: 'DEPOSIT',
        status: 'COMPLETED',
        cryptoCurrency: { not: null } // ✅ CHANGÉ DE crypto À cryptoCurrency
      },
      _sum: { amountSats: true }
    })

    const cryptoMap: Record<string, { name: string; color: string }> = {
      'BTC': { name: 'Bitcoin', color: '#F59E0B' },
      'ETH': { name: 'Ethereum', color: '#8B5CF6' },
      'USDT': { name: 'USDT', color: '#10B981' },
      'USDC': { name: 'USDC', color: '#2775CA' },
      'LTC': { name: 'Litecoin', color: '#345D9D' },
      'DOGE': { name: 'Dogecoin', color: '#C2A633' },
      'TRX': { name: 'Tron', color: '#FF0013' },
      'BNB': { name: 'BNB', color: '#F3BA2F' }
    }

    const depositMethodsData = cryptoData
      .map(item => ({
        name: cryptoMap[item.cryptoCurrency as string]?.name || item.cryptoCurrency || 'Autre',
        value: Math.round(Number(item._sum.amountSats || 0) / 100_000_000),
        color: cryptoMap[item.cryptoCurrency as string]?.color || '#6B7280'
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)

    // ========== ACTIVITÉ RÉCENTE ==========

    const recentTransactions = await prisma.transaction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
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

    const recentActivity = recentTransactions.map(tx => {
      const minutesAgo = Math.floor((Date.now() - tx.createdAt.getTime()) / 60000)
      const hoursAgo = Math.floor(minutesAgo / 60)
      const daysAgo = Math.floor(hoursAgo / 24)

      let timestamp = ''
      if (daysAgo > 0) timestamp = `Il y a ${daysAgo}j`
      else if (hoursAgo > 0) timestamp = `Il y a ${hoursAgo}h`
      else timestamp = `Il y a ${minutesAgo}min`

      return {
        id: tx.id,
        type: tx.type,
        icon: tx.type === 'DEPOSIT' ? 'TrendingUp' : 'ArrowDownToLine',
        color: tx.type === 'DEPOSIT' ? 'success' : 'primary',
        message: tx.type === 'DEPOSIT' ? 'Nouveau dépôt' : 'Retrait traité',
        user: tx.wallet?.user?.username || 'Utilisateur',
        amount: Number(tx.amountSats) / 100_000_000,
        timestamp
      }
    })

    // ========== RETOUR ==========

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalDeposits: Math.round(totalDeposits),
        totalWithdrawals: Math.round(totalWithdrawals),
        totalWagered: Math.round(totalWagered),
        totalGames,
        pendingWithdrawals,
        houseProfit: Math.round(houseProfit),
        userGrowth: Math.round(userGrowth * 10) / 10,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10
      },
      charts: {
        revenueData,
        userGrowthData,
        gameStatsData,
        depositMethodsData: depositMethodsData.length > 0 
          ? depositMethodsData 
          : [{ name: 'Aucune donnée', value: 1, color: '#374151' }]
      },
      recentActivity
    })

  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ 
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
