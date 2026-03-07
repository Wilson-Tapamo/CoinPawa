"use client";

import { useState, useEffect } from "react";
import { Info, X } from "lucide-react";
import Link from "next/link";

export function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Obtenir le consentement stocké localement
        const consent = localStorage.getItem("cookie_consent");
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem("cookie_consent", "true");
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom-5 duration-500">
            <div className="max-w-4xl mx-auto bg-surface border border-white/10 p-4 md:p-6 rounded-2xl shadow-2xl flex flex-col md:flex-row items-center gap-4 justify-between backdrop-blur-md">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Info className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-1">Nous respectons votre vie privée (RGPD)</h4>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            Ce site utilise des cookies pour améliorer votre expérience utilisateur et réaliser des statistiques d'audience. En naviguant sur notre site, vous acceptez notre <Link href="/politique-de-confidentialite" className="text-primary hover:underline">Politique de confidentialité</Link>.
                        </p>
                    </div>
                </div>
                <div className="flex w-full md:w-auto gap-2 shrink-0">
                    <button
                        onClick={handleAccept}
                        className="flex-1 md:flex-none px-6 py-2.5 bg-primary hover:bg-primary-hover text-background font-bold rounded-xl shadow-glow-gold transition-transform active:scale-95"
                    >
                        Accepter
                    </button>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/5 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
