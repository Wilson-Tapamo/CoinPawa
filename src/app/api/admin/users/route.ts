// src/app/api/admin/users/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    // 1. Vérifier que c'est un admin
    const userId = await verifySession()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // 2. Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // 3. Construire les filtres
    const where: any = {}

    // Filtre par rôle
    if (role && role !== 'all') {
      where.role = role
    }

    // Filtre par status
    if (status === 'banned') {
      where.isBanned = true
    } else if (status === 'active') {
      where.isBanned = false
    } else if (status === 'verified') {
      where.isEmailVerified = true
    }

    // Recherche
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    // 4. Récupérer les utilisateurs avec leur wallet
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isBanned: true,
          isEmailVerified: true,
          gamesPlayed: true,
          createdAt: true,
          lastLoginAt: true,
          wallet: {
            select: {
              balanceSats: true,
              totalDepositedSats: true,
              totalWageredSats: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ])

    // 5. Calculer les stats
    const [totalUsers, activeUsers, bannedUsers, verifiedUsers, totalBalanceResult] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isBanned: false } }),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.user.count({ where: { isEmailVerified: true } }),
      prisma.wallet.aggregate({
        _sum: {
          balanceSats: true
        }
      })
    ])

    return NextResponse.json({
      success: true,
      users,
      total,
      stats: {
        totalUsers,
        activeUsers,
        bannedUsers,
        verifiedUsers,
        totalBalance: Number(totalBalanceResult._sum.balanceSats || BigInt(0))
      }
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
