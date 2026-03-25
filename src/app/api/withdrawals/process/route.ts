// app/api/withdrawals/process/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { sendPlisioWithdrawal } from '@/lib/plisio-withdrawal'
import { notifyWithdrawalApproved, notifyWithdrawalRejected } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

/**
 * POST /api/withdrawals/process
 * Traite un retrait automatique (appelé par le système ou manuellement)
 */
export async function POST(request: Request) {
  try {
    // 1. Vérifier l'authentification (optionnel selon si c'est un cron ou admin)
    const userId = await verifySession()
    
    // 2. Parser les données
    const body = await request.json()
    const { transactionId } = body

    if (!transactionId) {
      return NextResponse.json({ 
        error: 'Transaction ID requis' 
      }, { status: 400 })
    }

    console.log(`🔄 Processing withdrawal: ${transactionId}`)

    // 3. Récupérer la transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        wallet: {
          include: { user: true }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json({ 
        error: 'Transaction introuvable' 
      }, { status: 404 })
    }

    // 4. Vérifier que c'est un retrait en attente
    if (transaction.type !== 'WITHDRAW') {
      return NextResponse.json({ 
        error: 'Pas une transaction de retrait' 
      }, { status: 400 })
    }

    if (transaction.status !== 'PENDING') {
      return NextResponse.json({ 
        error: `Transaction déjà traitée (${transaction.status})` 
      }, { status: 400 })
    }

    // 5. Vérifier que c'est un retrait automatique
    if (transaction.processType !== 'AUTOMATIC') {
      return NextResponse.json({ 
        error: 'Ce retrait nécessite une validation manuelle' 
      }, { status: 400 })
    }

    // 6. Récupérer les infos du metadata
    const metadata = transaction.metadata as any
    const network = metadata?.network || 'TRC20'
    const amountUSD = parseFloat(transaction.cryptoAmount || '0')
    const address = transaction.toAddress

    if (!address) {
      return NextResponse.json({ 
        error: 'Adresse de retrait manquante' 
      }, { status: 400 })
    }

    // 7. Traiter selon le provider
    const provider = transaction.provider || 'PLISIO'

    try {
      let result: any

      if (provider === 'PLISIO') {
        // Envoyer via Plisio
        console.log('📤 Envoi via Plisio...')
        result = await sendPlisioWithdrawal(amountUSD, address, 'USDT', network)

        if (result.status !== 'success' || !result.data) {
          throw new Error(result.error || 'Plisio withdrawal failed')
        }

        // Mettre à jour la transaction
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'COMPLETED',
            processedAt: new Date(),
            plisioId: result.data.id,
            plisioTxUrl: result.data.url,
            txHash: result.data.txid,
            confirmations: 0,
            metadata: {
              ...metadata,
              plisio_response: result.data,
              processed_at: new Date().toISOString(),
              processed_via: 'PLISIO'
            }
          }
        })

        console.log('✅ Retrait Plisio envoyé:', result.data.id)

      } else {
        // NOWPayments (à implémenter si besoin)
        throw new Error('NOWPayments withdrawal not implemented yet')
      }

      // 8. Notifier l'utilisateur
      try {
        await notifyWithdrawalApproved(
          transaction.wallet.user.id,
          amountUSD,
          transaction.id
        )
      } catch (notifError) {
        console.error('❌ Notification error:', notifError)
      }

      // 9. Retourner succès
      return NextResponse.json({
        success: true,
        message: 'Retrait traité avec succès',
        transaction: {
          id: transaction.id,
          status: 'COMPLETED',
          provider: provider,
          txHash: result.data?.txid,
          url: result.data?.url
        }
      })

    } catch (providerError: any) {
      console.error(`❌ ${provider} Error:`, providerError)

      // En cas d'erreur, marquer comme failed et rembourser
      await prisma.$transaction(async (tx) => {
        // Marquer comme failed
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'FAILED',
            metadata: {
              ...metadata,
              error: providerError.message,
              failed_at: new Date().toISOString()
            }
          }
        })

        // Rembourser le wallet
        await tx.wallet.update({
          where: { id: transaction.walletId },
          data: {
            balanceSats: { increment: transaction.amountSats }
          }
        })
      })

      console.log('💰 Wallet remboursé suite à l\'échec')

      // Notifier l'échec
      try {
        await notifyWithdrawalRejected(
          transaction.wallet.user.id,
          amountUSD,
          'Erreur technique lors du traitement'
        )
      } catch (notifError) {
        console.error('❌ Notification error:', notifError)
      }

      return NextResponse.json({
        success: false,
        error: 'Échec du traitement',
        details: providerError.message,
        refunded: true
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('❌ Process Withdrawal Error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/withdrawals/process
 * Liste les retraits en attente de traitement automatique
 */
export async function GET() {
  try {
    const userId = await verifySession()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer les retraits automatiques en attente
    const pendingWithdrawals = await prisma.transaction.findMany({
      where: {
        type: 'WITHDRAW',
        status: 'PENDING',
        processType: 'AUTOMATIC'
      },
      include: {
        wallet: {
          select: {
            user: {
              select: {
                username: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: 50
    })

    return NextResponse.json({
      success: true,
      count: pendingWithdrawals.length,
      withdrawals: pendingWithdrawals.map(tx => ({
        id: tx.id,
        amount: parseFloat(tx.cryptoAmount || '0'),
        address: tx.toAddress,
        provider: tx.provider,
        username: tx.wallet.user.username,
        createdAt: tx.createdAt
      }))
    })

  } catch (error: any) {
    console.error('❌ Get Pending Withdrawals Error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}