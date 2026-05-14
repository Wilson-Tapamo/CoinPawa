// lib/plisio.ts
import crypto from 'crypto'

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
    'BTC': 'BTC',
    'ETH': 'ETH',
    'LTC': 'LTC',
    'BNB': 'BNB',
    'TRX': 'TRX',
    'USDC': 'USDC',
    'SOL': 'SOL',
  }
  
  return mapping[currency.toUpperCase()] || currency.toUpperCase()
}

/**
 * Créer une invoice Plisio
 */
export async function createInvoice(params: CreateInvoiceParams): Promise<PlisioInvoice> {
  const apiKey = process.env.PLISIO_API_KEY
  
  if (!apiKey) {
    throw new Error('PLISIO_API_KEY non configuré')
  }

  // ✅ Construire les paramètres correctement
  const requestParams = {
    source_currency: 'USD',
    source_amount: params.sourceAmount.toString(),
    order_number: params.orderNumber,
    currency: params.currency,
    order_name: params.orderName,
    callback_url: params.callbackUrl,
    api_key: apiKey,
  }
  
  // Ajouter email si présent
  if (params.email) {
    (requestParams as any).email = params.email
  }

  const url = 'https://plisio.net/api/v1/invoices/new'
  
  console.log('📤 Appel API Plisio:', {
    url,
    params: {
      ...requestParams,
      api_key: '***' // Masquer la clé
    }
  })
  
  const body = new URLSearchParams(requestParams)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  const responseText = await response.text()
  
  console.log('📥 Réponse Plisio:', {
    status: response.status,
    statusText: response.statusText,
    body: responseText.substring(0, 500) // Premiers 500 caractères
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
    return true // En dev, on accepte sans vérification
  }

  if (!data.verify_hash) {
    console.error('❌ verify_hash manquant dans le webhook')
    return false
  }

  // Plisio génère le hash avec tous les champs (sauf verify_hash) triés alphabétiquement
  const fieldsToHash: Record<string, string> = {}
  
  // Convertir tous les champs en string
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
  const apiKey = process.env.PLISIO_API_KEY
  
  if (!apiKey) {
    throw new Error('PLISIO_API_KEY non configuré')
  }

  const url = `https://plisio.net/api/v1/operations/${txnId}?api_key=${apiKey}`
  
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