// lib/coingate.ts
// Service pour l'API CoinGate

const COINGATE_API_KEY = process.env.COINGATE_API_KEY!
const COINGATE_API_URL = process.env.COINGATE_API_URL || 'https://api-sandbox.coingate.com/v2'

export interface CreateOrderParams {
  priceAmount: number      // Montant en USD
  receiveCurrency: string  // Crypto (USDT, ETH, BTC, etc.)
  orderId: string          // Référence unique
  title: string
  description?: string
  callbackUrl?: string
  successUrl?: string
  cancelUrl?: string
}

export interface CoinGateOrder {
  id: number
  status: string
  price_currency: string
  price_amount: string
  receive_currency: string
  receive_amount: string
  pay_currency: string
  pay_amount: string
  payment_address: string
  order_id: string
  token: string
  created_at: string
  expire_at: string
  payment_url: string
}

/**
 * Créer une commande de paiement
 */
export async function createOrder(params: CreateOrderParams): Promise<CoinGateOrder> {
  try {
    const response = await fetch(`${COINGATE_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COINGATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: params.orderId,
        price_amount: params.priceAmount,
        price_currency: 'USD',
        receive_currency: params.receiveCurrency.toUpperCase(),
        title: params.title,
        description: params.description || params.title,
        callback_url: params.callbackUrl,
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('CoinGate API Error:', error)
      throw new Error(`CoinGate error: ${error.message || JSON.stringify(error)}`)
    }

    const order = await response.json()
    logOrder('ORDER CREATED', order)
    return order
  } catch (error) {
    console.error('Failed to create CoinGate order:', error)
    throw error
  }
}

/**
 * Récupérer le statut d'une commande
 */
export async function getOrder(orderId: number): Promise<CoinGateOrder> {
  try {
    const response = await fetch(`${COINGATE_API_URL}/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${COINGATE_API_KEY}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to fetch order: ${error.message}`)
    }

    return response.json()
  } catch (error) {
    console.error('Failed to get order:', error)
    throw error
  }
}

/**
 * Vérifier si l'API est disponible
 */
export async function checkStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${COINGATE_API_URL}/ping`, {
      headers: {
        'Authorization': `Bearer ${COINGATE_API_KEY}`,
      },
    })

    if (!response.ok) return false

    const data = await response.json()
    return data.ping === 'pong'
  } catch (error) {
    console.error('CoinGate API unavailable:', error)
    return false
  }
}

/**
 * Obtenir les taux de change
 */
export async function getExchangeRate(from: string = 'USD', to: string = 'USDT') {
  try {
    const response = await fetch(
      `${COINGATE_API_URL}/rates/merchant/${from}/${to}`,
      {
        headers: {
          'Authorization': `Bearer ${COINGATE_API_KEY}`,
        },
      }
    )

    if (!response.ok) return null

    return response.json()
  } catch (error) {
    console.error('Failed to get exchange rate:', error)
    return null
  }
}

/**
 * Logger pour le développement
 */
function logOrder(action: string, data: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟦 CoinGate: ${action}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(JSON.stringify(data, null, 2))
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  }
}

/**
 * Mapper les currencies
 */
export function mapCurrency(currency: string): string {
  const mapping: Record<string, string> = {
    'usdttrc20': 'USDT',
    'usdterc20': 'USDT',
    'usdcerc20': 'USDC',
    'usdc': 'USDC',
    'eth': 'ETH',
    'bnb': 'BNB',
    'trx': 'TRX',
    'btc': 'BTC',
    'ltc': 'LTC'
  }

  return mapping[currency.toLowerCase()] || currency.toUpperCase()
}