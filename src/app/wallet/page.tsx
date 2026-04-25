"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowUpRight,
    ArrowDownLeft,
    Copy,
    Check,
    QrCode,
    Wallet as WalletIcon,
    AlertCircle,
    Loader2,
    Coins,
    RefreshCw,
    ArrowLeft,
    Zap,
    History,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { cn, formatToUSD, satsToUsd } from "@/lib/utils";
import PendingWithdrawals from "@/components/wallet/PendingWithdrawals";
import TransactionHistory from "@/components/wallet/TransactionHistory";

// ✅ CONFIGURATION DES FRAIS (basée sur tests réels)
const CRYPTO_FEES: Record<string, { min: number; percent: number }> = {
    bnb:       { min: 0,    percent: 1.3  },
    usdc:      { min: 0.20, percent: 1.2  },
    ltc:       { min: 0,    percent: 1.6  },
    sol:       { min: 0,    percent: 1.6  },
    eth:       { min: 0.15, percent: 1.5  },
    trx:       { min: 0.05, percent: 1.7  },
    btc:       { min: 0.35, percent: 1.3  },
    usdttrc20: { min: 2.95, percent: 1.1  },
};

// ✅ FONCTION DE CALCUL DES FRAIS
function calculateFees(crypto: string, amount: number) {
    const config = CRYPTO_FEES[crypto.toLowerCase()];
    if (!config) return { fees: 0, percent: 0, final: amount };

    const fees = config.min + (amount * (config.percent / 100));
    
    return {
        fees: parseFloat(fees.toFixed(2)),
        percent: config.percent,
        final: parseFloat((amount - fees).toFixed(2))
    };
}

// Types
interface SupportedCrypto {
    symbol: string;
    name: string;
    network?: string;
    icon?: string;
    minDeposit?: number;
    recommended?: boolean;
}

interface PaymentData {
    id: string;
    orderId: string;
    status: string;
    payAddress: string;
    payAmount: number;
    payCurrency: string;
    priceAmount: number;
    priceCurrency: string;
    paymentUrl: string;
    expiresAt: string;
}

