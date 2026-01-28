import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function POST(request: Request) {
  const adminId = await verifySession()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { gameId, isActive } = await request.json()

  await prisma.$transaction([
    prisma.game.update({
      where: { id: gameId },
      data: { isActive }
    }),
    prisma.adminAction.create({
      data: {
        adminId,
        action: 'CHANGE_GAME_STATUS',
        targetEntityType: 'Game',
        targetEntityId: gameId,
        details: { isActive }
      }
    })
  ])

  return NextResponse.json({ success: true })
}