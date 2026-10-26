"use client";

import React, { useState } from "react";
import { TravelOption, OptionCategory, OptionProvider } from "@/types";
import { updateTravelOption, deleteTravelOption } from "@/lib/firebase/firestore";
import { getLinkMetadata, normalizeUrl } from "@/lib/linkPreview";
import confetti from "canvas-confetti";
import {
  X,
  Save,
  Trash2,
  MapPin,
  Euro,
  Link as LinkIcon,
  Image as ImageIcon,
  Sparkles,
  Train,
  Building,
  Utensils,
  Wine,
  Landmark,
  Compass,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

interface EditProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  option: TravelOption;
  onOptionUpdated?: (updated: TravelOption) => void;
  onOptionDeleted?: (optionId: string) => void;
}

const CATEGORY_DEFAULT_IMAGES: Record<OptionCategory, string> = {
  accommodation: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80",
  activity: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&auto=format&fit=crop&q=80",
  transport: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80",
  food: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80",
  nightlife: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=80",
  culture: "https://images.unsplash.com/photo-1513805959324-96eb66ca8713?w=800&auto=format&fit=crop&q=80",
  custom: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=80",
};

export function EditProposalModal({
  isOpen,
  onClose,
  tripId,
  option,
  onOptionUpdated,
  onOptionDeleted,
}: EditProposalModalProps) {
  const [category, setCategory] = useState<OptionCategory>(option.category || "activity");
  const [title, setTitle] = useState(option.title || "");
  const [city, setCity] = useState(option.fromLocation || option.toLocation || "Prag");
  const [priceEstimate, setPriceEstimate] = useState<string>(
    option.priceEstimate !== undefined ? String(option.priceEstimate) : "0"
  );
  const [url, setUrl] = useState(option.externalUrl || "");
  const [imageUrl, setImageUrl] = useState(option.imageUrl || "");
  const [description, setDescription] = useState(option.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!isOpen) return null;

  // Auto detect link metadata
  const linkMeta = url.trim() ? getLinkMetadata(url, category as any) : null;

  // Determine effective preview image
  const effectivePreviewImage =
    imageUrl.trim() ||
    linkMeta?.defaultPreviewImage ||
    CATEGORY_DEFAULT_IMAGES[category] ||
    CATEGORY_DEFAULT_IMAGES.custom;

  // Determine provider
  const getProvider = (): OptionProvider => {
    if (!url.trim()) return option.provider || "custom";
    const d = url.toLowerCase();
    if (d.includes("flixbus")) return "flixbus";
    if (d.includes("bahn") || d.includes("oebb")) return "bahn";
    if (d.includes("booking")) return "booking";
    if (d.includes("airbnb")) return "airbnb";
    if (d.includes("google")) return "google_maps";
    if (d.includes("tripadvisor")) return "tripadvisor";
    return option.provider || "custom";
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const normalizedUrl = url.trim() ? normalizeUrl(url.trim()) : undefined;
    const numPrice = Math.max(0, parseFloat(priceEstimate) || 0);
    const provider = getProvider();

    const updatedOption: TravelOption = {
      ...option,
      title: title.trim(),
      category,
      provider,
      description: description.trim(),
      priceEstimate: numPrice,
      fromLocation: city.trim(),
      toLocation: city.trim(),
      imageUrl: imageUrl.trim() || effectivePreviewImage,
      externalUrl: normalizedUrl,
      updatedAt: new Date().toISOString(),
    };

    // 1. Optimistic update
    if (onOptionUpdated) {
      onOptionUpdated(updatedOption);
    }

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
      colors: ["#3b82f6", "#10b981", "#8b5cf6"],
    });

    onClose();

    // 2. Background Firestore update
    try {
      await updateTravelOption(tripId, option.id, {
        title: title.trim(),
        category,
        provider,
        description: description.trim(),
        priceEstimate: numPrice,
        fromLocation: city.trim(),
        toLocation: city.trim(),
        imageUrl: imageUrl.trim() || effectivePreviewImage,
        externalUrl: normalizedUrl,
      });
    } catch (err) {
      console.warn("Failed to update travel option:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);

    if (onOptionDeleted) {
      onOptionDeleted(option.id);
    }
    onClose();

    try {
      await deleteTravelOption(tripId, option.id);
    } catch (err) {
      console.warn("Failed to delete travel option:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const categories = [
    { id: "accommodation", label: "Unterkunft", icon: <Building className="w-4 h-4 text-blue-500" /> },
    { id: "activity", label: "Aktivität", icon: <Compass className="w-4 h-4 text-purple-500" /> },
    { id: "transport", label: "Transport", icon: <Train className="w-4 h-4 text-emerald-500" /> },
    { id: "food", label: "Kulinarik", icon: <Utensils className="w-4 h-4 text-amber-500" /> },
    { id: "nightlife", label: "Nightlife & Bar", icon: <Wine className="w-4 h-4 text-rose-500" /> },
    { id: "culture", label: "Kultur", icon: <Landmark className="w-4 h-4 text-sky-500" /> },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Vorschlag bearbeiten
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Titel, Bildadresse, Preis oder Details anpassen
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Schließen"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Category Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-2">
              Kategorie
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategory(cat.id as OptionCategory);
                    setImageError(false);
                  }}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    category === cat.id
                      ? "border-blue-500 bg-blue-50/60 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 shadow-xs ring-1 ring-blue-500/20"
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
              Titel / Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Penthouse Apartment Altstadt, Pilsner Urquell Brauerei..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* City & Price */}
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

          {/* Image URL Input & Live Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                Bildadresse / Bild-URL
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl("");
                    setImageError(false);
                  }}
                  className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Standardbild nutzen</span>
                </button>
              )}
            </div>

            <div className="relative">
              <ImageIcon className="absolute left-3.5 top-3 w-4 h-4 text-indigo-500" />
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setImageError(false);
                }}
                placeholder="https://images.unsplash.com/... oder direkte Bildadresse (JPG, PNG, WebP)"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Live Image Preview */}
            <div className="relative h-36 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-neutral-800 bg-slate-950 group">
              <img
                src={imageError ? CATEGORY_DEFAULT_IMAGES[category] : effectivePreviewImage}
                alt="Vorschau"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover brightness-[0.9]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/20">
                  {category}
                </span>
                {imageUrl.trim() && !imageError && (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/90 text-white">
                    Eigenes Bild aktiv
                  </span>
                )}
              </div>

              {imageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 text-center">
                  <div className="flex items-center gap-1.5 text-amber-300 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Bildadresse nicht ladbar – Standardbild wird verwendet</span>
                  </div>
                </div>
              )}

              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-xs">
                <span className="font-bold truncate">{title || "Titel des Eintrags"}</span>
                {parseFloat(priceEstimate) > 0 && (
                  <span className="font-mono font-bold bg-black/60 px-2 py-0.5 rounded-md border border-white/10 shrink-0 ml-2">
                    ~{parseFloat(priceEstimate).toFixed(2)}€
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* External Link */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">
              Link / Website (Booking, Airbnb, Maps, etc.)
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3.5 top-3 w-4 h-4 text-blue-500" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://booking.com/... oder https://airbnb.de/..."
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            {linkMeta && (
              <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1 font-semibold">
                <span>Erkannt:</span>
                <span>{linkMeta.badgeLabel}</span>
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">
              Beschreibung & Notizen
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="z.B. Top Lage im Zentrum, Whirlpool, inklusive Frühstück..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between gap-2 flex-wrap">
            {/* Delete button with confirm state */}
            {confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-sm shadow-rose-500/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? "Wird gelöscht..." : "Wirklich löschen?"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-2.5 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 text-xs font-semibold"
                >
                  Abbrechen
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eintrag löschen</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 font-bold text-xs transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={!title.trim() || isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? "Speichern..." : "Änderungen speichern"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
