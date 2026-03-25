// app/api/webhooks/plisio-withdrawal/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

const PLISIO_SECRET_KEY = process.env.PLISIO_SECRET_KEY || process.env.PLISIO_API_KEY!

/**
 * Vérifier la signature du webhook Plisio
 */
function verifyPlisioSignature(body: string, signature: string): boolean {
  if (!PLISIO_SECRET_KEY) {
    console.error('PLISIO_SECRET_KEY not configured')
    return false
  }

  const expectedSignature = crypto
    .createHmac('sha1', PLISIO_SECRET_KEY)
    .update(body)
    .digest('hex')

  return signature === expectedSignature
}

/**
 * POST /api/webhooks/plisio-withdrawal
 * Webhook pour les confirmations de retraits Plisio
 */
export async function POST(request: Request) {
  try {
    console.log('📥 Plisio Withdrawal Webhook Received')

    // 1. Récupérer le body brut
    const bodyText = await request.text()
    const signature = request.headers.get('verify_hash') || request.headers.get('x-plisio-signature')

    // 2. Vérifier la signature (optionnel selon config Plisio)
    if (signature && !verifyPlisioSignature(bodyText, signature)) {
      console.error('❌ Invalid Plisio signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    // 3. Parser le body
    const webhookData = JSON.parse(bodyText)
    console.log('📦 Plisio Webhook Data:', JSON.stringify(webhookData, null, 2))

    const {
      id: plisioId,
      txid,
      status,
      amount,
      currency,
      fee,
      confirmations
    } = webhookData

    if (!plisioId) {
      console.error('❌ Missing plisioId in webhook')
      return NextResponse.json({ error: 'Missing plisioId' }, { status: 400 })
    }

    // 4. Trouver la transaction en BDD
    const transaction = await prisma.transaction.findUnique({
      where: { plisioId: plisioId.toString() },
      include: {
        wallet: {
          include: { user: true }
        }
      }
    })

    if (!transaction) {
      console.error('❌ Transaction not found:', plisioId)
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    console.log('✅ Transaction trouvée:', transaction.id)

    // 5. Traiter selon le statut Plisio
    const metadata = transaction.metadata as any

    switch (status) {
      case 'completed':
      case 'success':
        // Retrait confirmé sur la blockchain
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'COMPLETED',
            txHash: txid,
            confirmations: confirmations || 1,
            metadata: {
              ...metadata,
              plisio_webhook: webhookData,
              confirmed_at: new Date().toISOString()
            }
          }
        })

        console.log('✅ Retrait confirmé:', transaction.id)
        break

      case 'pending':
      case 'processing':
        // En cours de traitement
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            txHash: txid || transaction.txHash,
            confirmations: confirmations || 0,
            metadata: {
              ...metadata,
              plisio_webhook: webhookData,
              status_update: new Date().toISOString()
            }
          }
        })

        console.log('⏳ Retrait en cours:', transaction.id)
        break

      case 'failed':
      case 'error':
      case 'cancelled':
        // Échec du retrait - Rembourser
        await prisma.$transaction(async (tx) => {
          // Marquer comme failed
          await tx.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'FAILED',
              metadata: {
                ...metadata,
                plisio_webhook: webhookData,
                failed_at: new Date().toISOString(),
                failure_reason: status
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

        console.log('❌ Retrait échoué - Wallet remboursé:', transaction.id)
        break

      default:
        console.warn('⚠️ Unknown Plisio status:', status)
    }

    return NextResponse.json({ status: 'ok' })

  } catch (error: any) {
    console.error('❌ Plisio Webhook Error:', error)
    return NextResponse.json(
      { error: 'Internal error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/webhooks/plisio-withdrawal
 * Test endpoint
 */
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Plisio withdrawal webhook endpoint' 
  })
}