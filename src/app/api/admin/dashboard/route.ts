// src/app/api/admin/dashboard/route.ts
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

    // Récupérer le range depuis query params
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'

    const daysAgo = range === '7d' ? 7 : range === '30d' ? 30 : 90

    // Générer les données simulées
    const { revenueData, userGrowthData, totalUsers } = generateMockData(daysAgo)
    const gameStatsData = generateGameStats()
    const depositMethodsData = generatePaymentMethods()
    const recentActivity = generateRecentActivity()

    // Calculer les stats globales
    const totalDeposits = revenueData.reduce((sum, d) => sum + d.deposits, 0)
    const totalWithdrawals = revenueData.reduce((sum, d) => sum + d.withdrawals, 0)
    const totalWagered = totalDeposits * 1.5 // Les users misent 1.5x leurs dépôts en moyenne
    const houseProfit = totalDeposits - totalWithdrawals

    // Calculer croissance (vs période précédente - simulé)
    const userGrowth = 8 + Math.random() * 10 // 8-18%
    const revenueGrowth = 5 + Math.random() * 15 // 5-20%

    // Stats actuelles
    const activeUsers = Math.floor(totalUsers * (0.15 + Math.random() * 0.10))
    const totalGames = gameStatsData.length
    const pendingWithdrawals = Math.floor(5 + Math.random() * 15)

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: Math.round(totalUsers),
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
        depositMethodsData
      },
      recentActivity
    })

  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
