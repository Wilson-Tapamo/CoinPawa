"use client";

import { useState, useEffect } from 'react'
import { ArrowLeft, AlertCircle, CheckCircle, Loader2, Info } from 'lucide-react'
import Link from 'next/link'

export default function WithdrawalsPage() {
  const [amount, setAmount] = useState('')
  const [address, setAddress] = useState('')
  const [network, setNetwork] = useState('TRC20')
  const [balance, setBalance] = useState(0)
  const [fee, setFee] = useState(0)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<any>(null)

  // Fetch balance
  useEffect(() => {
    fetchBalance()
  }, [])

  // Calculer les frais en temps réel
  useEffect(() => {
    const amountNum = parseFloat(amount) || 0
    if (amountNum > 0) {
      const calculatedFee = Math.max(amountNum * 0.02, 1) // 2%, min $1
      setFee(calculatedFee)
      setTotal(amountNum + calculatedFee)
    } else {
      setFee(0)
      setTotal(0)
    }
  }, [amount])

  async function fetchBalance() {
    try {
      const res = await fetch('/api/wallet/balance')
      const data = await res.json()
      if (data.success) {
        setBalance(data.balanceUSD)
      }
    } catch (err) {
      console.error('Error fetching balance:', err)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(null)
    setIsLoading(true)

    try {
      const res = await fetch('/api/withdrawals/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          address,
          network
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la demande')
      }

      setSuccess(data)
      setAmount('')
      setAddress('')
      
      // Refresh balance
      await fetchBalance()

    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const amountNum = parseFloat(amount) || 0
  const canSubmit = amountNum >= 10 && amountNum <= 10000 && address.length > 0 && total <= balance

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link 
            href="/wallet"
            className="p-2 hover:bg-surface rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Retrait</h1>
            <p className="text-sm text-text-secondary">
              Balance: ${balance.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-green-500 font-medium mb-1">
                  {success.isAutomatic 
                    ? '✅ Retrait en cours de traitement automatique'
                    : '⏳ Retrait en attente de validation manuelle'}
                </p>
                <p className="text-sm text-text-secondary">
                  {success.message}
                </p>
                <Link 
                  href="/wallet"
                  className="text-sm text-primary hover:underline mt-2 inline-block"
                >
                  Voir l'historique →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-500 font-medium">Erreur</p>
                <p className="text-sm text-text-secondary mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Info Auto/Manuel */}
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-blue-500 font-medium mb-1">
                {amountNum < 500 
                  ? '⚡ Retrait automatique (instantané)'
                  : '⏳ Retrait manuel (validation admin)'}
              </p>
              <p className="text-text-secondary">
                {amountNum < 500
                  ? 'Les retraits inférieurs à $500 sont traités automatiquement en quelques minutes.'
                  : 'Les retraits supérieurs à $500 nécessitent une validation manuelle (quelques heures).'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-white/5 p-6">
          {/* Network Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-3">
              Réseau
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['TRC20', 'ERC20', 'BEP20'].map((net) => (
                <button
                  key={net}
                  type="button"
                  onClick={() => setNetwork(net)}
                  className={`
                    p-3 rounded-lg border transition-all
                    ${network === net
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-background border-white/10 text-text-secondary hover:border-white/20'
                    }
                  `}
                >
                  <div className="font-medium">{net}</div>
                  <div className="text-xs mt-1 opacity-70">
                    {net === 'TRC20' ? 'Tron' : net === 'ERC20' ? 'Ethereum' : 'BSC'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">
              Montant (USD)
            </label>
            <input
              type="number"
              step="0.01"
              min="10"
              max="10000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Entrez le montant"
              className="w-full px-4 py-3 bg-background border border-white/10 rounded-lg text-white placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors"
            />
            <div className="flex justify-between text-xs text-text-tertiary mt-2">
              <span>Min: $10</span>
              <span>Max: $10,000</span>
            </div>
          </div>

          {/* Address */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">
              Adresse {network}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={network === 'TRC20' ? 'TRxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' : '0xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'}
              className="w-full px-4 py-3 bg-background border border-white/10 rounded-lg text-white placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors font-mono text-sm"
            />
          </div>

          {/* Summary */}
          {amountNum > 0 && (
            <div className="mb-6 p-4 bg-background rounded-lg border border-white/5">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Montant</span>
                  <span className="text-white font-medium">${amountNum.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Frais (2%)</span>
                  <span className="text-white">${fee.toFixed(2)}</span>
                </div>
                <div className="h-px bg-white/5 my-2" />
                <div className="flex justify-between text-base">
                  <span className="text-white font-medium">Total débité</span>
                  <span className="text-primary font-bold">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit || isLoading}
            className={`
              w-full py-4 rounded-lg font-bold text-lg transition-all
              ${canSubmit && !isLoading
                ? 'bg-gradient-to-r from-primary to-secondary text-black hover:shadow-lg hover:shadow-primary/50'
                : 'bg-surface text-text-tertiary cursor-not-allowed'
              }
            `}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Traitement...
              </span>
            ) : (
              'Demander le retrait'
            )}
          </button>

          {/* Validation Errors */}
          {amountNum > 0 && (
            <div className="mt-4 space-y-1 text-xs">
              {amountNum < 10 && (
                <p className="text-red-500">• Montant minimum: $10</p>
              )}
              {amountNum > 10000 && (
                <p className="text-red-500">• Montant maximum: $10,000</p>
              )}
              {total > balance && (
                <p className="text-red-500">• Balance insuffisante (inclut les frais)</p>
              )}
              {!address && (
                <p className="text-yellow-500">• Adresse requise</p>
              )}
            </div>
          )}
        </form>

        {/* Info Section */}
        <div className="mt-6 p-4 bg-surface/50 rounded-xl border border-white/5">
          <h3 className="text-sm font-medium text-white mb-3">Informations importantes</h3>
          <ul className="space-y-2 text-xs text-text-secondary">
            <li>• Montant minimum: $10 USD</li>
            <li>• Frais de retrait: 2% (minimum $1)</li>
            <li>• Retraits &lt; $500: Automatiques (quelques minutes)</li>
            <li>• Retraits ≥ $500: Validation manuelle (quelques heures)</li>
            <li>• Maximum 3 retraits automatiques par jour</li>
            <li>• Vérifiez bien votre adresse avant de valider</li>
          </ul>
        </div>
      </div>
    </div>
  )
}