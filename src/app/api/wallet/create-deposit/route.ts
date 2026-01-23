// app/api/wallet/create-deposit/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { createPayment, logPayment } from '@/lib/nowpayments'
import { validateDepositAmount, usdToSats } from '@/lib/payment-limits'

export async function POST(request: Request) {
  try {
    // 1. Vérifier l'authentification
    const userId = await verifySession()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // 2. Récupérer les données
    const body = await request.json()
    const { currency, amountUsd } = body

    // Validation des données
    if (!currency || !amountUsd) {
      return NextResponse.json(
        { error: 'Paramètres manquants (currency, amountUsd)' },
        { status: 400 }
      )
    }

    const amount = parseFloat(amountUsd)
    if (isNaN(amount)) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
    }

    // 3. Valider le montant
    const validation = validateDepositAmount(amount)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // 4. Vérifier que le wallet existe
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    })

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet introuvable' }, { status: 404 })
    }

    // 5. Générer une référence unique pour le paiement
    const orderId = `DEP_${userId}_${Date.now()}`

    // 6. Créer le paiement sur NOWPayments
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const ipnCallbackUrl = `${appUrl}/api/webhooks/nowpayments`

    logPayment('CREATE_PAYMENT_REQUEST', {
      orderId,
      amount,
      currency,
      userId,
    })

    const payment = await createPayment({
      priceAmount: amount,
      payCurrency: currency,
      orderId,
      orderDescription: `Casino deposit - ${amount} USD`,
      ipnCallbackUrl,
    })

    logPayment('CREATE_PAYMENT_RESPONSE', payment)

    // 7. Créer la transaction en BDD (status: PENDING)
    const transaction = await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEPOSIT',
        amountSats: 0, // Sera mis à jour lors du webhook
        status: 'PENDING',
        paymentRef: orderId,

        // Champs crypto
        cryptoCurrency: currency.toUpperCase(),
        cryptoAmount: payment.pay_amount.toString(),
        usdtAmount: '0', // Sera mis à jour lors du webhook

        // NOWPayments
        nowPaymentId: payment.payment_id,
        paymentUrl: payment.pay_address,
        paymentExpiry: payment.expiration_estimate_date
          ? new Date(payment.expiration_estimate_date)
          : new Date(Date.now() + 30 * 60 * 1000), // 30 minutes par défaut

        // Métadonnées
        metadata: {
          price_amount: payment.price_amount,
          price_currency: payment.price_currency,
          outcome_currency: payment.outcome_currency,
        },
      },
    })

    logPayment('TRANSACTION_CREATED', transaction)

    // 8. Retourner les infos du paiement
    return NextResponse.json({
      success: true,
      payment: {
        id: payment.payment_id,
        orderId: orderId,
        status: payment.payment_status,
        
        // Infos de paiement
        payAddress: payment.pay_address,
        payAmount: payment.pay_amount,
        payCurrency: payment.pay_currency,
        
        // Montant USD
        priceAmount: payment.price_amount,
        priceCurrency: payment.price_currency,
        
        // URL de paiement (pour QR code)
        paymentUrl: `${currency.toLowerCase()}:${payment.pay_address}?amount=${payment.pay_amount}`,
        
        // Expiration
        expiresAt: payment.expiration_estimate_date || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Error creating deposit:', error)
    
    return NextResponse.json(
      {
        error: 'Erreur lors de la création du paiement',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}