"use client";

import React, { useState } from "react";
import { TravelOption, OptionCategory, OptionProvider } from "@/types";
import { addTravelOption, castVote } from "@/lib/firebase/firestore";
import { getLinkMetadata, normalizeUrl } from "@/lib/linkPreview";
import confetti from "canvas-confetti";
import {
  X,
  Plus,
  Link as LinkIcon,
  MapPin,
  Euro,
  Sparkles,
  Train,
  Building,
  Utensils,
  Wine,
  Landmark,
  Compass,
  Image as ImageIcon,
} from "lucide-react";

interface AddProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  currentUserId: string;
  onProposalAdded?: (option: TravelOption) => void;
}

export function AddProposalModal({
  isOpen,
  onClose,
  tripId,
  currentUserId,
  onProposalAdded,
}: AddProposalModalProps) {
  const [category, setCategory] = useState<OptionCategory>("activity");
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("Prag");
  const [priceEstimate, setPriceEstimate] = useState<string>("25");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Auto detect link metadata and preview image
  const linkMeta = url.trim() ? getLinkMetadata(url, category as any) : null;
  const previewImage = customImageUrl.trim() || linkMeta?.defaultPreviewImage || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=80";

  // Determine provider from domain or category
  const getProviderFromMeta = (): OptionProvider => {
    if (!linkMeta) return "custom";
    const d = linkMeta.domain.toLowerCase();
    if (d.includes("flixbus")) return "flixbus";
    if (d.includes("bahn") || d.includes("oebb")) return "bahn";
    if (d.includes("booking")) return "booking";
    if (d.includes("airbnb")) return "airbnb";
    if (d.includes("google")) return "google_maps";
    if (d.includes("tripadvisor")) return "tripadvisor";
    return "custom";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const localId = `opt-${Date.now()}`;
    const normalizedUrl = url.trim() ? normalizeUrl(url.trim()) : undefined;
    const numPrice = parseFloat(priceEstimate) || 0;
    const provider = getProviderFromMeta();

    const createdOpt: TravelOption = {
      id: localId,
      tripId,
      category,
      provider,
      title: title.trim(),
      description: description.trim() || `Vorgeschlagen von der Crew für ${city}`,
      priceEstimate: numPrice,
      currency: "EUR",
      fromLocation: city,
      toLocation: city,
      imageUrl: previewImage,
      externalUrl: normalizedUrl,
      createdBy: currentUserId,
      yesVotes: 1,
      noVotes: 0,
      createdAt: new Date().toISOString(),
    };

    // 1. Instant optimistic callback to grid
    if (onProposalAdded) {
      onProposalAdded(createdOpt);
    }

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#10b981", "#3b82f6", "#f59e0b", "#ec4899"],
    });

    onClose();

    // 2. Background Firestore synchronization
    try {
      const newOptionId = await addTravelOption(tripId, {
        category,
        provider,
        title: title.trim(),
        description: description.trim() || `Vorgeschlagen von der Crew für ${city}`,
        priceEstimate: numPrice,
        currency: "EUR",
        fromLocation: city,
        toLocation: city,
        imageUrl: previewImage,
        externalUrl: normalizedUrl,
        createdBy: currentUserId,
      });

      try {
        await castVote(tripId, newOptionId, currentUserId, "yes");
      } catch (err) {
        // Non-blocking
      }
    } catch (err) {
      console.warn("Firestore proposal sync:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { id: "activity", label: "Aktivität", icon: <Compass className="w-4 h-4 text-purple-500" /> },
    { id: "transport", label: "Transport", icon: <Train className="w-4 h-4 text-emerald-500" /> },
    { id: "accommodation", label: "Unterkunft", icon: <Building className="w-4 h-4 text-blue-500" /> },
    { id: "food", label: "Kulinarik", icon: <Utensils className="w-4 h-4 text-amber-500" /> },
    { id: "nightlife", label: "Nightlife & Bar", icon: <Wine className="w-4 h-4 text-rose-500" /> },
    { id: "culture", label: "Kultur", icon: <Landmark className="w-4 h-4 text-sky-500" /> },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Neuen Reise-Vorschlag einreichen
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Die Crew kann direkt darauf up- oder downvoten.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Category Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-2">
              Kategorie wählen
            </label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id as OptionCategory)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    category === cat.id
                      ? "border-blue-500 bg-blue-50/60 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 shadow-xs"
                      : "border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-950/40 text-slate-600 dark:text-neutral-400 hover:border-slate-300"
                  }`}
                >
                  {cat.icon}
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">
              Titel / Idee <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Pilsner Urquell Brauereitour, Penthouse Airbnb, Cloud 9 Sky Bar..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* City / Stop & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">
                Ort / Stopp
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="z.B. Prag, Wien, Berlin..."
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">
                Geschätzter Preis p.P. (€)
              </label>
              <div className="relative">
                <Euro className="absolute left-3.5 top-3 w-4 h-4 text-emerald-500" />
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={priceEstimate}
                  onChange={(e) => setPriceEstimate(e.target.value)}
                  placeholder="25"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* External Link */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">
              Link / Website (Maps, Booking, Airbnb, Tour)
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3.5 top-3 w-4 h-4 text-blue-500" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://maps.google.com/... oder https://airbnb.de/..."
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            {linkMeta && (
              <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                <span>Erkannt:</span>
                <span className="font-semibold">{linkMeta.badgeLabel}</span>
              </p>
            )}
          </div>

          {/* Image URL & Preview */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
              Bildadresse / Bild-URL (optional)
            </label>
            <div className="relative">
              <ImageIcon className="absolute left-3.5 top-3 w-4 h-4 text-indigo-500" />
              <input
                type="url"
                value={customImageUrl}
                onChange={(e) => setCustomImageUrl(e.target.value)}
                placeholder="https://... Bild-URL für tatsächliches Bild einfügen"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="relative h-28 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-950">
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 backdrop-blur-md text-white">
                {category.toUpperCase()} • {city}
              </div>
            </div>
          </div>

          {/* Description / Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">
              Beschreibung & Warum die Crew dafür sein sollte
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="z.B. Top Lage in der Altstadt, inklusive Frühstück & Dachterrasse..."
              className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 font-bold text-xs transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? "Wird gespeichert..." : "Idee einreichen"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
