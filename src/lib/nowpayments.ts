// lib/nowpayments.ts
// Helper pour l'API NOWPayments

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY!
const NOWPAYMENTS_API_URL = process.env.NOWPAYMENTS_API_URL || 'https://api.nowpayments.io/v1'

export interface CreatePaymentParams {
  priceAmount: number      // Montant en USD
  payCurrency: string      // Crypto choisie (btc, eth, usdttrc20, etc.)
  orderId: string          // Référence unique
  orderDescription: string
  ipnCallbackUrl: string
}

export interface PaymentResponse {
  payment_id: string
  payment_status: string
  pay_address: string
  pay_amount: number
  pay_currency: string
  price_amount: number
  price_currency: string
  order_id: string
  order_description: string
  created_at: string
  updated_at: string
  outcome_amount: number
  outcome_currency: string
  expiration_estimate_date?: string
}

export interface PaymentStatusResponse extends PaymentResponse {
  actually_paid: number
  payment_extra_id?: string
}

/**
 * Créer un nouveau paiement
 */
export async function createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
  try {
    const response = await fetch(`${NOWPAYMENTS_API_URL}/payment`, {
      method: 'POST',
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount: params.priceAmount,
        price_currency: 'usd',
        pay_currency: params.payCurrency.toLowerCase(),
        ipn_callback_url: params.ipnCallbackUrl,
        order_id: params.orderId,
        order_description: params.orderDescription,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('NOWPayments API Error:', error)
      throw new Error(`NOWPayments error: ${error.message || JSON.stringify(error)}`)
    }

    return response.json()
  } catch (error) {
    console.error('Failed to create payment:', error)
    throw error
  }
}

/**
 * Obtenir le statut d'un paiement
 */
export async function getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
  try {
    const response = await fetch(`${NOWPAYMENTS_API_URL}/payment/${paymentId}`, {
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch payment status')
    }

    return response.json()
  } catch (error) {
    console.error('Failed to get payment status:', error)
    throw error
  }
}

/**
 * Obtenir la liste des cryptos disponibles
 */
export async function getAvailableCurrencies(): Promise<string[]> {
  try {
    const response = await fetch(`${NOWPAYMENTS_API_URL}/currencies`, {
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch currencies')
    }

    const data = await response.json()
    return data.currencies
  } catch (error) {
    console.error('Failed to get currencies:', error)
    throw error
  }
}

/**
 * Estimer le montant à payer dans une crypto donnée
 */
export async function estimateAmount(
  amount: number,
  currencyFrom: string,
  currencyTo: string = 'usdttrc20'
) {
  try {
    const response = await fetch(
      `${NOWPAYMENTS_API_URL}/estimate?amount=${amount}&currency_from=${currencyFrom}&currency_to=${currencyTo}`,
      {
        headers: {
          'x-api-key': NOWPAYMENTS_API_KEY,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to estimate amount')
    }

    return response.json()
  } catch (error) {
    console.error('Failed to estimate amount:', error)
    throw error
  }
}

/**
 * Obtenir le montant minimum pour une crypto
 */
export async function getMinimumAmount(
  currencyFrom: string,
  currencyTo: string = 'usdttrc20'
) {
  try {
    const response = await fetch(
      `${NOWPAYMENTS_API_URL}/min-amount?currency_from=${currencyFrom}&currency_to=${currencyTo}`,
      {
        headers: {
          'x-api-key': NOWPAYMENTS_API_KEY,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to get minimum amount')
    }

    return response.json()
  } catch (error) {
    console.error('Failed to get minimum amount:', error)
    throw error
  }
}

/**
 * Vérifier le statut de l'API NOWPayments
 */
export async function checkApiStatus() {
  try {
    const response = await fetch(`${NOWPAYMENTS_API_URL}/status`, {
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
      },
    })

    if (!response.ok) {
      throw new Error('API is not available')
    }

    return response.json()
  } catch (error) {
    console.error('Failed to check API status:', error)
    throw error
  }
}

/**
 * Logger pour le développement
 */
export function logPayment(action: string, data: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔷 ${action}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(JSON.stringify(data, null, 2))
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  }
}