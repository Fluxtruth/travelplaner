"use client";

import React, { useState } from "react";
import { TimelineItem, ActivityType } from "@/types";
import { updateTimelineItem } from "@/lib/firebase/firestore";
import { getLinkMetadata, getBausteinImage, normalizeUrl } from "@/lib/linkPreview";
import { Category3DIcon } from "./Category3DIcon";
import {
  X,
  Clock,
  MapPin,
  AlignLeft,
  Tag,
  Link as LinkIcon,
  Image as ImageIcon,
  Check,
  Sparkles,
  Layers,
  Save,
} from "lucide-react";

interface EditActivityModalProps {
  tripId: string;
  item: TimelineItem;
  availableDays?: Array<{ id: string; label: string }>;
  onClose: () => void;
  onSave?: (updatedItem: TimelineItem) => void;
}

export function EditActivityModal({
  tripId,
  item,
  availableDays = [],
  onClose,
  onSave,
}: EditActivityModalProps) {
  const [selectedDayId, setSelectedDayId] = useState(item.dayId || "pool");
  const [title, setTitle] = useState(item.title || "");
  const [type, setType] = useState<ActivityType>(item.type || "activity");
  const [time, setTime] = useState(item.time || "");
  const [location, setLocation] = useState(item.location || "");
  const [url, setUrl] = useState(item.url || "");
  const [customImageUrl, setCustomImageUrl] = useState(item.imageUrl || "");
  const [notes, setNotes] = useState(item.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories: Array<{ id: ActivityType; label: string }> = [
    { id: "restaurant", label: "Restaurant / Food" },
    { id: "bar", label: "Bar & Drinks" },
    { id: "activity", label: "Aktivität / Action" },
    { id: "culture", label: "Kultur & Museen" },
    { id: "accommodation", label: "Unterkunft" },
    { id: "transport", label: "Transport" },
    { id: "timeslot", label: "Zeitslot" },
  ];

  const linkMeta = url.trim() ? getLinkMetadata(url, type) : null;
  const effectiveImageUrl = customImageUrl.trim() || getBausteinImage(customImageUrl, url, type);
  const timePresets = ["09:00", "12:30", "15:00", "18:30", "21:00"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const normalizedUrl = url.trim() ? normalizeUrl(url) : undefined;
      const updates = {
        title: title.trim(),
        type,
        dayId: selectedDayId,
        time: time.trim() || undefined,
        location: location.trim() || undefined,
        url: normalizedUrl,
        imageUrl: effectiveImageUrl || undefined,
        notes: notes.trim() || undefined,
      };

      await updateTimelineItem(tripId, item.id, updates);

      if (onSave) {
        onSave({
          ...item,
          ...updates,
          updatedAt: new Date().toISOString(),
        });
      }
      onClose();
    } catch (err) {
      console.warn("Error updating activity:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-2xl my-8 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/15 flex items-center justify-center border border-blue-200 dark:border-blue-500/30 shrink-0">
              <Category3DIcon type={type} size={36} animateOnHover={false} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Baustein befüllen / bearbeiten
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Passe Titel, Details, Fotos & Links nach deinen Wünschen an
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Schließen"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Target column (Kalendertag) */}
          {availableDays.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                Kalendertag / Spalte
              </label>
              <select
                value={selectedDayId}
                onChange={(e) => setSelectedDayId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="pool">🧩 Bausteine-Pool (Ideen & Vorrat)</option>
                {availableDays
                  .filter((d) => d.id !== "pool")
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      📅 {d.label}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Category Selector with 3D Icons */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Kategorie anpassen
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setType(cat.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                    type === cat.id
                      ? "border-blue-500 bg-blue-50/80 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold ring-2 ring-blue-500/20"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <Category3DIcon type={cat.id} size={24} animateOnHover={false} />
                  <span className="truncate text-[11px] font-semibold">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Titel / Bezeichnung *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Brauereiführung Pilsner Urquell, Restaurant Lokal Dlouha..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Time Picker & Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Uhrzeit / Zeitfenster
              </label>
              <span className="text-[10px] text-slate-400">Gruppe kann Zeiten vorschlagen</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="14:00 oder 14:00 - 16:30"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
              <div className="hidden sm:flex gap-1">
                {timePresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTime(preset)}
                    className="px-2 py-1 text-[11px] rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors font-mono"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Link URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
              Link / Google Maps / Buchung
            </label>
            <div className="relative">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://maps.google.com/... oder https://booking.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition-colors"
              />
              {linkMeta && (
                <span className="absolute right-2.5 top-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                  {linkMeta.badgeLabel}
                </span>
              )}
            </div>
          </div>

          {/* Location & Image Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Ort / Treffpunkt
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="z.B. Karlsbrücke / Altstadt"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                Vorschaubild (optional URL)
              </label>
              <input
                type="text"
                value={customImageUrl}
                onChange={(e) => setCustomImageUrl(e.target.value)}
                placeholder="https://images... (oder leer lassen)"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Live Thumbnail Preview */}
          {effectiveImageUrl && (
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <img
                src={effectiveImageUrl}
                alt="Vorschau"
                className="w-16 h-12 object-cover rounded-xl border border-slate-200 dark:border-slate-800 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  Vorschaubild aktiv
                </span>
                <p className="text-[10px] text-slate-400 truncate">
                  Wird auf der Karte in der Kalenderansicht angezeigt
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
              Notizen / Tipps für die Gruppe
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reservierung nötig, Tickets vorab sichern..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          {/* Submit / Cancel Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 text-xs font-semibold transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? "Wird gespeichert..." : "Änderungen speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
