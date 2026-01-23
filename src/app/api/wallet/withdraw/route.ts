import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const userId = await verifySession()
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    const body = await request.json()
    const amount = parseInt(body.amount)

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 })
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId } })
    if (!wallet) return NextResponse.json({ error: "Wallet introuvable" }, { status: 404 })

    // --- RÈGLE DU MANAGER ---
    // On ne peut retirer que si on a assez joué (Wager >= Depot)
    if (wallet.totalWageredSats < wallet.totalDepositedSats) {
      const manque = wallet.totalDepositedSats - wallet.totalWageredSats
      return NextResponse.json({
        error: "Condition de mise non atteinte",
        message: `Vous devez miser encore ${manque} sats avant de retirer.`
      }, { status: 403 })
    }

    // Vérification du solde interne
    if (wallet.balanceSats < BigInt(amount)) {
      return NextResponse.json({ error: "Fonds insuffisants" }, { status: 400 })
    }

    // TRANSACTION : On débite le solde CoinPawa
    await prisma.$transaction(async (tx) => {
      // 1. On DÉBITE le solde interne (- amount)
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balanceSats: { decrement: amount } }
      })

      // 2. On trace l'opération
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'WITHDRAW',
          amountSats: amount,
          status: 'COMPLETED', // On valide la sortie
          paymentRef: `WITH_${Date.now()}`
        }
      })
    })

    return NextResponse.json({ success: true, message: "Retrait validé" })

  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}