// lib/plisio.ts
import crypto from 'crypto'

const PLISIO_API_KEY = process.env.PLISIO_API_KEY!
const PLISIO_API_URL = 'https://plisio.net/api/v1'

// Types
export interface PlisioWebhook {
  txn_id: string
  status: string
  status_code?: number
  order_number: string
  amount: string
  currency: string
  source_amount?: string
  source_currency?: string
  verify_hash?: string
}

export interface PlisioInvoice {
  txn_id: string
  invoice_url: string
  wallet_hash: string
  amount: string
  currency: string
  source_amount: string
  source_currency: string
  qr_code: string
  expected_confirmations: number
}

export interface CreateInvoiceParams {
  sourceAmount: number
  currency: string
  orderNumber: string
  orderName: string
  email?: string
  callbackUrl: string
}

/**
 * Mapper les noms de crypto vers le format Plisio
 */
export function mapCurrency(currency: string): string {
  const mapping: Record<string, string> = {
    'USDT': 'USDT_TRX',      // USDT sur Tron
    'USDT_TRC20': 'USDT_TRX',
    'usdttrc20': 'USDT_TRX',
    'usdterc20': 'USDT',
    'BTC': 'BTC',
    'ETH': 'ETH',
    'LTC': 'LTC',
    'BNB': 'BNB',
    'TRX': 'TRX',
    'USDC': 'USDC',
    'SOL': 'SOL',
    'DOGE': 'DOGE',
  }
  
  return mapping[currency.toUpperCase()] || currency.toUpperCase()
}

/**
 * Créer une invoice Plisio
 * ✅ IMPORTANT : Plisio utilise GET avec query params, PAS POST !
 */
export async function createInvoice(params: CreateInvoiceParams): Promise<PlisioInvoice> {
  if (!PLISIO_API_KEY) {
    throw new Error('PLISIO_API_KEY non configuré')
  }

  // ✅ Construire les query params pour GET
  const queryParams = new URLSearchParams({
    source_currency: 'USD',
    source_amount: params.sourceAmount.toString(),
    order_number: params.orderNumber,
    currency: params.currency,
    order_name: params.orderName,
    callback_url: params.callbackUrl,
    api_key: PLISIO_API_KEY,
  })
  
  // Ajouter email si présent
  if (params.email) {
    queryParams.set('email', params.email)
  }

  const url = `${PLISIO_API_URL}/invoices/new?${queryParams}`
  
  console.log('📤 Appel API Plisio (GET):', {
    url: PLISIO_API_URL + '/invoices/new',
    params: {
      source_currency: 'USD',
      source_amount: params.sourceAmount,
      order_number: params.orderNumber,
      currency: params.currency,
      api_key: '***' // Masquer la clé
    }
  })

  // ✅ IMPORTANT : Utiliser GET, pas POST !
  const response = await fetch(url, {
    method: 'GET',
  })

  const responseText = await response.text()
  
  console.log('📥 Réponse Plisio:', {
    status: response.status,
    statusText: response.statusText,
    body: responseText.substring(0, 500)
  })

  if (!response.ok) {
    throw new Error(`Plisio API error: ${response.status} - ${responseText.substring(0, 200)}`)
  }

  let data
  try {
    data = JSON.parse(responseText)
  } catch (e) {
    throw new Error(`Plisio returned non-JSON: ${responseText.substring(0, 200)}`)
  }

  if (data.status !== 'success') {
    throw new Error(`Plisio error: ${data.message || JSON.stringify(data)}`)
  }

  return {
    txn_id: data.data.txn_id,
    invoice_url: data.data.invoice_url,
    wallet_hash: data.data.wallet_hash,
    amount: data.data.amount,
    currency: data.data.currency,
    source_amount: data.data.source_amount,
    source_currency: data.data.source_currency,
    qr_code: data.data.qr_code,
    expected_confirmations: data.data.expected_confirmations,
  }
}

/**
 * Vérifier la signature d'un webhook Plisio
 */
export function verifyWebhookSignature(data: PlisioWebhook): boolean {
  const secret = process.env.PLISIO_SECRET_KEY
  
  if (!secret) {
    console.warn('⚠️ PLISIO_SECRET_KEY non configuré, signature non vérifiée')
    return true
  }

  if (!data.verify_hash) {
    console.error('❌ verify_hash manquant dans le webhook')
    return false
  }

  const fieldsToHash: Record<string, string> = {}
  
  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'verify_hash' && value !== undefined) {
      fieldsToHash[key] = String(value)
    }
  })

  const sortedKeys = Object.keys(fieldsToHash).sort()
  const dataString = sortedKeys.map(key => fieldsToHash[key]).join('')
  
  const calculatedHash = crypto
    .createHash('sha1')
    .update(dataString + secret)
    .digest('hex')

  const isValid = calculatedHash === data.verify_hash

  if (!isValid) {
    console.error('❌ Signature invalide')
    console.error('Reçu:', data.verify_hash)
    console.error('Calculé:', calculatedHash)
  }

  return isValid
}

/**
 * Récupérer les détails d'une transaction Plisio (inclut les frais)
 */
export async function getTransactionDetails(txnId: string) {
  if (!PLISIO_API_KEY) {
    throw new Error('PLISIO_API_KEY non configuré')
  }

  const url = `${PLISIO_API_URL}/operations/${txnId}?api_key=${PLISIO_API_KEY}`
  
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`Plisio API error: ${response.status}`)
  }

  const data = await response.json()
  
  if (data.status !== 'success') {
    throw new Error(`Plisio API error: ${data.message}`)
  }

  return {
    txnId: data.data.id,
    status: data.data.status,
    amount: parseFloat(data.data.amount),
    sourceAmount: parseFloat(data.data.source_amount),
    fee: parseFloat(data.data.commission || '0'),
    amountReceived: parseFloat(data.data.amount) - parseFloat(data.data.commission || '0'),
    currency: data.data.currency,
    sourceCurrency: data.data.source_currency,
  }
}