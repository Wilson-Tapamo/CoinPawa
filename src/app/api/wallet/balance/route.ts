export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function GET() {
  const userId = await verifySession()
  if (!userId) return NextResponse.json({ error: "Non connecté" }, { status: 401 })

  // On lit simplement le Wallet interne
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    select: {
      balanceSats: true,
      totalDepositedSats: true,
      totalWageredSats: true
    }
  })

  if (!wallet) return NextResponse.json({ error: "Wallet introuvable" }, { status: 404 })

  return NextResponse.json({
    // On convertit les BigInt en String pour l'affichage
    balance: wallet.balanceSats.toString(),
    deposited: wallet.totalDepositedSats.toString(),
    wagered: wallet.totalWageredSats.toString()
  })
}