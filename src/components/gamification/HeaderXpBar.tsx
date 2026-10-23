"use client";

import React, { useState, useRef, useEffect } from "react";
import { useGamification } from "@/context/GamificationContext";
import { Flame, Sparkles, Award, Trophy, ChevronRight, X } from "lucide-react";
import { useRouter } from "next/navigation";

export function HeaderXpBar() {
  const { profile, levelInfo, totalStampsCount, xpGainAlert, updateBeerCount } = useGamification();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpenTimeline = () => {
    setPopoverOpen(false);
    const pathname = typeof window !== "undefined" ? window.location.pathname : "";
    if (pathname.startsWith("/trips/")) {
      window.dispatchEvent(new CustomEvent("boystrip:navigate-tab", { detail: "timeline" }));
    } else {
      router.push("/trips/ndzmg2EvmlT2bJxF6QLf");
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("boystrip:navigate-tab", { detail: "timeline" }));
      }, 500);
    }
  };

  const handleOpenLeaderboard = () => {
    setPopoverOpen(false);
    const pathname = typeof window !== "undefined" ? window.location.pathname : "";
    if (pathname.startsWith("/trips/")) {
      window.dispatchEvent(new CustomEvent("boystrip:navigate-tab", { detail: "passport" }));
    } else {
      router.push("/trips/ndzmg2EvmlT2bJxF6QLf");
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("boystrip:navigate-tab", { detail: "passport" }));
      }, 500);
    }
  };

  const progressPct = Math.min(100, Math.max(0, levelInfo.progressPercent));
  const remainingXp = Math.max(0, levelInfo.nextLevelPoints - profile.points);

  return (
    <div className="relative" ref={containerRef}>
      {/* Floating XP Gain Badge Animation */}
      {xpGainAlert && (
        <div className="absolute -top-7 right-0 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-mono font-black text-[11px] shadow-lg shadow-orange-500/40">
            <Sparkles className="w-3 h-3" />
            +{xpGainAlert.amount} XP
          </span>
        </div>
      )}

      {/* Minimalist Capsule in Header */}
      <button
        onClick={() => setPopoverOpen((prev) => !prev)}
        className="group flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full bg-slate-100/90 hover:bg-slate-200/90 dark:bg-neutral-900/90 dark:hover:bg-neutral-800/90 border border-slate-200 dark:border-neutral-800 shadow-xs hover:border-amber-400/50 dark:hover:border-amber-500/50 transition-all duration-200 cursor-pointer text-left select-none"
        title="Bier-Counter & XP-Status ansehen"
        aria-label="Gamification Status"
      >
        {/* Bier-Counter Pill */}
        <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/15 to-yellow-500/15 dark:from-amber-500/25 dark:to-yellow-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 group-hover:border-amber-500/60 transition-colors">
          <span className="text-[12px] leading-none">🍺</span>
          <span suppressHydrationWarning className="text-[11px] sm:text-xs font-black font-mono leading-none">
            {profile.beerCount ?? 0}
          </span>
        </div>

        {/* Level Tag */}
        <div className="flex items-center gap-1.5">
          <span suppressHydrationWarning className="px-1.5 py-0.5 rounded-md bg-amber-400 dark:bg-amber-500 text-slate-950 font-black text-[10px] tracking-tight leading-none shadow-xs">
            LVL {levelInfo.level}
          </span>

          <span suppressHydrationWarning className="text-xs font-semibold text-slate-700 dark:text-neutral-200 hidden lg:inline max-w-[85px] truncate">
            {levelInfo.title}
          </span>
        </div>

        {/* Minimal Progress Bar (visible on sm and up) */}
        <div className="hidden sm:flex flex-col gap-0.5 pl-1 pr-0.5">
          <div className="flex items-center justify-between text-[10px] font-mono leading-none text-slate-500 dark:text-neutral-400">
            <span suppressHydrationWarning className="font-bold text-slate-800 dark:text-neutral-200">
              {profile.points}
            </span>
            <span suppressHydrationWarning className="text-slate-400 dark:text-neutral-500">
              /{levelInfo.nextLevelPoints} XP
            </span>
          </div>

          <div className="w-16 md:w-20 lg:w-24 h-1.5 rounded-full bg-slate-200 dark:bg-neutral-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Mobile-only Points Label (hidden on small mobile to prevent header blowout) */}
        <span suppressHydrationWarning className="hidden xs:inline sm:hidden text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
          {profile.points} XP
        </span>
      </button>

      {/* Interactive Popover Dropdown */}
      {popoverOpen && (
        <div className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-16 sm:top-auto sm:mt-2 w-auto sm:w-88 max-w-sm mx-auto rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <img
                  src={
                    profile.photoURL ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.userId}`
                  }
                  alt={profile.displayName}
                  className="w-10 h-10 rounded-xl border border-amber-400 bg-slate-100 dark:bg-neutral-800 object-cover shadow-sm"
                />
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-400 text-slate-950">
                  {levelInfo.level}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {profile.displayName}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                    {levelInfo.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                  Offizieller Boystrip Reisepass
                </p>
              </div>
            </div>

            <button
              onClick={() => setPopoverOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* XP Progress Bar Section */}
          <div className="py-3">
            <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
              <span className="text-slate-600 dark:text-neutral-400">
                Fortschritt zu Level {levelInfo.level + 1}
              </span>
              <span className="text-amber-600 dark:text-amber-400 font-mono font-bold">
                {profile.points} / {levelInfo.nextLevelPoints} XP ({progressPct}%)
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-neutral-800 overflow-hidden border border-slate-200 dark:border-neutral-700/60">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-1.5">
              Noch <span className="font-bold text-slate-700 dark:text-neutral-300">{remainingXp} XP</span> bis zum nächsten Rang.
            </p>
          </div>

          {/* Quick Stats Grid: Bier-Counter Stepper + Stamps */}
          <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-100 dark:border-neutral-800">
            {/* Bier-Counter Stepper Card */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/5 dark:from-amber-500/20 dark:via-yellow-500/15 dark:to-transparent border border-amber-500/25">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-bold text-xs">
                  <span className="text-base">🍺</span>
                  <span>Boystrip Bier-Counter</span>
                </div>
                <div className="flex items-center gap-1 bg-amber-500/20 dark:bg-amber-500/30 px-2 py-0.5 rounded-md font-mono font-black text-amber-800 dark:text-amber-300 text-xs">
                  <span>{profile.beerCount ?? 0}</span>
                  <span className="text-[10px] font-normal">Biere</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mb-2.5">
                Kühles gezischt? Schnell erfassen & XP sichern!
              </p>

              {/* Fast Stepper Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateBeerCount(-1)}
                  disabled={(profile.beerCount ?? 0) <= 0}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-200 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                  title="1 Bier abziehen"
                >
                  -1
                </button>
                <button
                  type="button"
                  onClick={() => updateBeerCount(1)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 active:scale-98 text-slate-950 font-black text-xs shadow-xs transition-all cursor-pointer"
                >
                  <span>+1 Bier trinken</span>
                  <span>🍻</span>
                </button>
              </div>
            </div>

            {/* Stamps Collected (Clickable to open Timeline & Stempelpass) */}
            <button
              type="button"
              onClick={handleOpenTimeline}
              className="p-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-100/80 dark:bg-neutral-800/60 dark:hover:bg-neutral-800 border border-slate-200/60 dark:border-neutral-700/60 text-left transition-colors cursor-pointer group/stamp flex items-center justify-between"
            >
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                <Award className="w-4 h-4" />
                <span>{profile.stamps.length} / {totalStampsCount} Stempel gesammelt</span>
              </div>
              <span className="text-[11px] text-slate-400 group-hover/stamp:text-indigo-500 transition-colors">
                Zur Timeline →
              </span>
            </button>
          </div>

          {/* Action Buttons: Timeline & Stempelpass + Leaderboard */}
          <div className="mt-3 space-y-2">
            <button
              onClick={handleOpenLeaderboard}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-98"
            >
              <span>👑</span>
              <span>Bier-König Leaderboard öffnen</span>
              <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-900" />
            </button>

            <button
              onClick={handleOpenTimeline}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 font-bold text-xs transition-colors cursor-pointer"
            >
              <span>🛂</span>
              <span>Reisepass & Timeline Stempel</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
