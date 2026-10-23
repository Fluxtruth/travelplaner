"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createTrip } from "@/lib/firebase/firestore";
import { TripVisibility } from "@/types";
import { AuthModal } from "@/components/auth/AuthModal";
import {
  Compass,
  Sparkles,
  Calendar,
  MapPin,
  ArrowLeft,
  Plus,
  Lock,
  Globe,
  Mail,
  ShieldCheck,
} from "lucide-react";

export default function NewTripPage() {
  const router = useRouter();
  const { user, signInWithGoogle, signInAsGuest } = useAuth();

  const [name, setName] = useState("Boys-Trip nach Prag, Wien und Neustadt Dosse");
  const [description, setDescription] = useState("Roadtrip der Boys nach Prag, Wien und Neustadt (Dosse).");
  const [startDate, setStartDate] = useState("2026-07-10");
  const [endDate, setEndDate] = useState("2026-07-19");
  const [visibility, setVisibility] = useState<TripVisibility>("private");
  const [inviteEmailsText, setInviteEmailsText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const emailList = inviteEmailsText
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.length > 0 && s.includes("@"));

      const tripId = await createTrip(
        user.uid,
        name.trim(),
        description.trim(),
        startDate,
        endDate,
        visibility,
        emailList
      );

      router.push(`/trips/${tripId}`);
    } catch (err) {
      console.warn("Failed to create trip in Firestore:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 w-full">
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Zurück zur Übersicht
      </button>

      <div className="rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 shadow-sm transition-colors">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-200 dark:border-neutral-800">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-500/30">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Neues Reise-Projekt anlegen
            </h1>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Automatisch online gespeichert und für deine Crew synchronisiert.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1.5">
              Reise-Titel *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Boys-Trip nach Prag, Wien und Neustadt Dosse"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1.5">
              Beschreibung & Motto
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Was steht an? Sightseeing, Nachtleben, Roadtrip?"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          {/* Zugangsmanagement / Visibility Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2">
              Zugangsmanagement / Sichtbarkeit
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisibility("private")}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  visibility === "private"
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20"
                    : "border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-950 text-slate-600 dark:text-neutral-400 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs mb-1">
                  <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>🔒 Privat (Empfohlen)</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-snug">
                  Nur eingeladene Freunde haben Zugriff auf Planung und Abstimmung.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setVisibility("public")}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  visibility === "public"
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20"
                    : "border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-950 text-slate-600 dark:text-neutral-400 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs mb-1">
                  <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>🌐 Öffentlich</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-snug">
                  Alle registrierten Google-Nutzer können den Trip sehen.
                </p>
              </button>
            </div>
          </div>

          {/* Invited Emails input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Freunde vorab per E-Mail einladen (optional)
            </label>
            <input
              type="text"
              value={inviteEmailsText}
              onChange={(e) => setInviteEmailsText(e.target.value)}
              placeholder="alex@example.com, ben@example.com"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-1">
              Kommagetrennt. Du kannst auch später jederzeit Einladungslinks teilen.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Startdatum
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Enddatum
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Planned Stops info */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-950/60 border border-slate-200 dark:border-neutral-800">
            <span className="text-xs font-bold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5 mb-2">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              Vorkonfigurierte Route:
            </span>
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-neutral-400 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white font-medium">Berlin</span>
              <span>→</span>
              <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white font-medium">Prag</span>
              <span>→</span>
              <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white font-medium">Wien</span>
              <span>→</span>
              <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white font-medium">Neustadt (Dosse)</span>
              <span>→</span>
              <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white font-medium">Berlin</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? "Wird gespeichert..." : "Reise jetzt anlegen"}</span>
            </button>
          </div>
        </form>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title="Anmeldung erforderlich"
        description="Bitte melde dich an, um Reisen zu erstellen und mit deinen Freunden zu planen."
      />
    </div>
  );
}
