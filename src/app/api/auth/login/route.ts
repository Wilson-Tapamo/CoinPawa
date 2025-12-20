import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // recuperation des infos de l'utilisateur
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: "Pseudo et mot de passe requis" }, 
        { status: 400 }
      )
    }

    // 1. Chercher l'utilisateur par PSEUDO
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Identifiants incorrects" }, 
        { status: 401 }
      )
    }

    // 2. Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Identifiants incorrects" }, 
        { status: 401 }
      )
    }

    // 3. Créer la session
    await createSession(user.id)

    return NextResponse.json({ success: true, user: { username: user.username } })

  } catch (error) {
    console.error("Erreur Login:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}