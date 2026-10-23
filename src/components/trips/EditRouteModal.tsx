"use client";

import React, { useState, useEffect } from "react";
import { TripStop } from "@/types";
import { RouteEditor } from "./RouteEditor";
import { updateTripStops } from "@/lib/firebase/firestore";
import { X, MapPin, CheckCircle2 } from "lucide-react";

interface EditRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  initialStops?: (TripStop | string)[];
  onStopsUpdated?: (newStops: TripStop[]) => void;
}

export function EditRouteModal({
  isOpen,
  onClose,
  tripId,
  initialStops,
  onStopsUpdated,
}: EditRouteModalProps) {
  const [stops, setStops] = useState<TripStop[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!initialStops || !Array.isArray(initialStops) || initialStops.length === 0) {
      setStops([
        { id: "s-1", city: "Berlin", country: "Deutschland", order: 0 },
        { id: "s-2", city: "Prag", country: "Tschechien", order: 1 },
        { id: "s-3", city: "Wien", country: "Österreich", order: 2 },
        { id: "s-4", city: "Neustadt (Dosse)", country: "Deutschland", order: 3 },
        { id: "s-5", city: "Berlin", country: "Deutschland", order: 4 },
      ]);
    } else {
      const normalized: TripStop[] = initialStops.map((s, idx) => {
        if (typeof s === "string") {
          return { id: `stop-${idx}-${Date.now()}`, city: s, order: idx };
        }
        return { ...s, order: s.order ?? idx };
      });
      setStops(normalized);
    }
  }, [initialStops, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!tripId || stops.length === 0) return;
    setIsSaving(true);
    try {
      await updateTripStops(tripId, stops);
      if (onStopsUpdated) {
        onStopsUpdated(stops);
      }
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 600);
    } catch (err) {
      console.error("Failed to update route stops:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto transition-colors">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-200 dark:border-neutral-800">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-500/20 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Reiseroute anpassen
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Stationen und Zwischenstopps bearbeiten, verschieben oder ergänzen
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 border border-emerald-200 dark:border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Route erfolgreich aktualisiert!</span>
          </div>
        )}

        <RouteEditor
          stops={stops}
          onChange={setStops}
          isSaving={isSaving}
          onSave={handleSave}
          canEdit={true}
        />
      </div>
    </div>
  );
}
