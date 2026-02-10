// src/app/api/admin/games/route.ts
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

    // 2. Récupérer tous les jeux avec leurs statistiques
    const games = await prisma.game.findMany({
      include: {
        rounds: {
          select: {
            betAmountSats: true,
            payoutAmountSats: true,
            id: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    // 3. Calculer les statistiques pour chaque jeu
    const gamesWithStats = games.map(game => {
      const rounds = game.rounds || []
      
      // Total des paris
      const totalBets = rounds.length
      
      // Total misé (wagered)
      const totalWagered = rounds.reduce((sum, round) => 
        sum + Number(round.betAmountSats || 0), 0
      )
      
      // Total payé (payout)
      const totalPayout = rounds.reduce((sum, round) => 
        sum + Number(round.payoutAmountSats || 0), 0
      )
      
      // House Edge réel
      const actualHouseEdge = totalWagered > 0 
        ? ((totalWagered - totalPayout) / totalWagered) * 100 
        : 0

      return {
        id: game.id,
        name: game.name,
        slug: game.slug,
        type: game.type,
        isActive: game.isActive,
        houseEdge: game.houseEdge,
        totalBets: totalBets,
        totalWagered: totalWagered.toString(),
        totalPayout: totalPayout.toString(),
        playCount: totalBets, // Nombre de parties = nombre de rounds
        actualHouseEdge: actualHouseEdge
      }
    })

    // 4. Calculer les stats globales
    const stats = {
      totalGames: games.length,
      activeGames: games.filter(g => g.isActive).length,
      totalBets: gamesWithStats.reduce((sum, g) => sum + g.totalBets, 0),
      totalWagered: gamesWithStats.reduce((sum, g) => sum + Number(g.totalWagered), 0),
      averageHouseEdge: games.reduce((sum, g) => sum + g.houseEdge, 0) / (games.length || 1)
    }

    return NextResponse.json({
      success: true,
      games: gamesWithStats,
      stats
    })

  } catch (error) {
    console.error('Games API error:', error)
    return NextResponse.json({ 
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
