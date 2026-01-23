// app/api/wallet/check-payment/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { getPaymentStatus, logPayment } from '@/lib/nowpayments'

export async function POST(request: Request) {
  try {
    // 1. Vérifier l'authentification
    const userId = await verifySession()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // 2. Récupérer le payment ID
    const body = await request.json()
    const { paymentId } = body

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID manquant' }, { status: 400 })
    }

    // 3. Vérifier que la transaction appartient bien à cet utilisateur
    const transaction = await prisma.transaction.findFirst({
      where: {
        nowPaymentId: paymentId,
        wallet: {
          userId: userId,
        },
      },
      include: {
        wallet: true,
      },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction introuvable' }, { status: 404 })
    }

    // 4. Vérifier le statut sur NOWPayments
    const paymentStatus = await getPaymentStatus(paymentId)
    
    logPayment('CHECK_PAYMENT_STATUS', {
      paymentId,
      status: paymentStatus.payment_status,
      actuallyPaid: paymentStatus.actually_paid,
    })

    // 5. Retourner le statut
    return NextResponse.json({
      success: true,
      payment: {
        id: paymentStatus.payment_id,
        status: paymentStatus.payment_status,
        
        // Montants
        payAmount: paymentStatus.pay_amount,
        payCurrency: paymentStatus.pay_currency,
        actuallyPaid: paymentStatus.actually_paid,
        
        // Conversion
        outcomeAmount: paymentStatus.outcome_amount,
        outcomeCurrency: paymentStatus.outcome_currency,
        
        // Transaction locale
        localStatus: transaction.status,
        localAmount: transaction.amountSats.toString(),
      },
    })
  } catch (error: any) {
    console.error('Error checking payment:', error)
    
    return NextResponse.json(
      {
        error: 'Erreur lors de la vérification du paiement',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}