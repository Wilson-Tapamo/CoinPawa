// src/app/api/admin/me/route.ts
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function GET() {
  try {
    const userId = await verifySession()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer les infos admin
    const admin = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        email: true,
        role: true
      }
    })

    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Calculer les badges (notifications)
    const pendingWithdrawals = await prisma.transaction.count({
      where: {
        type: 'WITHDRAW',
        status: 'PENDING'
      }
    })

    return NextResponse.json({
      success: true,
      admin: {
        username: admin.username,
        email: admin.email
      },
      badges: {
        pendingWithdrawals
      }
    })

  } catch (error) {
    console.error('Error fetching admin info:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
