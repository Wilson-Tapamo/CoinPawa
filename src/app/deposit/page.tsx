"use client";

import { useState } from "react";
import { ArrowLeft, Shield, Zap, Copy, CheckCircle, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";

// Cryptos supportées par Plisio
const CRYPTO_OPTIONS = [
  { code: 'USDT_TRX', name: 'USDT', network: 'TRC-20', icon: '₮', color: 'text-success' },
  { code: 'USDT', name: 'USDT', network: 'ERC-20', icon: '₮', color: 'text-success' },
  { code: 'USDC', name: 'USDC', network: 'ERC-20', icon: '$', color: 'text-accent-cyan' },
  { code: 'ETH', name: 'Ethereum', network: 'ERC-20', icon: 'Ξ', color: 'text-accent-violet' },
  { code: 'BTC', name: 'Bitcoin', network: 'BTC', icon: '₿', color: 'text-primary' },
  { code: 'TRX', name: 'TRON', network: 'TRX', icon: 'T', color: 'text-accent-rose' }
];

const QUICK_AMOUNTS = [10, 25, 50, 100, 250, 500];

export default function DepositPlisioPage() {
  const [amount, setAmount] = useState(50);
  const [selectedCrypto, setSelectedCrypto] = useState('USDT_TRX');
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCreateDeposit = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/deposit/plisio/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount, 
          currency: selectedCrypto 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setPayment(data.payment);
      } else {
        setError(data.error || "Erreur lors de la création du dépôt");
      }
    } catch (err) {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert("Erreur lors de la copie");
    }
  };

  const resetForm = () => {
    setPayment(null);
    setError("");
  };

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
            Déposer des Fonds
          </h1>
          <p className="text-text-secondary">
            Propulsé par Plisio - Paiement crypto gaming-friendly
          </p>
        </div>

        {!payment ? (
          /* FORMULAIRE */
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Carte principale */}
              <div className="bg-surface rounded-2xl p-6 border border-white/5">
                {/* Montant */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-white mb-3">
                    Montant (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-text-tertiary">
                      $
                    </span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      min={10}
                      max={10000}
                      className="w-full bg-background-secondary border border-white/10 rounded-xl py-4 pl-12 pr-4 text-3xl font-display font-bold text-white focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <p className="text-xs text-text-tertiary mt-2">
                    Min: $10 - Max: $10,000
                  </p>
                </div>

                {/* Montants rapides */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-white mb-3">
                    Montants rapides
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {QUICK_AMOUNTS.map((quickAmount) => (
                      <button
                        key={quickAmount}
                        onClick={() => setAmount(quickAmount)}
                        className={cn(
                          "py-2 px-4 rounded-lg font-bold text-sm transition-all",
                          amount === quickAmount
                            ? "bg-primary text-background shadow-glow-gold"
                            : "bg-background-secondary text-text-secondary hover:bg-white/10"
                        )}
                      >
                        ${quickAmount}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Choix crypto */}
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
                      </button>
                    ))}
                  </div>
                </div>

                {/* Erreur */}
                {error && (
                  <div className="mb-6 p-4 bg-accent-rose/10 border border-accent-rose/20 rounded-xl">
                    <p className="text-sm text-accent-rose">{error}</p>
                  </div>
                )}

                {/* Bouton */}
                <button
                  onClick={handleCreateDeposit}
                  disabled={loading || amount < 10 || amount > 10000}
                  className="w-full py-4 bg-primary text-background font-bold rounded-xl shadow-glow-gold disabled:opacity-50 transition-all text-lg"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Clock className="w-5 h-5 animate-spin" />
                      Création en cours...
                    </span>
                  ) : (
                    `Déposer $${amount}`
                  )}
                </button>
              </div>

              {/* Badge Plisio */}
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Powered by Plisio</p>
                    <p className="text-xs text-text-tertiary">Gaming-friendly payment processor</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-surface rounded-2xl p-6 border border-white/5">
                <h3 className="text-lg font-bold text-white mb-4">Avantages</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Shield className="w-5 h-5 text-success flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-white">Gaming-Friendly</p>
                      <p className="text-xs text-text-tertiary">Conçu pour les casinos</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Zap className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-white">Rapide</p>
                      <p className="text-xs text-text-tertiary">Confirmé en minutes</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-accent-cyan flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-white">Frais 0.5%</p>
                      <p className="text-xs text-text-tertiary">Très compétitif</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* PAIEMENT CRÉÉ - VERSION MINIMALISTE */
          <div className="max-w-xl mx-auto">
            <div className="bg-surface rounded-2xl p-8 border border-white/5">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Paiement créé !
                </h2>
              </div>

              {/* Instructions */}
              <div className="mb-6 space-y-4 text-center">
                <p className="text-text-secondary">
                  Cliquez sur le bouton ci-dessous pour accéder à la page de paiement Plisio.
                </p>
                <p className="text-sm text-text-tertiary">
                  Suivez les instructions sur leur site pour finaliser votre dépôt de <span className="text-primary font-bold">${payment.sourceAmount}</span>
                </p>
              </div>

              {/* Bouton */}
              {payment.invoiceUrl ? (
                <a
                  href={payment.invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full py-4 bg-primary text-background rounded-xl font-bold hover:bg-primary-hover transition-colors shadow-glow-gold text-lg mb-4"
                >
                  <ExternalLink className="w-6 h-6" />
                  Ouvrir Plisio
                </a>
              ) : (
                <div className="text-center p-4 bg-accent-rose/10 border border-accent-rose/20 rounded-xl mb-4">
                  <p className="text-sm text-accent-rose">
                    URL de paiement non disponible
                  </p>
                </div>
              )}

              {/* Retour */}
              <button
                onClick={resetForm}
                className="w-full py-2 text-text-secondary text-center text-sm hover:text-white transition-colors"
              >
                ← Retour
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}