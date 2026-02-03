// src/app/api/profile/update-banner/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const userId = await verifySession()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { bannerUrl } = await request.json()

    if (!bannerUrl) {
      return NextResponse.json({ error: 'Bannière manquante' }, { status: 400 })
    }

    // Mettre à jour la bannière
    await prisma.user.update({
      where: { id: userId },
      data: { bannerUrl }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error updating banner:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
