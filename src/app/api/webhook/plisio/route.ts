// app/api/webhook/plisio/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyWebhookSignature, PlisioWebhook } from '@/lib/plisio'

export async function POST(request: Request) {
  try {
    const body = await request.text()
    
    console.log('🔔 Webhook Plisio reçu')

    // 1. Parser les données
    const data: PlisioWebhook = JSON.parse(body)
    
    console.log('📦 Données webhook:', {
      txn_id: data.txn_id,
      status: data.status,
      status_code: data.status_code,
      order_number: data.order_number,
      amount: data.amount,
      currency: data.currency
    })

    // 2. Vérifier la signature
    const isValid = verifyWebhookSignature(data)
    
    if (!isValid) {
      console.error('❌ Signature invalide')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    console.log('✅ Signature vérifiée')

    // 3. Récupérer la transaction en BDD via l'ID Plisio
    const transaction = await prisma.transaction.findFirst({
      where: { paymentRef: data.txn_id },
      include: { wallet: true }
    })

    if (!transaction) {
      console.error('❌ Transaction non trouvée:', data.txn_id)
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    console.log(`📄 Transaction trouvée: ${transaction.id}`)

    // 4. Traiter selon le statut Plisio
    // Status codes:
    // 1 = pending (en attente)
    // 2 = completed (complété et confirmé)
    // 3 = error (erreur)
    // 4 = expired (expiré)
    // 5 = cancelled (annulé)
    
    if (data.status_code === 2 && data.status === 'completed') {
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

    } else if ([3, 4, 5].includes(data.status_code)) {
      // ❌ PAIEMENT ÉCHOUÉ / EXPIRÉ / ANNULÉ
      
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

    } else if (data.status_code === 1) {
      // ⏳ EN ATTENTE
      console.log(`⏳ Paiement en attente: ${data.status}`)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ Erreur webhook Plisio:', error)
    return NextResponse.json({ 
      error: 'Internal error' 
    }, { status: 500 })
  }
}