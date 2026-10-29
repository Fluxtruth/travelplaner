"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { isIOS, isInAppBrowser } from "@/lib/firebase/auth";
import {
  X,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Copy,
  Check,
  ArrowRight,
  Compass,
  User as UserIcon,
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  title = "Anmelden bei Phil's Travelplaner",
  description = "Melde dich an, um Reisen mit deinen Freunden in Echtzeit zu planen und abzustimmen.",
}: AuthModalProps) {
  const { signInWithGoogle, signInWithGoogleRedirect, signInAsGuest } = useAuth();
  const [loading, setLoading] = useState(false);
  const [redirectLoading, setRedirectLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRedirectOption, setShowRedirectOption] = useState(false);

  // Device & browser detection
  const [inApp, setInApp] = useState(false);
  const [isAppleDevice, setIsAppleDevice] = useState(false);
  const [copied, setCopied] = useState(false);

  // Guest login state
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestName, setGuestName] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setInApp(isInAppBrowser());
      setIsAppleDevice(isIOS());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    if (typeof window !== "undefined") {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        // Fallback
      }
    }
  };

  const handleGooglePopupLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      if (
        err?.code === "auth/popup-closed-by-user" ||
        err?.code === "auth/popup-blocked" ||
        err?.code === "auth/cancelled-popup-request"
      ) {
        setShowRedirectOption(true);
        setError("Safari/iPhone hat das Anmeldefenster blockiert oder geschlossen. Nutze bitte die Weiterleitung unten.");
      } else if (err?.code === "auth/unauthorized-domain") {
        setError("Domain noch nicht in Firebase autorisiert (Settings -> Authorized domains).");
      } else {
        setError(err?.message || "Fehler bei der Google-Anmeldung.");
        if (isAppleDevice) {
          setShowRedirectOption(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRedirectLogin = async () => {
    setRedirectLoading(true);
    setError(null);
    try {
      await signInWithGoogleRedirect();
      // Browser navigates away to accounts.google.com
    } catch (err: any) {
      console.error("Google redirect sign-in error:", err);
      setError(err?.message || "Fehler beim Weiterleiten zu Google.");
      setRedirectLoading(false);
    }
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuestLoading(true);
    setError(null);
    try {
      await signInAsGuest(guestName.trim() || undefined);
      onClose();
    } catch (err: any) {
      console.error("Guest sign-in error:", err);
      setError("Gast-Anmeldung fehlgeschlagen.");
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/95 backdrop-blur-2xl p-6 sm:p-7 shadow-2xl transition-colors">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Schließen"
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-xl shadow-blue-500/20 mb-3">
            <div className="w-full h-full bg-white dark:bg-neutral-950 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-cyan-400" />
            </div>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1 max-w-sm leading-relaxed">
            {description}
          </p>
        </div>

        {/* WhatsApp / Instagram In-App Browser Warning Banner */}
        {inApp && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-[12px]">In-App-Browser erkannt (z. B. WhatsApp)</p>
                <p className="mt-1 text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-300/90">
                  Google blockiert Logins innerhalb von Apps. Tippe oben rechts auf <strong>„...“</strong> und wähle <strong>„In Safari öffnen“</strong>, oder trete unten als Gast bei.
                </p>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-100 font-semibold text-[11px] transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Link kopiert! Öffne nun Safari." : "Link kopieren & in Safari öffnen"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-300">
            <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
            <p className="leading-snug flex-1">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {/* Main Google Sign In Button (Popup) */}
          <button
            onClick={handleGooglePopupLogin}
            disabled={loading || redirectLoading || guestLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-950 font-bold text-sm shadow-xl shadow-slate-900/10 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            {/* Google SVG Logo */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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

          {/* Fallback Option for Safari / iPhone (Redirect instead of popup) */}
          {(showRedirectOption || isAppleDevice) && (
            <button
              onClick={handleGoogleRedirectLogin}
              disabled={loading || redirectLoading || guestLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold text-xs border border-blue-200 dark:border-blue-800/60 transition-all cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>
                {redirectLoading
                  ? "Leite weiter zu Google..."
                  : "iPhone/Safari-Modus (Über Weiterleitung anmelden)"}
              </span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          )}

          {/* Divider */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-neutral-800" />
            </div>
            <span className="relative bg-white dark:bg-neutral-900 px-3 text-[11px] uppercase tracking-wider text-slate-600 dark:text-neutral-400 font-medium">
              oder
            </span>
          </div>

          {/* Guest Login Option */}
          {!showGuestForm ? (
            <button
              type="button"
              onClick={() => setShowGuestForm(true)}
              disabled={loading || redirectLoading || guestLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-800/60 text-slate-700 dark:text-neutral-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              <UserIcon className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
              <span>Ohne Google als Gast beitreten</span>
            </button>
          ) : (
            <form onSubmit={handleGuestSubmit} className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-neutral-800/40 border border-slate-200 dark:border-neutral-700/60">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-neutral-300">
                Dein Name für die Reise:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="z. B. Max oder Flo"
                  autoFocus
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={guestLoading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {guestLoading ? "..." : "Beitreten"}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-neutral-400">
                Du kannst sofort abstimmen, Stationen vorschlagen und Bier zählen.
              </p>
            </form>
          )}
        </div>

        {/* Security badge note */}
        <p className="mt-5 text-[11px] text-slate-500 dark:text-neutral-500 text-center flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
          <span>Gesichert über Firebase Authentication</span>
        </p>
      </div>
    </div>
  );
}
