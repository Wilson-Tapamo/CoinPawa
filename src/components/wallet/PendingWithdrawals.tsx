// components/PendingWithdrawals.tsx
"use client"

import { useState, useEffect } from 'react'
import { formatToUSD } from '@/lib/utils'
import { Clock, CheckCircle, Copy, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PendingWithdrawal {
  id: string
  amountUsd: number
  netAmountUsd: number
  feeUsd: number
  crypto: string
  address: string
  status: string
  createdAt: string
  metadata?: any
}

export default function PendingWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<PendingWithdrawal[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPendingWithdrawals()
  }, [])

  const fetchPendingWithdrawals = async () => {
    try {
      const res = await fetch('/api/wallet/pending-withdrawals')
      if (res.ok) {
        const data = await res.json()
        setWithdrawals(data.withdrawals || [])
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSimulateComplete = async (withdrawalId: string) => {
    try {
      const res = await fetch('/api/wallet/simulate-withdrawal-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId }),
      })

      if (res.ok) {
        // Recharger la liste
        fetchPendingWithdrawals()
      }
    } catch (error) {
      console.error('Error simulating withdrawal:', error)
    }
  }

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (withdrawals.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Aucun retrait en attente</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {withdrawals.map((withdrawal) => (
        <div
          key={withdrawal.id}
          className="bg-[#1A1D26] rounded-xl border border-orange-500/20 p-4"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Retrait en attente</p>
                <p className="text-xs text-orange-400 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" /> En cours de traitement
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg text-red-500 font-mono">
                -{formatToUSD(withdrawal.amountUsd)}
              </p>
              <p className="text-[10px] text-text-tertiary">
                {new Date(withdrawal.createdAt).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {/* Détails */}
          <div className="space-y-2 text-xs bg-background-secondary/50 rounded-lg p-3">
            <div className="flex justify-between">
              <span className="text-text-tertiary">Montant demandé :</span>
              <span className="text-white font-mono">
                {formatToUSD(withdrawal.amountUsd)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">Frais (1%) :</span>
              <span className="text-red-400 font-mono">
                -{formatToUSD(withdrawal.feeUsd)}
              </span>
            </div>
            <div className="h-px bg-white/5" />
            <div className="flex justify-between font-bold">
              <span className="text-text-tertiary">Vous recevrez :</span>
              <span className="text-primary font-mono">
                {formatToUSD(withdrawal.netAmountUsd)}
              </span>
            </div>

            {/* Adresse */}
            <div className="pt-2 border-t border-white/5">
              <p className="text-[10px] text-text-tertiary mb-1">
                Adresse {withdrawal.crypto} :
              </p>
              <div className="flex items-center gap-2">
                <code className="text-[10px] text-text-secondary font-mono flex-1 truncate">
                  {withdrawal.address}
                </code>
                <button
                  onClick={() => copyAddress(withdrawal.address)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <Copy className="w-3 h-3 text-text-secondary" />
                </button>
              </div>
            </div>
          </div>

          {/* Bouton de simulation (dev only) */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => handleSimulateComplete(withdrawal.id)}
              className="w-full mt-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs font-bold rounded-lg transition-colors border border-green-500/30"
            >
              🧪 Simuler envoi crypto (DEV)
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
