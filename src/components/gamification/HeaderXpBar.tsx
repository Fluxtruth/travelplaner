"use client";

import React, { useState, useRef, useEffect } from "react";
import { useGamification } from "@/context/GamificationContext";
import { useAuth } from "@/context/AuthContext";
import { ChevronRight, X, Plus, Minus } from "lucide-react";
import { useRouter } from "next/navigation";

export function HeaderXpBar() {
  const { user } = useAuth();
  const { profile, updateBeerCount } = useGamification();
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

  if (!user) return null;

  const targetTripUrl = profile.tripId && profile.tripId !== "demo" ? `/trips/${profile.tripId}` : "/";

  const handleOpenLeaderboard = () => {
    setPopoverOpen(false);
    const pathname = typeof window !== "undefined" ? window.location.pathname : "";
    if (pathname.startsWith("/trips/")) {
      window.dispatchEvent(new CustomEvent("boystrip:navigate-tab", { detail: "passport" }));
    } else if (targetTripUrl !== "/") {
      router.push(targetTripUrl);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("boystrip:navigate-tab", { detail: "passport" }));
      }, 500);
    } else {
      router.push("/");
    }
  };

  const beerCount = profile.beerCount ?? 0;

  return (
    <div className="relative" ref={containerRef}>
      {/* Sleek Bier-Counter Capsule in Header */}
      <button
        onClick={() => setPopoverOpen((prev) => !prev)}
        className="group flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 dark:bg-amber-500/15 dark:hover:bg-amber-500/25 border border-amber-500/30 hover:border-amber-500/60 shadow-xs transition-all duration-200 cursor-pointer text-left select-none"
        title="Bier-Counter öffnen"
        aria-label="Bier-Counter"
      >
        <span className="text-sm leading-none transition-transform group-hover:scale-110">🍺</span>
        <span suppressHydrationWarning className="text-xs sm:text-xs font-black font-mono text-amber-800 dark:text-amber-300 leading-none">
          {beerCount}
        </span>
        <span className="text-[11px] font-bold text-amber-700/80 dark:text-amber-400/80 hidden xs:inline">
          {beerCount === 1 ? "Bier" : "Biere"}
        </span>
      </button>

      {/* Interactive Quick-Logger Popover */}
      {popoverOpen && (
        <div className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-16 sm:top-auto sm:mt-2 w-auto sm:w-80 max-w-sm mx-auto rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center text-lg border border-amber-500/30">
                🍺
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Bier-Counter
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                  {profile.displayName || "Dein Punktestand"}
                </p>
              </div>
            </div>

            <button
              onClick={() => setPopoverOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Big Counter Display & Stepper Card */}
          <div className="my-3.5 p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-orange-500/10 border border-amber-500/30 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Deine getrunkenen Biere
            </span>
            <div className="flex items-baseline justify-center gap-1.5 my-1">
              <span className="text-4xl font-black font-mono text-slate-900 dark:text-white">
                {beerCount}
              </span>
              <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                {beerCount === 1 ? "Bier" : "Biere"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mb-3">
              Kühles gezischt? Sofort für die Tour verbuchen!
            </p>

            {/* Stepper Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateBeerCount(-1)}
                disabled={beerCount <= 0}
                className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-200 font-bold flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer shadow-xs active:scale-95"
                title="1 Bier abziehen"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => updateBeerCount(1)}
                className="flex-1 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 active:scale-98 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+1 Bier trinken</span>
                <span>🍻</span>
              </button>
            </div>
          </div>

          {/* Action: Bierkönig Leaderboard */}
          <button
            onClick={handleOpenLeaderboard}
            className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 font-bold text-xs transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <span>👑</span>
              <span>Bier-König Leaderboard</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      )}
    </div>
  );
}
