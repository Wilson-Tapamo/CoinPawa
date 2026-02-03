// src/app/api/admin/users/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function GET(
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
      select: { role: true }
    })

    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const userId = params.id

    // Récupérer les détails complets de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: {
          select: {
            id: true,  // ✅ AJOUTER pour récupérer les transactions
            balanceSats: true,
            totalDepositedSats: true,
            totalWageredSats: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }

    // Récupérer les transactions récentes
    const transactions = user.wallet
      ? await prisma.transaction.findMany({
          where: { walletId: user.wallet.id },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            type: true,
            amountSats: true,
            status: true,
            createdAt: true
          }
        })
      : []

    // Formater les données
    const formattedUser = {
      ...user,
      wallet: user.wallet ? {
        balanceSats: user.wallet.balanceSats.toString(),
        totalDepositedSats: user.wallet.totalDepositedSats.toString(),
        totalWageredSats: user.wallet.totalWageredSats.toString()
      } : null,
      transactions: transactions.map(tx => ({
        ...tx,
        amountSats: tx.amountSats.toString()
      }))
    }

    return NextResponse.json({
      success: true,
      user: formattedUser
    })

  } catch (error) {
    console.error('Error fetching user details:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}