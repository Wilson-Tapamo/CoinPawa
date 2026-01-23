// app/api/wallet/simulate-withdrawal-complete/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

/**
 * Route de TEST pour simuler la complétion d'un retrait
 * Simule l'envoi de la crypto et marque le retrait comme COMPLETED
 * À DÉSACTIVER EN PRODUCTION !
 */
export async function POST(request: Request) {
  // ⚠️ SÉCURITÉ : Désactiver en production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Non disponible en production' }, { status: 403 })
  }

  try {
    // 1. Vérifier l'authentification
    const userId = await verifySession()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // 2. Récupérer le withdrawal ID
    const body = await request.json()
    const { withdrawalId } = body

    if (!withdrawalId) {
      return NextResponse.json({ error: 'Withdrawal ID manquant' }, { status: 400 })
    }

    // 3. Trouver la transaction
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: withdrawalId,
        type: 'WITHDRAW',
        wallet: { userId },
      },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Retrait introuvable' }, { status: 404 })
    }

    if (transaction.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Ce retrait a déjà été traité' },
        { status: 400 }
      )
    }

    // 4. Simuler l'envoi crypto et marquer comme COMPLETED
    const fakeTxHash = `0x${Math.random().toString(16).substr(2, 64)}`

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'COMPLETED',
        txHash: fakeTxHash,
        confirmations: 1,
        metadata: {
          ...(transaction.metadata as any),
          simulated: true,
          test_mode: true,
          completed_at: new Date().toISOString(),
          tx_hash: fakeTxHash,
        },
      },
    })

    console.log('🧪 RETRAIT SIMULÉ COMME COMPLÉTÉ', {
      withdrawalId,
      txHash: fakeTxHash,
    })

    return NextResponse.json({
      success: true,
      message: 'Retrait simulé avec succès ! La crypto a été "envoyée".',
      withdrawal: {
        id: transaction.id,
        status: 'COMPLETED',
        txHash: fakeTxHash,
        note: 'En production, la vraie crypto serait envoyée à l\'adresse fournie.',
      },
    })
  } catch (error: any) {
    console.error('Erreur simulation retrait:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}