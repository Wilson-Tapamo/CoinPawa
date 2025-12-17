import { SignJWT } from 'jose'
import { cookies } from 'next/headers'

// Récupère ta clé secrète dans le fichier .env
const secret = new TextEncoder().encode(process.env.JWT_SECRET)

export async function createSession(userId: string) {
  // 1. Création du Token JWT
  const jwt = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // La session dure 7 jours
    .sign(secret)

  // 2. Stockage dans un Cookie sécurisé
  cookies().set('session_token', jwt, {
    httpOnly: true, // Invisible pour le JavaScript (Anti-Hack)
    secure: process.env.NODE_ENV === 'production', // HTTPS en ligne
    sameSite: 'lax', // Protection CSRF
    maxAge: 60 * 60 * 24 * 7, // 7 jours
    path: '/',
  })
}