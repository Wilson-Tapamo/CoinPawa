"use client";

import { useState } from "react";
import { ArrowLeft, Shield, AlertCircle, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Cryptos supportées pour les retraits
const CRYPTO_OPTIONS = [
  { code: 'USDT_TRX', name: 'USDT', network: 'TRC-20', icon: '₮', color: 'text-success', minWithdraw: 10 },
  { code: 'USDT', name: 'USDT', network: 'ERC-20', icon: '₮', color: 'text-success', minWithdraw: 50 },
  { code: 'BTC', name: 'Bitcoin', network: 'BTC', icon: '₿', color: 'text-primary', minWithdraw: 100 },
  { code: 'ETH', name: 'Ethereum', network: 'ERC-20', icon: 'Ξ', color: 'text-accent-violet', minWithdraw: 50 },
  { code: 'TRX', name: 'TRON', network: 'TRX', icon: 'T', color: 'text-accent-rose', minWithdraw: 10 }
];

export default function WithdrawPage() {
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [selectedCrypto, setSelectedCrypto] = useState('USDT_TRX');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // TODO: Récupérer la vraie balance de l'utilisateur
  const userBalance = 1000; // $1000 en sats

  const selectedCryptoData = CRYPTO_OPTIONS.find(c => c.code === selectedCrypto);
  const minWithdraw = selectedCryptoData?.minWithdraw || 10;
  const maxWithdraw = Math.min(userBalance, 10000);

  const handleWithdraw = async () => {
    setLoading(true);
    setError("");

    try {
      // Validations
      const amountNum = parseFloat(amount);
      
      if (!amount || isNaN(amountNum)) {
        setError("Montant invalide");
        setLoading(false);
        return;
      }

      if (amountNum < minWithdraw) {
        setError(`Montant minimum: $${minWithdraw}`);
        setLoading(false);
        return;
      }

      if (amountNum > maxWithdraw) {
        setError(`Montant maximum: $${maxWithdraw}`);
        setLoading(false);
        return;
      }

      if (!address.trim()) {
        setError("Adresse crypto requise");
        setLoading(false);
        return;
      }

      // Validation basique de l'adresse selon la crypto
      if (selectedCrypto.includes('TRX') && !address.startsWith('T')) {
        setError("Adresse TRC-20 invalide (doit commencer par T)");
        setLoading(false);
        return;
      }

      if (selectedCrypto === 'BTC' && !address.match(/^[13bc]/)) {
        setError("Adresse Bitcoin invalide");
        setLoading(false);
        return;
      }

      if ((selectedCrypto === 'ETH' || selectedCrypto === 'USDT') && !address.startsWith('0x')) {
        setError("Adresse Ethereum invalide (doit commencer par 0x)");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/withdraw/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: amountNum, 
          currency: selectedCrypto,
          address: address.trim()
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setAmount("");
        setAddress("");
      } else {
        setError(data.error || "Erreur lors de la demande de retrait");
      }
    } catch (err) {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setError("");
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-xl mx-auto">
          <div className="bg-surface rounded-2xl p-8 border border-white/5 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Demande envoyée !
            </h2>
            <p className="text-text-secondary mb-6">
              Votre demande de retrait de <span className="text-primary font-bold">${amount}</span> est en cours de traitement.
            </p>
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl mb-6">
              <p className="text-sm text-text-secondary">
                Temps de traitement : <span className="text-white font-bold">1-24 heures</span>
              </p>
            </div>
            <button
              onClick={resetForm}
              className="w-full py-3 bg-primary text-background rounded-xl font-bold hover:bg-primary-hover transition-colors"
            >
              Nouvelle demande
            </button>
            <Link
              href="/"
              className="block mt-3 text-text-secondary hover:text-white text-sm"
            >
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-bold">Retour</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-white mb-2">
            Retirer des Fonds
          </h1>
          <p className="text-text-secondary">
            Demandez un retrait - Traitement sous 1-24h
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Formulaire */}
          <div className="lg:col-span-2">
            <div className="bg-surface rounded-2xl p-6 border border-white/5">
              {/* Balance */}
              <div className="mb-6 p-4 bg-gradient-to-r from-primary/20 to-accent-violet/20 border border-primary/30 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-tertiary">Balance disponible</span>
                  <span className="text-2xl font-bold text-white">${userBalance}</span>
                </div>
              </div>

              {/* Montant */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-white mb-3">
                  Montant à retirer (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-text-tertiary">
                    $
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min={minWithdraw}
                    max={maxWithdraw}
                    placeholder="0.00"
                    className="w-full bg-background-secondary border border-white/10 rounded-xl py-4 pl-12 pr-4 text-3xl font-display font-bold text-white focus:outline-none focus:border-primary/50"
                  />
                </div>
                <p className="text-xs text-text-tertiary mt-2">
                  Min: ${minWithdraw} - Max: ${maxWithdraw}
                </p>
              </div>

              {/* Crypto */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-white mb-3">
                  Cryptomonnaie
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {CRYPTO_OPTIONS.map((crypto) => (
                    <button
                      key={crypto.code}
                      onClick={() => setSelectedCrypto(crypto.code)}
                      className={cn(
                        "p-4 rounded-xl border transition-all text-left",
                        selectedCrypto === crypto.code
                          ? "border-primary bg-primary/10"
                          : "border-white/10 bg-background-secondary hover:border-white/20"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("text-xl font-bold", crypto.color)}>
                          {crypto.icon}
                        </span>
                        <span className="text-sm font-bold text-white">
                          {crypto.name}
                        </span>
                      </div>
                      <p className="text-xs text-text-tertiary">{crypto.network}</p>
                      <p className="text-xs text-text-tertiary mt-1">Min: ${crypto.minWithdraw}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Adresse */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-white mb-3">
                  Adresse {selectedCryptoData?.name} ({selectedCryptoData?.network})
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={
                    selectedCrypto.includes('TRX') ? "T..." :
                    selectedCrypto === 'BTC' ? "1... ou 3... ou bc1..." :
                    "0x..."
                  }
                  className="w-full bg-background-secondary border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50 font-mono text-sm"
                />
                <p className="text-xs text-text-tertiary mt-2">
                  ⚠️ Vérifiez bien l'adresse, les transferts sont irréversibles
                </p>
              </div>

              {/* Erreur */}
              {error && (
                <div className="mb-6 p-4 bg-accent-rose/10 border border-accent-rose/20 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-accent-rose flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-accent-rose">{error}</p>
                </div>
              )}

              {/* Bouton */}
              <button
                onClick={handleWithdraw}
                disabled={loading || !amount || !address}
                className="w-full py-4 bg-primary text-background font-bold rounded-xl shadow-glow-gold disabled:opacity-50 transition-all text-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Clock className="w-5 h-5 animate-spin" />
                    Traitement...
                  </span>
                ) : (
                  `Demander le retrait`
                )}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-surface rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-bold text-white mb-4">⏱️ Délais</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Traitement</span>
                  <span className="text-white font-bold">1-24h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Réseau</span>
                  <span className="text-white font-bold">5-30 min</span>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-bold text-white mb-4">ℹ️ Important</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li className="flex gap-2">
                  <Shield className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  <span>Vérifiez l'adresse 2 fois</span>
                </li>
                <li className="flex gap-2">
                  <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Transferts irréversibles</span>
                </li>
                <li className="flex gap-2">
                  <Clock className="w-4 h-4 text-accent-cyan flex-shrink-0 mt-0.5" />
                  <span>Traitement manuel sous 24h</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}