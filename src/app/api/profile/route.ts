// src/app/api/profile/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function GET() {
  try {
    const userId = await verifySession()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        email: true,
        avatarUrl: true,
        bannerUrl: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      profile: user
    })

  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
