// src/app/api/admin/settings/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export async function GET() {
  try {
    const adminId = await verifySession()
    if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true }
    })

    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

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
      minDepositUsd: parseFloat(configs.find(c => c.key === 'min_deposit_usd')?.value || '10'),
      minWithdrawalUsd: parseFloat(configs.find(c => c.key === 'min_withdrawal_usd')?.value || '10'),
      withdrawalFeePercent: parseFloat(configs.find(c => c.key === 'withdrawal_fee_percent')?.value || '1'),
      maxDailyWithdrawal: parseFloat(configs.find(c => c.key === 'max_daily_withdrawal')?.value || '10000'),
      houseEdgeDefault: parseFloat(configs.find(c => c.key === 'house_edge_default')?.value || '2.0'),
      kycRequiredAmount: parseFloat(configs.find(c => c.key === 'kyc_required_amount')?.value || '1000')
    }

    return NextResponse.json({ success: true, settings })

  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const adminId = await verifySession()
    if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true }
    })

    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

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

    // Convertir settings en JsonValue avec type explicite
    const detailsJson: Prisma.InputJsonValue = {
      minDepositUsd: settings.minDepositUsd,
      minWithdrawalUsd: settings.minWithdrawalUsd,
      withdrawalFeePercent: settings.withdrawalFeePercent,
      maxDailyWithdrawal: settings.maxDailyWithdrawal,
      houseEdgeDefault: settings.houseEdgeDefault,
      kycRequiredAmount: settings.kycRequiredAmount
    }

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
          details: detailsJson  // ✅ Type correct
        }
      })
    ])

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}