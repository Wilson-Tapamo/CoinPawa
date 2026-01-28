import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function GET(request: Request) {
  const adminId = await verifySession()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const type = searchParams.get('type')
  const status = searchParams.get('status')
  const dateRange = searchParams.get('dateRange')
  const search = searchParams.get('search')

  const skip = (page - 1) * limit

  // Construire le filtre WHERE
  const where: any = {}
  
  if (type && type !== 'all') where.type = type
  if (status && status !== 'all') where.status = status
  
  // Date range filter
  if (dateRange && dateRange !== 'all') {
    const now = new Date()
    const days = parseInt(dateRange.replace('d', ''))
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    where.createdAt = { gte: startDate }
  }
  
  // Search filter
  if (search) {
    where.OR = [
      { paymentRef: { contains: search, mode: 'insensitive' } },
      { wallet: { user: { username: { contains: search, mode: 'insensitive' } } } }
    ]
  }

  // Récupérer les transactions
  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        wallet: {
          include: {
            user: {
              select: { username: true }
            }
          }
        }
      }
    }),
    prisma.transaction.count({ where })
  ])

  // Calculer les stats
  const allTransactions = await prisma.transaction.findMany({
    where: { status: 'COMPLETED' },
    select: { type: true, amountSats: true }
  })

  const stats = {
    totalTransactions: total,
    totalVolume: allTransactions.reduce((sum, tx) => sum + Number(tx.amountSats), 0),
    deposits: allTransactions.filter(tx => tx.type === 'DEPOSIT').length,
    withdrawals: allTransactions.filter(tx => tx.type === 'WITHDRAW').length,
    bets: allTransactions.filter(tx => tx.type === 'BET').length,
    wins: allTransactions.filter(tx => tx.type === 'WIN').length
  }

  return NextResponse.json({
    success: true,
    transactions: transactions.map(tx => ({
      id: tx.id,
      type: tx.type,
      amountSats: tx.amountSats.toString(),
      status: tx.status,
      createdAt: tx.createdAt,
      user: tx.wallet.user,
      cryptoCurrency: tx.cryptoCurrency,
      paymentRef: tx.paymentRef
    })),
    total,
    stats
  })
}