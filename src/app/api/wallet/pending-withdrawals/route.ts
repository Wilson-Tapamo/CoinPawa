// app/api/wallet/pending-withdrawals/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

/**
 * GET /api/wallet/pending-withdrawals
 * Récupérer les retraits en attente de l'utilisateur
 */
export async function GET() {
  try {
    // Vérifier l'authentification
    const userId = await verifySession()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer le wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    })

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet introuvable' }, { status: 404 })
    }

    // Récupérer les retraits en attente
    const pendingWithdrawals = await prisma.transaction.findMany({
      where: {
        walletId: wallet.id,
        type: 'WITHDRAW',
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amountSats: true,
        status: true,
        toAddress: true,
        cryptoCurrency: true,
        withdrawalFee: true,
        netAmount: true,
        createdAt: true,
        metadata: true,
      },
    })

    // Convertir en USD
    const withdrawals = pendingWithdrawals.map((w) => ({
      id: w.id,
      amountUsd: Number(w.amountSats) / 100_000_000,
      netAmountUsd: w.netAmount ? Number(w.netAmount) / 100_000_000 : 0,
      feeUsd: w.withdrawalFee ? Number(w.withdrawalFee) / 100_000_000 : 0,
      crypto: w.cryptoCurrency,
      address: w.toAddress,
      status: w.status,
      createdAt: w.createdAt,
      metadata: w.metadata,
    }))

    return NextResponse.json({
      success: true,
      withdrawals,
      count: withdrawals.length,
    })
  } catch (error: any) {
    console.error('Error fetching pending withdrawals:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}