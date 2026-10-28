"use client";

import React, { useState, useEffect } from "react";
import { TripStop } from "@/types";
import { RouteEditor } from "./RouteEditor";
import { updateTripDetails } from "@/lib/firebase/firestore";
import { X, MapPin, CheckCircle2, Calendar, ShieldAlert } from "lucide-react";

interface EditRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  initialStops?: (TripStop | string)[];
  initialStartDate?: string;
  initialEndDate?: string;
  isOwner?: boolean;
  onStopsUpdated?: (newStops: TripStop[], startDate?: string, endDate?: string) => void;
}

export function EditRouteModal({
  isOpen,
  onClose,
  tripId,
  initialStops,
  initialStartDate = "",
  initialEndDate = "",
  isOwner = true,
  onStopsUpdated,
}: EditRouteModalProps) {
  const [stops, setStops] = useState<TripStop[]>([]);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setStartDate(initialStartDate || "");
    setEndDate(initialEndDate || "");

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
  }, [initialStops, initialStartDate, initialEndDate, isOpen]);

  if (!isOpen) return null;

  // Strict owner security gate: Non-owners cannot edit the route
  if (!isOwner) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl p-6 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Nur für Reiseleiter (Owner)
          </h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mb-4 leading-relaxed">
            Die Reiseroute und Grundstruktur (Städte und Tage) kann ausschließlich vom Ersteller der Reise angepasst werden.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-neutral-950 font-bold text-xs"
          >
            Verstanden
          </button>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!tripId || stops.length === 0) return;
    setIsSaving(true);
    try {
      await updateTripDetails(tripId, {
        stops,
        startDate: startDate.trim(),
        endDate: endDate.trim(),
      });
      if (onStopsUpdated) {
        onStopsUpdated(stops, startDate.trim(), endDate.trim());
      }
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 600);
    } catch (err) {
      console.error("Failed to update route stops and dates:", err);
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
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Reiseroute & Tage anpassen
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                Owner
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Reisezeitraum, Tage und Zwischenstopps für deine Crew konfigurieren
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 border border-emerald-200 dark:border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Route und Reisetage erfolgreich aktualisiert!</span>
          </div>
        )}

        {/* Reisedaten (Start- & Enddatum bestimmen die Reisetage) */}
        <div className="mb-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800">
          <span className="block text-xs font-bold text-slate-800 dark:text-neutral-200 mb-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            Reisezeitraum & Tage festlegen
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-neutral-400 mb-1">
                Startdatum
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-neutral-400 mb-1">
                Enddatum
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Zwischenstopps / Reiseroute */}
        <RouteEditor
          stops={stops}
          onChange={setStops}
          isSaving={isSaving}
          onSave={handleSave}
          canEdit={isOwner}
        />
      </div>
    </div>
  );
}
