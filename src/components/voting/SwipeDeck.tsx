"use client";

import React, { useState, useEffect } from "react";
import { TravelOption, UserVote, VoteDecision } from "@/types";
import { SwipeCard } from "./SwipeCard";
import { castVote } from "@/lib/firebase/firestore";
import { Sparkles, CheckCircle2, RotateCcw, ArrowRight } from "lucide-react";

interface SwipeDeckProps {
  tripId: string;
  options: TravelOption[];
  userVotes: Record<string, UserVote>;
  userId: string;
  onGoToMatches: () => void;
}

export function SwipeDeck({
  tripId,
  options,
  userVotes,
  userId,
  onGoToMatches,
}: SwipeDeckProps) {
  // Filter options to those not yet voted on or maintain index
  const unvotedOptions = options.filter((opt) => !userVotes[opt.id]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeAnim, setSwipeAnim] = useState<"left" | "right" | null>(null);

  // Keyboard navigation: Left = Nope, Right = Like
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handleSwipe("no");
      } else if (e.key === "ArrowRight") {
        handleSwipe("yes");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const currentOption = unvotedOptions[currentIndex];

  const handleSwipe = async (decision: VoteDecision) => {
    if (!currentOption) return;

    setSwipeAnim(decision === "yes" ? "right" : "left");

    // Background vote recording
    castVote(tripId, currentOption.id, userId, decision).catch((err) =>
      console.warn("Error casting swipe vote:", err)
    );

    setTimeout(() => {
      setSwipeAnim(null);
      // If we've reached the end of current unvoted batch
      if (currentIndex >= unvotedOptions.length - 1) {
        setCurrentIndex(0);
      }
    }, 280);
  };

  if (!currentOption) {
    return (
      <div className="flex flex-col items-center justify-center p-10 rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 shadow-sm text-center max-w-lg mx-auto my-8 transition-colors">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 border border-emerald-200 dark:border-emerald-500/30">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Alles abgestimmt! 🎉
        </h3>
        <p className="text-sm text-slate-600 dark:text-neutral-400 max-w-sm mb-6 leading-relaxed">
          Du hast alle vorgeschlagenen Transportmittel und Unterkünfte bewertet.
          Schau dir an, welche Optionen die Gruppe gematcht hat!
        </p>

        <button
          onClick={onGoToMatches}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all"
        >
          <span>Zu den Matches & Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      {/* Progress Counter */}
      <div className="flex items-center justify-between w-full px-2 text-xs text-slate-500 dark:text-neutral-400 font-medium">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          Option {options.length - unvotedOptions.length + 1} von {options.length}
        </span>
        <span>Swipe oder Pfeiltasten ← →</span>
      </div>

      {/* Card Deck with stack aesthetic */}
      <div className="relative w-full flex justify-center">
        {/* Shadow placeholder card behind */}
        {unvotedOptions[currentIndex + 1] && (
          <div className="absolute top-3 w-full max-w-sm sm:max-w-md h-[520px] rounded-3xl border border-slate-200 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-900/60 scale-95 opacity-50 pointer-events-none -z-10" />
        )}

        <SwipeCard
          option={currentOption}
          swipeDirection={swipeAnim}
          onSwipeLeft={() => handleSwipe("no")}
          onSwipeRight={() => handleSwipe("yes")}
        />
      </div>
    </div>
  );
}
