import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicyPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-12 animate-in fade-in duration-500">
            <Link href="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-white transition-colors mb-8 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                <ArrowLeft className="w-4 h-4" /> <span className="text-sm font-bold">Retour à l'accueil</span>
            </Link>

            <div className="glass-panel p-8 md:p-12">
                <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-8">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-glow-gold">
                        <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-black text-white">Politique de Confidentialité</h1>
                        <p className="text-text-secondary mt-1">Dernière mise à jour : {new Date('2026-03-07').toLocaleDateString('fr-FR')}</p>
                    </div>
                </div>

                <div className="space-y-8 text-text-secondary leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">1. Introduction</h2>
                        <p>
                            Bienvenue sur notre application. Nous accordons une grande importance à la protection de vos données personnelles et au respect de la réglementation RGPD. Cette politique vise à vous informer de la manière dont nous collectons, utilisons et protégeons vos données.
                        </p>
                    </section>
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">2. Données collectées</h2>
                        <p>
                            Nous collectons les informations strictement nécessaires pour vous fournir nos services cryptographiques de jeux en toute sécurité (historique de jeux, adresse e-mail, pseudonyme). Aucune donnée personnelle superflue n'est requise.
                        </p>
                    </section>
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">3. Utilisation des cookies</h2>
                        <p>
                            Nous utilisons des "cookies" et technologies similaires pour garantir le bon fonctionnement de l'application, maintenir votre connexion (sessions utilisateur de manière stricte) et sauvegarder vos préférences locales telles que votre consentement au RGPD.
                        </p>
                    </section>
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">4. Sécurité</h2>
                        <p>
                            Vos mots de passe et données de transactions sont chiffrés par les standards de l'industrie. Nous prenons de nombreuses mesures technologiques pour protéger l'intégrité de vos informations vis-à-vis d'accès non autorisés.
                        </p>
                    </section>
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">5. Vos droits (RGPD)</h2>
                        <p>
                            Conformément au RGPD européen, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Vous pouvez exercer ce droit à tout moment via l'interface de votre compte ou en contactant notre support technique.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
