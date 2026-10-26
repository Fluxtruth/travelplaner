"use client";

import React, { useState } from "react";
import { TripStop } from "@/types";
import {
  MapPin,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  Sparkles,
  RotateCcw,
  Check,
  Edit2,
} from "lucide-react";

interface RouteEditorProps {
  stops: TripStop[];
  onChange: (stops: TripStop[]) => void;
  isSaving?: boolean;
  onSave?: () => Promise<void> | void;
  canEdit?: boolean;
}

const POPULAR_CITIES = [
  { city: "Berlin", country: "Deutschland" },
  { city: "Prag", country: "Tschechien" },
  { city: "Wien", country: "Österreich" },
  { city: "Nürnberg", country: "Deutschland" },
  { city: "Budapest", country: "Ungarn" },
  { city: "München", country: "Deutschland" },
  { city: "Hamburg", country: "Deutschland" },
  { city: "Amsterdam", country: "Niederlande" },
  { city: "Bratislava", country: "Slowakei" },
  { city: "Krakau", country: "Polen" },
];

export function RouteEditor({
  stops,
  onChange,
  isSaving = false,
  onSave,
  canEdit = true,
}: RouteEditorProps) {
  const [newCity, setNewCity] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [editingStopId, setEditingStopId] = useState<string | null>(null);
  const [editCityDraft, setEditCityDraft] = useState("");

  const handleAddStop = (cityToAdd?: string, countryToAdd?: string) => {
    const city = (cityToAdd || newCity).trim();
    if (!city) return;

    const country = (countryToAdd || newCountry).trim();
    const newStop: TripStop = {
      id: `stop-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      city,
      country: country || undefined,
      order: stops.length,
    };

    const updated = [...stops, newStop].map((s, idx) => ({ ...s, order: idx }));
    onChange(updated);
    setNewCity("");
    setNewCountry("");
  };

  const handleRemoveStop = (id: string) => {
    const updated = stops.filter((s) => s.id !== id).map((s, idx) => ({ ...s, order: idx }));
    onChange(updated);
  };

  const handleMoveStop = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= stops.length) return;

    const copy = [...stops];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    const updated = copy.map((s, idx) => ({ ...s, order: idx }));
    onChange(updated);
  };

  const handleStartEdit = (stop: TripStop) => {
    setEditingStopId(stop.id);
    setEditCityDraft(stop.city);
  };

  const handleSaveEdit = (stopId: string) => {
    const trimmed = editCityDraft.trim();
    if (trimmed) {
      const updated = stops.map((s) => (s.id === stopId ? { ...s, city: trimmed } : s));
      onChange(updated);
    }
    setEditingStopId(null);
  };

  const handleResetDefault = () => {
    const defaultStops: TripStop[] = [
      { id: "stop-1", city: "Berlin", country: "Deutschland", order: 0 },
      { id: "stop-2", city: "Prag", country: "Tschechien", order: 1 },
      { id: "stop-3", city: "Wien", country: "Österreich", order: 2 },
      { id: "stop-4", city: "Neustadt (Dosse)", country: "Deutschland", order: 3 },
      { id: "stop-5", city: "Berlin", country: "Deutschland", order: 4 },
    ];
    onChange(defaultStops);
  };

  return (
    <div className="space-y-4">
      {/* Visual Route Preview Breadcrumbs */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-neutral-950/70 border border-slate-200 dark:border-neutral-800 transition-colors">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            <span>Aktuelle Reiseroute ({stops.length} {stops.length === 1 ? "Stopp" : "Stopps"}):</span>
          </span>
          {canEdit && (
            <button
              type="button"
              onClick={handleResetDefault}
              className="text-[11px] text-slate-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 font-medium flex items-center gap-1 transition-colors"
              title="Auf Standardroute zurücksetzen"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Standard</span>
            </button>
          )}
        </div>

        {stops.length > 0 ? (
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {stops.map((stop, index) => (
              <React.Fragment key={stop.id}>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-xs font-bold text-slate-900 dark:text-white shadow-sm">
                  <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-mono flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <span>{stop.city}</span>
                </span>
                {index < stops.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-600 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-neutral-500 italic">
            Noch keine Stopps definiert. Füge unten Städte hinzu!
          </p>
        )}
      </div>

      {/* Interactive Stop List & Configuration */}
      {canEdit && (
        <div className="space-y-2.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
            Reise-Stationen konfigurieren
          </label>

          <div className="space-y-2">
            {stops.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-neutral-800 text-center">
                <p className="text-xs text-slate-400 dark:text-neutral-500">
                  Noch keine Stationen hinzugefügt. Trage unten deine Zwischenstopps ein.
                </p>
              </div>
            ) : (
              stops.map((stop, index) => {
                const isFirst = index === 0;
                const isLast = index === stops.length - 1;
                const isEditing = editingStopId === stop.id;

                return (
                  <div
                    key={stop.id}
                    className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-sm transition-all hover:border-slate-300 dark:hover:border-neutral-700"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>

                      {isEditing ? (
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <input
                            type="text"
                            value={editCityDraft}
                            onChange={(e) => setEditCityDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit(stop.id);
                              if (e.key === "Escape") setEditingStopId(null);
                            }}
                            autoFocus
                            className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-neutral-950 border border-blue-500 text-xs font-bold text-slate-900 dark:text-white focus:outline-none flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(stop.id)}
                            className="p-1 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                            title="Speichern"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="min-w-0 flex-1 flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {stop.city}
                          </span>
                          {stop.country && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 font-medium">
                              {stop.country}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleStartEdit(stop)}
                            className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="Stadtname bearbeiten"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Actions: Reorder and Delete */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => handleMoveStop(index, "up")}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        title="Nach oben verschieben"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => handleMoveStop(index, "down")}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        title="Nach unten verschieben"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveStop(stop.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors ml-0.5 cursor-pointer"
                        title="Station entfernen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add Stop Input */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddStop();
                }
              }}
              placeholder="Stadt / Zwischenstopp hinzufügen..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="button"
              disabled={!newCity.trim()}
              onClick={() => handleAddStop()}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Hinzufügen</span>
            </button>
          </div>

          {/* Quick suggestions pills */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-neutral-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Vorschläge:
            </span>
            {POPULAR_CITIES.map((item) => (
              <button
                key={item.city}
                type="button"
                onClick={() => handleAddStop(item.city, item.country)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 hover:text-blue-600 dark:text-neutral-300 text-[11px] font-medium border border-slate-200 dark:border-neutral-700 transition-colors"
              >
                + {item.city}
              </button>
            ))}
          </div>

          {/* Save Button for Edit Mode */}
          {onSave && (
            <div className="pt-3 flex justify-end">
              <button
                type="button"
                disabled={isSaving}
                onClick={onSave}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSaving ? "Wird gespeichert..." : "Route speichern"}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
