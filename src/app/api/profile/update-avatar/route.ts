// src/app/api/profile/update-avatar/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const userId = await verifySession()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { avatarUrl } = await request.json()

    if (!avatarUrl) {
      return NextResponse.json({ error: 'Avatar manquant' }, { status: 400 })
    }

    // Mettre à jour l'avatar
    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error updating avatar:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
