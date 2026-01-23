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
    Zap
} from "lucide-react";
import { cn, formatToUSD } from "@/lib/utils";

// --- 1. CONFIGURATION : LES 5 CRYPTOS & TAUX DE CHANGE (Mock) ---
const RATES: Record<string, number> = {
    BTC: 65000,  // 1 BTC = $65,000
    ETH: 2800,   // 1 ETH = $2,800
    SOL: 145,    // 1 SOL = $145
    BNB: 600,    // 1 BNB = $600
    USDT: 1      // 1 USDT = $1
};

const CRYPTO_OPTIONS = [
    { id: "BTC", name: "Bitcoin", network: "Bitcoin", color: "text-orange-500", bg: "bg-orange-500/10", address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" },
    { id: "ETH", name: "Ethereum", network: "ERC-20", color: "text-indigo-400", bg: "bg-indigo-500/10", address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F" },
    { id: "SOL", name: "Solana", network: "Solana", color: "text-violet-500", bg: "bg-violet-500/10", address: "HN7cABqLq46Es1jh92dQQ43j92dQQ43j92dQQ43j" },
    { id: "BNB", name: "BNB", network: "BSC (BEP-20)", color: "text-yellow-400", bg: "bg-yellow-400/10", address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F" },
    { id: "USDT", name: "Tether", network: "TRC-20", color: "text-emerald-500", bg: "bg-emerald-500/10", address: "TVJ5ndGk5x6F4Y5x6F4Y5x6F4Y5x6F4Y5x" },
];

export default function WalletPage() {
    const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
    const [selectedCoin, setSelectedCoin] = useState(CRYPTO_OPTIONS[0]); // BTC par défaut

    // États UI
    const [copied, setCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // États Données
    const [balance, setBalance] = useState(0); // Solde local en USD
    const [cryptoAmount, setCryptoAmount] = useState(""); // Montant saisi pour le dépôt (en Crypto)
    const [withdrawAmount, setWithdrawAmount] = useState(""); // Montant saisi pour le retrait (en USD)
    const [withdrawAddress, setWithdrawAddress] = useState(""); // Adresse de retrait

    // --- 2. FONCTION POUR CHARGER LE SOLDE ---
    const fetchBalance = async () => {
        try {
            const res = await fetch("/api/wallet/balance");
            if (res.ok) {
                const data = await res.json();
                setBalance(parseInt(data.balance));
            }
        } catch (error) {
            console.error("Erreur chargement solde", error);
        }
    };

    // Charger le solde au démarrage
    useEffect(() => {
        fetchBalance();
    }, []);

    // --- 3. CALCUL DE CONVERSION (Dépôt) ---
    // Convertit la saisie crypto (ex: 0.1 BTC) en USD (ex: 6500)
    const estimatedUSDValue = cryptoAmount
        ? (parseFloat(cryptoAmount) * RATES[selectedCoin.id])
        : 0;

    // --- 4. GESTION DU DÉPÔT ---
    const handleDeposit = async () => {
        setIsLoading(true);
        setMessage(null);

        if (!cryptoAmount || parseFloat(cryptoAmount) <= 0) {
            setMessage({ type: 'error', text: "Montant invalide" });
            setIsLoading(false);
            return;
        }

        try {
            // On envoie la valeur en USD (arrondie) au backend
            const amountToSend = Math.floor(estimatedUSDValue);

            const res = await fetch('/api/wallet/deposit', {
                method: 'POST',
                body: JSON.stringify({ amount: amountToSend }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                setMessage({ type: 'success', text: `Dépôt de ${cryptoAmount} ${selectedCoin.id} (~${formatToUSD(amountToSend)}) réussi !` });
                setCryptoAmount(""); // Reset input
                fetchBalance(); // Mise à jour immédiate du solde
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || "Erreur dépôt" });
            }
        } catch {
            setMessage({ type: 'error', text: "Erreur de connexion serveur" });
        } finally {
            setIsLoading(false);
        }
    };

    // --- 5. GESTION DU RETRAIT ---
    const handleWithdraw = async () => {
        setIsLoading(true);
        setMessage(null);

        // Validation basique
        if (!withdrawAmount || parseInt(withdrawAmount) <= 0) {
            setMessage({ type: 'error', text: "Montant invalide" }); setIsLoading(false); return;
        }
        if (!withdrawAddress) {
            setMessage({ type: 'error', text: "Adresse invalide" }); setIsLoading(false); return;
        }
        if (parseInt(withdrawAmount) > balance) {
            setMessage({ type: 'error', text: "Solde insuffisant" }); setIsLoading(false); return;
        }

        try {
            const res = await fetch('/api/wallet/withdraw', {
                method: 'POST',
                body: JSON.stringify({ amount: withdrawAmount, address: withdrawAddress }),
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: "Retrait effectué avec succès !" });
                setWithdrawAmount("");
                setWithdrawAddress("");
                fetchBalance();
            } else {
                // Affiche l'erreur (ex: Wager requirement)
                setMessage({ type: 'error', text: data.message || data.error });
            }
        } catch {
            setMessage({ type: 'error', text: "Erreur serveur" });
        } finally {
            setIsLoading(false);
        }
    };

    // --- UTILITAIRES ---
    const handleCopy = () => {
        navigator.clipboard.writeText(selectedCoin.address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleMax = () => {
        setWithdrawAmount(balance.toString());
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

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setActiveTab("deposit")}
                                    className={cn(
                                        "flex-1 py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                                        activeTab === "deposit"
                                            ? "bg-primary text-background shadow-glow-gold"
                                            : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                                    )}
                                >
                                    <ArrowDownLeft className="w-5 h-5" /> Dépôt
                                </button>
                                <button
                                    onClick={() => setActiveTab("withdraw")}
                                    className={cn(
                                        "flex-1 py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                                        activeTab === "withdraw"
                                            ? "bg-primary text-background shadow-glow-gold"
                                            : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                                    )}
                                >
                                    <ArrowUpRight className="w-5 h-5" /> Retrait
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
                            {CRYPTO_OPTIONS.map((asset) => (
                                <div key={asset.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold", asset.bg, asset.color)}>
                                            {asset.id[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm">{asset.name}</p>
                                            <p className="text-xs text-text-tertiary">Taux: 1 {asset.id} ≈ {formatToUSD(RATES[asset.id])}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setActiveTab("deposit"); setSelectedCoin(asset); }}
                                        className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        Déposer
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- COLONNE DROITE : PANNEAU D'ACTION --- */}
                <div className="lg:col-span-1">
                    <div className="bg-[#1A1D26] p-6 rounded-2xl border border-white/5 h-full flex flex-col min-h-[500px]">

                        {/* MESSAGE DE FEEDBACK (Succès/Erreur) */}
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
                        {activeTab === "deposit" ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

                                <div className="mb-2">
                                    <h3 className="font-bold text-white text-lg">Dépôt {selectedCoin.name}</h3>
                                    <p className="text-xs text-text-tertiary">Envoyez des {selectedCoin.id} pour créditer votre solde USD.</p>
                                </div>

                                {/* 1. SÉLECTEUR DE COIN (LIGNE) */}
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {CRYPTO_OPTIONS.map((coin) => (
                                        <button
                                            key={coin.id}
                                            onClick={() => setSelectedCoin(coin)}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all whitespace-nowrap",
                                                selectedCoin.id === coin.id
                                                    ? "bg-primary/10 border-primary text-white"
                                                    : "bg-background-secondary border-white/5 text-text-tertiary hover:bg-white/5"
                                            )}
                                        >
                                            <div className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold", coin.bg, coin.color)}>
                                                {coin.id[0]}
                                            </div>
                                            <span className="text-xs font-bold">{coin.id}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* 2. QR CODE & ADRESSE */}
                                <div className="p-4 bg-background-secondary rounded-xl border border-white/5 flex flex-col items-center">
                                    <div className="p-2 bg-white rounded-lg mb-4 shadow-lg">
                                        <QrCode className="w-32 h-32 text-black" />
                                    </div>
                                    <div className="w-full">
                                        <label className="text-[10px] font-bold text-text-tertiary uppercase mb-1 block">Adresse {selectedCoin.network}</label>
                                        <div className="flex items-center gap-2 p-3 bg-black/20 rounded-lg border border-white/10 group hover:border-white/20 transition-colors">
                                            <code className="text-xs text-text-secondary truncate flex-1 font-mono">
                                                {selectedCoin.address.substring(0, 10)}...{selectedCoin.address.substring(selectedCoin.address.length - 10)}
                                            </code>
                                            <button
                                                onClick={handleCopy}
                                                className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-text-secondary hover:text-white"
                                            >
                                                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. SIMULATEUR DE PAIEMENT */}
                                <div className="border-t border-white/10 pt-4">
                                    <label className="text-xs text-accent-purple mb-2 font-bold flex items-center gap-2">
                                        <Loader2 className="w-3 h-3 animate-spin" /> SIMULATEUR DE DÉPÔT
                                    </label>

                                    <div className="space-y-3">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                value={cryptoAmount}
                                                onChange={(e) => setCryptoAmount(e.target.value)}
                                                className="w-full bg-background-secondary rounded-xl border border-white/10 py-3 pl-3 pr-12 text-white text-sm focus:outline-none focus:border-accent-purple"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-tertiary">
                                                {selectedCoin.id}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center text-xs px-1">
                                            <span className="text-text-tertiary">Vous recevrez environ :</span>
                                            <span className="text-white font-bold text-sm">
                                                {formatToUSD(estimatedUSDValue)}
                                            </span>
                                        </div>

                                        <button
                                            onClick={handleDeposit}
                                            disabled={isLoading || !cryptoAmount || parseFloat(cryptoAmount) <= 0}
                                            className="w-full py-3 bg-accent-purple hover:bg-accent-purple/80 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "CONFIRMER LE DÉPÔT"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* ================= ONGLET RETRAIT ================= */
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">

                                <div className="mb-2">
                                    <h3 className="font-bold text-white text-lg">Retrait des Fonds</h3>
                                    <p className="text-xs text-text-tertiary">Retirez vos gains vers votre portefeuille externe.</p>
                                </div>

                                {/* Sélecteur de réseau simple */}
                                <div>
                                    <label className="text-xs font-bold text-text-tertiary uppercase mb-1.5 block">Réseau de retrait</label>
                                    <button className="w-full flex items-center justify-between p-3 bg-background-secondary rounded-xl border border-white/10 hover:border-primary/50 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-yellow-500/10 rounded-lg"><Zap className="w-4 h-4 text-yellow-500" /></div>
                                            <div className="text-left">
                                                <span className="font-bold text-white text-sm block">Bitcoin Lightning</span>
                                                <span className="text-[10px] text-text-tertiary">Le plus rapide • Frais faibles</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-text-tertiary" />
                                    </button>
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

                                {/* Adresse avec Helper Dev */}
                                <div>
                                    <label className="text-xs font-bold text-text-tertiary uppercase mb-1.5 flex justify-between">
                                        Adresse de destination
                                        <button
                                            onClick={() => setWithdrawAddress("bc1q_TEST_ADDRESS_SIMULATION_xyz")}
                                            className="text-[10px] text-accent-purple hover:underline cursor-pointer"
                                        >
                                            [DEV] Remplir adresse test
                                        </button>
                                    </label>
                                    <input
                                        type="text"
                                        value={withdrawAddress}
                                        onChange={(e) => setWithdrawAddress(e.target.value)}
                                        className="w-full bg-background-secondary rounded-xl border border-white/10 py-3 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-text-tertiary/50 text-xs font-mono"
                                        placeholder="Collez une adresse ou cliquez sur [DEV]"
                                    />
                                </div>

                                {/* Résumé Frais */}
                                <div className="p-4 bg-background-secondary/50 rounded-xl border border-white/5 space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-text-secondary">Frais de réseau</span>
                                        <span className="text-white font-mono">$ 0.00</span>
                                    </div>
                                    <div className="h-px bg-white/5 my-1" />
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-text-secondary">Total à recevoir</span>
                                        <span className="text-primary font-mono">{withdrawAmount ? formatToUSD(withdrawAmount) : "$ 0.00"}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleWithdraw}
                                    disabled={isLoading}
                                    className="w-full py-3.5 bg-primary hover:bg-primary-hover text-background font-bold rounded-xl shadow-glow-gold transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowUpRight className="w-5 h-5" /> Confirmer le retrait</>}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}