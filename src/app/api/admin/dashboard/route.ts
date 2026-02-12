// src/app/api/admin/dashboard/route.ts
// VERSION CORRIGÉE : Revenus = House Edge (pas dépôts)
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Fonction pour générer des données simulées réalistes
function generateMockData(daysAgo: number) {
  const revenueData = []
  const userGrowthData = []

  let cumulativeUsers = 950 // Utilisateurs de base

  for (let i = daysAgo - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })

    // Variation réaliste jour par jour
    const randomFactor = 0.8 + Math.random() * 0.4 // Entre 0.8 et 1.2
    const weekendFactor = date.getDay() === 0 || date.getDay() === 6 ? 1.3 : 1 // +30% le weekend

    // Revenus
    const deposits = Math.floor(1000 + Math.random() * 2000) * randomFactor * weekendFactor
    const withdrawals = Math.floor(deposits * (0.6 + Math.random() * 0.2)) // 60-80% des dépôts
    const revenue = deposits - withdrawals

    revenueData.push({
      date: dateStr,
      revenue: Math.round(revenue),
      deposits: Math.round(deposits),
      withdrawals: Math.round(withdrawals)
    })

    // Croissance utilisateurs
    const newUsers = Math.floor(5 + Math.random() * 20) * weekendFactor
    cumulativeUsers += newUsers
    const activeUsers = Math.floor(cumulativeUsers * (0.15 + Math.random() * 0.1)) // 15-25% actifs

    userGrowthData.push({
      date: dateStr,
      users: Math.round(cumulativeUsers),
      active: Math.round(activeUsers)
    })
  }

  return { revenueData, userGrowthData, totalUsers: cumulativeUsers }
}

// Données simulées pour les jeux
function generateGameStats() {
  const games = [
    { name: 'Dice', color: '#F59E0B' },
    { name: 'Mines', color: '#8B5CF6' },
    { name: 'Roulette', color: '#EC4899' },
    { name: 'Crash', color: '#06B6D4' },
    { name: 'Blackjack', color: '#10B981' },
    { name: 'Plinko', color: '#EF4444' }
  ]

  return games.map(game => ({
    name: game.name,
    plays: Math.floor(100 + Math.random() * 500),
    revenue: Math.floor(500 + Math.random() * 3000)
  }))
}

// Données simulées pour les méthodes de paiement
function generatePaymentMethods() {
  const total = 10000
  const btc = 0.40 + Math.random() * 0.10 // 40-50%
  const eth = 0.25 + Math.random() * 0.10 // 25-35%
  const usdt = 0.10 + Math.random() * 0.10 // 10-20%
  const others = 1 - btc - eth - usdt

  return [
    { name: 'Bitcoin', value: Math.round(total * btc), color: '#F59E0B' },
    { name: 'Ethereum', value: Math.round(total * eth), color: '#8B5CF6' },
    { name: 'USDT', value: Math.round(total * usdt), color: '#10B981' },
    { name: 'Autres', value: Math.round(total * others), color: '#06B6D4' }
  ]
}

