// lib/plisio.ts
// Service pour l'API Plisio

const PLISIO_API_KEY = process.env.PLISIO_API_KEY!
const PLISIO_API_URL = 'https://plisio.net/api/v1'

export interface CreateInvoiceParams {
  sourceAmount: number      // Montant en USD
  currency: string          // Crypto (USDT, BTC, ETH, etc.)
  orderNumber: string       // ID unique de commande
  orderName: string         // Description
  email?: string            // Email du user (optionnel)
  callbackUrl?: string      // Webhook URL
}

export interface PlisioInvoice {
  txn_id: string
  invoice_url: string
  amount: string
  pending_amount: string
  wallet_hash: string
  psys_cid: string
  currency: string
  source_currency: string
  source_rate: string
  source_amount: string
  expected_confirmations: number
  qr_code: string
  verify_hash: string
  invoice_commission: string
  invoice_sum: string
  invoice_total_sum: string
}

export interface PlisioWebhook {
  txn_id: string
  status: string
  status_code: number
  amount: string
  pending_amount: string
  wallet_hash: string
  psys_cid: string
  currency: string
  source_currency: string
  source_rate: string
  source_amount: string
  confirmations: number
  expected_confirmations: number
  commission: string
  order_number: string
  order_name: string
  verify_hash: string
}

/**
 * Créer une nouvelle invoice
 */
export async function createInvoice(params: CreateInvoiceParams): Promise<PlisioInvoice> {
  try {
    const queryParams = new URLSearchParams({
      source_currency: 'USD',
      source_amount: params.sourceAmount.toString(),
      order_number: params.orderNumber,
      currency: params.currency.toUpperCase(),
      email: params.email || '',
      order_name: params.orderName,
      callback_url: params.callbackUrl || '',
      api_key: PLISIO_API_KEY,
    })

    const response = await fetch(`${PLISIO_API_URL}/invoices/new?${queryParams}`, {
      method: 'GET',
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Plisio API Error:', error)
      throw new Error(`Plisio error: ${error.message || JSON.stringify(error)}`)
    }

    const result = await response.json()
    
    if (result.status !== 'success') {
      throw new Error(`Plisio error: ${result.message || 'Unknown error'}`)
    }

    logInvoice('INVOICE CREATED', result.data)
    return result.data
  } catch (error) {
    console.error('Failed to create Plisio invoice:', error)
    throw error
  }
}

/**
 * Vérifier la signature du webhook
 */
export function verifyWebhookSignature(data: PlisioWebhook): boolean {
  try {
    const crypto = require('crypto')
    
    // Construire la string à vérifier (selon doc Plisio)
    const verifyString = JSON.stringify(data)
    
    const hash = crypto
      .createHmac('sha1', PLISIO_API_KEY)
      .update(verifyString)
      .digest('hex')

    return hash === data.verify_hash
  } catch (error) {
    console.error('Failed to verify webhook signature:', error)
    return false
  }
}

/**
 * Obtenir les cryptos disponibles
 */
export async function getAvailableCurrencies(): Promise<string[]> {
  try {
    const response = await fetch(`${PLISIO_API_URL}/currencies?api_key=${PLISIO_API_KEY}`)

    if (!response.ok) {
      throw new Error('Failed to fetch currencies')
    }

    const result = await response.json()
    
    if (result.status === 'success') {
      return Object.keys(result.data)
    }

    return []
  } catch (error) {
    console.error('Failed to get Plisio currencies:', error)
    // Fallback
    return ['BTC', 'ETH', 'USDT', 'USDC', 'LTC', 'DOGE', 'TRX', 'BNB']
  }
}

/**
 * Vérifier si l'API est disponible
 */
export async function checkStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${PLISIO_API_URL}/currencies?api_key=${PLISIO_API_KEY}`)
    return response.ok
  } catch (error) {
    console.error('Plisio API unavailable:', error)
    return false
  }
}

/**
 * Logger pour le développement
 */
function logInvoice(action: string, data: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟣 Plisio: ${action}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(JSON.stringify(data, null, 2))
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  }
}

/**
 * Mapper les currencies pour Plisio
 */
export function mapCurrency(currency: string): string {
  const mapping: Record<string, string> = {
    'usdttrc20': 'USDT_TRX',
    'usdterc20': 'USDT',
    'usdt': 'USDT',
    'usdc': 'USDC',
    'eth': 'ETH',
    'btc': 'BTC',
    'trx': 'TRX',
    'ltc': 'LTC',
    'doge': 'DOGE',
    'bnb': 'BNB'
  }

  return mapping[currency.toLowerCase()] || currency.toUpperCase()
}