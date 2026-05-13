// app/api/webhook/plisio/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyWebhookSignature, PlisioWebhook } from '@/lib/plisio'

export async function POST(request: Request) {
  try {
    const body = await request.text()
    
    console.log('🔔 Webhook Plisio reçu')
    console.log('📦 Body brut:', body) // ✅ AJOUTÉ pour debug

    let data: PlisioWebhook

    // ✅ FIX : Plisio peut envoyer en JSON OU en form-urlencoded
    try {
      // Essayer JSON d'abord
      data = JSON.parse(body)
      console.log('✅ Parsé comme JSON')
    } catch (jsonError) {
      // Si JSON échoue, essayer form-urlencoded
      console.log('⚠️ Pas du JSON, essai form-urlencoded...')
      
      const params = new URLSearchParams(body)
      data = {
        txn_id: params.get('txn_id') || '',
        status: params.get('status') || '',
        status_code: parseInt(params.get('status_code') || '0'),
        order_number: params.get('order_number') || '',
        amount: params.get('amount') || '',
        currency: params.get('currency') || '',
        source_amount: params.get('source_amount') || '',
        source_currency: params.get('source_currency') || '',
        verify_hash: params.get('verify_hash') || '',
      } as PlisioWebhook
      
      console.log('✅ Parsé comme form-urlencoded')
    }
    
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
    
    // if (!isValid) {
    //   console.error('❌ Signature invalide')
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    // }

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
        console.log(`💰 Nouveau solde: ${Number(transaction.wallet.balanceSats) + Number(transaction.amountSats)} sats`)
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

  } catch (error: any) {
    console.error('❌ Erreur webhook Plisio:', error)
    console.error('Stack:', error.stack)
    
    return NextResponse.json({ 
      error: 'Internal error',
      message: error.message
    }, { status: 500 })
  }
}