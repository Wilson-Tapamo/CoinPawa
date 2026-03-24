// lib/withdrawal-validator.ts
import { prisma } from '@/lib/prisma'
import { 
  WITHDRAWAL_CONFIG, 
  ManualReviewReason, 
  WithdrawalProcessType 
} from './withdrawal-config'

interface ValidationResult {
  canAutoProcess: boolean
  processType: WithdrawalProcessType
  reason?: ManualReviewReason
  message?: string
}

interface WithdrawalRequest {
  userId: string
  amount: number // en USD
  address: string
  network: string
}

/**
 * Valide si un retrait peut être traité automatiquement
 */
export async function validateWithdrawal(
  request: WithdrawalRequest
): Promise<ValidationResult> {
  const { userId, amount } = request

  // 1. Vérifier le montant
  if (amount < WITHDRAWAL_CONFIG.MIN_WITHDRAWAL) {
    return {
      canAutoProcess: false,
      processType: WithdrawalProcessType.MANUAL,
      reason: ManualReviewReason.HIGH_AMOUNT,
      message: `Montant minimum: $${WITHDRAWAL_CONFIG.MIN_WITHDRAWAL}`
    }
  }

  if (amount > WITHDRAWAL_CONFIG.MAX_WITHDRAWAL) {
    return {
      canAutoProcess: false,
      processType: WithdrawalProcessType.MANUAL,
      reason: ManualReviewReason.HIGH_AMOUNT,
      message: `Montant maximum: $${WITHDRAWAL_CONFIG.MAX_WITHDRAWAL}`
    }
  }

  // 2. Montant trop élevé pour auto
  if (amount > WITHDRAWAL_CONFIG.AUTO_MAX_AMOUNT) {
    return {
      canAutoProcess: false,
      processType: WithdrawalProcessType.MANUAL,
      reason: ManualReviewReason.HIGH_AMOUNT,
      message: `Les retraits supérieurs à $${WITHDRAWAL_CONFIG.AUTO_MAX_AMOUNT} nécessitent une validation manuelle`
    }
  }

  // 3. Récupérer les infos user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      wallet: {
        include: {
          transactions: {
            where: {
              type: 'WITHDRAW',
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24h
              }
            }
          }
        }
      }
    }
  })

  if (!user || !user.wallet) {
    return {
      canAutoProcess: false,
      processType: WithdrawalProcessType.MANUAL,
      reason: ManualReviewReason.SUSPICIOUS_ACTIVITY,
      message: 'Utilisateur ou wallet introuvable'
    }
  }

  // 4. Vérifier KYC
  if (user.kycLevel < WITHDRAWAL_CONFIG.REQUIRE_KYC_LEVEL) {
    return {
      canAutoProcess: false,
      processType: WithdrawalProcessType.MANUAL,
      reason: ManualReviewReason.UNVERIFIED_USER,
      message: 'Vérification d\'identité requise pour les retraits automatiques'
    }
  }

  // 5. Vérifier l'âge du compte
  const accountAgeHours = 
    (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60)
  
  if (accountAgeHours < WITHDRAWAL_CONFIG.MIN_ACCOUNT_AGE_HOURS) {
    return {
      canAutoProcess: false,
      processType: WithdrawalProcessType.MANUAL,
      reason: ManualReviewReason.NEW_ACCOUNT,
      message: 'Compte trop récent pour retraits automatiques'
    }
  }

  // 6. Vérifier limite journalière
  const todayWithdrawals = user.wallet.transactions.filter(
    tx => tx.status === 'COMPLETED' || tx.status === 'PENDING'
  )

  if (todayWithdrawals.length >= WITHDRAWAL_CONFIG.DAILY_LIMIT_AUTO) {
    return {
      canAutoProcess: false,
      processType: WithdrawalProcessType.MANUAL,
      reason: ManualReviewReason.DAILY_LIMIT_EXCEEDED,
      message: `Limite journalière atteinte (${WITHDRAWAL_CONFIG.DAILY_LIMIT_AUTO} retraits/jour)`
    }
  }

  // 7. Vérifier si user banni ou suspect
  if (user.isBanned) {
    return {
      canAutoProcess: false,
      processType: WithdrawalProcessType.MANUAL,
      reason: ManualReviewReason.SUSPICIOUS_ACTIVITY,
      message: 'Compte suspendu'
    }
  }

  // 8. Vérifier le wallet lock
  if (user.wallet.isWithdrawLocked) {
    return {
      canAutoProcess: false,
      processType: WithdrawalProcessType.MANUAL,
      reason: ManualReviewReason.SUSPICIOUS_ACTIVITY,
      message: user.wallet.withdrawLockReason || 'Retraits temporairement bloqués'
    }
  }

  // 9. Vérifier la balance
  const balanceUSD = Number(user.wallet.balanceSats) / 100_000_000
  const withdrawalFee = calculateFee(amount)
  const totalNeeded = amount + withdrawalFee

  if (balanceUSD < totalNeeded) {
    return {
      canAutoProcess: false,
      processType: WithdrawalProcessType.MANUAL,
      reason: ManualReviewReason.INSUFFICIENT_BALANCE,
      message: `Balance insuffisante. Requis: $${totalNeeded.toFixed(2)} (montant + frais)`
    }
  }

  // ✅ Toutes les vérifications passées
  return {
    canAutoProcess: true,
    processType: WithdrawalProcessType.AUTOMATIC,
    message: 'Retrait éligible au traitement automatique'
  }
}

/**
 * Calcule les frais de retrait
 */
export function calculateFee(amount: number): number {
  const feePercent = WITHDRAWAL_CONFIG.WITHDRAWAL_FEE_PERCENT / 100
  const calculatedFee = amount * feePercent
  
  // Appliquer le minimum
  return Math.max(calculatedFee, WITHDRAWAL_CONFIG.MIN_FEE_USD)
}

/**
 * Compte les retraits du jour pour un user
 */
export async function getTodayWithdrawalCount(userId: string): Promise<number> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const count = await prisma.transaction.count({
    where: {
      wallet: { userId },
      type: 'WITHDRAW',
      createdAt: { gte: startOfDay },
      status: { in: ['COMPLETED', 'PENDING'] }
    }
  })

  return count
}

/**
 * Vérifie si l'adresse de retrait est valide
 */
export function validateAddress(address: string, network: string): boolean {
  // TRC20 (USDT Tron)
  if (network === 'TRC20') {
    return /^T[A-Za-z1-9]{33}$/.test(address)
  }
  
  // ERC20 (Ethereum)
  if (network === 'ERC20') {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }
  
  // BEP20 (BSC)
  if (network === 'BEP20') {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }
  
  return false
}