import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const userId = await verifySession()
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    const body = await request.json()
    const amount = parseInt(body.amount) // Le montant que le user veut déposer

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 })
    }

    // TRANSACTION : On met à jour le solde CoinPawa
    const result = await prisma.$transaction(async (tx) => {
      // 1. On récupère le wallet
      const wallet = await tx.wallet.findUnique({ where: { userId } })
      if (!wallet) throw new Error("Wallet introuvable")

      // 2. On trace l'opération (Historique)
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'DEPOSIT',
          amountSats: amount,
          status: 'COMPLETED', // Ici, on valide l'entrée d'argent
          paymentRef: `DEP_${Date.now()}` // Ref interne
        }
      })

      // 3. On CRÉDITE le solde interne (+ amount)
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balanceSats: { increment: amount },
          totalDepositedSats: { increment: amount } // Important pour la règle du Wager
        }
      })

      return updatedWallet
    })

    return NextResponse.json({ success: true, newBalance: result.balanceSats.toString() })

  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}