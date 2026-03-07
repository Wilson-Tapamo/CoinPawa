// app/api/wallet/simulate-payment/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { usdToSats } from '@/lib/payment-limits'
import { notifyDepositConfirmed } from '@/lib/notifications' // 🆕 AJOUTÉ

/**
 * Route de TEST pour simuler un paiement réussi
 * À DÉSACTIVER EN PRODUCTION !
 */
export async function POST(request: Request) {
  // ⚠️ SÉCURITÉ : Désactiver en production
  // if (process.env.NODE_ENV === 'production') {
  //   return NextResponse.json({ error: 'Non disponible en production' }, { status: 403 })
  // }

  try {
    // 1. Vérifier l'authentification
    const userId = await verifySession()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // 2. Récupérer les données
    const body = await request.json()
    const { paymentId, amountUsd, withSurplus } = body

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID manquant' }, { status: 400 })
    }

    // 3. Trouver la transaction
    const transaction = await prisma.transaction.findFirst({
      where: {
        nowPaymentId: paymentId,
        wallet: { userId },
      },
      include: { wallet: true },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction introuvable' }, { status: 404 })
    }

    if (transaction.status !== 'PENDING') {
      return NextResponse.json({ error: 'Transaction déjà traitée' }, { status: 400 })
    }

    // 4. Calculer les montants
    const baseAmount = amountUsd || parseFloat((transaction.metadata as any)?.price_amount || '10')
    const receivedAmount = withSurplus ? baseAmount * 1.5 : baseAmount // +50% si surplus
    const surplus = receivedAmount - baseAmount

    console.log('🧪 SIMULATION DE PAIEMENT', {
      paymentId,
      baseAmount,
      receivedAmount,
      withSurplus,
      surplus,
    })

    // 5. Simuler la logique du webhook
    const mainAmountSats = usdToSats(baseAmount)

    await prisma.$transaction(async (tx) => {
      // Mettre à jour la transaction principale
      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'COMPLETED',
          amountSats: mainAmountSats,
          usdtAmount: receivedAmount.toString(),
          confirmations: 1,
          metadata: {
            ...(transaction.metadata as any),
            simulated: true,
            received_amount: receivedAmount,
            expected_amount: baseAmount,
            surplus_amount: surplus,
            test_mode: true,
          },
        },
      })

      // Créditer le montant principal
      await tx.wallet.update({
        where: { id: transaction.walletId },
        data: {
          balanceSats: { increment: mainAmountSats },
          totalDepositedSats: { increment: mainAmountSats },
        },
      })

      // Si surplus, créer transaction bonus (95%)
      if (withSurplus && surplus > 0) {
        const bonusAmount = surplus * 0.95
        const platformFee = surplus - bonusAmount
        const bonusAmountSats = usdToSats(bonusAmount)

        await tx.transaction.create({
          data: {
            walletId: transaction.walletId,
            type: 'DEPOSIT_BONUS',
            amountSats: bonusAmountSats,
            status: 'COMPLETED',
            paymentRef: `BONUS_${transaction.paymentRef}`,
            cryptoCurrency: transaction.cryptoCurrency,
            usdtAmount: bonusAmount.toString(),
            metadata: {
              parent_transaction_id: transaction.id,
              surplus_total: surplus,
              bonus_percentage: 95,
              platform_fee: platformFee,
              note: 'Bonus de surplus - 95% crédité',
              simulated: true,
              test_mode: true,
            },
          },
        })

        // Créditer le bonus
        await tx.wallet.update({
          where: { id: transaction.walletId },
          data: {
            balanceSats: { increment: bonusAmountSats },
            totalDepositedSats: { increment: bonusAmountSats },
          },
        })

        console.log('🎁 BONUS SIMULÉ', {
          surplusTotal: surplus,
          bonusAmount,
          platformFee,
        })
      }
    })

    // 🆕 6. CRÉER LA NOTIFICATION
    try {
      const currency = transaction.cryptoCurrency || 'USDT'
      await notifyDepositConfirmed(userId, receivedAmount, currency)
      console.log(`🔔 Notification envoyée (simulation) pour user ${userId}`)
    } catch (notifError) {
      console.error('❌ Erreur création notification:', notifError)
      // Ne pas faire échouer la simulation
    }

    return NextResponse.json({
      success: true,
      message: withSurplus
        ? `Paiement simulé avec succès ! Crédité: ${baseAmount} USD + bonus ${(surplus * 0.95).toFixed(2)} USD`
        : `Paiement simulé avec succès ! Crédité: ${baseAmount} USD`,
      transaction: {
        id: transaction.id,
        amount: baseAmount,
        received: receivedAmount,
        bonus: withSurplus ? surplus * 0.95 : 0,
      },
    })
  } catch (error: any) {
    console.error('Erreur simulation paiement:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}