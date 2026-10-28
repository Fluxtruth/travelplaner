"use client";

import React, { useState } from "react";
import { ActivityType } from "@/types";
import { addTimelineItem } from "@/lib/firebase/firestore";
import { getLinkMetadata, getBausteinImage, normalizeUrl } from "@/lib/linkPreview";
import { Category3DIcon } from "./Category3DIcon";
import {
  X,
  Plus,
  Clock,
  MapPin,
  AlignLeft,
  Tag,
  Link as LinkIcon,
  Image as ImageIcon,
  Sparkles,
  Layers,
  Eye,
  EyeOff,
  Coins,
} from "lucide-react";

interface AddActivityModalProps {
  tripId: string;
  dayId: string;
  city: string;
  currentUserId: string;
  currentUserName?: string;
  availableDays?: Array<{ id: string; label: string }>;
  onClose: () => void;
}

export function AddActivityModal({
  tripId,
  dayId: initialDayId,
  city: initialCity,
  currentUserId,
  currentUserName,
  availableDays = [],
  onClose,
}: AddActivityModalProps) {
  const [selectedDayId, setSelectedDayId] = useState(initialDayId);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ActivityType>("activity");
  const [time, setTime] = useState("");
  const [cost, setCost] = useState("");
  const [location, setLocation] = useState("");
  const [url, setUrl] = useState("");
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [showPreviewImage, setShowPreviewImage] = useState(true);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Categories configuration with icons & labels
  const categories: Array<{ id: ActivityType; label: string }> = [
    { id: "restaurant", label: "Restaurant" },
    { id: "cafe", label: "Café" },
    { id: "bar", label: "Bar & Drinks" },
    { id: "activity", label: "Aktivität" },
    { id: "culture", label: "Kultur" },
    { id: "accommodation", label: "Unterkunft" },
    { id: "transport", label: "Transport" },
    { id: "timeslot", label: "Zeitslot" },
  ];

  // Derive thumbnail preview
  const linkMeta = url.trim() ? getLinkMetadata(url, type) : null;
  const candidateImage = customImageUrl.trim() || (url.trim() ? getBausteinImage(undefined, url, type) : null);
  const effectiveImageUrl = showPreviewImage ? candidateImage : null;
  const timePresets = ["09:00", "12:30", "15:00", "18:30", "21:00"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const normalizedUrl = url.trim() ? normalizeUrl(url) : "";
      const finalImageUrl = showPreviewImage
        ? (customImageUrl.trim() || (url.trim() ? getBausteinImage(undefined, url, type) : "") || "")
        : "none";

      const parsedCost = cost.trim() !== "" ? parseFloat(cost.replace(",", ".")) : undefined;
      const validCost = parsedCost !== undefined && !isNaN(parsedCost) && parsedCost >= 0 ? parsedCost : undefined;

      await addTimelineItem(tripId, {
        dayId: selectedDayId,
        stopCity: initialCity || "Reisestopp",
        title: title.trim(),
        type,
        time: time.trim() || undefined,
        cost: validCost,
        location: location.trim() || undefined,
        url: normalizedUrl || undefined,
        imageUrl: finalImageUrl === "none" ? undefined : (finalImageUrl || undefined),
        notes: notes.trim() || undefined,
        order: Date.now(),
        createdBy: currentUserId,
        createdByName: currentUserName,
      });
      onClose();
    } catch (err) {
      console.warn("Error adding activity:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[92dvh] sm:max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/15 flex items-center justify-center border border-blue-200 dark:border-blue-500/30 shrink-0">
              <Category3DIcon type={type} size={26} animateOnHover={false} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                Neuen Baustein hinzufügen
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Für Kalender &amp; Timeline-Planung
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body & Fixed Footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-3.5 space-y-3 overscroll-contain">
            {/* Title Input */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Titel / Bezeichnung *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z.B. Brauereiführung Pilsner Urquell, Restaurant Lokal..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Category Selector with Compact 3D Icons */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-slate-400" />
                Kategorie
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setType(cat.id)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl border text-left transition-all ${
                      type === cat.id
                        ? "border-blue-500 bg-blue-50/80 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold ring-1 ring-blue-500/20"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <Category3DIcon type={cat.id} size={20} animateOnHover={false} />
                    <span className="truncate text-[11px] font-semibold">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Target column, Time & Price in 3-Column Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {availableDays.length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-slate-400" />
                    Zielort / Kalenderspalte
                  </label>
                  <select
                    value={selectedDayId}
                    onChange={(e) => setSelectedDayId(e.target.value)}
                    className="w-full px-2.5 py-1.5 sm:py-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="pool">🧩 Bausteine-Pool (Ideen)</option>
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

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Uhrzeit / Zeitfenster
                  </label>
                  <span className="text-[9px] text-slate-400">optional</span>
                </div>
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="14:00 oder 14:00 - 16:30"
                  className="w-full px-2.5 py-1.5 sm:py-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Coins className="w-3 h-3 text-emerald-500" />
                    Preis / Kosten
                  </label>
                  <span className="text-[9px] text-slate-400">optional</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="z.B. 25"
                    className="w-full px-2.5 py-1.5 sm:py-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-blue-500 transition-colors pr-6"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-neutral-500 pointer-events-none">
                    €
                  </span>
                </div>
              </div>
            </div>

            {/* Ort & Link in 2-Column Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  Ort / Treffpunkt
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="z.B. Karlsbrücke / Altstadt"
                  className="w-full px-2.5 py-1.5 sm:py-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <LinkIcon className="w-3 h-3 text-slate-400" />
                  Link / Google Maps / Buchung
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://maps.google.com/..."
                    className="w-full px-2.5 py-1.5 sm:py-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition-colors pr-16"
                  />
                  {linkMeta && (
                    <span className="absolute right-1.5 top-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                      {linkMeta.badgeLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Vorschaubild Sektion mit Ein/Aus-Schalter */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3 h-3 text-slate-400" />
                  Vorschaubild (Thumbnail)
                </label>

                {/* Toggle-Button: Vorschaubild an / aus */}
                <button
                  type="button"
                  onClick={() => setShowPreviewImage((prev) => !prev)}
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                    showPreviewImage
                      ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700/60"
                      : "bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 border border-slate-200 dark:border-neutral-700"
                  }`}
                  title={showPreviewImage ? "Vorschaubild ausschalten" : "Vorschaubild aktivieren"}
                >
                  {showPreviewImage ? (
                    <>
                      <Eye className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Bild aktiv</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-2.5 h-2.5 text-slate-400" />
                      <span>Bild aus</span>
                    </>
                  )}
                </button>
              </div>

              {showPreviewImage ? (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="Eigene Bild-URL einfügen (optional, sonst automatisch)"
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  />

                  {effectiveImageUrl ? (
                    <div className="p-1.5 sm:p-2 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={effectiveImageUrl}
                          alt="Vorschau"
                          className="w-12 h-9 object-cover rounded-lg border border-slate-200 dark:border-slate-800 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
                            Vorschau aktiv
                          </span>
                          <p className="text-[9px] text-slate-400 truncate">
                            Wird in der Kalenderkarte dargestellt
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowPreviewImage(false)}
                        className="px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900/50 transition-colors shrink-0 cursor-pointer"
                      >
                        Ausblenden
                      </button>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 dark:text-neutral-500">
                      Trage oben einen Link oder eine Bild-URL ein, um automatisch ein Bild zu laden.
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-300 dark:border-neutral-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400 text-[11px]">
                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                    <span>Kein Bild (kompakte Textansicht)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPreviewImage(true)}
                    className="px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-[10px] font-semibold border border-blue-200 dark:border-blue-500/20 transition-colors cursor-pointer"
                  >
                    Aktivieren
                  </button>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <AlignLeft className="w-3 h-3 text-slate-400" />
                Notizen / Tipps für die Gruppe
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reservierung nötig, Tickets vorab sichern..."
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Fixed Footer: Submit / Cancel Actions */}
          <div className="flex items-center justify-end gap-2.5 px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Wird gespeichert..." : "Baustein erstellen"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
