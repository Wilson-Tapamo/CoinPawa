export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function GET() {
  const adminId = await verifySession()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { role: true }
  })

  if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  // Récupérer les retraits en attente
  const withdrawals = await prisma.transaction.findMany({
    where: {
      type: 'WITHDRAW',
      status: 'PENDING'
    },
    orderBy: { createdAt: 'asc' },
    include: {
      wallet: {
        include: {
          user: {
            select: {
              username: true,
              email: true
            }
          }
        }
      }
    }
  })

  // Calculer stats
  const totalAmount = withdrawals.reduce((sum, w) => sum + Number(w.amountSats), 0)

  return NextResponse.json({
    success: true,
    withdrawals: withdrawals.map(w => ({
      id: w.id,
      amountSats: w.amountSats.toString(),
      withdrawalFee: (w.withdrawalFee || BigInt(0)).toString(),
      netAmount: (w.netAmount || BigInt(0)).toString(),
      toAddress: w.toAddress || '',
      user: w.wallet.user,
      createdAt: w.createdAt,
      riskScore: w.riskScore || 0,
      isFlagged: w.isFlagged,
      flagReason: w.flagReason
    })),
    stats: {
      pending: withdrawals.length,
      totalAmount
    }
  })
}