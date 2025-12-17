"use client";

import { useState } from "react";
import {
    User,
    Shield,
    BadgeCheck,
    Settings,
    LogOut,
    Camera,
    Mail,
    Smartphone,
    CheckCircle2,
    ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock User Data
const USER = {
    username: "CryptoKing99",
    email: "cr***@gmail.com",
    level: 42,
    xp: 75, // percentage
    joinDate: "Sept 2023",
    kycStatus: "Verified", // Verified, Pending, Unverified
    vipTier: "Gold",
    userId: "8829103"
};

const TABS = [
    { id: "general", label: "General", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "verification", label: "Verification", icon: BadgeCheck },
    { id: "preferences", label: "Preferences", icon: Settings },
];

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState("general");

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 1. HEADER PROFILE CARD */}
            <div className="relative rounded-2xl overflow-hidden bg-surface border border-white/5 shadow-2xl">
                {/* Banner */}
                <div className="h-32 bg-gradient-to-r from-accent-violet/20 to-accent-cyan/20 relative">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                    <button className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/50 backdrop-blur text-xs font-bold text-white rounded-lg hover:bg-black/70 transition-colors flex items-center gap-2">
                        <Camera className="w-3 h-3" /> Edit Cover
                    </button>
                </div>

                <div className="px-8 pb-8 flex flex-col md:flex-row items-end md:items-center gap-6 -mt-10">
                    {/* Avatar */}
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full border-4 border-surface bg-gradient-to-br from-accent-violet to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-glow-purple">
                            K
                        </div>
                        <button className="absolute bottom-0 right-0 p-1.5 bg-surface border border-white/10 rounded-full text-text-secondary hover:text-white transition-colors">
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 mb-2 md:mb-0">
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold font-display text-white">{USER.username}</h1>
                            <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-bold uppercase rounded border border-primary/20">
                                {USER.vipTier} VIP
                            </span>
                            {USER.kycStatus === "Verified" && (
                                <CheckCircle2 className="w-5 h-5 text-success fill-success/10" />
                            )}
                        </div>
                        <p className="text-text-tertiary text-sm">User ID: <span className="text-text-secondary font-mono">{USER.userId}</span></p>
                    </div>

                    {/* Level Progress */}
                    <div className="w-full md:w-64">
                        <div className="flex justify-between text-xs font-bold text-text-secondary mb-2">
                            <span>Level {USER.level}</span>
                            <span>{USER.xp}%</span>
                        </div>
                        <div className="h-2 w-full bg-background-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-primary to-accent-rose w-[75%] shadow-glow-gold/50" />
                        </div>
                        <p className="text-[10px] text-text-tertiary mt-1 text-right">540 XP to Level {USER.level + 1}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* 2. SIDEBAR NAVIGATION */}
                <div className="md:col-span-1 space-y-2">
                    <nav className="space-y-1">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left",
                                        isActive
                                            ? "bg-surface text-primary border border-primary/20 shadow-lg"
                                            : "text-text-secondary hover:bg-surface/50 hover:text-white"
                                    )}
                                >
                                    <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-text-tertiary")} />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </nav>

                    <div className="pt-4 border-t border-white/5 mt-4">
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors text-left">
                            <LogOut className="w-4 h-4" />
                            Log Out
                        </button>
                    </div>
                </div>

                {/* 3. SETTINGS CONTENT AREA */}
                <div className="md:col-span-3 bg-surface border border-white/5 rounded-2xl p-6 min-h-[500px]">

                    {/* === GENERAL TAB === */}
                    {activeTab === "general" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-4">Personal Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-text-tertiary uppercase">Username</label>
                                        <div className="flex items-center px-4 py-3 bg-background-secondary border border-white/10 rounded-xl text-white">
                                            {USER.username}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-text-tertiary uppercase">Email Address</label>
                                        <div className="flex items-center justify-between px-4 py-3 bg-background-secondary border border-white/10 rounded-xl">
                                            <div className="flex items-center gap-2 text-white">
                                                <Mail className="w-4 h-4 text-text-tertiary" />
                                                {USER.email}
                                            </div>
                                            <span className="text-xs text-success font-bold bg-success/10 px-2 py-1 rounded">Verified</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-white/5 pt-6">
                                <h2 className="text-xl font-bold text-white mb-4">Statistics</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 bg-background-secondary rounded-xl text-center border border-white/5">
                                        <div className="text-2xl font-bold text-primary font-display">$42.5k</div>
                                        <div className="text-xs text-text-tertiary uppercase">Wagered</div>
                                    </div>
                                    <div className="p-4 bg-background-secondary rounded-xl text-center border border-white/5">
                                        <div className="text-2xl font-bold text-success font-display">1,240</div>
                                        <div className="text-xs text-text-tertiary uppercase">Total Bets</div>
                                    </div>
                                    <div className="p-4 bg-background-secondary rounded-xl text-center border border-white/5">
                                        <div className="text-2xl font-bold text-accent-cyan font-display">254</div>
                                        <div className="text-xs text-text-tertiary uppercase">Wins</div>
                                    </div>
                                    <div className="p-4 bg-background-secondary rounded-xl text-center border border-white/5">
                                        <div className="text-2xl font-bold text-accent-rose font-display">x500</div>
                                        <div className="text-xs text-text-tertiary uppercase">Max Win</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* === VERIFICATION (KYC) TAB === */}
                    {activeTab === "verification" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white">Identity Verification</h2>
                                <span className="px-3 py-1 bg-success text-background font-bold text-sm rounded-full shadow-glow-cyan flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" /> Verified
                                </span>
                            </div>

                            <div className="space-y-4">
                                {/* Step 1 */}
                                <div className="flex gap-4 p-4 rounded-xl bg-background-secondary border border-white/5 opacity-50">
                                    <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">Level 1: Basic Info</h4>
                                        <p className="text-sm text-text-secondary">Full name, date of birth, and address.</p>
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-r from-success/10 to-transparent border border-success/30">
                                    <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">Level 2: ID Verification</h4>
                                        <p className="text-sm text-text-secondary">Government issued ID and selfie.</p>
                                        <p className="text-xs text-success font-bold mt-2">Completed on Oct 12, 2023</p>
                                    </div>
                                </div>

                                {/* Step 3 */}
                                <div className="flex gap-4 p-4 rounded-xl bg-background-secondary border border-white/5">
                                    <div className="w-8 h-8 rounded-full bg-surface border border-white/10 flex items-center justify-center shrink-0 text-text-tertiary">
                                        3
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-opacity-50">Level 3: Proof of Address</h4>
                                        <p className="text-sm text-text-tertiary">Utility bill or bank statement (Optional for higher limits).</p>
                                        <button className="mt-3 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg border border-white/10 transition-colors">
                                            Start Verification
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* === SECURITY TAB === */}
                    {activeTab === "security" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-4">Security Settings</h2>

                                {/* 2FA Card */}
                                <div className="p-6 rounded-xl bg-background-secondary border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                            <Smartphone className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white">Two-Factor Authentication (2FA)</h4>
                                            <p className="text-sm text-text-secondary max-w-md">
                                                Secure your account with Google Authenticator. Recommended for all users.
                                            </p>
                                        </div>
                                    </div>
                                    <button className="px-5 py-2 bg-primary hover:bg-primary-hover text-background font-bold rounded-lg shadow-glow-gold transition-colors">
                                        Enable 2FA
                                    </button>
                                </div>
                            </div>

                            <div className="border-t border-white/5 pt-6">
                                <h3 className="font-bold text-white mb-4">Active Sessions</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_5px_#10B981]" />
                                            <div>
                                                <p className="text-sm font-bold text-white">Windows 10 - Chrome</p>
                                                <p className="text-xs text-text-tertiary">Paris, France • Current Session</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-success uppercase">Active</span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors opacity-50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-text-tertiary" />
                                            <div>
                                                <p className="text-sm font-bold text-white">iPhone 14 - Safari</p>
                                                <p className="text-xs text-text-tertiary">Lyon, France • 2 days ago</p>
                                            </div>
                                        </div>
                                        <button className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded transition-colors text-text-tertiary">
                                            <LogOut className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* === PREFERENCES TAB (Placeholder) === */}
                    {activeTab === "preferences" && (
                        <div className="flex flex-col items-center justify-center h-full text-center py-10 animate-in fade-in slide-in-from-right-4 duration-300">
                            <Settings className="w-16 h-16 text-text-tertiary opacity-20 mb-4" />
                            <h3 className="text-lg font-bold text-white">Preferences</h3>
                            <p className="text-text-secondary max-w-sm">
                                Language, currency, and notification settings coming soon.
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
