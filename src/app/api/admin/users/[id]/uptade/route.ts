// src/app/api/admin/users/[id]/update/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const userId = params.id
    const { email } = await request.json()

    // Mettre à jour l'utilisateur
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { email }
      }),
      prisma.adminAction.create({
        data: {
          adminId,
          action: 'EDIT_USER',
          targetUserId: userId,
          details: {
            field: 'email',
            newValue: email
          }
        }
      })
    ])

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error updating user:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
