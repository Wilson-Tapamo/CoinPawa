import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password, email, referralCode } = body

    // 1. Validation : Seul pseudo et mdp sont obligatoires
    if (!username || !password) {
      return NextResponse.json(
        { error: "Pseudo et mot de passe requis" }, 
        { status: 400 }
      )
    }

    // 2. Vérification PSEUDO existe 
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Ce pseudo est déjà pris" }, 
        { status: 409 }
      )
    }

    // 3. (Optionnel) Vérifier si l'email est pris (seulement s'il est fourni)
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email }
      })
      if (existingEmail) {
        return NextResponse.json(
          { error: "Cet email est déjà lié à un compte" }, 
          { status: 409 }
        )
      }
    }

    // 4. Gestion du Parrainage
    let referrerId = null
    if (referralCode) {
       const referrer = await prisma.user.findUnique({ where: { id: referralCode } }) // ou username du parrain
       if (referrer) referrerId = referrer.id
    }

    // 5. Hashage & Création
    const passwordHash = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        username,
        email: email || null, // On s'assure que c'est null si vide
        passwordHash,
        referrerId,
        wallet: {
          create: {
            balanceSats: 0,
            totalDepositedSats: 0,
            totalWageredSats: 0
          }
        }
      }
    })

    // 6. Connexion Auto
    await createSession(newUser.id)

    return NextResponse.json({ success: true, userId: newUser.id }, { status: 201 })

  } catch (error) {
    console.error("Erreur Register:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}