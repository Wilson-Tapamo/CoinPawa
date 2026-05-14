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
    console.log('🔍 Tentative 1: plisioId =', data.txn_id)
    let transaction = await prisma.transaction.findFirst({
      where: { plisioId: data.txn_id },
      include: { wallet: true }
    })

    if (!transaction) {
      console.log('❌ Pas trouvé avec plisioId')
      
      // ✅ FALLBACK 1 : Chercher par paymentRef = txn_id (cas actuel - plisioId pas sauvegardé)
      console.log('🔍 Tentative 2: paymentRef =', data.txn_id)
      transaction = await prisma.transaction.findFirst({
        where: { paymentRef: data.txn_id },
        include: { wallet: true }
      })
    }

    if (!transaction) {
      console.log('❌ Pas trouvé avec txn_id dans paymentRef')
      
      // ✅ FALLBACK 2 : Chercher par paymentRef = order_number (au cas où)
      console.log('🔍 Tentative 3: paymentRef =', data.order_number)
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

        // ✅ RÉCUPÉRER LES DÉTAILS EXACTS VIA L'API PLISIO
        let receivedAmount: number
        let fee: number = 0
        
        try {
          const apiKey = process.env.PLISIO_API_KEY
          const apiUrl = `https://plisio.net/api/v1/operations/${data.txn_id}?api_key=${apiKey}`
          
          console.log('🔍 Récupération détails transaction Plisio...')
          const apiResponse = await fetch(apiUrl)
          const apiData = await apiResponse.json()
          
          if (apiData.status === 'success' && apiData.data) {
            const amount = parseFloat(apiData.data.amount || '0')
            fee = parseFloat(apiData.data.fee || '0')
            receivedAmount = amount - fee // Montant net = montant - frais
            
            console.log('📊 Détails API Plisio:')
            console.log('  Amount:', amount, apiData.data.currency)
            console.log('  Fee:', fee, apiData.data.currency)
            console.log('  Net (received):', receivedAmount, apiData.data.currency)
          } else {
            console.warn('⚠️ API Plisio n\'a pas retourné les détails, utilisation montant webhook')
            receivedAmount = parseFloat(data.amount)
          }
        } catch (apiError) {
          console.error('❌ Erreur API Plisio:', apiError)
          console.warn('⚠️ Fallback: utilisation montant webhook')
          receivedAmount = parseFloat(data.amount)
        }
        
        const receivedSats = BigInt(Math.floor(receivedAmount * 100_000_000))
        
        console.log('💵 Montant initial:', Number(transaction.amountSats) / 100_000_000, 'USD')
        console.log('💵 Montant reçu (net):', receivedAmount, 'USD')
        console.log('💸 Frais Plisio:', fee, 'USD')

        await prisma.$transaction(async (tx) => {
          // Mettre à jour la transaction
          await tx.transaction.update({
            where: { id: transaction.id },
            data: { 
              status: 'COMPLETED',
              amountSats: receivedSats, // ✅ Montant REÇU (après frais)
              updatedAt: new Date()
            }
          })

          // Créditer le wallet avec le montant REÇU
          const updatedWallet = await tx.wallet.update({
            where: { id: transaction.walletId },
            data: {
              balanceSats: { increment: receivedSats },
              totalDepositedSats: { increment: receivedSats }
            }
          })
          
          console.log('💰 Wallet crédité:')
          console.log('  walletId:', transaction.walletId)
          console.log('  creditSats:', receivedSats.toString())
          console.log('  newBalanceSats:', updatedWallet.balanceSats.toString())
          console.log('  newBalanceUSD: $' + (Number(updatedWallet.balanceSats) / 100_000_000).toFixed(2))
        })

        console.log(`✅ DÉPÔT COMPLÉTÉ: $${receivedAmount.toFixed(2)} pour user ${transaction.wallet.userId}`)
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