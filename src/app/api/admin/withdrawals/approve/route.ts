import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function POST(request: Request) {
  const adminId = await verifySession()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { transactionId } = await request.json()

  await prisma.$transaction([
    prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'COMPLETED',
        approvedBy: adminId,
        approvedAt: new Date()
      }
    }),
    prisma.adminAction.create({
      data: {
        adminId,
        action: 'APPROVE_WITHDRAWAL',
        targetEntityType: 'Transaction',
        targetEntityId: transactionId
      }
    })
  ])

  return NextResponse.json({ success: true })
}