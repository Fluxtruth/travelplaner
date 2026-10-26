"use client";

import React, { useState, useMemo } from "react";
import { TravelOption, Trip, UserVote, VoteDecision, OptionCategory } from "@/types";
import { addTimelineItem, castVote } from "@/lib/firebase/firestore";
import { AddProposalModal } from "./AddProposalModal";
import { EditProposalModal } from "./EditProposalModal";
import confetti from "canvas-confetti";
import {
  Sparkles,
  Trophy,
  Check,
  Plus,
  Pencil,
  ArrowRight,
  Train,
  Building,
  Utensils,
  Wine,
  Landmark,
  Compass,
  MapPin,
  Calendar,
  Euro,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Flame,
  Search,
} from "lucide-react";

interface FinalDashboardProps {
  trip: Trip;
  options: TravelOption[];
  userVotes?: Record<string, UserVote>;
  currentUserId: string;
  currentUserName?: string;
  onGoToTimeline: () => void;
  onOptionAdded?: (option: TravelOption) => void;
  onOptionUpdated?: (option: TravelOption) => void;
  onOptionDeleted?: (optionId: string) => void;
}

export function FinalDashboard({
  trip,
  options,
  userVotes = {},
  currentUserId,
  currentUserName = "Traveler",
  onGoToTimeline,
  onOptionAdded,
  onOptionUpdated,
  onOptionDeleted,
}: FinalDashboardProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<TravelOption | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"votes" | "newest" | "price">("votes");
  const [searchQuery, setSearchQuery] = useState("");
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});
  const [localAddedOptions, setLocalAddedOptions] = useState<TravelOption[]>([]);
  const [localUpdatedOptions, setLocalUpdatedOptions] = useState<Record<string, TravelOption>>({});
  const [deletedOptionIds, setDeletedOptionIds] = useState<Set<string>>(new Set());

  const handleInternalOptionAdded = (opt: TravelOption) => {
    setLocalAddedOptions((prev) => [opt, ...prev]);
    if (onOptionAdded) {
      onOptionAdded(opt);
    }
  };

  const handleInternalOptionUpdated = (updated: TravelOption) => {
    setLocalUpdatedOptions((prev) => ({ ...prev, [updated.id]: updated }));
    if (onOptionUpdated) {
      onOptionUpdated(updated);
    }
  };

  const handleInternalOptionDeleted = (optionId: string) => {
    setDeletedOptionIds((prev) => {
      const next = new Set(prev);
      next.add(optionId);
      return next;
    });
    if (onOptionDeleted) {
      onOptionDeleted(optionId);
    }
  };

  const allOptions = useMemo(() => {
    const combined = [...localAddedOptions, ...options];
    const seen = new Set<string>();
    const list: TravelOption[] = [];
    for (const opt of combined) {
      if (deletedOptionIds.has(opt.id)) continue;
      if (seen.has(opt.id)) continue;
      seen.add(opt.id);
      const updated = localUpdatedOptions[opt.id];
      list.push(updated ? { ...opt, ...updated } : opt);
    }
    return list;
  }, [localAddedOptions, options, localUpdatedOptions, deletedOptionIds]);

  // Local optimistic state for votes so UI reacts immediately (<16ms)
  const [optimisticVotes, setOptimisticVotes] = useState<Record<string, "yes" | "no" | null>>({});
  const [optimisticCounts, setOptimisticCounts] = useState<Record<string, { yesDelta: number; noDelta: number }>>({});

  // Direct Up- / Downvoting Handler
  const handleVote = async (optionId: string, decision: VoteDecision) => {
    // Current user vote state for this option
    const currentDecision =
      optimisticVotes[optionId] !== undefined
        ? optimisticVotes[optionId]
        : userVotes[optionId]?.decision || null;

    let newDecision: "yes" | "no" | null = decision;
    let yesChange = 0;
    let noChange = 0;

    if (currentDecision === decision) {
      // Toggle off / unvote
      newDecision = null;
      if (decision === "yes") yesChange = -1;
      else noChange = -1;
    } else if (currentDecision === null) {
      // New vote
      newDecision = decision;
      if (decision === "yes") yesChange = 1;
      else noChange = 1;
    } else {
      // Switched vote (yes <-> no)
      newDecision = decision;
      if (decision === "yes") {
        yesChange = 1;
        noChange = -1;
      } else {
        yesChange = -1;
        noChange = 1;
      }
    }

    // Apply optimistic updates
    setOptimisticVotes((prev) => ({ ...prev, [optionId]: newDecision }));
    setOptimisticCounts((prev) => {
      const cur = prev[optionId] || { yesDelta: 0, noDelta: 0 };
      return {
        ...prev,
        [optionId]: {
          yesDelta: cur.yesDelta + yesChange,
          noDelta: cur.noDelta + noChange,
        },
      };
    });

    // Fire celebratory confetti on upvote
    if (newDecision === "yes") {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.75 },
        colors: ["#10b981", "#3b82f6", "#f59e0b", "#ec4899"],
      });
    }

    try {
      await castVote(trip.id, optionId, currentUserId, decision);
    } catch (err) {
      console.warn("Failed to cast vote in Firestore:", err);
    }
  };

  // Transfer matched option into Kanban timeline
  const handleTransferToTimeline = async (option: TravelOption) => {
    let targetDayId = "day-2";
    if (option.fromLocation?.includes("Prag") || option.title.includes("Prag")) {
      targetDayId = "day-2";
    } else if (option.fromLocation?.includes("Wien") || option.title.includes("Wien")) {
      targetDayId = "day-4";
    } else if (
      option.fromLocation?.includes("Neustadt") ||
      option.title.includes("Neustadt") ||
      option.fromLocation?.includes("Nürnberg") ||
      option.title.includes("Nürnberg")
    ) {
      targetDayId = "day-6";
    }

    try {
      await addTimelineItem(trip.id, {
        dayId: targetDayId,
        stopCity: option.toLocation || option.fromLocation || "Zwischenstopp",
        title: option.title,
        type: (option.category as any) || "activity",
        time: option.dates || "10:00 - 14:00",
        location: option.fromLocation || option.toLocation,
        url: option.externalUrl,
        imageUrl: option.imageUrl,
        notes: `Aus Crew-Vorschlägen übernommen (~${option.priceEstimate}€)`,
        order: Date.now(),
        optionId: option.id,
        provider: option.provider,
        createdBy: currentUserId,
      });

      setAddedItemIds((prev) => ({ ...prev, [option.id]: true }));

      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.warn("Failed to transfer option to timeline:", err);
    }
  };

  // Compute options with optimistic counts
  const processedOptions = useMemo(() => {
    return allOptions.map((opt) => {
      const deltas = optimisticCounts[opt.id] || { yesDelta: 0, noDelta: 0 };
      const yesVotes = Math.max(0, (opt.yesVotes || 0) + deltas.yesDelta);
      const noVotes = Math.max(0, (opt.noVotes || 0) + deltas.noDelta);
      const netScore = yesVotes - noVotes;

      const userDecision =
        optimisticVotes[opt.id] !== undefined
          ? optimisticVotes[opt.id]
          : userVotes[opt.id]?.decision || null;

      return {
        ...opt,
        yesVotes,
        noVotes,
        netScore,
        userDecision,
      };
    });
  }, [allOptions, optimisticCounts, optimisticVotes, userVotes]);

  // Filter and Sort
  const filteredAndSortedOptions = useMemo(() => {
    let result = [...processedOptions];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (opt) =>
          opt.title.toLowerCase().includes(q) ||
          opt.description?.toLowerCase().includes(q) ||
          opt.fromLocation?.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (filterCategory === "favorites") {
      result = result.filter((opt) => opt.netScore > 0);
    } else if (filterCategory !== "all") {
      result = result.filter((opt) => opt.category === filterCategory);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "votes") {
        return b.netScore - a.netScore || b.yesVotes - a.yesVotes;
      }
      if (sortBy === "price") {
        return (a.priceEstimate || 0) - (b.priceEstimate || 0);
      }
      if (sortBy === "newest") {
        return new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime();
      }
      return 0;
    });

    return result;
  }, [processedOptions, filterCategory, sortBy, searchQuery]);

  const favoritesCount = processedOptions.filter((opt) => opt.netScore > 0).length;

  const categoryIcons: Record<string, React.ReactNode> = {
    transport: <Train className="w-3.5 h-3.5 text-emerald-500" />,
    accommodation: <Building className="w-3.5 h-3.5 text-blue-500" />,
    activity: <Compass className="w-3.5 h-3.5 text-purple-500" />,
    food: <Utensils className="w-3.5 h-3.5 text-amber-500" />,
    nightlife: <Wine className="w-3.5 h-3.5 text-rose-500" />,
    culture: <Landmark className="w-3.5 h-3.5 text-sky-500" />,
    custom: <Sparkles className="w-3.5 h-3.5 text-indigo-500" />,
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-50 via-blue-50/40 to-indigo-50/20 dark:from-emerald-950/40 dark:via-blue-950/20 dark:to-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-sm transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/30 shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Reise-Ideen & Favoriten-Voting
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 font-bold">
                {favoritesCount} Favoriten
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 font-bold">
                {options.length} Vorschläge
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
              Hier sammelt die Crew alle Vorschläge. Stimmt direkt per Up- & Downvote ab – Favoriten können mit einem Klick in den Zeitstrahl übernommen werden.
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/25 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Neuen Vorschlag einreichen</span>
          </button>

          <button
            onClick={onGoToTimeline}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 font-semibold text-xs border border-slate-200 dark:border-neutral-700 transition-colors"
          >
            <span>Zum Zeitstrahl</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter & Sort Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-2 rounded-2xl bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 transition-colors">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <button
            onClick={() => setFilterCategory("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterCategory === "all"
                ? "bg-white dark:bg-neutral-800 text-blue-600 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-neutral-400 hover:text-slate-900"
            }`}
          >
            Alle ({processedOptions.length})
          </button>

          <button
            onClick={() => setFilterCategory("favorites")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterCategory === "favorites"
                ? "bg-amber-400 text-slate-950 shadow-xs"
                : "text-slate-600 dark:text-neutral-400 hover:text-slate-900"
            }`}
          >
            <span>🌟 Top Favoriten ({favoritesCount})</span>
          </button>

          <button
            onClick={() => setFilterCategory("transport")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              filterCategory === "transport"
                ? "bg-white dark:bg-neutral-800 text-emerald-600 shadow-xs"
                : "text-slate-600 dark:text-neutral-400 hover:text-slate-900"
            }`}
          >
            <Train className="w-3.5 h-3.5" />
            <span>Transport</span>
          </button>

          <button
            onClick={() => setFilterCategory("accommodation")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              filterCategory === "accommodation"
                ? "bg-white dark:bg-neutral-800 text-blue-600 shadow-xs"
                : "text-slate-600 dark:text-neutral-400 hover:text-slate-900"
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Unterkunft</span>
          </button>

          <button
            onClick={() => setFilterCategory("activity")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              filterCategory === "activity"
                ? "bg-white dark:bg-neutral-800 text-purple-600 shadow-xs"
                : "text-slate-600 dark:text-neutral-400 hover:text-slate-900"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Aktivität</span>
          </button>

          <button
            onClick={() => setFilterCategory("food")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              filterCategory === "food"
                ? "bg-white dark:bg-neutral-800 text-amber-600 shadow-xs"
                : "text-slate-600 dark:text-neutral-400 hover:text-slate-900"
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Kulinarik</span>
          </button>

          <button
            onClick={() => setFilterCategory("nightlife")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              filterCategory === "nightlife"
                ? "bg-white dark:bg-neutral-800 text-rose-600 shadow-xs"
                : "text-slate-600 dark:text-neutral-400 hover:text-slate-900"
            }`}
          >
            <Wine className="w-3.5 h-3.5" />
            <span>Nightlife</span>
          </button>
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suche..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-semibold text-slate-700 dark:text-neutral-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="votes">Sortieren: Meiste Stimmen</option>
            <option value="newest">Sortieren: Neueste zuerst</option>
            <option value="price">Sortieren: Günstigste zuerst</option>
          </select>
        </div>
      </div>

      {/* Proposals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAndSortedOptions.map((option, index) => {
          const isAdded = addedItemIds[option.id];
          const isTopRank = option.netScore > 0 && index === 0 && filterCategory !== "all";
          const isFavorite = option.netScore >= 2;
          const userVotedYes = option.userDecision === "yes";
          const userVotedNo = option.userDecision === "no";

          return (
            <div
              key={option.id}
              className={`relative rounded-3xl border overflow-hidden bg-white dark:bg-neutral-900 shadow-sm flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                isFavorite
                  ? "border-amber-300 dark:border-amber-500/50 ring-2 ring-amber-400/20"
                  : "border-slate-200 dark:border-neutral-800"
              }`}
            >
              {/* Media Thumbnail */}
              <div className="relative h-44 w-full overflow-hidden bg-slate-900 group">
                <img
                  src={
                    option.imageUrl ||
                    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=80"
                  }
                  alt={option.title}
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=80";
                  }}
                  className="w-full h-full object-cover brightness-[0.85] group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                  {isFavorite && (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black shadow-md">
                      <Sparkles className="w-3.5 h-3.5" />
                      CREW-FAVORIT
                    </div>
                  )}

                  <div className="px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider">
                    {categoryIcons[option.category] || categoryIcons.custom}
                    <span>{option.category}</span>
                  </div>
                </div>

                {/* Edit Button in Thumbnail */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                  <button
                    type="button"
                    onClick={() => setEditingOption(option)}
                    title="Vorschlag bearbeiten (Titel, Preis, Bildadresse, etc.)"
                    className="px-2.5 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold flex items-center gap-1 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Pencil className="w-3 h-3 text-blue-400" />
                    <span>Bearbeiten</span>
                  </button>
                </div>

                {/* Price Estimate */}
                {option.priceEstimate > 0 && (
                  <div className="absolute bottom-3 left-3 px-3 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/20 text-white text-xs font-bold flex items-center gap-1 shadow-md">
                    <span>~{option.priceEstimate.toFixed(2)}</span>
                    <Euro className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] text-slate-400 font-normal">p.P.</span>
                  </div>
                )}

                {/* Location Pill */}
                {option.fromLocation && (
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-400" />
                    <span className="truncate max-w-[140px]">{option.fromLocation}</span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                      {option.provider || "Vorschlag"}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingOption(option)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400"
                        title="Diesen Eintrag bearbeiten"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Bearbeiten</span>
                      </button>
                      {option.externalUrl && (
                        <a
                          href={option.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <span>Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-snug">
                    {option.title}
                  </h4>

                  {option.description && (
                    <p className="text-xs text-slate-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                      {option.description}
                    </p>
                  )}
                </div>

                {/* Voting Action Section */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    {/* Voting Buttons */}
                    <div className="flex items-center gap-1.5">
                      {/* Upvote Button */}
                      <button
                        onClick={() => handleVote(option.id, "yes")}
                        title="Bock drauf! (Dafür stimmen)"
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                          userVotedYes
                            ? "bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20"
                            : "bg-slate-50 dark:bg-neutral-800/80 border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:border-emerald-400 hover:text-emerald-600"
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{option.yesVotes}</span>
                      </button>

                      {/* Downvote Button */}
                      <button
                        onClick={() => handleVote(option.id, "no")}
                        title="Eher nicht (Dagegen stimmen)"
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                          userVotedNo
                            ? "bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/20"
                            : "bg-slate-50 dark:bg-neutral-800/80 border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:border-rose-400 hover:text-rose-600"
                        }`}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span>{option.noVotes}</span>
                      </button>
                    </div>

                    {/* Net Score Badge */}
                    <div className="text-right">
                      <span
                        className={`text-xs font-mono font-black px-2 py-0.5 rounded-md border ${
                          option.netScore > 0
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                            : option.netScore < 0
                            ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                            : "bg-slate-50 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 border-slate-200 dark:border-neutral-700"
                        }`}
                      >
                        {option.netScore > 0 ? `+${option.netScore}` : option.netScore} Score
                      </span>
                    </div>
                  </div>

                  {/* Transfer Action Button */}
                  <div>
                    {isAdded ? (
                      <div className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                        <Check className="w-4 h-4" />
                        <span>Im Zeitstrahl eingetragen</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleTransferToTimeline(option)}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-800 dark:text-white font-semibold text-xs border border-slate-200 dark:border-neutral-700 transition-all shadow-2xs active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>In Zeitstrahl übernehmen</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredAndSortedOptions.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-200 dark:border-neutral-800 p-12 text-center bg-slate-50/50 dark:bg-neutral-900/50">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Noch keine Vorschläge in dieser Kategorie
          </h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mx-auto mb-4">
            Reiche als Erster eine Idee für Transport, Unterkunft oder Aktivitäten ein.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20"
          >
            Vorschlag einreichen
          </button>
        </div>
      )}

      {/* Add Proposal Modal */}
      <AddProposalModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        tripId={trip.id}
        currentUserId={currentUserId}
        onProposalAdded={handleInternalOptionAdded}
      />

      {/* Edit Proposal Modal */}
      {editingOption && (
        <EditProposalModal
          isOpen={Boolean(editingOption)}
          onClose={() => setEditingOption(null)}
          tripId={trip.id}
          option={editingOption}
          onOptionUpdated={handleInternalOptionUpdated}
          onOptionDeleted={handleInternalOptionDeleted}
        />
      )}
    </div>
  );
}
