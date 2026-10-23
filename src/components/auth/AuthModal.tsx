"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { X, LogIn, Sparkles, User, ShieldCheck, AlertCircle } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  title = "Anmelden bei Boystrip",
  description = "Melde dich mit Google an, um Reisen mit deinen Freunden in Echtzeit zu planen und abzustimmen.",
}: AuthModalProps) {
  const { signInWithGoogle, signInAsGuest } = useAuth();
  const [guestName, setGuestName] = useState("");
  const [showGuestInput, setShowGuestInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      if (err?.code === "auth/popup-closed-by-user") {
        setError("Das Anmeldefenster wurde geschlossen.");
      } else if (err?.code === "auth/unauthorized-domain") {
        setError("Domain noch nicht autorisiert in Firebase Auth.");
      } else {
        setError(err?.message || "Fehler bei der Google-Anmeldung.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInAsGuest(guestName.trim() || undefined);
      onClose();
    } catch (err: any) {
      console.error("Guest sign-in error:", err);
      setError("Fehler beim Gast-Login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/95 backdrop-blur-2xl p-7 shadow-2xl transition-colors">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-xl shadow-blue-500/20 mb-3">
            <div className="w-full h-full bg-white dark:bg-neutral-950 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-blue-600 dark:text-cyan-400" />
            </div>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1.5 max-w-sm leading-relaxed">
            {description}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-300">
            <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
            <p className="leading-snug">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-50 dark:hover:bg-neutral-100 text-slate-900 dark:text-neutral-950 font-bold text-sm border border-slate-200 dark:border-transparent shadow-lg shadow-slate-200/50 dark:shadow-white/10 active:scale-95 transition-all disabled:opacity-50"
          >
            {/* Google SVG Logo */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{loading ? "Verbinde mit Google..." : "Mit Google anmelden"}</span>
          </button>

          {/* Divider */}
          <div className="relative py-2 flex items-center justify-center">
            <div className="w-full border-t border-slate-200 dark:border-neutral-800" />
            <span className="absolute px-3 bg-white dark:bg-neutral-900 text-[11px] font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
              oder
            </span>
          </div>

          {/* Guest Access Option */}
          {!showGuestInput ? (
            <button
              onClick={() => setShowGuestInput(true)}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-neutral-950 dark:hover:bg-neutral-800/80 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 font-semibold text-xs transition-all"
            >
              <User className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
              <span>Als Gast beitreten (ohne Google)</span>
            </button>
          ) : (
            <form onSubmit={handleGuestLogin} className="space-y-3 pt-1">
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Dein Name (z.B. Alex)"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowGuestInput(false)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-neutral-950 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white text-xs font-medium border border-slate-200 dark:border-neutral-800 transition-colors"
                >
                  Zurück
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white text-xs font-semibold border border-transparent dark:border-neutral-700 transition-colors"
                >
                  {loading ? "Wird gestartet..." : "Als Gast starten"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security badge note */}
        <p className="mt-5 text-[11px] text-slate-500 dark:text-neutral-500 text-center flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
          <span>Gesichert über Firebase Authentication (boystrip-4a39d)</span>
        </p>
      </div>
    </div>
  );
}
