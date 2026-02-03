"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";
import Image from "next/image";

// Liste des avatars disponibles
const AVATARS = [
  { id: 1, url: "/avatars/avatar-1.png", name: "Guerrier" },
  { id: 2, url: "/avatars/avatar-2.png", name: "Mage" },
  { id: 3, url: "/avatars/avatar-3.png", name: "Archer" },
  { id: 4, url: "/avatars/avatar-4.png", name: "Ninja" },
  { id: 5, url: "/avatars/avatar-5.png", name: "Chevalier" },
  { id: 6, url: "/avatars/avatar-6.png", name: "Sorcier" },
  { id: 7, url: "/avatars/avatar-7.png", name: "Voleur" },
  { id: 8, url: "/avatars/avatar-8.png", name: "Paladin" },
];

interface AvatarSelectorProps {
  currentAvatar: string | null;
  onClose: () => void;
  onSelect: (avatarUrl: string) => void;
}

export function AvatarSelector({ currentAvatar, onClose, onSelect }: AvatarSelectorProps) {
  const [selected, setSelected] = useState(currentAvatar);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!selected) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/profile/update-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: selected })
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
      <div className="bg-[#1A1D26] rounded-2xl border border-white/10 max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-xl font-display font-bold text-white">
            Choisir un avatar
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Grid d'avatars */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-4 gap-4">
            {AVATARS.map((avatar) => (
              <button
                key={avatar.id}
                onClick={() => setSelected(avatar.url)}
                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                  selected === avatar.url
                    ? 'border-primary shadow-glow-gold'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <Image
                  src={avatar.url}
                  alt={avatar.name}
                  fill
                  className="object-cover"
                />
                {selected === avatar.url && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-5 h-5 text-background" />
                    </div>
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-xs font-bold text-white text-center">
                    {avatar.name}
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
