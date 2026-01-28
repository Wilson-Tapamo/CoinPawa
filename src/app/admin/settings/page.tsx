"use client";

import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Save,
  DollarSign,
  Percent,
  TrendingUp,
  Shield,
  Loader2,
  Check
} from "lucide-react";

interface SystemSettings {
  minDepositUsd: number;
  minWithdrawalUsd: number;
  withdrawalFeePercent: number;
  maxDailyWithdrawal: number;
  houseEdgeDefault: number;
  kycRequiredAmount: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      alert('Erreur');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (key: keyof SystemSettings, value: number) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-20 text-text-tertiary">
        <p>Erreur de chargement</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Settings</h1>
          <p className="text-text-secondary text-sm mt-1">
            Configuration système du casino
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-background font-bold rounded-xl shadow-glow-gold hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check className="w-5 h-5" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* PAYMENT SETTINGS */}
      <div className="bg-[#1A1D26] rounded-xl p-6 border border-white/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-primary/10 rounded-xl">
            <DollarSign className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Payment Settings</h2>
            <p className="text-sm text-text-tertiary">Limites de dépôts et retraits</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Min Deposit */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Minimum Deposit (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">$</span>
              <input
                type="number"
                value={settings.minDepositUsd}
                onChange={(e) => handleChange('minDepositUsd', parseFloat(e.target.value))}
                min="1"
                step="1"
                className="w-full bg-background-secondary border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <p className="text-xs text-text-tertiary mt-2">
              Montant minimum pour les dépôts
            </p>
          </div>

          {/* Min Withdrawal */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Minimum Withdrawal (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">$</span>
              <input
                type="number"
                value={settings.minWithdrawalUsd}
                onChange={(e) => handleChange('minWithdrawalUsd', parseFloat(e.target.value))}
                min="1"
                step="1"
                className="w-full bg-background-secondary border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <p className="text-xs text-text-tertiary mt-2">
              Montant minimum pour les retraits
            </p>
          </div>

          {/* Withdrawal Fee */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Withdrawal Fee (%)
            </label>
            <div className="relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">%</span>
              <input
                type="number"
                value={settings.withdrawalFeePercent}
                onChange={(e) => handleChange('withdrawalFeePercent', parseFloat(e.target.value))}
                min="0"
                max="10"
                step="0.1"
                className="w-full bg-background-secondary border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <p className="text-xs text-text-tertiary mt-2">
              Frais de retrait en pourcentage
            </p>
          </div>

          {/* Max Daily Withdrawal */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Max Daily Withdrawal (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">$</span>
              <input
                type="number"
                value={settings.maxDailyWithdrawal}
                onChange={(e) => handleChange('maxDailyWithdrawal', parseFloat(e.target.value))}
                min="100"
                step="100"
                className="w-full bg-background-secondary border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <p className="text-xs text-text-tertiary mt-2">
              Limite quotidienne de retrait par utilisateur
            </p>
          </div>
        </div>
      </div>

      {/* GAME SETTINGS */}
      <div className="bg-[#1A1D26] rounded-xl p-6 border border-white/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-accent-violet/10 rounded-xl">
            <Percent className="w-6 h-6 text-accent-violet" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Game Settings</h2>
            <p className="text-sm text-text-tertiary">Configuration des jeux</p>
          </div>
        </div>

        <div className="max-w-md">
          {/* House Edge Default */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Default House Edge (%)
            </label>
            <div className="relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">%</span>
              <input
                type="number"
                value={settings.houseEdgeDefault}
                onChange={(e) => handleChange('houseEdgeDefault', parseFloat(e.target.value))}
                min="0.5"
                max="10"
                step="0.1"
                className="w-full bg-background-secondary border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <p className="text-xs text-text-tertiary mt-2">
              House edge par défaut pour les nouveaux jeux
            </p>
          </div>
        </div>
      </div>

      {/* SECURITY SETTINGS */}
      <div className="bg-[#1A1D26] rounded-xl p-6 border border-white/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-accent-rose/10 rounded-xl">
            <Shield className="w-6 h-6 text-accent-rose" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Security Settings</h2>
            <p className="text-sm text-text-tertiary">Sécurité et vérification</p>
          </div>
        </div>

        <div className="max-w-md">
          {/* KYC Required Amount */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              KYC Required Amount (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">$</span>
              <input
                type="number"
                value={settings.kycRequiredAmount}
                onChange={(e) => handleChange('kycRequiredAmount', parseFloat(e.target.value))}
                min="100"
                step="100"
                className="w-full bg-background-secondary border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <p className="text-xs text-text-tertiary mt-2">
              Montant cumulé nécessitant une vérification KYC
            </p>
          </div>
        </div>
      </div>

      {/* PREVIEW */}
      <div className="bg-accent-cyan/10 rounded-xl p-6 border border-accent-cyan/20">
        <h3 className="text-lg font-bold text-accent-cyan mb-4">Current Configuration</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-text-tertiary mb-1">Min Deposit</p>
            <p className="text-sm font-bold text-white">${settings.minDepositUsd}</p>
          </div>
          <div>
            <p className="text-xs text-text-tertiary mb-1">Min Withdrawal</p>
            <p className="text-sm font-bold text-white">${settings.minWithdrawalUsd}</p>
          </div>
          <div>
            <p className="text-xs text-text-tertiary mb-1">Withdrawal Fee</p>
            <p className="text-sm font-bold text-white">{settings.withdrawalFeePercent}%</p>
          </div>
          <div>
            <p className="text-xs text-text-tertiary mb-1">Max Daily Withdrawal</p>
            <p className="text-sm font-bold text-white">${settings.maxDailyWithdrawal}</p>
          </div>
          <div>
            <p className="text-xs text-text-tertiary mb-1">House Edge</p>
            <p className="text-sm font-bold text-white">{settings.houseEdgeDefault}%</p>
          </div>
          <div>
            <p className="text-xs text-text-tertiary mb-1">KYC Required</p>
            <p className="text-sm font-bold text-white">${settings.kycRequiredAmount}+</p>
          </div>
        </div>
      </div>
    </div>
  );
}
