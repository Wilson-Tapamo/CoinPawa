// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET)

export async function middleware(request: NextRequest) {
  // Vérifier si c'est une route admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    try {
      // Récupérer le cookie de session
      const token = request.cookies.get('session_token')?.value

      if (!token) {
        // Pas de token → Rediriger vers login
        return NextResponse.redirect(new URL('/login', request.url))
      }

      // Vérifier le JWT (compatible Edge Runtime)
      const { payload } = await jwtVerify(token, secret, {
        algorithms: ['HS256'],
      })

      const userId = payload.userId as string

      // ✅ SOLUTION : Vérifier le rôle via une API route au lieu de Prisma direct
      // Faire une requête interne à notre propre API
      const baseUrl = request.nextUrl.origin
      const roleCheckResponse = await fetch(`${baseUrl}/api/admin/check-role`, {
        headers: {
          'x-user-id': userId,
          'x-internal-request': 'true'
        }
      })

      if (!roleCheckResponse.ok) {
        // Pas admin → Rediriger vers accueil
        console.log('❌ User is not admin, redirecting to /')
        return NextResponse.redirect(new URL('/', request.url))
      }

      // Admin vérifié → Autoriser l'accès
      console.log('✅ User is admin, allowing access to /admin')
      return NextResponse.next()

    } catch (error) {
      console.error('Middleware error:', error)
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Autres routes → Laisser passer
  return NextResponse.next()
}

// Configuration : appliquer le middleware aux routes /admin
export const config = {
  matcher: [
    '/admin/:path*',  // Toutes les routes /admin/*
  ]
}