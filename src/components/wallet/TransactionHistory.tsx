// components/TransactionHistory.tsx
"use client"

import { useState, useEffect } from 'react'
import { formatToUSD } from '@/lib/utils'
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Gift, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Transaction {
  id: string
  type: 'DEPOSIT' | 'DEPOSIT_BONUS' | 'WITHDRAW' | 'BET' | 'WIN'
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'EXPIRED'
  amountSats: string
  cryptoCurrency?: string
  toAddress?: string
  txHash?: string
  createdAt: string
  metadata?: any
  paymentRef?: string
}

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedTx, setExpandedTx] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/wallet/transactions')
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Convertir sats en USD
  const satsToUsd = (sats: string) => {
    return Number(sats) / 100_000_000
  }

  // Copier dans le presse-papier
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  // Icônes selon le type
  const getIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return <ArrowDownLeft className="w-5 h-5 text-green-500" />
      case 'DEPOSIT_BONUS':
        return <Gift className="w-5 h-5 text-purple-500" />
      case 'WITHDRAW':
        return <ArrowUpRight className="w-5 h-5 text-red-500" />
      case 'BET':
        return <ArrowUpRight className="w-5 h-5 text-orange-500" />
      case 'WIN':
        return <ArrowDownLeft className="w-5 h-5 text-yellow-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  // Label selon le type
  const getLabel = (tx: Transaction) => {
    switch (tx.type) {
      case 'DEPOSIT':
        return 'Dépôt'
      case 'DEPOSIT_BONUS':
        const percentage = tx.metadata?.bonus_percentage || 95
        return `Bonus Surplus (${percentage}%)`
      case 'WITHDRAW':
        return 'Retrait'
      case 'BET':
        return 'Mise'
      case 'WIN':
        return 'Gain'
      default:
        return tx.type
    }
  }

  // Couleur de fond selon le type
  const getBgColor = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return 'bg-green-500/10'
      case 'DEPOSIT_BONUS':
        return 'bg-purple-500/10'
      case 'WITHDRAW':
        return 'bg-red-500/10'
      case 'BET':
        return 'bg-orange-500/10'
      case 'WIN':
        return 'bg-yellow-500/10'
      default:
        return 'bg-gray-500/10'
    }
  }

  // Badge de statut
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <div className="flex items-center gap-1 text-green-500 text-xs">
            <CheckCircle className="w-3 h-3" /> Complété
          </div>
        )
      case 'PENDING':
        return (
          <div className="flex items-center gap-1 text-yellow-500 text-xs">
            <Clock className="w-3 h-3" /> En attente
          </div>
        )
      case 'FAILED':
        return (
          <div className="flex items-center gap-1 text-red-500 text-xs">
            <XCircle className="w-3 h-3" /> Échoué
          </div>
        )
      case 'EXPIRED':
        return (
          <div className="flex items-center gap-1 text-orange-500 text-xs">
            <AlertCircle className="w-3 h-3" /> Expiré
          </div>
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-text-secondary bg-background-secondary rounded-xl border border-white/5">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium">Aucune transaction</p>
        <p className="text-xs text-text-tertiary mt-1">Vos transactions apparaîtront ici</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => {
        const isExpanded = expandedTx === tx.id
        const isCredit = ['DEPOSIT', 'DEPOSIT_BONUS', 'WIN'].includes(tx.type)
        const amountUsd = satsToUsd(tx.amountSats)

        return (
          <div
            key={tx.id}
            className={cn(
              "bg-[#1A1D26] rounded-xl border transition-all",
              tx.status === 'PENDING' && "border-yellow-500/20",
              tx.status === 'COMPLETED' && "border-white/5 hover:border-white/10",
              tx.status === 'FAILED' && "border-red-500/20",
              tx.status === 'EXPIRED' && "border-orange-500/20"
            )}
          >
            {/* Header - Toujours visible */}
            <div 
              className="p-4 cursor-pointer"
              onClick={() => setExpandedTx(isExpanded ? null : tx.id)}
            >
              <div className="flex items-center justify-between">
                {/* Icône + Info */}
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", getBgColor(tx.type))}>
                    {getIcon(tx.type)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white text-sm">{getLabel(tx)}</p>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-text-tertiary" /> : <ChevronDown className="w-4 h-4 text-text-tertiary" />}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(tx.status)}
                      {tx.cryptoCurrency && (
                        <span className="text-[10px] text-text-tertiary">
                          {tx.cryptoCurrency}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Montant */}
                <div className="text-right">
                  <p className={cn(
                    "font-bold text-lg font-mono",
                    isCredit ? "text-green-500" : "text-red-500"
                  )}>
                    {isCredit ? '+' : '-'}{formatToUSD(amountUsd)}
                  </p>
                  <p className="text-[10px] text-text-tertiary mt-0.5">
                    {new Date(tx.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Détails - Visible si étendu */}
            {isExpanded && (
              <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                
                {/* Détails du bonus de surplus */}
                {tx.type === 'DEPOSIT_BONUS' && tx.metadata && (
                  <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
                    <p className="text-xs font-bold text-purple-400 mb-2 flex items-center gap-1">
                      <Gift className="w-3 h-3" /> Détails du bonus
                    </p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-text-tertiary">Surplus total:</span>
                        <span className="text-white font-mono">
                          {formatToUSD(tx.metadata.surplus_total)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-tertiary">Bonus ({tx.metadata.bonus_percentage}%):</span>
                        <span className="text-green-400 font-mono">
                          +{formatToUSD(amountUsd)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-tertiary">Frais plateforme (5%):</span>
                        <span className="text-red-400 font-mono">
                          -{formatToUSD(tx.metadata.platform_fee)}
                        </span>
                      </div>
                    </div>
                    {tx.metadata.note && (
                      <p className="text-[10px] text-purple-300 mt-2">
                        💡 {tx.metadata.note}
                      </p>
                    )}
                  </div>
                )}

                {/* Adresse (pour retraits) */}
                {tx.toAddress && (
                  <div>
                    <p className="text-[10px] text-text-tertiary mb-1 font-bold uppercase">
                      Adresse de destination
                    </p>
                    <div className="flex items-center gap-2 bg-background-secondary/50 rounded-lg p-2">
                      <code className="text-[11px] text-text-secondary font-mono flex-1 truncate">
                        {tx.toAddress}
                      </code>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopy(tx.toAddress!, tx.id)
                        }}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        {copied === tx.id ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-text-secondary" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* TxHash (si disponible) */}
                {tx.txHash && (
                  <div>
                    <p className="text-[10px] text-text-tertiary mb-1 font-bold uppercase">
                      Transaction Hash
                    </p>
                    <div className="flex items-center gap-2 bg-background-secondary/50 rounded-lg p-2">
                      <code className="text-[11px] text-text-secondary font-mono flex-1 truncate">
                        {tx.txHash}
                      </code>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopy(tx.txHash!, `${tx.id}-hash`)
                        }}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        {copied === `${tx.id}-hash` ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-text-secondary" />
                        )}
                      </button>
                      <a
                        href={`https://tronscan.org/#/transaction/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3 text-text-secondary" />
                      </a>
                    </div>
                  </div>
                )}

                {/* ID de la transaction */}
                <div>
                  <p className="text-[10px] text-text-tertiary mb-1 font-bold uppercase">
                    ID de transaction
                  </p>
                  <div className="flex items-center gap-2 bg-background-secondary/50 rounded-lg p-2">
                    <code className="text-[11px] text-text-secondary font-mono flex-1 truncate">
                      {tx.paymentRef || tx.id}
                    </code>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopy(tx.paymentRef || tx.id, `${tx.id}-ref`)
                      }}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      {copied === `${tx.id}-ref` ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3 text-text-secondary" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Badge de test */}
                {(tx.metadata?.simulated || tx.metadata?.test_mode) && (
                  <div className="flex items-center gap-2 text-[10px] text-yellow-400 bg-yellow-500/10 rounded-lg p-2">
                    <AlertCircle className="w-3 h-3" />
                    <span>Transaction de test (simulée)</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
