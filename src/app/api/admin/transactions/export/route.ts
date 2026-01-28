import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function GET(request: Request) {
  const adminId = await verifySession()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const status = searchParams.get('status')
  const dateRange = searchParams.get('dateRange')

  const where: any = {}
  if (type && type !== 'all') where.type = type
  if (status && status !== 'all') where.status = status
  if (dateRange && dateRange !== 'all') {
    const days = parseInt(dateRange.replace('d', ''))
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    where.createdAt = { gte: startDate }
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      wallet: {
        include: {
          user: { select: { username: true, email: true } }
        }
      }
    }
  })

  // Créer le CSV
  const csv = [
    'ID,Type,Username,Email,Amount,Status,Crypto,Reference,Date',
    ...transactions.map(tx => [
      tx.id,
      tx.type,
      tx.wallet.user.username,
      tx.wallet.user.email || '',
      Number(tx.amountSats) / 100_000_000,
      tx.status,
      tx.cryptoCurrency || '',
      tx.paymentRef,
      tx.createdAt.toISOString()
    ].join(','))
  ].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="transactions-${Date.now()}.csv"`
    }
  })
}