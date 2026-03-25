// app/api/deposit/coingate/status/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { getOrder } from '@/lib/coingate'

export async function GET(request: Request) {
  try {
    // 1. Vérifier la session
    const userId = await verifySession()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // 2. Récupérer l'ID de la transaction
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('id')

    if (!transactionId) {
      return NextResponse.json({ error: 'ID de transaction manquant' }, { status: 400 })
    }

    // 3. Récupérer la transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        wallet: {
          select: { userId: true }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction non trouvée' }, { status: 404 })
    }

    // 4. Vérifier que c'est bien la transaction de l'utilisateur
    if (transaction.wallet.userId !== userId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // 5. Si déjà complétée, retourner le statut
    if (transaction.status === 'COMPLETED') {
      return NextResponse.json({
        success: true,
        transaction: {
          id: transaction.id,
          status: 'COMPLETED',
          amount: Number(transaction.amountSats) / 100_000_000,
          currency: transaction.cryptoCurrency,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt
        }
      })
    }

    // 6. Sinon, vérifier le statut auprès de CoinGate
    try {
      const coingateOrderId = parseInt(transaction.paymentRef)
      const order = await getOrder(coingateOrderId)

      return NextResponse.json({
        success: true,
        transaction: {
          id: transaction.id,
          status: transaction.status,
          amount: Number(transaction.amountSats) / 100_000_000,
          currency: transaction.cryptoCurrency,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt
        },
        coingate: {
          orderId: order.id,
          status: order.status,
          paymentAddress: order.payment_address,
          payAmount: order.pay_amount,
          payCurrency: order.pay_currency,
          expiresAt: order.expire_at,
          paymentUrl: order.payment_url
        }
      })

    } catch (error) {
      // Si erreur CoinGate, retourner juste le statut de la BDD
      console.error('Erreur lors de la récupération du statut CoinGate:', error)
      
      return NextResponse.json({
        success: true,
        transaction: {
          id: transaction.id,
          status: transaction.status,
          amount: Number(transaction.amountSats) / 100_000_000,
          currency: transaction.cryptoCurrency,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt
        }
      })
    }

  } catch (error) {
    console.error('Erreur vérification statut:', error)
    return NextResponse.json({ 
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}