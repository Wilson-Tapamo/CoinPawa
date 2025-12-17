"use client";

import { useState } from "react";
import {
    ArrowUpRight,
    ArrowDownLeft,
    CreditCard,
    History,
    Copy,
    QrCode,
    ChevronRight,
    Wallet as WalletIcon,
    Bitcoin
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock Data: Assets
const ASSETS = [
    { symbol: "BTC", name: "Bitcoin", balance: "0.04500000", value: "$1,890.45", color: "text-orange-500", bg: "bg-orange-500/10" },
    { symbol: "ETH", name: "Ethereum", balance: "1.25000000", value: "$2,850.12", color: "text-blue-500", bg: "bg-blue-500/10" },
    { symbol: "USDT", name: "Tether", balance: "450.00", value: "$450.00", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { symbol: "SOL", name: "Solana", balance: "12.50000000", value: "$890.00", color: "text-violet-500", bg: "bg-violet-500/10" },
    { symbol: "DOGE", name: "Dogecoin", balance: "5000.000000", value: "$450.25", color: "text-yellow-400", bg: "bg-yellow-400/10" },
];

// Mock Data: Transactions
const TRANSACTIONS = [
    { id: "tx-1", type: "Deposit", asset: "BTC", amount: "+0.005 BTC", value: "$210.50", status: "Completed", date: "2023-11-15 14:30" },
    { id: "tx-2", type: "Withdraw", asset: "ETH", amount: "-0.5 ETH", value: "$1,100.00", status: "Given", date: "2023-11-14 09:12" },
    { id: "tx-3", type: "Game Win", asset: "USDT", amount: "+120.50 USDT", value: "$120.50", status: "Completed", date: "2023-11-13 22:45" },
    { id: "tx-4", type: "Deposit", asset: "SOL", amount: "+5.0 SOL", value: "$350.00", status: "Pending", date: "2023-11-12 18:20" },
];

export default function WalletPage() {
    const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-display font-bold text-white">Wallet</h1>
                <button className="flex items-center gap-2 text-sm text-primary hover:text-primary-hover font-bold bg-primary/10 px-4 py-2 rounded-lg transition-colors">
                    <History className="w-4 h-4" /> Transaction History
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COLUMN: Balance & Assets */}
                <div className="lg:col-span-2 space-y-6">
                    {/* 1. Total Balance Card */}
                    <div className="bg-gradient-to-br from-surface to-background-secondary p-8 rounded-2xl border border-white/5 relative overflow-hidden shadow-2xl">
                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <WalletIcon className="w-64 h-64 text-white" />
                        </div>

                        <div className="relative z-10">
                            <p className="text-text-secondary font-medium mb-2">Total Estimated Balance</p>
                            <div className="flex items-baseline gap-3 mb-8">
                                <span className="text-5xl font-display font-bold text-white">$ 6,530.82</span>
                                <span className="text-lg text-success font-bold flex items-center gap-1">
                                    <ArrowUpRight className="w-4 h-4" /> +2.4%
                                </span>
                            </div>

                            <div className="flex gap-4">
                                <button className="flex-1 py-3 bg-primary hover:bg-primary-hover text-background font-bold rounded-xl shadow-glow-gold transition-all flex items-center justify-center gap-2">
                                    <ArrowDownLeft className="w-5 h-5" /> Deposit
                                </button>
                                <button className="flex-1 py-3 bg-surface hover:bg-surface-hover border border-white/10 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 backdrop-blur-md">
                                    <ArrowUpRight className="w-5 h-5" /> Withdraw
                                </button>
                                <button className="px-4 py-3 bg-surface hover:bg-surface-hover border border-white/10 text-white font-bold rounded-xl transition-all flex items-center justify-center backdrop-blur-md">
                                    <CreditCard className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 2. Crypto Assets List */}
                    <div className="bg-surface/30 rounded-2xl border border-white/5 overflow-hidden">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                            <h3 className="font-bold text-white">Crypto Assets</h3>
                            <div className="flex gap-2">
                                <span className="text-xs font-bold text-text-tertiary uppercase px-2">Hide Zero Balances</span>
                            </div>
                        </div>
                        <div className="divide-y divide-white/5">
                            {ASSETS.map((asset) => (
                                <div key={asset.symbol} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", asset.bg)}>
                                            {/* Ideally actual icons, using text fallback or Lucide generic if needed */}
                                            <span className={cn("font-bold text-xs", asset.color)}>{asset.symbol[0]}</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm">{asset.name}</p>
                                            <p className="text-xs text-text-tertiary">{asset.symbol}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-white text-sm">{asset.balance}</p>
                                        <p className="text-xs text-text-secondary">{asset.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Action / Promo */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Quick Exchange / Deposit Widget */}
                    <div className="bg-surface p-6 rounded-2xl border border-white/5">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-white">Quick Actions</h3>
                            <div className="flex p-1 bg-background-secondary rounded-lg">
                                <button
                                    onClick={() => setActiveTab("deposit")}
                                    className={cn(
                                        "px-3 py-1 rounded-md text-xs font-bold transition-all",
                                        activeTab === "deposit" ? "bg-surface text-white shadow-sm" : "text-text-tertiary hover:text-white"
                                    )}
                                >
                                    Deposit
                                </button>
                                <button
                                    onClick={() => setActiveTab("withdraw")}
                                    className={cn(
                                        "px-3 py-1 rounded-md text-xs font-bold transition-all",
                                        activeTab === "withdraw" ? "bg-surface text-white shadow-sm" : "text-text-tertiary hover:text-white"
                                    )}
                                >
                                    Withdraw
                                </button>
                            </div>
                        </div>

                        {activeTab === "deposit" ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div>
                                    <label className="text-xs text-text-tertiary mb-1.5 block">Select Currency</label>
                                    <button className="w-full flex items-center justify-between p-3 bg-background-secondary rounded-xl border border-white/10 hover:border-primary/50 transition-colors mb-4">
                                        <div className="flex items-center gap-2">
                                            <Bitcoin className="w-5 h-5 text-orange-500" />
                                            <span className="font-bold text-white">Bitcoin</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-text-tertiary" />
                                    </button>

                                    <label className="text-xs text-text-tertiary mb-1.5 block">Select Network</label>
                                    <button className="w-full flex items-center justify-between p-3 bg-background-secondary rounded-xl border border-white/10 hover:border-primary/50 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-white text-sm">Bitcoin (BTC)</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-text-tertiary" />
                                    </button>
                                    <div className="mt-1 flex gap-2">
                                        <span className="text-[10px] px-2 py-0.5 bg-accent-purple/10 text-accent-purple rounded border border-accent-purple/20">Lightning Network Available</span>
                                    </div>
                                </div>

                                <div className="p-4 bg-white rounded-xl flex items-center justify-center my-4">
                                    {/* Fake QR Code */}
                                    <div className="w-32 h-32 bg-black opacity-10" />
                                    <QrCode className="w-32 h-32 text-black absolute" />
                                </div>

                                <div>
                                    <label className="text-xs text-text-tertiary mb-1.5 block">Deposit Address</label>
                                    <div className="flex items-center gap-2 p-3 bg-background-secondary rounded-xl border border-white/10">
                                        <code className="text-xs text-text-secondary truncate flex-1">1A1zP1eP5QGefi2DMPTfTL5SL...</code>
                                        <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-text-secondary hover:text-white">
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-2 text-center text-xs text-text-tertiary">
                                    Minimum deposit: 0.0001 BTC
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                                <div>
                                    <label className="text-xs text-text-tertiary mb-1.5 block">Select Currency</label>
                                    <button className="w-full flex items-center justify-between p-3 bg-background-secondary rounded-xl border border-white/10 hover:border-primary/50 transition-colors mb-4">
                                        <div className="flex items-center gap-2">
                                            <Bitcoin className="w-5 h-5 text-orange-500" />
                                            <span className="font-bold text-white">Bitcoin</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-text-tertiary" />
                                    </button>

                                    <label className="text-xs text-text-tertiary mb-1.5 block">Withdraw Amount</label>
                                    <div className="relative mb-4">
                                        <input
                                            type="text"
                                            className="w-full bg-background-secondary rounded-xl border border-white/10 py-3 pl-4 pr-16 text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-text-tertiary/50"
                                            placeholder="0.00"
                                        />
                                        <button className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors">
                                            MAX
                                        </button>
                                    </div>

                                    <label className="text-xs text-text-tertiary mb-1.5 block">Destination Address</label>
                                    <input
                                        type="text"
                                        className="w-full bg-background-secondary rounded-xl border border-white/10 py-3 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-text-tertiary/50 mb-4"
                                        placeholder="Paste BTC address"
                                    />
                                </div>

                                <div className="p-3 bg-accent-rose/5 rounded-xl border border-accent-rose/10">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-text-secondary">Network Fee</span>
                                        <span className="text-white">0.00005 BTC</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-text-secondary">Total</span>
                                        <span className="text-white">0.00005 BTC</span>
                                    </div>
                                </div>

                                <button className="w-full py-3 bg-primary hover:bg-primary-hover text-background font-bold rounded-xl shadow-glow-gold transition-all flex items-center justify-center gap-2">
                                    <ArrowUpRight className="w-5 h-5" /> Confirm Withdraw
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Recent Activity List (Mini) */}
                    <div className="bg-surface/30 rounded-2xl border border-white/5 p-4">
                        <h3 className="font-bold text-white text-sm mb-4">Recent Activity</h3>
                        <div className="space-y-4">
                            {TRANSACTIONS.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center bg-surface border border-white/5",
                                            tx.type === "Deposit" || tx.type === "Game Win" ? "text-success" : "text-text-secondary"
                                        )}>
                                            {tx.type === "Deposit" || tx.type === "Game Win" ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white">{tx.type}</p>
                                            <p className="text-[10px] text-text-tertiary">{tx.date}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn("text-xs font-bold", tx.type.includes("Withdraw") ? "text-white" : "text-success")}>{tx.amount}</p>
                                        <p className="text-[10px] text-text-secondary capitalize">{tx.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
