// lib/withdrawal-config.ts

// ⚙️ CONFIGURATION SYSTÈME RETRAITS AUTOMATIQUES

export const WITHDRAWAL_CONFIG = {
  // Montants (en USD)
  AUTO_MAX_AMOUNT: 500, // Max pour retrait automatique
  MIN_WITHDRAWAL: 10, // Montant minimum
  MAX_WITHDRAWAL: 10000, // Montant maximum
  
  // Limites temporelles
  DAILY_LIMIT_AUTO: 3, // Nombre max de retraits auto par jour
  DAILY_LIMIT_MANUAL: 5, // Nombre max de retraits manuels par jour
  
  // Vérification utilisateur
  REQUIRE_KYC_LEVEL: 1, // Niveau KYC minimum pour auto
  
  // Providers (ordre de priorité)
  PROVIDERS: ['PLISIO', 'NOWPAYMENTS'] as const,
  DEFAULT_PROVIDER: 'PLISIO' as const,
  
  // Sécurité
  RISK_SCORE_MAX: 0.5, // Score de risque max pour auto (0-1)
  MIN_ACCOUNT_AGE_HOURS: 24, // Âge min du compte en heures
  
  // Frais de retrait (en %)
  WITHDRAWAL_FEE_PERCENT: 2, // 2% de frais
  MIN_FEE_USD: 1, // Frais minimum
}

// Types de traitement
export enum WithdrawalProcessType {
  AUTOMATIC = 'AUTOMATIC', // Traité automatiquement
  MANUAL = 'MANUAL', // Nécessite validation admin
  PENDING = 'PENDING', // En cours de traitement
}

// Raisons de passage en manuel
export enum ManualReviewReason {
  HIGH_AMOUNT = 'HIGH_AMOUNT', // Montant > $500
  UNVERIFIED_USER = 'UNVERIFIED_USER', // User non vérifié KYC
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY', // Activité suspecte
  DAILY_LIMIT_EXCEEDED = 'DAILY_LIMIT_EXCEEDED', // Limite journalière dépassée
  PROVIDER_ERROR = 'PROVIDER_ERROR', // Erreur technique provider
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE', // Balance provider insuffisante
  NEW_ACCOUNT = 'NEW_ACCOUNT', // Compte trop récent
  HIGH_RISK_SCORE = 'HIGH_RISK_SCORE', // Score de risque élevé
}

// Statuts de retrait
export enum WithdrawalStatus {
  PENDING = 'PENDING', // En attente de traitement
  PROCESSING = 'PROCESSING', // En cours d'envoi
  COMPLETED = 'COMPLETED', // Envoyé avec succès
  FAILED = 'FAILED', // Échec
  REJECTED = 'REJECTED', // Rejeté par admin
  CANCELLED = 'CANCELLED', // Annulé par user
}

// Provider types
export type PaymentProvider = 'PLISIO' | 'NOWPAYMENTS'