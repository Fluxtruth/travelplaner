"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  Compass,
  Plus,
  LogIn,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Settings,
} from "lucide-react";
import { AuthModal } from "@/components/auth/AuthModal";
import { SettingsModal } from "@/components/common/SettingsModal";
import { HeaderXpBar } from "@/components/gamification/HeaderXpBar";

export function Navbar() {
  const { user, profile, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/85 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-1 sm:gap-2">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0 border border-slate-200 dark:border-neutral-800 bg-slate-900">
            <img
              src="/logo-3d.png"
              alt="Phil's Travelplaner Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white leading-tight">
              Phil&apos;s Travelplaner
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-neutral-400 font-mono tracking-tight hidden sm:inline">
              Collab Travel Hub
            </span>
          </div>
        </Link>

        {/* Center / Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Minimalist Header XP Bar - only when authenticated */}
          {user && <HeaderXpBar />}

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Designmodus umschalten"
            title={`Modus: ${theme === "light" ? "Hell (Standard)" : "Dunkel"}`}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 flex items-center justify-center transition-colors shrink-0"
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4 text-slate-700" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* Settings Modal Button - hidden on mobile, accessible in user dropdown */}
          <button
            onClick={() => setSettingsModalOpen(true)}
            aria-label="Einstellungen öffnen"
            title="Einstellungen"
            className="hidden sm:flex w-9 h-9 rounded-xl text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 items-center justify-center transition-colors shrink-0"
          >
            <Settings className="w-4 h-4 text-slate-700 dark:text-neutral-300" />
          </button>

          {/* Neuer Trip (only for logged-in users) */}
          {user && (
            <Link
              href="/trips/new"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 text-xs font-semibold text-slate-900 dark:text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Neuer Trip
            </Link>
          )}

          {/* User Auth controls */}
          {loading ? (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-200 dark:bg-neutral-800 animate-pulse shrink-0" />
          ) : user ? (
            <div className="relative shrink-0">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-900 border border-transparent hover:border-slate-200 dark:border-neutral-800 transition-all"
              >
                <img
                  src={
                    profile?.photoURL ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`
                  }
                  alt={profile?.displayName || "User"}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-300 dark:border-neutral-700 bg-slate-100 dark:bg-neutral-800 object-cover"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200 hidden md:inline">
                  {profile?.displayName || "Traveler"}
                </span>
                <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500 dark:text-neutral-400" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div
                  onMouseLeave={() => setDropdownOpen(false)}
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95"
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-neutral-800/80 mb-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {profile?.displayName || "Traveler"}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">
                      {user.email || "Gast-Modus"}
                    </p>
                  </div>

                  <Link
                    href="/"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Meine Reisen
                  </Link>

                  <Link
                    href="/trips/new"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Trip erstellen
                  </Link>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      setSettingsModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                    Einstellungen
                  </button>

                  <Link
                    href="/impressum"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <span className="w-4 text-center text-xs">⚖️</span>
                    Impressum
                  </Link>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Abmelden
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Anmelden</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        onOpenAuth={() => setAuthModalOpen(true)}
      />
    </header>
  );
}
