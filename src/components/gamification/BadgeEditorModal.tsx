"use client";

import React, { useState } from "react";
import { BadgeAchievement } from "@/types";
import { X, Sparkles, Award, Check } from "lucide-react";

interface BadgeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (badge: BadgeAchievement) => Promise<void> | void;
  initialBadge?: BadgeAchievement | null;
}

const PRESET_ICONS = [
  "🍺", "👑", "🕶️", "🌯", "💤", "🚕", "🌭", "🥩", 
  "🏆", "🔥", "🎯", "🚀", "📸", "🎸", "🌅", "🕺", 
  "🎲", "🍔", "✈️", "🧭", "🏎️", "🎤", "☕", "🏖️",
  "🍕", "🍻", "⚓", "🎉", "⚡", "🏅", "🧗", "🏰",
];

const CATEGORIES: { value: BadgeAchievement["category"]; label: string; desc: string }[] = [
  { value: "social", label: "Social & Fun", desc: "Party, Insider, lustige Missgeschicke" },
  { value: "explorer", label: "Entdecker & Action", desc: "Touren, Sightseeing & Essen" },
  { value: "checkin", label: "Aktivitäten & Stopps", desc: "Besondere Aktivitäten des Tages" },
  { value: "streak", label: "Ausdauer & Streak", desc: "Meilensteine über mehrere Tage" },
];

export function BadgeEditorModal({
  isOpen,
  onClose,
  onSave,
  initialBadge,
}: BadgeEditorModalProps) {
  const isEditing = Boolean(initialBadge);

  const [title, setTitle] = useState(initialBadge?.title || "");
  const [description, setDescription] = useState(initialBadge?.description || "");
  const [icon, setIcon] = useState(initialBadge?.icon || "🏆");
  const [category, setCategory] = useState<BadgeAchievement["category"]>(
    initialBadge?.category || "social"
  );
  const [points, setPoints] = useState<number>(initialBadge?.points ?? 75);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Bitte gib einen Titel für den Badge ein.");
      return;
    }
    if (!description.trim()) {
      setError("Bitte gib eine kurze Beschreibung ein.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const badgePayload: BadgeAchievement = {
      id: initialBadge?.id || `badge-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      description: description.trim(),
      icon: icon.trim() || "🏆",
      category,
      points: Number(points) || 50,
    };

    try {
      await onSave(badgePayload);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Fehler beim Speichern des Badges");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl border border-amber-500/30">
              {icon}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{isEditing ? "Badge bearbeiten" : "Neuen Reise-Badge anlegen"}</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Nur für dich als Trip-Owner anpassbar • Live für alle Teilnehmer
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5 uppercase tracking-wider">
              Badge-Titel *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. DJ der Truppe, Kater-König, Erster am Buffet"
              maxLength={40}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 font-medium"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5 uppercase tracking-wider">
              Beschreibung & Voraussetzung *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="z.B. Hat im Taxi die besten Songs aufgelegt oder morgens die erste Runde Kaffee geholt."
              rows={2}
              maxLength={140}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 font-medium resize-none"
              required
            />
          </div>

          {/* Icon Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider">
                Icon / Emoji
              </label>
              <span className="text-[11px] text-slate-400">Wähle oder tippe beliebiges Emoji</span>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-8 gap-1.5 p-2 rounded-2xl bg-slate-100/70 dark:bg-neutral-800/60 border border-slate-200 dark:border-neutral-700 mb-2">
              {PRESET_ICONS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setIcon(preset)}
                  className={`h-9 rounded-xl flex items-center justify-center text-lg transition-transform active:scale-95 cursor-pointer ${
                    icon === preset
                      ? "bg-amber-400 text-slate-950 scale-110 shadow-sm ring-2 ring-amber-400/40"
                      : "hover:bg-white dark:hover:bg-neutral-700"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="Eigenes Emoji z.B. 🥨"
                maxLength={4}
                className="w-24 px-3 py-2 text-center text-lg rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-900 dark:text-white font-mono"
              />
              <span className="text-xs text-slate-500 dark:text-neutral-400">
                Aktuelles Icon: <span className="text-xl align-middle ml-1">{icon}</span>
              </span>
            </div>
          </div>

          {/* Category & Points in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5 uppercase tracking-wider">
                Kategorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BadgeAchievement["category"])}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5 uppercase tracking-wider">
                Erfahrungs-Punkte (XP)
              </label>
              <div className="flex items-center gap-1.5">
                {[25, 50, 75, 100, 150].map((val) => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => setPoints(val)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      points === val
                        ? "bg-amber-400 text-slate-950 border-amber-400 shadow-xs"
                        : "bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 border-slate-200 dark:border-neutral-700 hover:bg-slate-200"
                    }`}
                  >
                    +{val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="pt-2">
            <span className="block text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
              Vorschau in der App
            </span>
            <div className="p-4 rounded-2xl border border-amber-300/80 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-700/50 shadow-xs flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border bg-amber-100 dark:bg-amber-500/20 border-amber-300 text-amber-900 shadow-sm">
                {icon || "🏆"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {title || "Titel des Badges"}
                  </h4>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    +{points} XP
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-snug">
                  {description || "Hier steht die Beschreibung der Auszeichnung..."}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    ✓ Freigeschaltet
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {CATEGORIES.find((c) => c.value === category)?.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{isSubmitting ? "Speichern..." : isEditing ? "Änderungen übernehmen" : "Badge hinzufügen"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
