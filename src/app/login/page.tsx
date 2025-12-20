"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Lock, Mail, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
    const router = useRouter();
    // page active
    const [activeTab, setActiveTab] = useState<"login" | "register">("login");
    
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true); // Pour éviter le flash du formulaire si déjà connecté
    const [error, setError] = useState("");
    
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        email: ""
    });

    // --- 0. VÉRIFICATION AUTOMATIQUE DE SESSION ---
    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await fetch("/api/wallet/balance");
                if (res.ok) {
                    router.push("/wallet");
                } else {
                    setIsCheckingAuth(false);
                }
            } catch (e) {
                setIsCheckingAuth(false);
            }
        };

        checkSession();
    }, [router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // ---  LOGIN ---
    const handleLogin = async () => {
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    username: formData.username, 
                    password: formData.password 
                }),
            });

            const data = await res.json();

            if (res.ok) {
                router.push("/wallet");
                router.refresh();
            } else {
                setError(data.error || "Identifiants incorrects");
            }
        } catch (err) {
            setError("Erreur de connexion au serveur");
        } finally {
            setIsLoading(false);
        }
    };

    // ---  REGISTER ---
    const handleRegister = async () => {
        setIsLoading(true);
        setError("");

        if (!formData.username || !formData.password) {
            setError("Veuillez remplir tous les champs");
            return;
        }

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    username: formData.username, 
                    password: formData.password 
                }),
            });

            const data = await res.json();

            if (res.ok) {
                await handleLogin(); // Connexion auto après inscription
            } else {
                setError(data.error || "Erreur lors de l'inscription");
            }
        } catch (err) {
            setError("Erreur serveur");
        } finally {
            setIsLoading(false);
        }
    };

    // loader pour verification en cours 
    if (isCheckingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0F1218]">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[#0F1218] z-0" />
            <div className="absolute top-0 left-0 w-full h-full opacity-20 z-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-500">
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2">
                        CoinPawa
                    </h1>
                    <p className="text-gray-500">Next Gen Crypto Casino</p>
                </div>

                {/* Tabs (Juste Login et Register) */}
                <div className="flex bg-white/5 p-1 rounded-xl mb-6 backdrop-blur-sm border border-white/5">
                    {(["login", "register"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setError(""); }}
                            className={cn(
                                "flex-1 py-2 text-sm font-bold rounded-lg transition-all capitalize",
                                activeTab === tab
                                    ? "bg-[#1A1D26] text-white shadow-lg border border-white/10"
                                    : "text-gray-500 hover:text-white"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Main Card */}
                <div className="bg-[#1A1D26]/80 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">

                    {/* ERROR MESSAGE DISPLAY */}
                    {error && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                            <p className="text-xs font-bold text-red-400">{error}</p>
                        </div>
                    )}

                    {/* LOGIN FORM */}
                    {activeTab === "login" && (
                        <div className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-300">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Username</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            className="w-full bg-[#0F1218]/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500/50 transition-colors placeholder:text-gray-600"
                                            placeholder="Enter your username"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full bg-[#0F1218]/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500/50 transition-colors placeholder:text-gray-600"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleLogin}
                                disabled={isLoading}
                                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span className="mr-1">Log In</span> <ArrowRight className="w-5 h-5" /></>}
                            </button>
                        </div>
                    )}

                    {/* REGISTER FORM */}
                    {activeTab === "register" && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Username</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            className="w-full bg-[#0F1218]/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500/50 transition-colors placeholder:text-gray-600"
                                            placeholder="Choose a username"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full bg-[#0F1218]/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500/50 transition-colors placeholder:text-gray-600"
                                            placeholder="Create a password"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Email Address <span className="text-gray-600 font-normal normal-case">(Optional)</span></label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full bg-[#0F1218]/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500/50 transition-colors placeholder:text-gray-600"
                                            placeholder="Enter your email"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleRegister}
                                disabled={isLoading}
                                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                            </button>

                            <p className="text-center text-xs text-gray-500">
                                Already have an account? <button onClick={() => setActiveTab("login")} className="text-purple-500 hover:underline">Log in</button>
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <Link href="/" className="text-sm text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-2">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}