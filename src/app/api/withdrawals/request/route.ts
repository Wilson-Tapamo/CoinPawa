// app/api/withdrawals/request/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { validateWithdrawal, calculateFee, validateAddress } from '@/lib/withdrawal-validator'
import { WITHDRAWAL_CONFIG, WithdrawalProcessType } from '@/lib/withdrawal-config'
import { selectBestProvider } from '@/lib/plisio-withdrawal'
import { usdToSats } from '@/lib/payment-limits'

export const dynamic = 'force-dynamic'

/**
 * POST /api/withdrawals/request
 * Demander un retrait
 */
export async function POST(request: Request) {
  try {
    // 1. Vérifier l'authentification
    const userId = await verifySession()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // 2. Parser les données
    const body = await request.json()
    const { amount, address, network = 'TRC20' } = body

    // Validation basique
    if (!amount || !address) {
      return NextResponse.json({ 
        error: 'Montant et adresse requis' 
      }, { status: 400 })
    }

    const amountUSD = parseFloat(amount)

    if (isNaN(amountUSD) || amountUSD <= 0) {
      return NextResponse.json({ 
        error: 'Montant invalide' 
      }, { status: 400 })
    }

    // 3. Valider l'adresse
    if (!validateAddress(address, network)) {
      return NextResponse.json({ 
        error: `Adresse ${network} invalide` 
      }, { status: 400 })
    }

    // 4. Calculer les frais
    const fee = calculateFee(amountUSD)
    const totalAmount = amountUSD + fee

    console.log('💸 Withdrawal Request:', {
      userId,
      amount: amountUSD,
      fee,
      total: totalAmount,
      address,
      network
    })

    // 5. Valider le retrait (auto ou manuel ?)
    const validation = await validateWithdrawal({
      userId,
      amount: amountUSD,
      address,
      network
    })

    console.log('✅ Validation Result:', validation)

    // 6. Récupérer le wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      select: { id: true, balanceSats: true }
    })

    if (!wallet) {
      return NextResponse.json({ 
        error: 'Wallet introuvable' 
      }, { status: 404 })
    }

    // 7. Vérifier la balance
    const balanceUSD = Number(wallet.balanceSats) / 100_000_000
    if (balanceUSD < totalAmount) {
      return NextResponse.json({ 
        error: 'Balance insuffisante',
        details: {
          balance: balanceUSD,
          required: totalAmount,
          fee: fee
        }
      }, { status: 400 })
    }

    // 8. Sélectionner le provider (si automatique)
    let selectedProvider: string | null = null
    
    if (validation.canAutoProcess) {
      selectedProvider = await selectBestProvider(amountUSD)
      console.log(`🎯 Provider sélectionné: ${selectedProvider}`)
    }

    // 9. Créer la transaction
    const amountSats = usdToSats(amountUSD)
    const feeSats = usdToSats(fee)
    const netAmountSats = amountSats - feeSats

    const transaction = await prisma.$transaction(async (tx) => {
      // Créer la transaction de retrait
      const withdrawal = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'WITHDRAW',
          amountSats: amountSats,
          paymentRef: `WD_${userId}_${Date.now()}`,
          status: 'PENDING',
          
          // Crypto info
          cryptoCurrency: 'USDT',
          cryptoAmount: amountUSD.toString(),
          toAddress: address,
          
          // Frais
          withdrawalFee: feeSats,
          netAmount: netAmountSats,
          
          // Process type
          processType: validation.processType,
          manualReason: validation.reason || null,
          provider: selectedProvider,
          
          // Metadata
          metadata: {
            network: network,
            fee_usd: fee,
            total_usd: totalAmount,
            validation: JSON.parse(JSON.stringify(validation)), // Fix: Serialize
            requested_at: new Date().toISOString()
          }
        }
      })

      // Débiter le wallet immédiatement (retenu)
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balanceSats: { decrement: amountSats }
        }
      })

      console.log('✅ Transaction créée:', {
        id: withdrawal.id,
        processType: withdrawal.processType,
        provider: withdrawal.provider
      })

      return withdrawal
    })

    // 10. Si retrait automatique, déclencher le traitement immédiatement
    if (validation.canAutoProcess) {
      try {
        // Appeler la route de traitement en arrière-plan
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/withdrawals/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionId: transaction.id })
        }).catch(err => {
          console.error('❌ Auto-trigger error:', err)
          // Ne pas bloquer la réponse si l'auto-trigger échoue
        })
        
        console.log('🔄 Auto-traitement déclenché pour:', transaction.id)
      } catch (triggerError) {
        console.error('❌ Trigger error:', triggerError)
      }
    }

    // 11. Retourner la réponse
    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        amount: amountUSD,
        fee: fee,
        total: totalAmount,
        address: address,
        network: network,
        processType: validation.processType,
        provider: selectedProvider,
        status: 'PENDING'
      },
      message: validation.canAutoProcess
        ? 'Retrait en cours de traitement automatique'
        : `Retrait en attente de validation manuelle: ${validation.message}`,
      isAutomatic: validation.canAutoProcess
    })

  } catch (error: any) {
    console.error('❌ Withdrawal Request Error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}