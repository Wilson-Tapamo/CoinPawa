// app/api/withdraw/request/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    // 1. Vérifier la session
    const userId = await verifySession()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // 2. Récupérer les paramètres
    const body = await request.json()
    const { amount, currency, address } = body

    // Validation montant
    if (!amount || amount < 10) {
      return NextResponse.json({ 
        error: 'Montant minimum: $10' 
      }, { status: 400 })
    }

    if (amount > 10000) {
      return NextResponse.json({ 
        error: 'Montant maximum: $10,000' 
      }, { status: 400 })
    }

    // Validation currency
    if (!currency) {
      return NextResponse.json({ 
        error: 'Devise non spécifiée' 
      }, { status: 400 })
    }

    // Validation address
    if (!address || address.trim().length < 10) {
      return NextResponse.json({ 
        error: 'Adresse crypto invalide' 
      }, { status: 400 })
    }

    // 3. Récupérer le wallet de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true }
    })

    if (!user || !user.wallet) {
      return NextResponse.json({ error: 'Wallet non trouvé' }, { status: 404 })
    }

    // 4. Vérifier la balance
    const amountSats = BigInt(Math.floor(amount * 100_000_000))
    
    if (user.wallet.balanceSats < amountSats) {
      return NextResponse.json({ 
        error: 'Balance insuffisante',
        available: Number(user.wallet.balanceSats) / 100_000_000,
        requested: amount
      }, { status: 400 })
    }

    // 5. Vérifier s'il n'y a pas déjà une demande en cours
    const pendingWithdrawal = await prisma.transaction.findFirst({
      where: {
        walletId: user.wallet.id,
        type: 'WITHDRAWAL',
        status: 'PENDING'
      }
    })

    if (pendingWithdrawal) {
      return NextResponse.json({ 
        error: 'Vous avez déjà une demande de retrait en cours' 
      }, { status: 400 })
    }

    // 6. Créer la transaction de retrait (PENDING)
    const transaction = await prisma.$transaction(async (tx) => {
      // Débiter le wallet immédiatement (pour éviter double dépense)
      await tx.wallet.update({
        where: { id: user.wallet.id },
        data: {
          balanceSats: {
            decrement: amountSats
          }
        }
      })

      // Créer la transaction
      const newTransaction = await tx.transaction.create({
        data: {
          walletId: user.wallet.id,
          type: 'WITHDRAWAL',
          amountSats: amountSats,
          status: 'PENDING',
          paymentRef: address, // On stocke l'adresse dans paymentRef
          cryptoCurrency: currency
        }
      })

      return newTransaction
    })

    console.log(`📤 Demande de retrait créée: ${transaction.id} - $${amount} pour user ${userId}`)

    // 7. TODO: Envoyer notification admin (email, Slack, etc.)

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: transaction.id,
        amount: amount,
        currency: currency,
        address: address,
        status: 'PENDING',
        createdAt: transaction.createdAt
      }
    })

  } catch (error) {
    console.error('❌ Erreur création retrait:', error)
    
    return NextResponse.json({ 
      error: 'Erreur lors de la création de la demande',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}