import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Utilitaire pour fusionner les classes Tailwind (Standard Shadcn)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formate un nombre en devise USD
 * Ex: 1250.5 -> "$ 1,250.50"
 */
export function formatToUSD(amount: number | string) {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(value) || value === null) {
    return "$ 0.00";
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

// Taux de conversion fixe pour la démo (1 BTC = $50,000 => 1 USD = 2000 Sats)
export const SATS_PER_USD = 2000;

export function usdToSats(usdAmount: number): number {
  return Math.floor(usdAmount * SATS_PER_USD);
}

export function satsToUsd(satsAmount: number): number {
  return satsAmount / SATS_PER_USD;
}