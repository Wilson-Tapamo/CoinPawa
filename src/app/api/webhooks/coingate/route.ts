// app/api/webhook/coingate/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-coingate-signature')

    console.log('🔔 Webhook CoinGate reçu')

    // 1. Vérifier la signature
    if (signature) {
      const token = process.env.COINGATE_API_KEY || ''
      const expectedSignature = crypto
        .createHmac('sha256', token)
        .update(body)
        .digest('hex')

      if (signature !== expectedSignature) {
        console.error('❌ Signature invalide')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }

      console.log('✅ Signature vérifiée')
    }

    // 2. Parser les données
    const data = JSON.parse(body)
    
    console.log('📦 Données webhook:', {
      id: data.id,
      status: data.status,
      order_id: data.order_id,
      price_amount: data.price_amount,
      pay_currency: data.pay_currency
    })

    // 3. Récupérer la transaction en BDD via l'ID CoinGate
    const transaction = await prisma.transaction.findFirst({
      where: { paymentRef: data.id.toString() },
      include: { wallet: true }
    })

    if (!transaction) {
      console.error('❌ Transaction non trouvée:', data.id)
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    console.log(`📄 Transaction trouvée: ${transaction.id}`)

    // 4. Traiter selon le statut CoinGate
    // Statuts possibles: new, pending, confirming, paid, invalid, expired, canceled, refunded
    
    if (data.status === 'paid') {
      // ✅ PAIEMENT COMPLÉTÉ
      
      if (transaction.status !== 'COMPLETED') {
        console.log('💰 Crédit du wallet...')

        await prisma.$transaction(async (tx) => {
          // Mettre à jour la transaction
          await tx.transaction.update({
            where: { id: transaction.id },
            data: { 
              status: 'COMPLETED',
              updatedAt: new Date()
            }
          })

          // Créditer le wallet
          await tx.wallet.update({
            where: { id: transaction.walletId },
            data: {
              balanceSats: {
                increment: transaction.amountSats
              },
              totalDepositedSats: {
                increment: transaction.amountSats
              }
            }
          })
        })

        const amountUSD = Number(transaction.amountSats) / 100_000_000

        console.log(`✅ Dépôt complété: $${amountUSD} pour user ${transaction.wallet.userId}`)
      } else {
        console.log('ℹ️ Transaction déjà complétée')
      }

    } else if (['invalid', 'expired', 'canceled'].includes(data.status)) {
      // ❌ PAIEMENT ÉCHOUÉ
      
      if (transaction.status === 'PENDING') {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { 
            status: 'FAILED',
            updatedAt: new Date()
          }
        })

        console.log(`❌ Dépôt échoué: ${transaction.id} - Statut: ${data.status}`)
      }

    } else if (['pending', 'confirming'].includes(data.status)) {
      // ⏳ EN COURS
      console.log(`⏳ Paiement en cours: ${data.status}`)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ Erreur webhook CoinGate:', error)
    return NextResponse.json({ 
      error: 'Internal error' 
    }, { status: 500 })
  }
}