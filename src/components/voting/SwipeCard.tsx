"use client";

import React from "react";
import { TravelOption } from "@/types";
import {
  Bus,
  Train,
  Building,
  MapPin,
  Calendar,
  Euro,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

interface SwipeCardProps {
  option: TravelOption;
  swipeDirection?: "left" | "right" | null;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

export function SwipeCard({
  option,
  swipeDirection,
  onSwipeLeft,
  onSwipeRight,
}: SwipeCardProps) {
  const getProviderConfig = (provider: TravelOption["provider"]) => {
    switch (provider) {
      case "flixbus":
        return {
          name: "Flixbus",
          colorClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
          icon: <Bus className="w-4 h-4 text-emerald-400" />,
        };
      case "bahn":
        return {
          name: "Deutsche Bahn / ÖBB",
          colorClass: "bg-red-500/20 text-red-400 border-red-500/30",
          icon: <Train className="w-4 h-4 text-red-400" />,
        };
      case "airbnb":
        return {
          name: "Airbnb",
          colorClass: "bg-rose-500/20 text-rose-400 border-rose-500/30",
          icon: <Building className="w-4 h-4 text-rose-400" />,
        };
      case "booking":
        return {
          name: "Booking.com",
          colorClass: "bg-blue-500/20 text-blue-400 border-blue-500/30",
          icon: <Building className="w-4 h-4 text-blue-400" />,
        };
      default:
        return {
          name: "Travel Option",
          colorClass: "bg-purple-500/20 text-purple-400 border-purple-500/30",
          icon: <MapPin className="w-4 h-4 text-purple-400" />,
        };
    }
  };

  const provider = getProviderConfig(option.provider);

  return (
    <div
      className={`relative w-full max-w-sm sm:max-w-md h-[540px] rounded-3xl overflow-hidden border border-slate-200 dark:border-neutral-800 bg-neutral-900 shadow-2xl transition-all duration-300 select-none flex flex-col justify-between ${
        swipeDirection === "right"
          ? "translate-x-12 rotate-6 ring-4 ring-emerald-500/50 shadow-emerald-500/20"
          : swipeDirection === "left"
          ? "-translate-x-12 -rotate-6 ring-4 ring-red-500/50 shadow-red-500/20"
          : "hover:shadow-blue-500/10"
      }`}
    >
      {/* Background Image / Gradient */}
      <div className="absolute inset-0 z-0">
        <img
          src={
            option.imageUrl ||
            "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=80"
          }
          alt={option.title}
          className="w-full h-full object-cover brightness-[0.65] contrast-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
      </div>

      {/* Swipe Badges Overlay (Tinder-style stamp) */}
      {swipeDirection === "right" && (
        <div className="absolute top-8 left-8 z-20 px-4 py-2 rounded-2xl border-4 border-emerald-400 bg-emerald-950/80 text-emerald-300 font-extrabold text-2xl tracking-wider uppercase -rotate-12 animate-in zoom-in-75">
          MATCH! 👍
        </div>
      )}
      {swipeDirection === "left" && (
        <div className="absolute top-8 right-8 z-20 px-4 py-2 rounded-2xl border-4 border-red-500 bg-red-950/80 text-red-300 font-extrabold text-2xl tracking-wider uppercase rotate-12 animate-in zoom-in-75">
          NOPE 👎
        </div>
      )}

      {/* Top Bar: Provider & Price */}
      <div className="relative z-10 p-5 flex items-center justify-between">
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${provider.colorClass}`}
        >
          {provider.icon}
          {provider.name}
        </div>

        <div className="px-3.5 py-1.5 rounded-2xl bg-neutral-950/80 border border-neutral-700/80 backdrop-blur-md text-white font-mono text-sm font-bold flex items-center gap-1 shadow-lg">
          <span>~{option.priceEstimate.toFixed(2)}</span>
          <Euro className="w-3.5 h-3.5 text-emerald-400" />
        </div>
      </div>

      {/* Bottom Content: Title, Description, Voting stats */}
      <div className="relative z-10 p-6 flex flex-col gap-3">
        {/* Route / Location pill */}
        {(option.fromLocation || option.toLocation) && (
          <div className="flex items-center gap-1.5 text-xs text-neutral-300 bg-neutral-950/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-800 w-fit">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>
              {option.fromLocation}
              {option.toLocation && ` → ${option.toLocation}`}
            </span>
          </div>
        )}

        <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug drop-shadow-md">
          {option.title}
        </h3>

        <p className="text-xs sm:text-sm text-neutral-300 line-clamp-3 leading-relaxed drop-shadow">
          {option.description}
        </p>

        {option.dates && (
          <p className="text-xs text-neutral-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            {option.dates}
          </p>
        )}

        {/* Voting Action Buttons */}
        <div className="mt-4 pt-4 border-t border-neutral-800/80 flex items-center justify-around gap-4">
          <button
            onClick={onSwipeLeft}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-neutral-900/90 border border-red-500/30 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all shadow-lg"
          >
            <ThumbsDown className="w-5 h-5" />
            <span className="font-bold text-sm">Pass</span>
          </button>

          <button
            onClick={onSwipeRight}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 active:scale-95 transition-all"
          >
            <ThumbsUp className="w-5 h-5" />
            <span>Bock drauf!</span>
          </button>
        </div>
      </div>
    </div>
  );
}
