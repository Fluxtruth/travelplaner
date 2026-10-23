"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { joinTripByInviteCode } from "@/lib/firebase/firestore";
import {
  X,
  Settings,
  KeyRound,
  Sun,
  Moon,
  Sparkles,
  LogOut,
  LogIn,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ExternalLink,
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  onOpenAuth,
}: SettingsModalProps) {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [inviteCode, setInviteCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinStatus, setJoinStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inviteCode.trim().toUpperCase();
    if (!cleanCode) return;

    if (!user) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    setIsJoining(true);
    setJoinStatus(null);

    try {
      const tripId = await joinTripByInviteCode(cleanCode, user.uid);
      if (tripId) {
        setJoinStatus({
          type: "success",
          message: "Erfolgreich beigetreten! Du wirst weitergeleitet...",
        });
        setTimeout(() => {
          onClose();
          router.push(`/trips/${tripId}`);
        }, 800);
      } else {
        setJoinStatus({
          type: "error",
          message: "Keine Reise mit diesem Einladungscode gefunden.",
        });
        setIsJoining(false);
      }
    } catch (err) {
      setJoinStatus({
        type: "error",
        message: "Fehler beim Beitreten der Reise. Bitte versuche es erneut.",
      });
      setIsJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-2xl p-6 sm:p-7 flex flex-col gap-6 max-h-[90vh] overflow-y-auto transition-colors"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="settings-modal-title"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                Einstellungen
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Optionen, Design & Code-Beitritt
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Schließen"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SECTION 1: Reise mit Einladungscode beitreten */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-neutral-950/60 border border-slate-200 dark:border-neutral-800 flex flex-col gap-3">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Reise mit Einladungscode beitreten
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                Hast du einen Code von deinen Freunden erhalten? Trage ihn hier ein, um dem Projekt beizutreten:
              </p>
            </div>
          </div>

          <form onSubmit={handleJoinByCode} className="flex flex-col sm:flex-row gap-2 mt-1">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="z.B. BOYS26"
              className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white text-xs font-mono tracking-widest placeholder-slate-400 focus:outline-none focus:border-blue-500 uppercase"
            />
            <button
              type="submit"
              disabled={isJoining || !inviteCode.trim()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all whitespace-nowrap"
            >
              {isJoining ? "Beitreten..." : "Beitreten"}
            </button>
          </form>

          {joinStatus && (
            <div
              className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium ${
                joinStatus.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                  : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20"
              }`}
            >
              {joinStatus.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{joinStatus.message}</span>
            </div>
          )}
        </div>

      {/* SECTION 2: Design / Erscheinungsbild */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-neutral-950/60 border border-slate-200 dark:border-neutral-800">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Design & Modus
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400">
              Aktuell: {theme === "light" ? "Hell" : "Dunkel"}
            </p>
          </div>

          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-xs font-semibold text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors shadow-sm"
          >
            {theme === "light" ? (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-700" />
                <span>Zu Dunkel</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Zu Hell</span>
              </>
            )}
          </button>
        </div>

        {/* SECTION 4: Benutzerkonto */}
        {user ? (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-neutral-950/60 border border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={
                  profile?.photoURL ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`
                }
                alt="Avatar"
                className="w-9 h-9 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {profile?.displayName || "Google Nutzer"}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">
                  {user.email || "Angemeldet"}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                signOut();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors shrink-0 border border-rose-200 dark:border-rose-500/20"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Abmelden</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-950/60 border border-slate-200 dark:border-neutral-800">
            <span className="text-xs text-slate-600 dark:text-neutral-400">
              Nicht angemeldet
            </span>
            <button
              onClick={() => {
                onClose();
                if (onOpenAuth) onOpenAuth();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Anmelden</span>
            </button>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px] text-slate-400 dark:text-neutral-500">
          <span>Boystrip Prototyp v1.0</span>
          <button
            onClick={onClose}
            className="text-slate-600 dark:text-neutral-400 hover:underline font-semibold"
          >
            Fertig
          </button>
        </div>
      </div>
    </div>
  );
}
