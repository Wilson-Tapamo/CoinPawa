// Fichier: app/api/auth/logout/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    // suppression du cookie de session
    cookies().delete('session_token')

    return NextResponse.json({
      success: true,
      message: "Déconnexion réussie"
    }, { status: 200 })

  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}