// src/app/api/admin/users/ban/route.ts
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

    const { userId, reason } = await request.json()

    if (!userId || !reason) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }

    // Ne pas permettre de bannir un autre admin
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Impossible de bannir un administrateur' }, { status: 403 })
    }

    // Bannir l'utilisateur
    await prisma.$transaction([
      // Mettre à jour l'utilisateur
      prisma.user.update({
        where: { id: userId },
        data: {
          isBanned: true,
          bannedAt: new Date(),
          banReason: reason,
          bannedBy: adminId
        }
      }),
      // Logger l'action
      prisma.adminAction.create({
        data: {
          adminId,
          action: 'BAN_USER',
          targetUserId: userId,
          details: {
            reason,
            timestamp: new Date().toISOString()
          }
        }
      })
    ])

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error banning user:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
