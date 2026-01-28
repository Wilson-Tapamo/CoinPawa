// src/app/api/admin/users/[id]/notes/route.ts
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
      select: { role: true, username: true }
    })

    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const userId = params.id
    const { note, isImportant } = await request.json()

    if (!note || !note.trim()) {
      return NextResponse.json({ error: 'Note vide' }, { status: 400 })
    }

    // Créer la note
    await prisma.adminNote.create({
      data: {
        userId,
        authorId: adminId,
        authorName: admin.username,
        note: note.trim(),
        isImportant: isImportant || false
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error adding note:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
