{/* BOUTONS DE TEST - À AFFICHER UNIQUEMENT EN DEV */}
{process.env.NODE_ENV === 'development' && paymentData && (
  <div className="mt-4 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20 space-y-3">
    <p className="text-xs font-bold text-purple-400 flex items-center gap-2">
      🧪 MODE TEST (DEV uniquement)
    </p>
    
    <div className="flex gap-2">
      <button
        onClick={async () => {
          setIsLoading(true)
          try {
            const res = await fetch('/api/wallet/simulate-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentId: paymentData.id,
                amountUsd: paymentData.priceAmount,
                withSurplus: false,
              }),
            })
            
            const data = await res.json()
            
            if (res.ok) {
              setMessage({ type: 'success', text: data.message })
              fetchBalance()
              setPaymentData(null)
              setDepositAmountUsd("")
            } else {
              setMessage({ type: 'error', text: data.error })
            }
          } catch (error) {
            setMessage({ type: 'error', text: 'Erreur simulation' })
          } finally {
            setIsLoading(false)
          }
        }}
        className="flex-1 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs font-bold rounded-lg transition-colors border border-green-500/30"
      >
        ✅ Simuler paiement exact
      </button>
      
      <button
        onClick={async () => {
          setIsLoading(true)
          try {
            const res = await fetch('/api/wallet/simulate-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentId: paymentData.id,
                amountUsd: paymentData.priceAmount,
                withSurplus: true,
              }),
            })
            
            const data = await res.json()
            
            if (res.ok) {
              setMessage({ type: 'success', text: data.message })
              fetchBalance()
              setPaymentData(null)
              setDepositAmountUsd("")
            } else {
              setMessage({ type: 'error', text: data.error })
            }
          } catch (error) {
            setMessage({ type: 'error', text: 'Erreur simulation' })
          } finally {
            setIsLoading(false)
          }
        }}
        className="flex-1 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-xs font-bold rounded-lg transition-colors border border-purple-500/30"
      >
        🎁 Simuler avec surplus +50%
      </button>
    </div>
    
    <p className="text-[10px] text-text-tertiary">
      Ces boutons simulent la réception d'un webhook NOWPayments et créditent votre wallet instantanément.
    </p>
  </div>
)}
