"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";
import Image from "next/image";

// Liste des bannières disponibles
const BANNERS = [
  { id: 1, url: "/banners/banner-1.jpg", name: "Espace" },
  { id: 2, url: "/banners/banner-2.jpg", name: "Néon" },
  { id: 3, url: "/banners/banner-3.jpg", name: "Océan" },
  { id: 4, url: "/banners/banner-4.jpg", name: "Montagne" },
  { id: 5, url: "/banners/banner-5.jpg", name: "Ville" },
  { id: 6, url: "/banners/banner-6.jpg", name: "Nature" },
];

interface BannerSelectorProps {
  currentBanner: string | null;
  onClose: () => void;
  onSelect: (bannerUrl: string) => void;
}

export function BannerSelector({ currentBanner, onClose, onSelect }: BannerSelectorProps) {
  const [selected, setSelected] = useState(currentBanner);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!selected) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/profile/update-banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bannerUrl: selected })
      });

      if (res.ok) {
        onSelect(selected);
        onClose();
      } else {
        alert('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      alert('Erreur réseau');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1A1D26] rounded-2xl border border-white/10 max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-xl font-display font-bold text-white">
            Choisir une bannière
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Grid de bannières */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 gap-4">
            {BANNERS.map((banner) => (
              <button
                key={banner.id}
                onClick={() => setSelected(banner.url)}
                className={`relative aspect-[21/9] rounded-xl overflow-hidden border-2 transition-all hover:scale-[1.02] ${
                  selected === banner.url
                    ? 'border-primary shadow-glow-gold'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <Image
                  src={banner.url}
                  alt={banner.name}
                  fill
                  className="object-cover"
                />
                {selected === banner.url && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-6 h-6 text-background" />
                    </div>
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <p className="text-sm font-bold text-white">
                    {banner.name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-text-secondary hover:text-white transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!selected || isSaving}
            className="px-6 py-2 bg-primary text-background font-bold rounded-xl shadow-glow-gold hover:bg-primary-hover transition-colors disabled:opacity-50 text-sm"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
