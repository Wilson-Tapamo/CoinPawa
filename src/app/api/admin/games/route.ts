import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function GET() {
  const adminId = await verifySession()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const games = await prisma.game.findMany({
    orderBy: { name: 'asc' }
  })

  const stats = {
    totalGames: games.length,
    activeGames: games.filter(g => g.isActive).length,
    totalBets: games.reduce((sum, g) => sum + g.totalBets, 0),
    totalWagered: games.reduce((sum, g) => sum + Number(g.totalWagered), 0),
    averageHouseEdge: games.reduce((sum, g) => sum + g.houseEdge, 0) / games.length
  }

  return NextResponse.json({
    success: true,
    games: games.map(g => ({
      ...g,
      totalWagered: g.totalWagered.toString(),
      totalPayout: g.totalPayout.toString()
    })),
    stats
  })
}