// Activité récente simulée
function generateRecentActivity() {
  const activities = [
    { type: 'deposit', users: ['alice', 'bob', 'charlie', 'david', 'emma'] },
    { type: 'withdrawal', users: ['frank', 'grace', 'henry', 'ivy', 'jack'] },
    { type: 'win', users: ['kate', 'leo', 'mia', 'noah', 'olivia'] },
    { type: 'game', users: ['paul', 'quinn', 'ruby', 'sam', 'tina'] }
  ]

  const icons = {
    deposit: 'TrendingUp',
    withdrawal: 'ArrowDownToLine',
    win: 'Trophy',
    game: 'Gamepad2'
  }

  const colors = {
    deposit: 'success',
    withdrawal: 'primary',
    win: 'violet',
    game: 'cyan'
  }

  const messages = {
    deposit: 'Nouveau dépôt',
    withdrawal: 'Retrait approuvé',
    win: 'Grosse victoire',
    game: 'Partie jouée'
  }

  const recentActivities = []

  for (let i = 0; i < 10; i++) {
    const activity = activities[Math.floor(Math.random() * activities.length)]
    const user = activity.users[Math.floor(Math.random() * activity.users.length)]
    const amount = Math.floor(10 + Math.random() * 200)
    const minutesAgo = Math.floor(Math.random() * 120) // 0-120 minutes

    recentActivities.push({
      id: `activity-${i}`,
      type: activity.type,
      icon: icons[activity.type as keyof typeof icons],
      color: colors[activity.type as keyof typeof colors],
      message: messages[activity.type as keyof typeof messages],
      user,
      amount,
      timestamp: `Il y a ${minutesAgo < 60 ? minutesAgo + ' min' : Math.floor(minutesAgo / 60) + ' h'}`
    })
  }

  return recentActivities
}

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
    const activeUsersData = await prisma.gameRound.findMany({
      where: { createdAt: { gte: startDate } },
      select: { walletId: true },
      distinct: ['walletId']
    })
    const activeUsers = activeUsersData.length

    // Total dépôts (pour info, pas les revenus)
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

    // ✅ VRAIS REVENUS = House Edge (Total misé - Total payé)
    const allRounds = await prisma.gameRound.findMany({
      select: {
        betAmountSats: true,
        payoutAmountSats: true
      }
    })
    
    const totalBet = allRounds.reduce((sum, r) => sum + Number(r.betAmountSats), 0)
    const totalPayout = allRounds.reduce((sum, r) => sum + Number(r.payoutAmountSats), 0)
    const houseRevenue = (totalBet - totalPayout) / 100_000_000 // ✅ VRAIS REVENUS

    // Profit net = Revenus - (Dépôts - Retraits en suspens)
    // Simplification : Revenus house edge = profit direct
    const houseProfit = houseRevenue

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

    // ✅ Croissance REVENUS (house edge)
    const roundsThisPeriod = await prisma.gameRound.findMany({
      where: { createdAt: { gte: startDate } },
      select: { betAmountSats: true, payoutAmountSats: true }
    })
    const roundsPrevPeriod = await prisma.gameRound.findMany({
      where: {
        createdAt: { gte: prevStartDate, lt: startDate }
      },
      select: { betAmountSats: true, payoutAmountSats: true }
    })

    const revenueThis = roundsThisPeriod.reduce((sum, r) => 
      sum + Number(r.betAmountSats) - Number(r.payoutAmountSats), 0
    )
    const revenuePrev = roundsPrevPeriod.reduce((sum, r) => 
      sum + Number(r.betAmountSats) - Number(r.payoutAmountSats), 0
    )
    const revenueGrowth = revenuePrev > 0
      ? ((revenueThis - revenuePrev) / revenuePrev) * 100
      : 0

    // ========== GRAPHIQUE REVENUS (House Edge par jour) ==========

    const revenueData = []
    const groupSize = daysAgo === 7 ? 1 : daysAgo === 30 ? 3 : 7
    
    for (let i = 0; i < daysAgo; i += groupSize) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + groupSize)

      // ✅ REVENUS = House Edge des jeux
      const periodRounds = await prisma.gameRound.findMany({
        where: {
          createdAt: { gte: date, lt: nextDate }
        },
        select: {
          betAmountSats: true,
          payoutAmountSats: true
        }
      })

      const periodBet = periodRounds.reduce((sum, r) => sum + Number(r.betAmountSats), 0)
      const periodPayout = periodRounds.reduce((sum, r) => sum + Number(r.payoutAmountSats), 0)
      const periodRevenue = (periodBet - periodPayout) / 100_000_000

      // Wagered pour info
      const periodWagered = periodBet / 100_000_000

      revenueData.push({
        date: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        revenue: Math.round(periodRevenue * 100) / 100, // ✅ House Edge
        wagered: Math.round(periodWagered * 100) / 100, // Total misé
        payout: Math.round((periodPayout / 100_000_000) * 100) / 100 // Total payé
      })
    }

    // ========== GRAPHIQUE UTILISATEURS ==========

    const userGrowthData = []
    
    for (let i = 0; i < daysAgo; i += groupSize) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + groupSize)

      const usersAtDate = await prisma.user.count({
        where: { createdAt: { lte: nextDate } }
      })

      const activePeriod = await prisma.gameRound.findMany({
        where: { createdAt: { gte: date, lt: nextDate } },
        select: { walletId: true },
        distinct: ['walletId']
      })

      userGrowthData.push({
        date: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        users: usersAtDate,
        active: activePeriod.length
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
          revenue: Math.round(((totalBet - totalPayout) / 100_000_000) * 100) / 100, // House Edge
          wagered: Math.round((totalBet / 100_000_000) * 100) / 100 // Total misé
        }
      })
      .filter(g => g.plays > 0)

    // ========== MÉTHODES DE PAIEMENT ==========

    const cryptoData = await prisma.transaction.groupBy({
      by: ['cryptoCurrency'],
      where: {
        type: 'DEPOSIT',
        status: 'COMPLETED',
        cryptoCurrency: { not: null }
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
      const daysAgoCalc = Math.floor(hoursAgo / 24)

      let timestamp = ''
      if (daysAgoCalc > 0) timestamp = `Il y a ${daysAgoCalc}j`
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
        totalDeposits: Math.round(totalDeposits * 100) / 100, // Pour info
        totalWithdrawals: Math.round(totalWithdrawals * 100) / 100, // Pour info
        totalWagered: Math.round(totalWagered * 100) / 100,
        houseRevenue: Math.round(houseRevenue * 100) / 100, // ✅ VRAIS REVENUS
        totalGames,
        pendingWithdrawals,
        houseProfit: Math.round(houseProfit * 100) / 100, // ✅ = House Revenue
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