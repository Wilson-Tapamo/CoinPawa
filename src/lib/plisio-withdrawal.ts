// lib/plisio-withdrawal.ts

const PLISIO_API_KEY = process.env.PLISIO_API_KEY!
const PLISIO_API_URL = 'https://plisio.net/api/v1'

interface PlisioWithdrawRequest {
  amount: number // Montant en USDT
  to: string // Adresse de destination
  currency: string // 'USDT' ou autre
  type: string // 'cash_out'
  feePlan?: string // 'normal' | 'priority'
}

interface PlisioWithdrawResponse {
  status: string // 'success' | 'error'
  data?: {
    id: string // ID de la transaction Plisio
    txid?: string // Hash de la transaction blockchain
    amount: string
    fee: string
    total: string // amount + fee
    url?: string // URL de suivi
    status: string // 'new' | 'pending' | 'completed'
  }
  error?: string
}

interface PlisioBalanceResponse {
  status: string
  data?: {
    [currency: string]: {
      balance: string
      pending: string
    }
  }
  error?: string
}

/**
 * Envoie un retrait via Plisio
 */
export async function sendPlisioWithdrawal(
  amount: number,
  toAddress: string,
  currency: string = 'USDT',
  network: string = 'TRC20'
): Promise<PlisioWithdrawResponse> {
  try {
    console.log('📤 Plisio Withdrawal Request:', {
      amount,
      toAddress,
      currency,
      network
    })

    // Construire la requête
    const params = new URLSearchParams({
      api_key: PLISIO_API_KEY,
      amount: amount.toString(),
      to: toAddress,
      currency: currency,
      type: 'cash_out',
      feePlan: 'normal'
    })

    const response = await fetch(
      `${PLISIO_API_URL}/operations/withdraw?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    const data: PlisioWithdrawResponse = await response.json()

    console.log('📥 Plisio Withdrawal Response:', data)

    if (data.status !== 'success') {
      throw new Error(data.error || 'Plisio withdrawal failed')
    }

    return data
  } catch (error: any) {
    console.error('❌ Plisio Withdrawal Error:', error)
    throw error
  }
}

/**
 * Vérifie la balance Plisio pour une crypto
 */
export async function getPlisioBalance(
  currency: string = 'USDT'
): Promise<number> {
  try {
    const response = await fetch(
      `${PLISIO_API_URL}/balances?api_key=${PLISIO_API_KEY}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    const data: PlisioBalanceResponse = await response.json()

    if (data.status !== 'success' || !data.data) {
      throw new Error(data.error || 'Failed to fetch balance')
    }

    const currencyData = data.data[currency]
    if (!currencyData) {
      return 0
    }

    const balance = parseFloat(currencyData.balance)
    console.log(`💰 Plisio ${currency} Balance:`, balance)

    return balance
  } catch (error: any) {
    console.error('❌ Plisio Balance Error:', error)
    return 0
  }
}

/**
 * Vérifie le statut d'un retrait Plisio
 */
export async function checkPlisioWithdrawalStatus(
  plisioId: string
): Promise<PlisioWithdrawResponse> {
  try {
    const response = await fetch(
      `${PLISIO_API_URL}/operations/${plisioId}?api_key=${PLISIO_API_KEY}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    const data: PlisioWithdrawResponse = await response.json()

    console.log(`🔍 Plisio Status Check (${plisioId}):`, data)

    return data
  } catch (error: any) {
    console.error('❌ Plisio Status Check Error:', error)
    throw error
  }
}

/**
 * Estime les frais Plisio pour un retrait
 */
export async function estimatePlisioFee(
  amount: number,
  currency: string = 'USDT',
  feePlan: string = 'normal'
): Promise<number> {
  try {
    const params = new URLSearchParams({
      api_key: PLISIO_API_KEY,
      amount: amount.toString(),
      currency: currency,
      feePlan: feePlan
    })

    const response = await fetch(
      `${PLISIO_API_URL}/operations/fee?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    const data = await response.json()

    if (data.status === 'success' && data.data?.fee) {
      return parseFloat(data.data.fee)
    }

    // Fallback: 1% du montant
    return amount * 0.01
  } catch (error: any) {
    console.error('❌ Plisio Fee Estimation Error:', error)
    // Fallback: 1% du montant
    return amount * 0.01
  }
}

/**
 * Sélectionne le meilleur provider selon la balance
 */
export async function selectBestProvider(
  amount: number
): Promise<'PLISIO' | 'NOWPAYMENTS'> {
  try {
    // Vérifier balance Plisio
    const plisioBalance = await getPlisioBalance('USDT')

    // Si Plisio a assez de balance, l'utiliser (priorité)
    if (plisioBalance >= amount * 1.1) { // 10% de marge
      console.log('✅ Plisio sélectionné (balance suffisante)')
      return 'PLISIO'
    }

    // Sinon, utiliser NOWPayments
    console.log('⚠️ NOWPayments sélectionné (Plisio balance insuffisante)')
    return 'NOWPAYMENTS'
  } catch (error) {
    console.error('❌ Provider Selection Error:', error)
    // En cas d'erreur, fallback sur NOWPayments
    return 'NOWPAYMENTS'
  }
}

/**
 * Log pour debugging
 */
export function logPlisioOperation(
  type: string,
  data: any
) {
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`🔷 PLISIO_${type.toUpperCase()}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(JSON.stringify(data, null, 2))
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
}