export default function WalletPage() {

    const [activeTab, setActiveTab] = useState<"deposit" | "withdraw" | "history">("deposit");
    const [showCryptoList, setShowCryptoList] = useState(false);

    // États UI
    const [copied, setCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // États Données
    const [balance, setBalance] = useState(0);
    const [cryptos, setCryptos] = useState<SupportedCrypto[]>([]);
    const [selectedCoin, setSelectedCoin] = useState<SupportedCrypto | null>(null);

    // États Dépôt
    const [depositAmountUsd, setDepositAmountUsd] = useState("");
    const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
    const [isCheckingPayment, setIsCheckingPayment] = useState(false);

    // --- CHARGER LES CRYPTOS SUPPORTÉES ---
    const fetchSupportedCryptos = async () => {
        try {
            const res = await fetch("/api/wallet/supported-cryptos");
            if (res.ok) {
                const data = await res.json();
                setCryptos(data.cryptos || []);
                const defaultCrypto = data.cryptos.find((c: SupportedCrypto) => c.recommended) || data.cryptos[0];
                setSelectedCoin(defaultCrypto);
            }
        } catch (error) {
            console.error("Erreur chargement cryptos", error);
        }
    };

    // --- CHARGER LE SOLDE ---
    const fetchBalance = async () => {
        try {
            const res = await fetch("/api/wallet/balance");
            if (res.ok) {
                const data = await res.json();
                const balanceUsd = satsToUsd(parseInt(data.balance));
                setBalance(balanceUsd);
            }
        } catch (error) {
            console.error("Erreur chargement solde", error);
        }
    };

    useEffect(() => {
        fetchSupportedCryptos();
        fetchBalance();
        
        // Actualiser balance toutes les 5s
        const interval = setInterval(fetchBalance, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 5000)
            return () => clearTimeout(timer)
        }
    }, [message])

    // --- CRÉER UN DÉPÔT (NOWPayments uniquement) ---
    const handleDeposit = async () => {
        setIsLoading(true);
        setMessage(null);
        setPaymentData(null);

        if (!depositAmountUsd || parseFloat(depositAmountUsd) <= 0) {
            setMessage({ type: 'error', text: "Montant invalide" });
            setIsLoading(false);
            return;
        }

        if (!selectedCoin) {
            setMessage({ type: 'error', text: "Sélectionnez une crypto" });
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/wallet/create-deposit', {
                method: 'POST',
                body: JSON.stringify({
                    currency: selectedCoin.symbol.toLowerCase(),
                    amountUsd: parseFloat(depositAmountUsd)
                }),
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setPaymentData(data.payment);
                setMessage({
                    type: 'success',
                    text: `Paiement créé ! Envoyez ${data.payment.payAmount} ${selectedCoin.symbol}`
                });

                startPaymentCheck(data.payment.id);
            } else {
                setMessage({ type: 'error', text: data.error || data.details || "Erreur création paiement" });
            }
        } catch {
            setMessage({ type: 'error', text: "Erreur de connexion serveur" });
        } finally {
            setIsLoading(false);
        }
    };

    // --- VÉRIFIER LE STATUT DU PAIEMENT ---
    const startPaymentCheck = (paymentId: string) => {
        setIsCheckingPayment(true);

        const checkInterval = setInterval(async () => {
            try {
                const res = await fetch('/api/wallet/check-payment', {
                    method: 'POST',
                    body: JSON.stringify({ paymentId }),
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = await res.json();

                if (res.ok && data.success) {
                    if (data.payment.localStatus === 'COMPLETED') {
                        clearInterval(checkInterval);
                        setIsCheckingPayment(false);
                        setMessage({
                            type: 'success',
                            text: '🎉 Paiement reçu ! Votre solde a été crédité.'
                        });
                        fetchBalance();
                        setPaymentData(null);
                        setDepositAmountUsd("");
                    }
                }
            } catch (error) {
                console.error("Erreur vérification paiement", error);
            }
        }, 10000);

        setTimeout(() => {
            clearInterval(checkInterval);
            setIsCheckingPayment(false);
        }, 30 * 60 * 1000);
    };

    // --- UTILITAIRES ---
    const handleCopy = async () => {
        if (paymentData) {
            try {
                await navigator.clipboard.writeText(paymentData.payAddress);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (error) {
                const textArea = document.createElement('textarea');
                textArea.value = paymentData.payAddress;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                } catch (err) {
                    console.error('Erreur copie:', err);
                }
                document.body.removeChild(textArea);
            }
        }
    };

    const getCryptoStyle = (symbol: string) => {
        const styles: Record<string, { color: string, bg: string }> = {
            'btc': { color: 'text-orange-500', bg: 'bg-orange-500/10' },
            'eth': { color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
            'sol': { color: 'text-violet-500', bg: 'bg-violet-500/10' },
            'bnb': { color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
            'trx': { color: 'text-red-400', bg: 'bg-red-400/10' },
            'ltc': { color: 'text-gray-400', bg: 'bg-gray-400/10' },
            'usdc': { color: 'text-blue-500', bg: 'bg-blue-500/10' },
            'usdttrc20': { color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            'usdterc20': { color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            'usdcmatic': { color: 'text-blue-500', bg: 'bg-blue-500/10' },
        };
        return styles[symbol.toLowerCase()] || { color: 'text-gray-500', bg: 'bg-gray-500/10' };
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-6">

            {/* HEADER COMPACT */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-text-secondary" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-display font-bold text-white">Portefeuille</h1>
                        <p className="text-text-tertiary text-xs">Balance: {formatToUSD(balance)}</p>
                    </div>
                </div>
                <button
                    onClick={fetchBalance}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                    <RefreshCw className="w-5 h-5 text-text-secondary hover:text-white" />
                </button>
            </div>

            {/* TABS */}
            <div className="flex gap-2 bg-surface/50 p-1 rounded-xl">
                <button
                    onClick={() => setActiveTab("deposit")}
                    className={cn(
                        "flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2",
                        activeTab === "deposit"
                            ? "bg-accent-purple text-white shadow-lg"
                            : "text-text-secondary hover:text-white"
                    )}
                >
                    <ArrowDownLeft className="w-4 h-4" />
                    Dépôt
                </button>

                <button
                    onClick={() => setActiveTab("withdraw")}
                    className={cn(
                        "flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2",
                        activeTab === "withdraw"
                            ? "bg-primary text-background shadow-lg"
                            : "text-text-secondary hover:text-white"
                    )}
                >
                    <ArrowUpRight className="w-4 h-4" />
                    Retrait
                </button>

                <button
                    onClick={() => setActiveTab("history")}
                    className={cn(
                        "flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2",
                        activeTab === "history"
                            ? "bg-blue-500 text-white shadow-lg"
                            : "text-text-secondary hover:text-white"
                    )}
                >
                    <History className="w-4 h-4" />
                    Historique
                </button>
            </div>

            {/* MESSAGE DE FEEDBACK */}
            {message && (
                <div className={cn(
                    "p-3 rounded-xl text-xs font-bold flex items-center gap-2",
                    message.type === 'success' ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                )}>
                    {message.type === 'error' && <AlertCircle className="w-4 h-4" />}
                    {message.text}
                </div>
            )}

            {/* CONTENU */}
            <div className="bg-surface rounded-xl border border-white/5 p-6">
                
                {/* ================= ONGLET DÉPÔT ================= */}
                {activeTab === "deposit" && (
                    <div className="space-y-4">
                        <h3 className="font-bold text-white">Dépôt via NOWPayments</h3>

                        {!paymentData ? (
                            <>
                                {/* Input montant */}
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="Montant en USD"
                                        value={depositAmountUsd}
                                        onChange={(e) => setDepositAmountUsd(e.target.value)}
                                        className="w-full bg-background-secondary rounded-xl border border-white/10 py-3 pl-3 pr-12 text-white text-sm focus:outline-none focus:border-accent-purple"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-tertiary">
                                        USD
                                    </span>
                                </div>

                                {/* ✅ Sélecteur crypto AVEC FRAIS */}
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {cryptos.map((coin) => {
                                        const style = getCryptoStyle(coin.symbol);
                                        const fees = CRYPTO_FEES[coin.symbol.toLowerCase()];
                                        
                                        // ✅ Ignorer les cryptos sans config de frais
                                        if (!fees) return null;
                                        
                                        return (
                                            <button
                                                key={coin.symbol}
                                                onClick={() => setSelectedCoin(coin)}
                                                className={cn(
                                                    "flex flex-col items-start gap-1 px-2.5 py-2 rounded-lg border transition-all whitespace-nowrap shrink-0",
                                                    selectedCoin?.symbol === coin.symbol
                                                        ? "bg-primary/10 border-primary"
                                                        : "bg-background-secondary border-white/5 hover:bg-white/5"
                                                )}
                                            >
                                                <div className="flex items-center gap-1.5 w-full">
                                                    <div className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold", style.bg, style.color)}>
                                                        {coin.icon || coin.symbol[0]}
                                                    </div>
                                                    <span className={cn("text-xs font-bold", selectedCoin?.symbol === coin.symbol ? "text-white" : "text-text-tertiary")}>
                                                        {coin.symbol.toUpperCase()}
                                                    </span>
                                                </div>
                                                <span className="text-[9px] text-text-secondary leading-tight">
                                                    {fees.min > 0 
                                                        ? `$${fees.min}+${fees.percent}%`
                                                        : `~${fees.percent}%`
                                                    }
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={handleDeposit}
                                    disabled={isLoading || !depositAmountUsd || parseFloat(depositAmountUsd) <= 0}
                                    className="w-full py-3 bg-accent-purple hover:bg-accent-purple/80 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "CRÉER LE PAIEMENT"}
                                </button>

                                {/* Accordéon liste crypto */}
                                <div className="border-t border-white/5 pt-4">
                                    <button
                                        onClick={() => setShowCryptoList(!showCryptoList)}
                                        className="w-full flex items-center justify-between text-sm text-text-secondary hover:text-white transition-colors"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Coins className="w-4 h-4" />
                                            Cryptos acceptées ({cryptos.filter((c) => CRYPTO_FEES[c.symbol.toLowerCase()]).length})
                                        </span>
                                        {showCryptoList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>

                                    {showCryptoList && (
                                        <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                            {cryptos
                                                .filter((crypto) => CRYPTO_FEES[crypto.symbol.toLowerCase()]) // ✅ Filtrer uniquement celles avec frais
                                                .map((crypto) => {
                                                const style = getCryptoStyle(crypto.symbol);
                                                const fees = CRYPTO_FEES[crypto.symbol.toLowerCase()];
                                                return (
                                                    <div key={crypto.symbol} className="flex items-center justify-between p-3 bg-background-secondary rounded-lg hover:bg-white/5 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold", style.bg, style.color)}>
                                                                {crypto.icon || crypto.symbol[0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-white text-xs">{crypto.name}</p>
                                                                <p className="text-[10px] text-text-tertiary">{crypto.network}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            {fees && (
                                                                <p className="text-[10px] text-text-secondary">
                                                                    {fees.min > 0 
                                                                        ? `$${fees.min} + ${fees.percent}%`
                                                                        : `~${fees.percent}%`
                                                                    }
                                                                </p>
                                                            )}
                                                            {crypto.recommended && (
                                                                <span className="text-[10px] text-primary font-bold">✅ Recommandé</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Lien Plisio */}
                                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                    <p className="text-xs text-text-secondary mb-2">
                                        Alternative : <Link href="/deposit" className="text-primary hover:underline font-bold">Déposer via Plisio →</Link>
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-background-secondary rounded-xl border border-white/5 flex flex-col items-center">
                                    <div className="p-2 bg-white rounded-lg mb-4">
                                        <QrCode className="w-32 h-32 text-black" />
                                    </div>
                                    <input
                                        type="text"
                                        readOnly
                                        value={paymentData.payAddress}
                                        onClick={(e) => {
                                            e.currentTarget.select();
                                            handleCopy();
                                        }}
                                        className="w-full bg-background-secondary text-white font-mono text-xs p-3 rounded-lg border-2 border-primary/30 cursor-pointer hover:border-primary transition-colors break-all"
                                    />
                                    {copied && (
                                        <p className="text-xs text-green-500 font-bold flex items-center gap-1 mt-2">
                                            <Check className="w-3 h-3" /> Copié !
                                        </p>
                                    )}
                                </div>

                                <div className="p-3 bg-accent-purple/10 rounded-lg border border-accent-purple/20 space-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-text-secondary">À envoyer:</span>
                                        <span className="text-white font-bold font-mono">{parseFloat(paymentData.payAmount.toString()).toFixed(6)} {paymentData.payCurrency.toUpperCase()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-text-secondary">Vous recevrez:</span>
                                        <span className="text-primary font-bold">{formatToUSD(paymentData.priceAmount)}</span>
                                    </div>
                                </div>

                                {/* ✅ ESTIMATION APRÈS CRÉATION */}
                                {selectedCoin && CRYPTO_FEES[selectedCoin.symbol.toLowerCase()] && (
                                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                                        <p className="text-xs text-blue-400 mb-2 font-semibold">
                                            💡 Estimation des frais
                                        </p>
                                        <div className="space-y-1 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-text-secondary">
                                                    Frais estimés (
                                                    {CRYPTO_FEES[selectedCoin.symbol.toLowerCase()].min > 0 
                                                        ? `$${CRYPTO_FEES[selectedCoin.symbol.toLowerCase()].min} + ${CRYPTO_FEES[selectedCoin.symbol.toLowerCase()].percent}%`
                                                        : `~${CRYPTO_FEES[selectedCoin.symbol.toLowerCase()].percent}%`
                                                    }
                                                    ):
                                                </span>
                                                <span className="text-red-400 font-mono">-${calculateFees(selectedCoin.symbol.toLowerCase(), paymentData.priceAmount).fees}</span>
                                            </div>
                                            <div className="flex justify-between pt-1 border-t border-blue-500/10">
                                                <span className="text-text-secondary font-semibold">Crédit estimé:</span>
                                                <span className="text-green-400 font-bold font-mono">${calculateFees(selectedCoin.symbol.toLowerCase(), paymentData.priceAmount).final}</span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-text-secondary/70 mt-2">
                                            Montant exact confirmé après réception du paiement
                                        </p>
                                    </div>
                                )}

                                {isCheckingPayment && (
                                    <div className="flex items-center justify-center gap-2 text-xs text-accent-purple">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Vérification...
                                    </div>
                                )}

                                <button
                                    onClick={() => {
                                        setPaymentData(null);
                                        setDepositAmountUsd("");
                                    }}
                                    className="w-full py-2 text-xs text-text-secondary hover:text-white"
                                >
                                    ← Annuler
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ================= ONGLET RETRAIT ================= */}
                {activeTab === "withdraw" && (
                    <div className="space-y-4">
                        <h3 className="font-bold text-white">Retraits automatiques</h3>
                        <p className="text-xs text-text-secondary">
                            Instantané jusqu'à $500 via Plisio
                        </p>

                        <Link 
                            href="/withdraw"
                            className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-hover text-background font-bold rounded-xl transition-all"
                        >
                            <Zap className="w-5 h-5" />
                            Demander un retrait
                        </Link>

                        <div className="border-t border-white/5 pt-4">
                            <h4 className="text-sm font-bold text-white mb-3">Retraits en cours</h4>
                            <PendingWithdrawals />
                        </div>
                    </div>
                )}

                {/* ================= ONGLET HISTORIQUE ================= */}
                {activeTab === "history" && (
                    <div>
                        <h3 className="font-bold text-white mb-4">Historique des transactions</h3>
                        <TransactionHistory />
                    </div>
                )}
            </div>
        </div>
    );
}