// src/app/api/admin/check-role/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export async function GET() {
  try {
    // Récupérer l'userId depuis les headers (envoyé par le middleware)
    const headersList = headers()
    const userId = headersList.get('x-user-id')
    const isInternalRequest = headersList.get('x-internal-request')

    // Sécurité : cette route ne peut être appelée que depuis le middleware
    if (!isInternalRequest || isInternalRequest !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'No user ID' }, { status: 401 })
    }

    // Vérifier le rôle en BDD (ici on peut utiliser Prisma car c'est une API route normale)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Vérifier si admin
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Not admin' }, { status: 403 })
    }

    // User est admin
    return NextResponse.json({ 
      success: true,
      role: user.role 
    })

  } catch (error) {
    console.error('Error checking role:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}