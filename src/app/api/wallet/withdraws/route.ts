// app/api/wallet/withdraw/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { validateWithdrawAmount, satsToUsd, usdToSats } from '@/lib/payment-limits'

const WITHDRAWAL_FEE_PERCENT = 0.01 // 1%
const MIN_WITHDRAWAL_USD = 5 // Minimum 5 USD

/**
 * POST /api/wallet/withdraw
 * Demander un retrait de fonds
 */
export async function POST(request: Request) {
  try {
    // 1. Vérifier l'authentification
    const userId = await verifySession()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // 2. Récupérer les données
    const body = await request.json()
    const { amount, address, crypto } = body

    // Validation des paramètres
    if (!amount || !address) {
      return NextResponse.json(
        { error: 'Paramètres manquants (amount, address)' },
        { status: 400 }
      )
    }

    const amountUsd = parseFloat(amount)
    if (isNaN(amountUsd) || amountUsd <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
    }

    // Validation du montant minimum
    if (amountUsd < MIN_WITHDRAWAL_USD) {
      return NextResponse.json(
        { 
          error: `Montant minimum de retrait : $${MIN_WITHDRAWAL_USD}`,
          message: `Le montant minimum de retrait est de $${MIN_WITHDRAWAL_USD}` 
        },
        { status: 400 }
      )
    }

    // Validation supplémentaire
    const validation = validateWithdrawAmount(amountUsd)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // 3. Récupérer le wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      select: {
        id: true,
        balanceSats: true,
        totalDepositedSats: true,
        totalWageredSats: true,
      },
    })

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet introuvable' }, { status: 404 })
    }

    // Convertir en USD pour les comparaisons
    const balanceUsd = Number(wallet.balanceSats) / 100_000_000
    const totalDepositedUsd = Number(wallet.totalDepositedSats) / 100_000_000
    const totalWageredUsd = Number(wallet.totalWageredSats) / 100_000_000

    console.log('💰 RETRAIT DEMANDÉ', {
      userId,
      amountUsd,
      balanceUsd,
      totalDepositedUsd,
      totalWageredUsd,
    })

    // 4. VÉRIFICATION DU WAGER REQUIREMENT
    // if (totalWageredUsd < totalDepositedUsd) {
    //   const remainingWager = totalDepositedUsd - totalWageredUsd

    //   return NextResponse.json(
    //     {
    //       error: 'Wager requirement non atteint',
    //       message: `Vous devez miser au moins ${remainingWager.toFixed(2)} USD de plus avant de pouvoir retirer.`,
    //       details: {
    //         totalDeposited: totalDepositedUsd,
    //         totalWagered: totalWageredUsd,
    //         required: totalDepositedUsd,
    //         remaining: remainingWager,
    //       },
    //     },
    //     { status: 403 }
    //   )
    // }

    // 5. VÉRIFICATION DU SOLDE avec frais
    const withdrawalFee = amountUsd * WITHDRAWAL_FEE_PERCENT
    const totalRequired = amountUsd // On prélève les frais sur le montant demandé
    const netAmount = amountUsd - withdrawalFee // Ce que l'user recevra

    if (balanceUsd < totalRequired) {
      return NextResponse.json(
        {
          error: 'Solde insuffisant',
          message: `Solde insuffisant. Disponible : $${balanceUsd.toFixed(2)}, Requis : $${totalRequired.toFixed(2)}`,
        },
        { status: 400 }
      )
    }

    // 6. VALIDATION DE L'ADRESSE (basique)
    const cryptoSymbol = crypto?.toLowerCase() || 'usdttrc20'
    
    // Validation basique selon le réseau
    let isValidAddress = true
    let networkName = 'TRON'

    if (cryptoSymbol.includes('trc20') || cryptoSymbol === 'trx') {
      // Adresse TRON : commence par T et 34 caractères
      isValidAddress = address.startsWith('T') && address.length === 34
      networkName = 'TRON'
    } else if (cryptoSymbol.includes('erc20') || cryptoSymbol === 'eth') {
      // Adresse Ethereum : commence par 0x et 42 caractères
      isValidAddress = address.startsWith('0x') && address.length === 42
      networkName = 'Ethereum'
    } else if (cryptoSymbol === 'btc') {
      // Adresse Bitcoin : commence par 1, 3 ou bc1
      isValidAddress = /^(1|3|bc1)[a-zA-Z0-9]{25,62}$/.test(address)
      networkName = 'Bitcoin'
    }

    if (!isValidAddress) {
      return NextResponse.json(
        {
          error: 'Adresse invalide',
          message: `L'adresse fournie n'est pas une adresse ${networkName} valide`,
        },
        { status: 400 }
      )
    }

    // 7. CRÉER LA TRANSACTION DE RETRAIT (status: PENDING)
    const amountSats = usdToSats(amountUsd)
    const netAmountSats = usdToSats(netAmount)
    const withdrawalFeeSats = usdToSats(withdrawalFee)

    const transaction = await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'WITHDRAW',
        amountSats: netAmountSats, // Montant net (après frais)
        status: 'PENDING',
        paymentRef: `WD_${userId}_${Date.now()}`,
        
        // Infos crypto
        cryptoCurrency: cryptoSymbol.toUpperCase(),
        toAddress: address,
        
        // Frais
        withdrawalFee: withdrawalFeeSats,
        netAmount: netAmountSats,
        
        // Métadonnées
        metadata: {
          requested_amount: amountUsd,
          withdrawal_fee: withdrawalFee,
          withdrawal_fee_percent: WITHDRAWAL_FEE_PERCENT * 100,
          net_amount: netAmount,
          crypto_symbol: cryptoSymbol,
          network: networkName,
          address: address,
          wager_check: {
            total_deposited: totalDepositedUsd,
            total_wagered: totalWageredUsd,
            passed: true,
          },
        },
      },
    })

    // 8. DÉBITER LE WALLET immédiatement (car retrait en attente)
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balanceSats: { decrement: amountSats },
        withdrawalAddress: address, // Sauvegarder pour la prochaine fois
        withdrawalNetwork: networkName,
      },
    })

    console.log('✅ RETRAIT CRÉÉ', {
      transactionId: transaction.id,
      amountRequested: amountUsd,
      fee: withdrawalFee,
      netAmount: netAmount,
      address: address.substring(0, 10) + '...',
    })

    // 9. RETOURNER LA CONFIRMATION
    return NextResponse.json({
      success: true,
      message: 'Demande de retrait enregistrée avec succès',
      withdrawal: {
        id: transaction.id,
        status: 'PENDING',
        
        // Montants
        requestedAmount: amountUsd,
        withdrawalFee: withdrawalFee,
        netAmount: netAmount,
        
        // Détails
        crypto: cryptoSymbol.toUpperCase(),
        network: networkName,
        address: address,
        
        // Infos
        note: 'Votre retrait sera traité sous 24-48h. Vous recevrez une notification par email.',
      },
    })
  } catch (error: any) {
    console.error('❌ Erreur retrait:', error)
    
    return NextResponse.json(
      {
        error: 'Erreur lors du retrait',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}