// app/api/deposit/plisio/create/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { createInvoice, mapCurrency } from '@/lib/plisio'

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
    const orderNumber = `PL_${userId.substring(0, 8)}_${Date.now()}`

    // 5. Créer la transaction en BDD (statut PENDING)
    const transaction = await prisma.transaction.create({
      data: {
        walletId: user.wallet.id,
        type: 'DEPOSIT',
        amountSats: BigInt(Math.floor(amount * 100_000_000)),
        status: 'PENDING',
        paymentRef: orderNumber,
        cryptoCurrency: currency
      }
    })

    console.log(`📝 Transaction créée: ${transaction.id}`)

    // 6. Créer l'invoice Plisio
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://coin-power.vercel.app'
    
    const invoice = await createInvoice({
      sourceAmount: amount,
      currency: mapCurrency(currency),
      orderNumber: orderNumber,
      orderName: `Dépôt de $${amount} - ${user.username}`,
      email: user.email || undefined,
      callbackUrl: `${baseUrl}/api/webhook/plisio`
    })

    // 7. Mettre à jour la transaction avec l'ID Plisio
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        paymentRef: invoice.txn_id
      }
    })

    console.log(`✅ Invoice Plisio créée: ${invoice.txn_id}`)

    // 8. Retourner les infos de paiement
    return NextResponse.json({
      success: true,
      payment: {
        transactionId: transaction.id,
        txnId: invoice.txn_id,
        invoiceUrl: invoice.invoice_url,
        paymentAddress: invoice.wallet_hash,
        amount: invoice.amount,
        currency: invoice.currency,
        sourceAmount: invoice.source_amount,
        sourceCurrency: invoice.source_currency,
        qrCode: invoice.qr_code,
        expectedConfirmations: invoice.expected_confirmations
      }
    })

  } catch (error) {
    console.error('❌ Erreur création dépôt Plisio:', error)
    
    return NextResponse.json({ 
      error: 'Erreur lors de la création du dépôt',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}