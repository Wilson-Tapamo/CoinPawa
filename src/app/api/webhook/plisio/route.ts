// app/api/webhook/plisio/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface PlisioWebhook {
  txn_id: string
  status: string
  status_code?: number
  order_number: string
  amount: string
  currency: string
  source_amount?: string
  source_currency?: string
  verify_hash?: string
}

/**
 * Parser multipart/form-data de Plisio
 */
function parseMultipartFormData(body: string): PlisioWebhook {
  const fields: Record<string, string> = {}
  
  // Extraire chaque champ
  const fieldRegex = /name="([^"]+)"\r?\n\r?\n([^\r\n-]+)/g
  let match
  
  while ((match = fieldRegex.exec(body)) !== null) {
    const [, name, value] = match
    fields[name] = value.trim()
  }
  
  console.log('📦 Champs extraits:', fields)
  
  return {
    txn_id: fields.txn_id || '',
    status: fields.status || '',
    status_code: fields.status === 'completed' ? 2 : 1,
    order_number: fields.order_number || '',
    amount: fields.amount || '',
    currency: fields.currency || '',
    source_amount: fields.source_amount,
    source_currency: fields.source_currency,
    verify_hash: fields.verify_hash,
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.text()
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔔 WEBHOOK PLISIO REÇU')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    let data: PlisioWebhook

    // Détecter le format et parser
    if (body.includes('Content-Disposition')) {
      console.log('✅ Format: multipart/form-data')
      data = parseMultipartFormData(body)
    } else if (body.startsWith('{')) {
      console.log('✅ Format: JSON')
      data = JSON.parse(body)
      if (!data.status_code && data.status) {
        data.status_code = data.status === 'completed' ? 2 : 1
      }
    } else {
      console.log('✅ Format: form-urlencoded')
      const params = new URLSearchParams(body)
      data = {
        txn_id: params.get('txn_id') || '',
        status: params.get('status') || '',
        status_code: params.get('status') === 'completed' ? 2 : 1,
        order_number: params.get('order_number') || '',
        amount: params.get('amount') || '',
        currency: params.get('currency') || '',
        source_amount: params.get('source_amount') || undefined,
        source_currency: params.get('source_currency') || undefined,
        verify_hash: params.get('verify_hash') || undefined,
      }
    }
    
    console.log('📦 Données extraites:')
    console.log('  txn_id:', data.txn_id)
    console.log('  order_number:', data.order_number)
    console.log('  status:', data.status)
    console.log('  amount:', data.amount)
    console.log('  currency:', data.currency)

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔍 RECHERCHE TRANSACTION EN BDD')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // ✅ STRATÉGIE : Chercher par plisioId (le txn_id Plisio)
    console.log('🔍 Recherche par plisioId =', data.txn_id)
    let transaction = await prisma.transaction.findFirst({
      where: { plisioId: data.txn_id },
      include: { wallet: true }
    })

    if (!transaction) {
      console.log('❌ Pas trouvé avec plisioId')
      
      // Chercher par paymentRef (order_number)
      console.log('🔍 Recherche par paymentRef =', data.order_number)
      transaction = await prisma.transaction.findFirst({
        where: { paymentRef: data.order_number },
        include: { wallet: true }
      })
    }

    if (!transaction) {
      console.log('❌ TRANSACTION NON TROUVÉE')
      
      // Logger les transactions récentes pour debug
      const recent = await prisma.transaction.findMany({
        where: { type: 'DEPOSIT' },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          paymentRef: true,
          plisioId: true,
          status: true,
          createdAt: true
        }
      })
      
      console.log('📋 Transactions récentes:', JSON.stringify(recent, null, 2))
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      return NextResponse.json({ 
        error: 'Transaction not found',
        searched: {
          plisioId: data.txn_id,
          paymentRef: data.order_number
        }
      }, { status: 404 })
    }

    console.log('✅ TRANSACTION TROUVÉE:', transaction.id)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Traiter selon le statut
    if (data.status === 'completed') {
      
      if (transaction.status !== 'COMPLETED') {
        console.log('💰 CRÉDIT DU WALLET...')

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
          const updatedWallet = await tx.wallet.update({
            where: { id: transaction.walletId },
            data: {
              balanceSats: { increment: transaction.amountSats },
              totalDepositedSats: { increment: transaction.amountSats }
            }
          })
          
          console.log('💰 Wallet crédité:')
          console.log('  walletId:', transaction.walletId)
          console.log('  creditSats:', transaction.amountSats.toString())
          console.log('  newBalanceSats:', updatedWallet.balanceSats.toString())
          console.log('  newBalanceUSD: $' + (Number(updatedWallet.balanceSats) / 100_000_000).toFixed(2))
        })

        const amountUSD = Number(transaction.amountSats) / 100_000_000
        console.log(`✅ DÉPÔT COMPLÉTÉ: $${amountUSD} pour user ${transaction.wallet.userId}`)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        
      } else {
        console.log('ℹ️ Transaction déjà complétée')
      }

    } else if (data.status === 'pending') {
      console.log(`⏳ Paiement en attente`)
      
    } else if (['error', 'expired', 'cancelled'].includes(data.status)) {
      console.log(`❌ Paiement échoué: ${data.status}`)
      
      if (transaction.status === 'PENDING') {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: 'FAILED' }
        })
      }
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('❌ ERREUR WEBHOOK:', error)
    console.error('Stack:', error.stack)
    
    return NextResponse.json({ 
      error: 'Internal error',
      message: error.message
    }, { status: 500 })
  }
}