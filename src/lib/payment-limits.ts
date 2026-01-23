// lib/payment-limits.ts
// Configuration des limites de paiement selon l'environnement

export const PAYMENT_LIMITS = {
  development: {
    minDeposit: 1.0,      // 1 USD minimum en dev
    maxDeposit: 50.0,     // 50 USD maximum en dev (pour sécurité)
    maxWithdraw: 20.0,    // 20 USD maximum en retrait
  },
  production: {
    minDeposit: 5.0,      // 5 USD minimum en production
    maxDeposit: 10000.0,  // 10,000 USD maximum
    maxWithdraw: 5000.0,  // 5,000 USD maximum par retrait
  },
}

export function getPaymentLimits() {
  const env = (process.env.NODE_ENV || 'development') as keyof typeof PAYMENT_LIMITS
  return PAYMENT_LIMITS[env]
}

export function validateDepositAmount(amount: number): { valid: boolean; error?: string } {
  const limits = getPaymentLimits()

  if (amount < limits.minDeposit) {
    return {
      valid: false,
      error: `Montant minimum de dépôt : ${limits.minDeposit} USD`,
    }
  }

  if (amount > limits.maxDeposit) {
    return {
      valid: false,
      error: `Montant maximum de dépôt : ${limits.maxDeposit} USD`,
    }
  }

  return { valid: true }
}

export function validateWithdrawAmount(amount: number): { valid: boolean; error?: string } {
  const limits = getPaymentLimits()

  if (amount <= 0) {
    return {
      valid: false,
      error: 'Montant invalide',
    }
  }

  if (amount > limits.maxWithdraw) {
    return {
      valid: false,
      error: `Montant maximum de retrait : ${limits.maxWithdraw} USD`,
    }
  }

  return { valid: true }
}

// Conversion helpers
export function usdToSats(usdAmount: number): bigint {
  // 1 USD = 100,000,000 sats (convention)
  return BigInt(Math.floor(usdAmount * 100_000_000))
}

export function satsToUsd(sats: bigint): number {
  return Number(sats) / 100_000_000
}