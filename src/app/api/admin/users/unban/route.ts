// src/app/api/admin/users/unban/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function POST(request: Request) {
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

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID manquant' }, { status: 400 })
    }

    // Débannir l'utilisateur
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          isBanned: false,
          bannedAt: null,
          banReason: null,
          bannedBy: null
        }
      }),
      prisma.adminAction.create({
        data: {
          adminId,
          action: 'UNBAN_USER',
          targetUserId: userId,
          details: {
            timestamp: new Date().toISOString()
          }
        }
      })
    ])

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error unbanning user:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
