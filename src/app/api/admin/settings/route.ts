import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function GET() {
  const adminId = await verifySession()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Récupérer toutes les configs
  const configs = await prisma.systemConfig.findMany({
    where: {
      key: {
        in: [
          'min_deposit_usd',
          'min_withdrawal_usd',
          'withdrawal_fee_percent',
          'max_daily_withdrawal',
          'house_edge_default',
          'kyc_required_amount'
        ]
      }
    }
  })

  const settings = {
    minDepositUsd: parseFloat(String(configs.find(c => c.key === 'min_deposit_usd')?.value || '10')),
    minWithdrawalUsd: parseFloat(String(configs.find(c => c.key === 'min_withdrawal_usd')?.value || '10')),
    withdrawalFeePercent: parseFloat(String(configs.find(c => c.key === 'withdrawal_fee_percent')?.value || '1')),
    maxDailyWithdrawal: parseFloat(String(configs.find(c => c.key === 'max_daily_withdrawal')?.value || '10000')),
    houseEdgeDefault: parseFloat(String(configs.find(c => c.key === 'house_edge_default')?.value || '2.0')),
    kycRequiredAmount: parseFloat(String(configs.find(c => c.key === 'kyc_required_amount')?.value || '1000'))
  }

  return NextResponse.json({ success: true, settings })
}

export async function POST(request: Request) {
  const adminId = await verifySession()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const settings = await request.json()

  // Mettre à jour chaque config
  const updates = [
    { key: 'min_deposit_usd', value: settings.minDepositUsd.toString() },
    { key: 'min_withdrawal_usd', value: settings.minWithdrawalUsd.toString() },
    { key: 'withdrawal_fee_percent', value: settings.withdrawalFeePercent.toString() },
    { key: 'max_daily_withdrawal', value: settings.maxDailyWithdrawal.toString() },
    { key: 'house_edge_default', value: settings.houseEdgeDefault.toString() },
    { key: 'kyc_required_amount', value: settings.kycRequiredAmount.toString() }
  ]

  await prisma.$transaction([
    ...updates.map(u =>
      prisma.systemConfig.upsert({
        where: { key: u.key },
        create: {
          key: u.key,
          value: u.value,
          category: 'system',
          lastModifiedBy: adminId
        },
        update: {
          value: u.value,
          lastModifiedBy: adminId
        }
      })
    ),
    prisma.adminAction.create({
      data: {
        adminId,
        action: 'UPDATE_SETTINGS',
        details: settings
      }
    })
  ])

  return NextResponse.json({ success: true })
}