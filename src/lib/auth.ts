// Fichier: lib/auth.ts
import { SignJWT, jwtVerify } from 'jose' // On ajoute jwtVerify ici
import { cookies } from 'next/headers'

const secret = new TextEncoder().encode(process.env.JWT_SECRET)

// 1. Fonction pour Créer la Session (Utilisée lors du Login/Register)
export async function createSession(userId: string) {
  const jwt = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)

  cookies().set('session_token', jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 jours
    path: '/',
  })
}

// 2. Fonction pour Vérifier la Session (Utilisée dans les APIs protégées)
export async function verifySession() {
  const cookieStore = cookies()
  const token = cookieStore.get('session_token')?.value

  if (!token) return null

  try {
    // On vérifie que le token est valide et généré par nous
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    })
    return payload.userId as string
  } catch {
    // Si le token est falsifié ou expiré
    return null
  }
}