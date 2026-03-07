"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Calendar, Image as ImageIcon, Link as LinkIcon, AlertCircle, Loader2 } from "lucide-react";
import Image from "next/image";

interface HomepageEvent {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    buttonText: string | null;
    buttonLink: string | null;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

export default function AdminEventsPage() {
    const [events, setEvents] = useState<HomepageEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<HomepageEvent | null>(null);

    // Form inputs
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [buttonText, setButtonText] = useState("");
    const [buttonLink, setButtonLink] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isActive, setIsActive] = useState(true);

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/events");
            if (res.ok) {
                const data = await (res.json());
                setEvents(data);
            }
        } catch (e) {
            setError("Erreur de chargement des événements");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const openModal = (evt: HomepageEvent | null = null) => {
        setEditingEvent(evt);
        if (evt) {
            setTitle(evt.title);
            setDescription(evt.description || "");
            setImageUrl(evt.imageUrl || "");
            setButtonText(evt.buttonText || "");
            setButtonLink(evt.buttonLink || "");
            setStartDate(new Date(evt.startDate).toISOString().slice(0, 16));
            setEndDate(new Date(evt.endDate).toISOString().slice(0, 16));
            setIsActive(evt.isActive);
        } else {
            setTitle("");
            setDescription("");
            setImageUrl("");
            setButtonText("");
            setButtonLink("");
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 7);

            setStartDate(now.toISOString().slice(0, 16));
            setEndDate(tomorrow.toISOString().slice(0, 16));
            setIsActive(true);
        }
        setIsModalOpen(true);
        setError("");
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError("");

        try {
            const method = editingEvent ? "PUT" : "POST";
            const bodyData = {
                id: editingEvent?.id,
                title,
                description,
                imageUrl,
                buttonText,
                buttonLink,
                startDate,
                endDate,
                isActive
            };

            const res = await fetch("/api/admin/events", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bodyData)
            });

            if (res.ok) {
                await fetchEvents();
                setIsModalOpen(false);
            } else {
                const data = await res.json();
                setError(data.error || "Failed to save event");
            }
        } catch (e) {
            setError("Erreur réseau");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer cet événement ?")) return;
        try {
            const res = await fetch(`/api/admin/events?id=${id}`, { method: "DELETE" });
            if (res.ok) fetchEvents();
            else alert("Erreur lors de la suppression");
        } catch (e) {
            alert("Erreur réseau");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Événements & Promotions</h2>
                    <p className="text-sm text-text-secondary">Gérez les bannières de promotions affichées sur la page d'accueil</p>
                </div>
                <button
                    onClick={() => openModal(null)}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-background font-bold px-4 py-2 rounded-xl transition-colors"
                >
                    <Plus className="w-5 h-5" /> Nouveaux Événement
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
            ) : events.length === 0 ? (
                <div className="bg-surface border border-white/5 rounded-2xl p-12 text-center">
                    <Calendar className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Aucun événement</h3>
                    <p className="text-text-secondary">Créez votre première promotion pour l'afficher sur l'accueil.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((evt) => (
                        <div key={evt.id} className={`bg-surface border ${evt.isActive ? 'border-primary/30' : 'border-white/5 opacity-70'} rounded-2xl overflow-hidden flex flex-col`}>
                            <div className="h-40 relative bg-background flex items-center justify-center">
                                {evt.imageUrl ? (
                                    <Image src={evt.imageUrl} alt={evt.title} fill className="object-cover" />
                                ) : (
                                    <ImageIcon className="w-10 h-10 text-white/10" />
                                )}
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${evt.isActive ? 'bg-success/20 text-success' : 'bg-red-500/20 text-red-500'}`}>
                                        {evt.isActive ? 'Actif' : 'Inactif'}
                                    </span>
                                </div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <h3 className="font-bold text-white text-lg mb-1">{evt.title}</h3>
                                <p className="text-xs text-text-secondary line-clamp-2 mb-4">{evt.description}</p>

                                <div className="mt-auto space-y-2 text-xs text-text-tertiary">
                                    <div className="flex justify-between">
                                        <span>Début :</span>
                                        <span className="text-white">{new Date(evt.startDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Fin :</span>
                                        <span className="text-white">{new Date(evt.endDate).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                                    <button onClick={() => openModal(evt)} className="flex-1 flex justify-center items-center gap-2 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors text-sm">
                                        <Edit2 className="w-4 h-4" /> Éditer
                                    </button>
                                    <button onClick={() => handleDelete(evt.id)} className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de création/édition */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">{editingEvent ? 'Éditer l\'Événement' : 'Nouvel Événement'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-text-tertiary hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4">
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg flex gap-2">
                                    <AlertCircle className="w-5 h-5 shrink-0" /> {error}
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-text-secondary uppercase">Titre (H1)</label>
                                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-background border border-white/10 rounded-xl px-4 py-2 text-white focus:border-primary/50 outline-none" placeholder="Ex: Grosse Promo du Weekend" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-text-secondary uppercase">Description Courte</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-background border border-white/10 rounded-xl px-4 py-2 text-white focus:border-primary/50 outline-none" rows={3} placeholder="Détails de l'offre..." />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-text-secondary uppercase">URL Image de fond</label>
                                <div className="relative">
                                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                                    <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} type="text" className="w-full bg-background border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white focus:border-primary/50 outline-none" placeholder="/bonus_bg.png" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-text-secondary uppercase">Texte du Bouton</label>
                                    <input value={buttonText} onChange={e => setButtonText(e.target.value)} type="text" className="w-full bg-background border border-white/10 rounded-xl px-4 py-2 text-white focus:border-primary/50 outline-none" placeholder="Réclamer" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-text-secondary uppercase">Lien du Bouton</label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                                        <input value={buttonLink} onChange={e => setButtonLink(e.target.value)} type="text" className="w-full bg-background border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white focus:border-primary/50 outline-none" placeholder="/wallet" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-text-secondary uppercase">Date de Début</label>
                                    <input required value={startDate} onChange={e => setStartDate(e.target.value)} type="datetime-local" className="w-full bg-background border border-white/10 rounded-xl px-4 py-2 text-white focus:border-primary/50 outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-text-secondary uppercase">Date de Fin</label>
                                    <input required value={endDate} onChange={e => setEndDate(e.target.value)} type="datetime-local" className="w-full bg-background border border-white/10 rounded-xl px-4 py-2 text-white focus:border-primary/50 outline-none" />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 accent-primary" />
                                <label htmlFor="isActive" className="text-sm font-bold text-white cursor-pointer">Activer l'événement immédiatement</label>
                            </div>

                            <div className="pt-6 border-t border-white/10 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 font-bold transition-colors">
                                    Annuler
                                </button>
                                <button type="submit" disabled={isSaving} className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-background font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sauvegarder"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
