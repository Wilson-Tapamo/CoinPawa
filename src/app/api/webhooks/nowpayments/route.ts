// app/api/webhooks/nowpayments/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logPayment } from '@/lib/nowpayments'
import { usdToSats } from '@/lib/payment-limits'
import crypto from 'crypto'

const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET!
const SURPLUS_CREDIT_PERCENTAGE = 0.95 // 95% du surplus crédité au user

/**
 * Vérifier la signature du webhook NOWPayments
 */
function verifySignature(body: string, signature: string): boolean {
  if (!NOWPAYMENTS_IPN_SECRET) {
    console.error('NOWPAYMENTS_IPN_SECRET not configured')
    return false
  }

  const expectedSignature = crypto
    .createHmac('sha512', NOWPAYMENTS_IPN_SECRET)
    .update(body)
    .digest('hex')

  return signature === expectedSignature
}

/**
 * Webhook NOWPayments
 * POST /api/webhooks/nowpayments
 */
export async function POST(request: Request) {
  try {
    // 1. Récupérer le body brut
    const bodyText = await request.text()
    const signature = request.headers.get('x-nowpayments-sig')

    logPayment('WEBHOOK_RECEIVED', {
      signature: signature?.substring(0, 20) + '...',
      bodyLength: bodyText.length,
    })

    // 2. Vérifier la signature
    if (!signature) {
      console.error('Missing signature header')
      return NextResponse.json({ error: 'Missing signature' }, { status: 403 })
    }

    if (!verifySignature(bodyText, signature)) {
      console.error('Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    // 3. Parser le body
    const webhookData = JSON.parse(bodyText)
    logPayment('WEBHOOK_DATA', webhookData)

    const {
      payment_id,
      payment_status,
      pay_amount,
      pay_currency,
      price_amount,
      price_currency,
      outcome_amount,
      outcome_currency,
      order_id,
      actually_paid,
    } = webhookData

    // 4. Récupérer la transaction en BDD
    const transaction = await prisma.transaction.findUnique({
      where: { nowPaymentId: payment_id },
      include: { wallet: true },
    })

    if (!transaction) {
      console.error('Transaction not found:', payment_id)
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // 5. Vérifier que la transaction est en PENDING
    if (transaction.status !== 'PENDING') {
      console.log('Transaction already processed:', transaction.status)
      return NextResponse.json({ status: 'already_processed' })
    }

    // 6. Traiter selon le statut
    switch (payment_status) {
      case 'finished':
      case 'confirmed':
        await handleSuccessfulPayment(transaction, webhookData)
        break

      case 'partially_paid':
        await handlePartialPayment(transaction, webhookData)
        break

      case 'failed':
      case 'expired':
      case 'refunded':
        await handleFailedPayment(transaction, payment_status)
        break

      case 'sending':
      case 'waiting':
        logPayment('PAYMENT_WAITING', { payment_id, payment_status })
        break

      default:
        console.warn('Unknown payment status:', payment_status)
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Gérer un paiement réussi avec gestion du surplus
 */
async function handleSuccessfulPayment(transaction: any, webhookData: any) {
  const {
    payment_id,
    outcome_amount,
    outcome_currency,
    pay_amount,
    pay_currency,
    price_amount,
    actually_paid,
  } = webhookData

  const usdtReceived = parseFloat(outcome_amount)
  const usdtExpected = parseFloat(price_amount)
  
  // Calculer le surplus
  const surplus = usdtReceived - usdtExpected
  
  // Montant principal (ce qui était demandé)
  const mainAmount = Math.min(usdtReceived, usdtExpected)
  const mainAmountSats = usdToSats(mainAmount)

  logPayment('PAYMENT_SUCCESSFUL', {
    payment_id,
    expected: usdtExpected,
    received: usdtReceived,
    surplus: surplus > 0 ? surplus : 0,
    mainAmount,
  })

  // Transaction atomique
  await prisma.$transaction(async (tx) => {
    // 1. Mettre à jour la transaction principale
    await tx.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'COMPLETED',
        amountSats: mainAmountSats,
        usdtAmount: outcome_amount.toString(),
        exchangeRate: (parseFloat(pay_amount) / usdtReceived).toString(),
        confirmations: 1,
        metadata: {
          ...transaction.metadata,
          actually_paid: actually_paid,
          outcome_currency,
          expected_amount: usdtExpected,
          received_amount: usdtReceived,
          surplus_amount: surplus > 0 ? surplus : 0,
          webhook_received_at: new Date().toISOString(),
        },
      },
    })

    // 2. Créditer le montant principal
    await tx.wallet.update({
      where: { id: transaction.walletId },
      data: {
        balanceSats: { increment: mainAmountSats },
        totalDepositedSats: { increment: mainAmountSats },
      },
    })

    logPayment('MAIN_AMOUNT_CREDITED', {
      walletId: transaction.walletId,
      amountSats: mainAmountSats.toString(),
      amountUsd: mainAmount,
    })

    // 3. Si surplus positif → Créer une transaction bonus (95% crédité)
    if (surplus > 0) {
      const bonusAmount = surplus * SURPLUS_CREDIT_PERCENTAGE // 95%
      const platformFee = surplus - bonusAmount // 5%
      const bonusAmountSats = usdToSats(bonusAmount)

      // Créer une transaction de type DEPOSIT_BONUS
      await tx.transaction.create({
        data: {
          walletId: transaction.walletId,
          type: 'DEPOSIT_BONUS', // 🆕 Nouveau type
          amountSats: bonusAmountSats,
          status: 'COMPLETED',
          paymentRef: `BONUS_${transaction.paymentRef}`,
          cryptoCurrency: transaction.cryptoCurrency,
          usdtAmount: bonusAmount.toString(),
          metadata: {
            parent_transaction_id: transaction.id,
            parent_payment_id: payment_id,
            surplus_total: surplus,
            bonus_percentage: SURPLUS_CREDIT_PERCENTAGE * 100,
            platform_fee: platformFee,
            note: `Bonus de surplus - ${(SURPLUS_CREDIT_PERCENTAGE * 100)}% crédité`,
          },
        },
      })

      // Créditer le bonus au wallet
      await tx.wallet.update({
        where: { id: transaction.walletId },
        data: {
          balanceSats: { increment: bonusAmountSats },
          totalDepositedSats: { increment: bonusAmountSats },
        },
      })

      logPayment('SURPLUS_BONUS_CREDITED', {
        walletId: transaction.walletId,
        surplusTotal: surplus,
        bonusAmount,
        bonusAmountSats: bonusAmountSats.toString(),
        platformFee,
        bonusPercentage: SURPLUS_CREDIT_PERCENTAGE * 100,
      })
    }
  })

  logPayment('PAYMENT_FULLY_PROCESSED', {
    walletId: transaction.walletId,
    totalCredited: usdtReceived,
    mainAmount,
    bonusAmount: surplus > 0 ? surplus * SURPLUS_CREDIT_PERCENTAGE : 0,
  })
}

/**
 * Gérer un paiement partiel
 */
async function handlePartialPayment(transaction: any, webhookData: any) {
  const { payment_id, actually_paid, pay_amount } = webhookData

  logPayment('PAYMENT_PARTIAL', {
    payment_id,
    actually_paid,
    expected: pay_amount,
  })

  await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      status: 'FAILED',
      metadata: {
        ...transaction.metadata,
        failure_reason: 'partially_paid',
        actually_paid,
        expected_amount: pay_amount,
        webhook_received_at: new Date().toISOString(),
      },
    },
  })
}

/**
 * Gérer un paiement échoué
 */
async function handleFailedPayment(transaction: any, paymentStatus: string) {
  logPayment('PAYMENT_FAILED', {
    transactionId: transaction.id,
    status: paymentStatus,
  })

  const status = paymentStatus === 'expired' ? 'EXPIRED' : 'FAILED'

  await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      status,
      metadata: {
        ...transaction.metadata,
        failure_reason: paymentStatus,
        webhook_received_at: new Date().toISOString(),
      },
    },
  })
}