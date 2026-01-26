"use client";

import { useState, useEffect } from "react";
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
    ChevronRight,
    Zap,
    ExternalLink,
    History
} from "lucide-react";
import { cn, formatToUSD } from "@/lib/utils";
import PendingWithdrawals from "@/components/wallet/PendingWithdrawals";
import TransactionHistory from "@/components/wallet/TransactionHistory";

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

    // États UI
    const [copied, setCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // États Données
    const [balance, setBalance] = useState(0); // Solde en sats
    const [cryptos, setCryptos] = useState<SupportedCrypto[]>([]);
    const [selectedCoin, setSelectedCoin] = useState<SupportedCrypto | null>(null);

    // États Dépôt
    const [depositAmountUsd, setDepositAmountUsd] = useState(""); // Montant en USD
    const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
    const [isCheckingPayment, setIsCheckingPayment] = useState(false);

    // États Retrait
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [withdrawAddress, setWithdrawAddress] = useState("");
    const [withdrawCrypto, setWithdrawCrypto] = useState<SupportedCrypto | null>(null);

    // --- CHARGER LES CRYPTOS SUPPORTÉES ---
    const fetchSupportedCryptos = async () => {
        try {
            const res = await fetch("/api/wallet/supported-cryptos");
            if (res.ok) {
                const data = await res.json();
                setCryptos(data.cryptos || []);
                // Sélectionner USDT TRC20 par défaut
                const defaultCrypto = data.cryptos.find((c: SupportedCrypto) => c.recommended) || data.cryptos[0];
                setSelectedCoin(defaultCrypto);
                setWithdrawCrypto(defaultCrypto); // Pour le retrait aussi
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
                // Convertir sats en USD (1 USD = 100,000,000 sats)
                const balanceUsd = parseInt(data.balance) / 100_000_000;
                setBalance(balanceUsd);
            }
        } catch (error) {
            console.error("Erreur chargement solde", error);
        }
    };

    // Charger au démarrage
    useEffect(() => {
        fetchSupportedCryptos();
        fetchBalance();
    }, []);

    // retirer l'alerte apres son affichage
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 5000)
            return () => clearTimeout(timer)
        }
    }, [message])

    // --- CRÉER UN DÉPÔT ---
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

                // Commencer à vérifier le paiement toutes les 10 secondes
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
                    // Vérifier si le paiement est complété
                    if (data.payment.localStatus === 'COMPLETED') {
                        clearInterval(checkInterval);
                        setIsCheckingPayment(false);
                        setMessage({
                            type: 'success',
                            text: '🎉 Paiement reçu ! Votre solde a été crédité.'
                        });
                        fetchBalance(); // Rafraîchir le solde
                        setPaymentData(null);
                        setDepositAmountUsd("");
                    }
                }
            } catch (error) {
                console.error("Erreur vérification paiement", error);
            }
        }, 10000); // Vérifier toutes les 10 secondes

        // Arrêter après 30 minutes
        setTimeout(() => {
            clearInterval(checkInterval);
            setIsCheckingPayment(false);
        }, 30 * 60 * 1000);
    };

    // --- GÉRER LE RETRAIT ---
    const handleWithdraw = async () => {
        setIsLoading(true);
        setMessage(null);
        if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
            setMessage({ type: 'error', text: "Montant invalide" });
            setIsLoading(false);
            return;
        }

        if (!withdrawAddress) {
            setMessage({ type: 'error', text: "Adresse invalide" });
            setIsLoading(false);
            return;
        }

        if (parseFloat(withdrawAmount) > balance) {
            setMessage({ type: 'error', text: "Solde insuffisant" });
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/wallet/withdraws', {
                method: 'POST',
                body: JSON.stringify({
                    amount: withdrawAmount,
                    address: withdrawAddress
                }),
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: "Retrait effectué avec succès !" });
                setWithdrawAmount("");
                setWithdrawAddress("");
                fetchBalance();
            } else {
                setMessage({ type: 'error', text: data.message || data.error });
            }
        } catch {
            setMessage({ type: 'error', text: "Erreur serveur" });
        } finally {
            setIsLoading(false);
        }
    };

    // --- UTILITAIRES ---
   const handleCopy = async () => {
    if (paymentData) {
        try {
            await navigator.clipboard.writeText(paymentData.payAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            // Fallback pour les navigateurs qui bloquent clipboard
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

    const handleMax = () => {
        setWithdrawAmount(balance.toString());
    };

    // Obtenir la couleur et le bg selon le symbole de la crypto
    const getCryptoStyle = (symbol: string) => {
        const styles: Record<string, { color: string, bg: string }> = {
            'btc': { color: 'text-orange-500', bg: 'bg-orange-500/10' },
            'eth': { color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
            'sol': { color: 'text-violet-500', bg: 'bg-violet-500/10' },
            'bnb': { color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
            'usdttrc20': { color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            'usdterc20': { color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            'usdcmatic': { color: 'text-blue-500', bg: 'bg-blue-500/10' },
        };
        return styles[symbol.toLowerCase()] || { color: 'text-gray-500', bg: 'bg-gray-500/10' };
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 md:p-8">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white">Portefeuille</h1>
                    <p className="text-text-secondary text-sm">Gérez vos cryptos et convertissez en solde de jeu</p>
                </div>
                <button
                    onClick={fetchBalance}
                    className="flex items-center gap-2 text-sm text-primary hover:text-primary-hover font-bold bg-primary/10 px-4 py-2 rounded-lg transition-colors border border-primary/20"
                >
                    <RefreshCw className="w-4 h-4" /> Actualiser
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* --- COLONNE GAUCHE : BALANCE & PORTFOLIO --- */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Carte Solde Principal */}
                    <div className="bg-gradient-to-br from-[#1A1D26] to-[#0F1218] p-8 rounded-2xl border border-white/5 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <WalletIcon className="w-64 h-64 text-white" />
                        </div>

                        <div className="relative z-10">
                            <p className="text-text-secondary font-medium mb-2 uppercase tracking-wider text-xs">Solde Disponible (USD)</p>
                            <div className="flex items-baseline gap-3 mb-8">
                                <span className="text-5xl font-display font-bold text-white">
                                    {formatToUSD(balance)}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mb-6">

                                {/* Dépôt */}
                                <button
                                    onClick={() => setActiveTab("deposit")}
                                    className={cn(
                                        "py-3 px-4 rounded-xl font-bold text-sm transition-all",
                                        "flex items-center justify-center gap-2 min-h-[48px]",
                                        activeTab === "deposit"
                                            ? "bg-accent-purple text-white"
                                            : "bg-background-secondary text-text-secondary hover:bg-white/5"
                                    )}
                                >
                                    <ArrowDownLeft className="w-4 h-4" />
                                    <span>Dépôt</span>
                                </button>
                                {/* Retrait */}
                                <button
                                    onClick={() => setActiveTab("withdraw")}
                                    className={cn(
                                        "py-3 px-4 rounded-xl font-bold text-sm transition-all",
                                        "flex items-center justify-center gap-2 min-h-[48px]",
                                        activeTab === "withdraw"
                                            ? "bg-primary text-background"
                                            : "bg-background-secondary text-text-secondary hover:bg-white/5"
                                    )}
                                >
                                    <ArrowUpRight className="w-4 h-4" />
                                    <span>Retrait</span>
                                </button>

                                {/* Historique */}
                                <button
                                    onClick={() => setActiveTab("history")}
                                    className={cn(
                                        "py-3 px-4 rounded-xl font-bold text-sm transition-all",
                                        "flex items-center justify-center gap-2 min-h-[48px]",
                                        activeTab === "history"
                                            ? "bg-blue-500 text-white"
                                            : "bg-background-secondary text-text-secondary hover:bg-white/5"
                                    )}
                                >
                                    <History className="w-4 h-4" />
                                    <span>Historique</span>
                                </button>

                            </div>

                        </div>
                    </div>

                    {/* Liste des Cryptos Acceptées */}
                    <div className="bg-[#1A1D26]/50 rounded-2xl border border-white/5 overflow-hidden">
                        <div className="p-4 border-b border-white/5">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Coins className="w-4 h-4 text-primary" /> Cryptos Acceptées
                            </h3>
                        </div>
                        <div className="divide-y divide-white/5">
                            {cryptos.map((crypto) => {
                                const style = getCryptoStyle(crypto.symbol);
                                return (
                                    <div key={crypto.symbol} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold", style.bg, style.color)}>
                                                {crypto.icon || crypto.symbol[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-sm">{crypto.name}</p>
                                                <p className="text-xs text-text-tertiary">
                                                    {crypto.network} {crypto.recommended && <span className="text-primary">• Recommandé</span>}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { setActiveTab("deposit"); setSelectedCoin(crypto); }}
                                            className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            Déposer
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* --- COLONNE DROITE : PANNEAU D'ACTION --- */}
                <div className="lg:col-span-1">
                    <div className="bg-[#1A1D26] p-6 rounded-2xl border border-white/5 h-full flex flex-col min-h-[500px]">
                        {/* MESSAGE DE FEEDBACK */}
                        {message && (
                            <div className={cn(
                                "p-3 rounded-xl mb-4 text-xs font-bold flex items-center gap-2",
                                message.type === 'success' ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                            )}>
                                {message.type === 'error' && <AlertCircle className="w-4 h-4" />}
                                {message.text}
                            </div>
                        )}

                        {/* ================= ONGLET DÉPÔT ================= */}
                        {activeTab === "deposit" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

                                <div className="mb-2">
                                    <h3 className="font-bold text-white text-lg">Dépôt {selectedCoin?.name}</h3>
                                    <p className="text-xs text-text-tertiary">Envoyez des {selectedCoin?.symbol} pour créditer votre solde USD.</p>
                                </div>

                                {/* 1. SÉLECTEUR DE COIN */}
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {cryptos.map((coin) => {
                                        const style = getCryptoStyle(coin.symbol);
                                        return (
                                            <button
                                                key={coin.symbol}
                                                onClick={() => setSelectedCoin(coin)}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all whitespace-nowrap",
                                                    selectedCoin?.symbol === coin.symbol
                                                        ? "bg-primary/10 border-primary text-white"
                                                        : "bg-background-secondary border-white/5 text-text-tertiary hover:bg-white/5"
                                                )}
                                            >
                                                <div className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold", style.bg, style.color)}>
                                                    {coin.icon || coin.symbol[0]}
                                                </div>
                                                <span className="text-xs font-bold">{coin.symbol.toUpperCase()}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* 2. SI PAIEMENT CRÉÉ → AFFICHER QR CODE */}
                                {paymentData ? (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-background-secondary rounded-xl border border-white/5 flex flex-col items-center">
                                            <div className="p-2 bg-white rounded-lg mb-4 shadow-lg">
                                                <QrCode className="w-32 h-32 text-black" />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-xs font-bold text-primary uppercase">
                                                    📍 Adresse de paiement USDT TRC20
                                                </label>
                                                
                                                <input 
                                                    type="text"
                                                    readOnly
                                                    value={paymentData.payAddress}
                                                    onClick={(e) => {
                                                        e.currentTarget.select();
                                                        navigator.clipboard.writeText(paymentData.payAddress);
                                                        setCopied(true);
                                                        setTimeout(() => setCopied(false), 2000);
                                                    }}
                                                    className="w-full bg-background-secondary text-white font-mono text-sm p-3 rounded-lg border-2 border-primary/30 cursor-pointer hover:border-primary transition-colors"
                                                    placeholder="Cliquez pour sélectionner et copier"
                                                />
                                                
                                                {copied && (
                                                    <p className="text-xs text-green-500 font-bold flex items-center gap-1">
                                                        <Check className="w-3 h-3" /> Adresse copiée dans le presse-papier !
                                                    </p>
                                                )}
                                                
                                                <p className="text-[10px] text-text-tertiary">
                                                    💡 Cliquez sur l'adresse pour la sélectionner automatiquement
                                                </p>
                                            </div>

                                        </div>

                                        <div className="p-4 bg-accent-purple/10 rounded-xl border border-accent-purple/20">
                                            <div className="flex justify-between text-xs mb-2">
                                                <span className="text-text-secondary">Montant à envoyer :</span>
                                                <span className="text-white font-bold">{paymentData.payAmount} {paymentData.payCurrency.toUpperCase()}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-text-secondary">Vous recevrez :</span>
                                                <span className="text-primary font-bold">{formatToUSD(paymentData.priceAmount)}</span>
                                            </div>
                                        </div>

                                        {isCheckingPayment && (
                                            <div className="flex items-center justify-center gap-2 text-xs text-accent-purple">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Vérification du paiement en cours...</span>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => {
                                                setPaymentData(null);
                                                setDepositAmountUsd("");
                                                setIsCheckingPayment(false);
                                            }}
                                            className="w-full py-2 text-xs text-text-secondary hover:text-white transition-colors"
                                        >
                                            Annuler et créer un nouveau paiement
                                        </button>
                                    </div>
                                ) : (
                                    /* 3. FORMULAIRE DE CRÉATION DE PAIEMENT */
                                    <div className="border-t border-white/10 pt-4">
                                        <label className="text-xs text-text-tertiary mb-2 font-bold block">
                                            Montant du dépôt (USD)
                                        </label>

                                        <div className="space-y-3">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    placeholder="10.00"
                                                    value={depositAmountUsd}
                                                    onChange={(e) => setDepositAmountUsd(e.target.value)}
                                                    className="w-full bg-background-secondary rounded-xl border border-white/10 py-3 pl-3 pr-12 text-white text-sm focus:outline-none focus:border-accent-purple"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-tertiary">
                                                    USD
                                                </span>
                                            </div>

                                            {selectedCoin && depositAmountUsd && (
                                                <div className="flex justify-between items-center text-xs px-1">
                                                    <span className="text-text-tertiary">Dépôt Min. :</span>
                                                    <span className="text-white font-bold text-sm">
                                                        {formatToUSD(selectedCoin.minDeposit || 5)}
                                                    </span>
                                                </div>
                                            )}

                                            <button
                                                onClick={handleDeposit}
                                                disabled={isLoading || !depositAmountUsd || parseFloat(depositAmountUsd) <= 0}
                                                className="w-full py-3 bg-accent-purple hover:bg-accent-purple/80 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "CRÉER LE PAIEMENT"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {/* simulation paiement  */}
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
                                                            paymentId: paymentData?.id,
                                                            amountUsd: paymentData?.priceAmount,
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
                                                            paymentId: paymentData?.id,
                                                            amountUsd: paymentData?.priceAmount,
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
                                        Ces boutons simulent la réception d'un webhook NOWPayments et créditent votre portefeuille instantanément.
                                    </p>
                                </div>
                            </div>

                        )}

                        {/* ================= ONGLET RETRAIT =================  */}
                        {activeTab === "withdraw" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">

                                <div className="mb-2">
                                    <h3 className="font-bold text-white text-lg">Retrait des Fonds</h3>
                                    <p className="text-xs text-text-tertiary">Retirez vos gains vers votre portefeuille externe.</p>
                                </div>

                                {/* Sélecteur de crypto pour le retrait */}
                                <div>
                                    <label className="text-xs font-bold text-text-tertiary uppercase mb-1.5 block">Crypto de retrait</label>
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                        {cryptos.map((coin) => {
                                            const style = getCryptoStyle(coin.symbol);
                                            return (
                                                <button
                                                    key={coin.symbol}
                                                    onClick={() => setWithdrawCrypto(coin)}
                                                    className={cn(
                                                        "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all whitespace-nowrap",
                                                        withdrawCrypto?.symbol === coin.symbol
                                                            ? "bg-primary/10 border-primary text-white"
                                                            : "bg-background-secondary border-white/5 text-text-tertiary hover:bg-white/5"
                                                    )}
                                                >
                                                    <div className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold", style.bg, style.color)}>
                                                        {coin.icon || coin.symbol[0]}
                                                    </div>
                                                    <div className="text-left">
                                                        <span className="text-xs font-bold block">{coin.symbol.toUpperCase()}</span>
                                                        <span className="text-[9px] text-text-tertiary">{coin.network}</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Montant */}
                                <div>
                                    <div className="flex justify-between mb-1.5">
                                        <label className="text-xs font-bold text-text-tertiary uppercase">Montant (USD)</label>
                                        <span className="text-xs text-text-tertiary">Max: <span className="text-white font-bold">{formatToUSD(balance)}</span></span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={withdrawAmount}
                                            onChange={(e) => setWithdrawAmount(e.target.value)}
                                            className="w-full bg-background-secondary rounded-xl border border-white/10 py-3 pl-4 pr-16 text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-text-tertiary/50 font-mono"
                                            placeholder="0.00"
                                        />
                                        <button
                                            onClick={handleMax}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors"
                                        >
                                            MAX
                                        </button>
                                    </div>
                                </div>

                                {/* Adresse */}
                                <div>
                                    <label className="text-xs font-bold text-text-tertiary uppercase mb-1.5 block">
                                        Adresse de destination {withdrawCrypto && `(${withdrawCrypto.network})`}
                                    </label>
                                    <input
                                        type="text"
                                        value={withdrawAddress}
                                        onChange={(e) => setWithdrawAddress(e.target.value)}
                                        className="w-full bg-background-secondary rounded-xl border border-white/10 py-3 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-text-tertiary/50 text-xs font-mono"
                                        placeholder={`Collez votre adresse ${withdrawCrypto?.symbol.toUpperCase() || 'crypto'}`}
                                    />
                                    <p className="text-[10px] text-text-tertiary mt-1.5 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        Vérifiez bien le réseau avant d'envoyer
                                    </p>
                                </div>

                                {/* Résumé Frais */}
                                <div className="p-4 bg-background-secondary/50 rounded-xl border border-white/5 space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-text-secondary">Montant demandé</span>
                                        <span className="text-white font-mono">
                                            {withdrawAmount ? formatToUSD(parseFloat(withdrawAmount)) : "$ 0.00"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-text-secondary">Frais de retrait (1%)</span>
                                        <span className="text-white font-mono">
                                            {withdrawAmount ? formatToUSD(parseFloat(withdrawAmount) * 0.01) : "$ 0.00"}
                                        </span>
                                    </div>
                                    <div className="h-px bg-white/5 my-1" />
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-text-secondary">Total à recevoir</span>
                                        <span className="text-primary font-mono">
                                            {withdrawAmount ? formatToUSD(parseFloat(withdrawAmount) * 0.99) : "$ 0.00"}
                                        </span>
                                    </div>
                                    {withdrawCrypto && withdrawAmount && (
                                        <div className="pt-2 border-t border-white/5">
                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-text-tertiary">En {withdrawCrypto.symbol.toUpperCase()}</span>
                                                <span className="text-accent-purple font-mono">
                                                    ≈ {(parseFloat(withdrawAmount) * 0.99).toFixed(4)} {withdrawCrypto.symbol.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {/* Retraits en attente */}
                                <div className="mt-6">
                                    <h3 className="text-sm font-bold text-white mb-3">
                                        Retraits en cours
                                    </h3>
                                    <PendingWithdrawals />
                                </div>


                                <button
                                    onClick={handleWithdraw}
                                    disabled={isLoading || !withdrawCrypto}
                                    className="w-full py-3.5 bg-primary hover:bg-primary-hover text-background font-bold rounded-xl shadow-glow-gold transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowUpRight className="w-5 h-5" /> Confirmer le retrait</>}
                                </button>
                            </div>
                        )}
                        {activeTab === "history" && (
                            <div>
                                <h3 className="font-bold text-white text-lg mb-4">Historique des Transactions</h3>
                                <TransactionHistory />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}