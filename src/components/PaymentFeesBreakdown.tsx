// components/PaymentFeesBreakdown.tsx
'use client'

interface PaymentFeesBreakdownProps {
  priceAmount: number // Montant demandé par le user
  outcomeAmount: number // Montant que tu recevras
  payCurrency: string
  className?: string
}

export default function PaymentFeesBreakdown({
  priceAmount,
  outcomeAmount,
  payCurrency,
  className = ''
}: PaymentFeesBreakdownProps) {
  
  const totalFees = priceAmount - outcomeAmount
  const feePercent = (totalFees / priceAmount) * 100
  
  return (
    <div className={`bg-surface border border-border rounded-lg p-4 ${className}`}>
      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <span>📊</span>
        Détails de la transaction
      </h4>
      
      <div className="space-y-2">
        {/* Montant demandé */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-text-secondary">Montant demandé</span>
          <span className="font-mono font-semibold text-white">
            ${priceAmount.toFixed(2)}
          </span>
        </div>
        
        {/* Separator */}
        <div className="border-t border-border/50 my-2" />
        
        {/* Frais totaux */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-text-secondary">Frais (réseau + service)</span>
          <span className="font-mono font-semibold text-red-400">
            -${totalFees.toFixed(2)}
          </span>
        </div>
        
        <div className="flex justify-between items-center text-xs">
          <span className="text-text-secondary/70">Pourcentage</span>
          <span className="font-mono text-red-400/80">
            {feePercent.toFixed(2)}%
          </span>
        </div>
        
        {/* Separator */}
        <div className="border-t border-border/50 my-2" />
        
        {/* Montant final */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-white">
            Crédit final
          </span>
          <span className="font-mono text-lg font-bold text-green-400">
            ${outcomeAmount.toFixed(2)}
          </span>
        </div>
      </div>
      
      {/* Info message */}
      <div className="mt-3 pt-3 border-t border-border/50">
        <p className="text-xs text-text-secondary/80">
          Le montant de <span className="font-semibold text-white">${outcomeAmount.toFixed(2)}</span> sera 
          crédité dans votre balance après confirmation du paiement.
        </p>
      </div>
      
      {/* Warning si frais > 5% */}
      {feePercent > 5 && (
        <div className="mt-3 bg-amber-500/10 border border-amber-500/30 rounded p-2">
          <p className="text-xs text-amber-400">
            ⚠️ Frais importants ({feePercent.toFixed(1)}%). 
            Considérez Bitcoin ou Ethereum pour économiser.
          </p>
        </div>
      )}
    </div>
  )
}