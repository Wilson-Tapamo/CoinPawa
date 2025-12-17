"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Lock, Mail, ArrowRight, Shield, Ghost, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
    const [activeTab, setActiveTab] = useState<"login" | "register" | "anonymous">("login");
    const router = useRouter();

    const handleAnonymousLogin = () => {
        // In a real app, this might create a temporary session
        localStorage.setItem("user_type", "guest");
        router.push("/wallet");
    };

    const handleLogin = () => {
        // Mock Login
        localStorage.setItem("user_type", "user");
        router.push("/wallet");
    };

    const handleRegister = () => {
        // Mock Register
        localStorage.setItem("user_type", "user");
        router.push("/wallet");
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-dark z-0" />
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0 pointer-events-none" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/20 rounded-full blur-[128px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-500">
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-glow mb-2">
                        CoinPawa
                    </h1>
                    <p className="text-text-secondary">Next Gen Crypto Casino</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-surface/50 p-1 rounded-xl mb-6 backdrop-blur-sm border border-white/5">
                    {(["login", "register", "anonymous"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "flex-1 py-2 text-sm font-bold rounded-lg transition-all capitalize",
                                activeTab === tab
                                    ? "bg-surface text-white shadow-lg border border-white/10"
                                    : "text-text-tertiary hover:text-white"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Main Card */}
                <div className="bg-surface/30 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">

                    {/* ANONYMOUS / GUEST MODE */}
                    {activeTab === "anonymous" && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 bg-accent-cyan/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-accent-cyan/20 shadow-glow-cyan">
                                    <Ghost className="w-8 h-8 text-accent-cyan" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">Play Anonymously</h2>
                                <p className="text-sm text-text-secondary leading-relaxed">
                                    No account needed. Deposit crypto and start playing instantly.
                                    Your session is secured by your browser.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                    <Shield className="w-5 h-5 text-success" />
                                    <p className="text-xs text-text-secondary">No Personal Data Required</p>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                    <Wallet className="w-5 h-5 text-primary" />
                                    <p className="text-xs text-text-secondary">Instant Deposits & Withdrawals</p>
                                </div>
                            </div>

                            <button
                                onClick={handleAnonymousLogin}
                                className="w-full py-4 bg-gradient-to-r from-accent-cyan to-blue-600 hover:from-accent-cyan hover:to-blue-500 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                            >
                                <Ghost className="w-5 h-5" /> Start Playing Anonymously
                            </button>

                            <p className="text-center text-[10px] text-text-tertiary">
                                By continuing, you agree to our Terms of Service.
                            </p>
                        </div>
                    )}

                    {/* LOGIN FORM */}
                    {activeTab === "login" && (
                        <div className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-300">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-text-tertiary uppercase mb-1.5 block">Email / Username</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                                        <input
                                            type="text"
                                            className="w-full bg-background-secondary/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-text-tertiary/50"
                                            placeholder="Enter your email"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-text-tertiary uppercase mb-1.5 block">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                                        <input
                                            type="password"
                                            className="w-full bg-background-secondary/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-text-tertiary/50"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div className="flex justify-end mt-2">
                                        <a href="#" className="text-xs text-primary hover:text-primary-hover transition-colors">Forgot Password?</a>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleLogin}
                                className="w-full py-3.5 bg-primary hover:bg-primary-hover text-background font-bold rounded-xl shadow-glow-gold transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                            >
                                Log In <ArrowRight className="w-5 h-5" />
                            </button>

                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                                <div className="relative flex justify-center text-xs uppercase"><span className="bg-surface px-2 text-text-tertiary">Or continue with</span></div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button className="py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-xs font-bold transition-all flex items-center justify-center gap-2">
                                    <Wallet className="w-4 h-4" /> Wallet
                                </button>
                                <button className="py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-xs font-bold transition-all flex items-center justify-center gap-2">
                                    Google
                                </button>
                            </div>
                        </div>
                    )}

                    {/* REGISTER FORM */}
                    {activeTab === "register" && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-text-tertiary uppercase mb-1.5 block">Username</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                                        <input
                                            type="text"
                                            className="w-full bg-background-secondary/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-text-tertiary/50"
                                            placeholder="Choose a username"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-text-tertiary uppercase mb-1.5 block">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                                        <input
                                            type="password"
                                            className="w-full bg-background-secondary/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-text-tertiary/50"
                                            placeholder="Create a password"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-text-tertiary uppercase mb-1.5 block">Email Address <span className="text-text-tertiary/50 font-normal normal-case">(Optional for recovery)</span></label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                                        <input
                                            type="email"
                                            className="w-full bg-background-secondary/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-text-tertiary/50"
                                            placeholder="Enter your email"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleRegister}
                                className="w-full py-3.5 bg-accent-purple hover:bg-accent-purple/90 text-white font-bold rounded-xl shadow-glow-purple transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                            >
                                Create Account
                            </button>

                            <p className="text-center text-xs text-text-tertiary">
                                Already have an account? <button onClick={() => setActiveTab("login")} className="text-primary hover:underline">Log in</button>
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <Link href="/" className="text-sm text-text-tertiary hover:text-white transition-colors flex items-center justify-center gap-2">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
