// app/api/deposit/coingate/create/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { createOrder, mapCurrency } from '@/lib/coingate'

export async function POST(request: Request) {
  try {
    // 1. Vérifier la session
    const userId = await verifySession()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // 2. Récupérer les paramètres
    const body = await request.json()
    const { amount, currency } = body

    // Validation montant
    if (!amount || amount < 10 || amount > 10000) {
      return NextResponse.json({ 
        error: 'Montant invalide (min: $10, max: $10,000)' 
      }, { status: 400 })
    }

    // Validation currency
    if (!currency) {
      return NextResponse.json({ 
        error: 'Devise non spécifiée' 
      }, { status: 400 })
    }

    // 3. Récupérer le wallet de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true }
    })

    if (!user || !user.wallet) {
      return NextResponse.json({ error: 'Wallet non trouvé' }, { status: 404 })
    }

    // 4. Créer un ID de commande unique
    const orderId = `CG_${userId.substring(0, 8)}_${Date.now()}`

    // 5. Créer la transaction en BDD (statut PENDING)
    const transaction = await prisma.transaction.create({
      data: {
        walletId: user.wallet.id,
        type: 'DEPOSIT',
        amountSats: BigInt(Math.floor(amount * 100_000_000)),
        status: 'PENDING',
        paymentRef: orderId,
        cryptoCurrency: currency
      }
    })

    console.log(`📝 Transaction créée: ${transaction.id}`)

    // 6. Créer la commande CoinGate
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    const order = await createOrder({
      priceAmount: amount,
      receiveCurrency: mapCurrency(currency),
      orderId: orderId,
      title: `Dépôt de $${amount}`,
      description: `Dépôt CoinPawa - ${user.username}`,
      callbackUrl: `${baseUrl}/api/webhook/coingate`,
      successUrl: `${baseUrl}/deposit/success?tx=${transaction.id}`,
      cancelUrl: `${baseUrl}/deposit/cancel?tx=${transaction.id}`
    })

    // 7. Mettre à jour la transaction avec l'ID CoinGate
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        paymentRef: order.id.toString()
      }
    })

    console.log(`✅ Commande CoinGate créée: ${order.id}`)

    // 8. Retourner les infos de paiement
    return NextResponse.json({
      success: true,
      payment: {
        transactionId: transaction.id,
        orderId: order.id,
        orderToken: order.token,
        paymentAddress: order.payment_address,
        payAmount: order.pay_amount,
        payCurrency: order.pay_currency,
        priceAmount: order.price_amount,
        priceCurrency: order.price_currency,
        paymentUrl: order.payment_url,
        expiresAt: order.expire_at,
        status: order.status,
        qrCode: `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${order.payment_address}`
      }
    })

  } catch (error) {
    console.error('❌ Erreur création dépôt CoinGate:', error)
    
    return NextResponse.json({ 
      error: 'Erreur lors de la création du dépôt',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}