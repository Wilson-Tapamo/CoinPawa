import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function POST(request: Request) {
  const adminId = await verifySession()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { transactionId, reason } = await request.json()

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: { walletId: true, amountSats: true }
  })

  if (!transaction) {
    return NextResponse.json({ error: 'Transaction introuvable' }, { status: 404 })
  }

  // Rembourser le montant et rejeter la transaction
  await prisma.$transaction([
    prisma.wallet.update({
      where: { id: transaction.walletId },
      data: {
        balanceSats: { increment: transaction.amountSats }
      }
    }),
    prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'FAILED',
        rejectedBy: adminId,
        rejectedAt: new Date(),
        rejectionReason: reason
      }
    }),
    prisma.adminAction.create({
      data: {
        adminId,
        action: 'REJECT_WITHDRAWAL',
        targetEntityType: 'Transaction',
        targetEntityId: transactionId,
        details: { reason }
      }
    })
  ])

  return NextResponse.json({ success: true })
}