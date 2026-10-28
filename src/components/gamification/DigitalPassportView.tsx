"use client";

import React, { useState, useEffect } from "react";
import {
  UserGamificationProfile,
  PassportStamp,
  BadgeAchievement,
  ExperienceContestItem,
  Trip,
} from "@/types";
import {
  PASSPORT_STAMPS,
  BADGES_CATALOG,
  calculateLevel,
  evaluateBadges,
} from "@/lib/gamification/catalog";
import { voteForBestExperience, updateTripBadges } from "@/lib/firebase/firestore";
import { useGamification } from "@/context/GamificationContext";
import confetti from "canvas-confetti";
import {
  Compass,
  Trophy,
  Flame,
  Award,
  CheckCircle2,
  Lock,
  Sparkles,
  MapPin,
  Calendar,
  Crown,
  Users,
  ChevronRight,
  Shield,
  ThumbsUp,
  Share2,
  Beer,
  Plus,
  Minus,
  Pencil,
  Trash2,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

import { BadgeEditorModal } from "./BadgeEditorModal";

interface DigitalPassportViewProps {
  trip: Trip;
  profiles: UserGamificationProfile[];
  candidates: ExperienceContestItem[];
  currentUserId: string;
  currentUserName?: string;
  currentUserPhoto?: string | null;
  isOwner?: boolean;
  onGoToTimeline: () => void;
}

export function DigitalPassportView({
  trip,
  profiles,
  candidates,
  currentUserId,
  currentUserName = "Traveler",
  currentUserPhoto,
  isOwner,
  onGoToTimeline,
}: DigitalPassportViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"leaderboard" | "badges" | "contest">("leaderboard");
  const { profile: contextProfile, updateBeerCount, updateProfile, addXp } = useGamification();

  // Role check: Is current user the trip owner?
  const effectiveIsOwner =
    isOwner ??
    (Boolean(currentUserId) &&
      (trip.ownerId === currentUserId ||
        (currentUserId === "guest-owner" && trip.ownerId === "guest-owner") ||
        trip.ownerId === "demo-owner"));

  // Active Badges catalog (customized by Owner or default Boystrip badges)
  const activeBadges: BadgeAchievement[] = React.useMemo(() => {
    if (trip.customBadges && Array.isArray(trip.customBadges) && trip.customBadges.length > 0) {
      return trip.customBadges;
    }
    return BADGES_CATALOG;
  }, [trip.customBadges]);

  // Badge Management Modal states
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [badgeToEdit, setBadgeToEdit] = useState<BadgeAchievement | null>(null);
  const [badgeNotification, setBadgeNotification] = useState<string | null>(null);

  const handleOpenCreateBadge = () => {
    setBadgeToEdit(null);
    setIsBadgeModalOpen(true);
  };

  const handleOpenEditBadge = (badge: BadgeAchievement) => {
    setBadgeToEdit(badge);
    setIsBadgeModalOpen(true);
  };

  const handleSaveBadge = async (badge: BadgeAchievement) => {
    let updatedList: BadgeAchievement[];
    const existingIndex = activeBadges.findIndex((b) => b.id === badge.id);
    if (existingIndex >= 0) {
      updatedList = [...activeBadges];
      updatedList[existingIndex] = badge;
    } else {
      updatedList = [badge, ...activeBadges];
    }

    try {
      await updateTripBadges(trip.id, updatedList);
      setBadgeNotification(`Badge "${badge.title}" erfolgreich gespeichert!`);
      setTimeout(() => setBadgeNotification(null), 3500);
    } catch (e: any) {
      console.error("Failed to save badge to Firestore:", e);
      alert("Fehler beim Speichern des Badges: " + (e?.message || "Unbekannter Fehler"));
    }
  };

  const handleDeleteBadge = async (badgeId: string, badgeTitle: string) => {
    if (!window.confirm(`Möchtest du den Badge "${badgeTitle}" wirklich dauerhaft für diesen Trip löschen?`)) {
      return;
    }
    const updatedList = activeBadges.filter((b) => b.id !== badgeId);
    try {
      await updateTripBadges(trip.id, updatedList);
      setBadgeNotification(`Badge "${badgeTitle}" entfernt.`);
      setTimeout(() => setBadgeNotification(null), 3500);
    } catch (e: any) {
      console.error("Failed to delete badge from Firestore:", e);
      alert("Fehler beim Löschen des Badges: " + (e?.message || "Unbekannter Fehler"));
    }
  };

  const handleResetBadgesToDefault = async () => {
    if (
      !window.confirm(
        "Möchtest du alle Badges wirklich auf den Boystrip-Standardkatalog zurücksetzen? Eigene Änderungen werden dabei überschrieben."
      )
    ) {
      return;
    }
    try {
      await updateTripBadges(trip.id, BADGES_CATALOG);
      setBadgeNotification("Standard-Badges wurden erfolgreich wiederhergestellt!");
      setTimeout(() => setBadgeNotification(null), 3500);
    } catch (e: any) {
      console.error("Failed to reset badges:", e);
      alert("Fehler beim Zurücksetzen: " + (e?.message || "Unbekannter Fehler"));
    }
  };

  // Evaluate automatic badges based on stamps and beerCount
  const myBeerCount = contextProfile.beerCount ?? 0;
  const autoBadges = evaluateBadges(contextProfile.stamps, myBeerCount);
  const myUnlockedBadges = Array.from(new Set([...(contextProfile.badges || []), ...autoBadges]));

  // Active Real Crew Profiles ONLY - Absolutely NO fake users!
  const activeProfiles = React.useMemo(() => {
    const list: UserGamificationProfile[] = [];

    // Current user's real profile
    const currentInProfiles = (profiles || []).find((p) => p.userId === currentUserId);
    const myPoints = Math.max(currentInProfiles?.points || 0, contextProfile.points || 0);
    const myCalc = calculateLevel(myPoints);

    const myProfileItem: UserGamificationProfile = {
      userId: currentUserId,
      tripId: trip.id,
      displayName: currentUserName || "Traveler",
      photoURL: currentUserPhoto || undefined,
      points: myPoints,
      level: myCalc.level,
      levelTitle: myCalc.title,
      beerCount: Math.max(currentInProfiles?.beerCount || 0, myBeerCount),
      currentStreak: currentInProfiles?.currentStreak || contextProfile.currentStreak || 1,
      lastActiveDate: new Date().toISOString().split("T")[0],
      stamps: Array.from(new Set([...(currentInProfiles?.stamps || []), ...(contextProfile.stamps || [])])),
      badges: Array.from(new Set([...(currentInProfiles?.badges || []), ...myUnlockedBadges])),
      checkins: { ...(currentInProfiles?.checkins || {}), ...(contextProfile.checkins || {}) },
    };

    list.push(myProfileItem);

    // Other real participants synced from Firestore
    (profiles || []).forEach((p) => {
      if (p.userId !== currentUserId) {
        list.push(p);
      }
    });

    return list.sort((a, b) => ((b.beerCount ?? 0) - (a.beerCount ?? 0)) || ((b.points || 0) - (a.points || 0)));
  }, [profiles, currentUserId, currentUserName, currentUserPhoto, trip.id, contextProfile, myBeerCount, myUnlockedBadges]);

  const defaultCandidates: ExperienceContestItem[] = [
    {
      id: "contest-1",
      tripId: trip.id,
      title: "Brauereitour & Bierverkostung Pilsner Urquell",
      city: "Prag",
      category: "Aktivität & Bier",
      imageUrl: "https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=800&auto=format&fit=crop&q=80",
      votes: [],
    },
    {
      id: "contest-2",
      tripId: trip.id,
      title: "Hemingway Bar Prag (Craft-Cocktails)",
      city: "Prag",
      category: "Bar & Nightlife",
      imageUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=80",
      votes: [],
    },
    {
      id: "contest-3",
      tripId: trip.id,
      title: "Karlsbrücke & Prager Burg Sunset Walk",
      city: "Prag",
      category: "Kultur & Panorama",
      imageUrl: "https://images.unsplash.com/photo-1513805959324-96eb66ca8713?w=800&auto=format&fit=crop&q=80",
      votes: [],
    },
    {
      id: "contest-4",
      tripId: trip.id,
      title: "Original Wiener Schnitzel Tradition bei Figlmüller",
      city: "Wien",
      category: "Kulinarik",
      imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
      votes: [],
    },
  ];

  const [contestItems, setContestItems] = useState<ExperienceContestItem[]>(
    candidates && candidates.length > 0 ? candidates : defaultCandidates
  );

  useEffect(() => {
    if (candidates && candidates.length > 0) {
      setContestItems(candidates);
    }
  }, [candidates]);

  // Current user's profile for display
  const myProfile = activeProfiles[0] || {
    userId: currentUserId,
    tripId: trip.id,
    displayName: currentUserName,
    points: 0,
    level: 1,
    levelTitle: "Reise-Rookie",
    beerCount: 0,
    stamps: [],
    badges: [],
  };
  const levelInfo = calculateLevel(myProfile.points);

  const handleToggleBadge = (badgeId: string, badgeTitle: string, badgePoints: number) => {
    const isCurrentlyUnlocked = myUnlockedBadges.includes(badgeId);
    let nextBadges: string[];
    if (isCurrentlyUnlocked) {
      nextBadges = myUnlockedBadges.filter((id) => id !== badgeId);
    } else {
      nextBadges = [...myUnlockedBadges, badgeId];
      addXp(badgePoints, `Badge freigeschaltet: ${badgeTitle}`);
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#f59e0b", "#ec4899", "#8b5cf6", "#10b981"],
      });
    }
    updateProfile({ badges: nextBadges });
  };

  const handleVoteExperience = async (candidateId: string) => {
    setContestItems((prev) =>
      prev
        .map((cand) => {
          if (cand.id !== candidateId) return cand;
          const currentVotes = cand.votes || [];
          const hasVoted = currentVotes.includes(currentUserId);
          const nextVotes = hasVoted
            ? currentVotes.filter((u) => u !== currentUserId)
            : [...currentVotes, currentUserId];
          return { ...cand, votes: nextVotes };
        })
        .sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0))
    );

    confetti({
      particleCount: 45,
      spread: 70,
      origin: { y: 0.7 },
      colors: ["#ec4899", "#f59e0b", "#3b82f6", "#10b981"],
    });

    try {
      await voteForBestExperience(trip.id, candidateId, currentUserId);
    } catch (e) {
      console.warn("Firestore vote sync:", e);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Streamlined View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center text-xl border border-amber-500/30">
            🍺
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Bier-Counter & Crew-Rangliste
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Erfasse deine Biere live auf der Tour und sieh, wer der Bierkönig der Crew wird!
            </p>
          </div>
        </div>

        {/* Quick summary status tags */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-neutral-300">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 flex items-center gap-1.5">
            <span>🍺</span>
            <span>{myProfile.beerCount || 0} Biere</span>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 flex items-center gap-1.5">
            <span>🏆</span>
            <span>{myProfile.badges.length} / {activeBadges.length} Badges</span>
          </span>
          {effectiveIsOwner && (
            <span className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Trip-Owner</span>
            </span>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 w-fit backdrop-blur-md overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab("leaderboard")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === "leaderboard"
              ? "bg-white dark:bg-neutral-800 text-amber-600 dark:text-amber-400 shadow-xs"
              : "text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <span className="text-sm">🍺</span>
          <span>Bier-König Leaderboard</span>
        </button>

        <button
          onClick={() => setActiveSubTab("badges")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === "badges"
              ? "bg-white dark:bg-neutral-800 text-purple-600 dark:text-purple-400 shadow-xs"
              : "text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Badges & Reise-Erfolge ({myProfile.badges.length}/{activeBadges.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("contest")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === "contest"
              ? "bg-white dark:bg-neutral-800 text-rose-600 dark:text-rose-400 shadow-xs"
              : "text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Crown className="w-4 h-4" />
          <span>Bestes Erlebnis Voting</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 1. BADGES & ACHIEVEMENTS VIEW                             */}
      {/* ========================================================= */}
      {activeSubTab === "badges" && (
        <div className="rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 p-6 sm:p-8 shadow-sm transition-colors space-y-6">
          {/* Action Notification */}
          {badgeNotification && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between animate-in fade-in duration-200">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{badgeNotification}</span>
              </span>
              <button
                type="button"
                onClick={() => setBadgeNotification(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {/* Section Header with Owner Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-neutral-800">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🏆 Badges & Reise-Erfolge</span>
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20 font-bold">
                  {myProfile.badges.length} / {activeBadges.length} Freigeschaltet
                </span>
                {effectiveIsOwner ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-500" />
                    <span>Owner-Verwaltung aktiv</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Vom Trip-Owner verwaltet</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                {effectiveIsOwner
                  ? "Als Trip-Owner kannst du eigene Badges anlegen, bestehende Erfolge editieren oder löschen."
                  : "Besondere Trophäen für die Reise. Klicke auf 'Freischalten', um deine Erfolge zu verbuchen."}
              </p>
            </div>

            {/* Owner Management Buttons */}
            {effectiveIsOwner ? (
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={handleResetBadgesToDefault}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Auf den ursprünglichen Standardkatalog zurücksetzen"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Standard-Badges</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenCreateBadge}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Neuer Badge anlegen</span>
                </button>
              </div>
            ) : null}
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeBadges.map((badge) => {
              const isUnlocked = myProfile.badges.includes(badge.id);

              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 relative group ${
                    isUnlocked
                      ? "border-amber-300/80 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-700/50 shadow-xs"
                      : "border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/30 opacity-70 hover:opacity-100"
                  }`}
                >
                  {/* Top: Icon + Title + Points + Owner Tools */}
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border ${
                        isUnlocked
                          ? "bg-amber-100 dark:bg-amber-500/20 border-amber-300 text-amber-900 shadow-sm"
                          : "bg-slate-200 dark:bg-neutral-800 border-slate-300 dark:border-neutral-700 grayscale"
                      }`}
                    >
                      {badge.icon}
                    </div>

                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-start justify-between gap-1 mb-0.5">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                          {badge.title}
                        </h4>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
                          +{badge.points} XP
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-snug line-clamp-2">
                        {badge.description}
                      </p>
                    </div>
                  </div>

                  {/* Owner Controls (Pencil & Trash) visible only to Owner */}
                  {effectiveIsOwner && (
                    <div className="flex items-center justify-end gap-1 pt-1 border-t border-slate-100 dark:border-neutral-800/60">
                      <button
                        type="button"
                        onClick={() => handleOpenEditBadge(badge)}
                        className="px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Badge bearbeiten (Titel, XP, Icon)"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Bearbeiten</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBadge(badge.id, badge.title)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Badge löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Bottom: Unlock Status & Toggle Button for all Travelers */}
                  <div className="pt-2 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold">
                      {isUnlocked ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                          ✓ Freigeschaltet
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-neutral-500">Noch offen</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleBadge(badge.id, badge.title, badge.points)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        isUnlocked
                          ? "bg-slate-100 dark:bg-neutral-800 text-slate-500 hover:text-rose-500 border-slate-200 dark:border-neutral-700"
                          : "bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 shadow-xs active:scale-95"
                      }`}
                      title={isUnlocked ? "Badge zurücknehmen" : "Badge für dich verbuchen"}
                    >
                      {isUnlocked ? "Zurücknehmen" : "Freischalten 🎉"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {activeBadges.length === 0 && (
            <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-neutral-700 text-center space-y-3">
              <span className="text-3xl block">🏆</span>
              <p className="text-sm font-bold text-slate-800 dark:text-neutral-200">
                Noch keine Badges für diese Reise definiert
              </p>
              {effectiveIsOwner && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleResetBadgesToDefault}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 hover:bg-slate-200"
                  >
                    Standard-Badges laden
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenCreateBadge}
                    className="px-4 py-2 rounded-xl text-xs font-black bg-amber-500 text-slate-950 hover:bg-amber-400"
                  >
                    + Neuen Badge anlegen
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. BOYS TRIP BIER-COUNTER WETTBEWERB & LEADERBOARD        */}
      {/* ========================================================= */}
      {activeSubTab === "leaderboard" && (
        <div className="rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 p-6 sm:p-8 shadow-sm transition-colors space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-neutral-800">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🍺</span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Boystrip Bier-Counter Wettbewerb
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                Wer trinkt die meisten Biere auf der Tour? Prost auf den Boystrip-Bierkönig der Crew!
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-500/20 w-fit">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>Live Crew-Wettbewerb</span>
            </div>
          </div>

          {/* Group Overview Banner & Quick Beer Logger */}
          {(() => {
            const totalCrewBeers = activeProfiles.reduce((acc, p) => acc + (p.beerCount || 0), 0);
            const beerKing = activeProfiles[0];
            return (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-2xl shadow-md shadow-amber-500/30 shrink-0">
                    🍻
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                        Crew-Gesamtverbrauch
                      </span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                        {activeProfiles.length} Reisende
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
                        {totalCrewBeers}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400">
                        Biere insgesamt gezapft
                      </span>
                    </div>
                    {beerKing && (
                      <p className="text-[11px] text-slate-600 dark:text-neutral-400 mt-1 flex items-center gap-1.5">
                        <span>Aktueller Bierkönig:</span>
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          👑 {beerKing.displayName} ({beerKing.beerCount || 0} Biere)
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Add Beer for current traveler */}
                <div className="flex items-center gap-2 self-stretch md:self-auto">
                  <button
                    type="button"
                    onClick={() => updateBeerCount(1, trip.id)}
                    className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-98 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>1 Bier für mich eintragen</span>
                    <span className="text-sm">🍺</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Active Travelers Leaderboard list */}
          <div className="space-y-3">
            {activeProfiles.map((userProf, index) => {
              const isFirst = index === 0;
              const isSecond = index === 1;
              const isThird = index === 2;
              const isMe =
                userProf.userId === currentUserId ||
                (currentUserId === "guest-user" && userProf.userId === contextProfile.userId);

              return (
                <div
                  key={userProf.userId}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all gap-3 ${
                    isFirst
                      ? "bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/5 dark:from-amber-950/30 dark:via-yellow-950/20 dark:to-transparent border-amber-400 dark:border-amber-600 shadow-md ring-1 ring-amber-400/40"
                      : isSecond
                      ? "bg-slate-100/60 dark:bg-neutral-800/50 border-slate-300 dark:border-neutral-700 shadow-xs"
                      : isThird
                      ? "bg-amber-900/5 dark:bg-amber-950/15 border-amber-700/30 dark:border-amber-700/40"
                      : isMe
                      ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700/50"
                      : "bg-slate-50/60 dark:bg-neutral-900/60 border-slate-200 dark:border-neutral-800"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Rank Badge */}
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                        isFirst
                          ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 shadow-amber-500/30 text-base"
                          : isSecond
                          ? "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900"
                          : isThird
                          ? "bg-gradient-to-br from-amber-700 to-amber-800 text-amber-100"
                          : "bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400"
                      }`}
                    >
                      {isFirst ? "👑" : isSecond ? "🥈" : isThird ? "🥉" : `#${index + 1}`}
                    </div>

                    <div className="relative shrink-0">
                      <img
                        src={userProf.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${userProf.userId}`}
                        alt={userProf.displayName}
                        className={`w-11 h-11 rounded-xl border bg-slate-100 dark:bg-neutral-800 object-cover ${
                          isFirst
                            ? "border-amber-400 ring-2 ring-amber-400/40"
                            : "border-slate-200 dark:border-neutral-700"
                        }`}
                      />
                      {isFirst && (
                        <span className="absolute -top-1.5 -right-1 text-xs">👑</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {userProf.displayName}
                        </h4>
                        {isMe && (
                          <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-blue-600 text-white">
                            DU
                          </span>
                        )}
                        {isFirst && (
                          <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-amber-400 text-slate-950 shadow-xs">
                            👑 BIERKÖNIG
                          </span>
                        )}
                        {isSecond && (
                          <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-neutral-700 text-slate-800 dark:text-neutral-200">
                            VIZE-KÖNIG
                          </span>
                        )}
                        {isThird && (
                          <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-amber-800 text-amber-100">
                            HOPFEN-HELD
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-neutral-400 flex items-center gap-2 flex-wrap mt-0.5">
                        <span>{userProf.beerCount ?? 0} {userProf.beerCount === 1 ? "Bier gezischt" : "Biere gezischt"}</span>
                        <span>•</span>
                        <span>{userProf.stamps?.length || 0} Reise-Stationen</span>
                      </p>
                    </div>
                  </div>

                  {/* Right side: Beer Count + Quick Actions for Current User */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-neutral-800">
                    {isMe && (
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-800/80 p-1 rounded-xl border border-slate-200 dark:border-neutral-700">
                        <button
                          type="button"
                          onClick={() => updateBeerCount(-1, trip.id)}
                          disabled={(userProf.beerCount || 0) <= 0}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-neutral-700 hover:bg-slate-200 dark:hover:bg-neutral-600 flex items-center justify-center text-slate-700 dark:text-neutral-200 transition-colors disabled:opacity-30 cursor-pointer shadow-xs"
                          title="1 Bier abziehen"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateBeerCount(1, trip.id)}
                          className="px-2.5 h-7 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 flex items-center gap-1 text-slate-950 font-black text-xs transition-transform active:scale-95 cursor-pointer shadow-xs"
                          title="1 Bier hinzufügen"
                        >
                          <Plus className="w-3 h-3 stroke-[3]" />
                          <span>1 Bier</span>
                        </button>
                      </div>
                    )}

                    {/* Big Beer Badge */}
                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/30 text-right shrink-0">
                      <span className="text-xl leading-none">🍺</span>
                      <div>
                        <span className="font-mono text-base font-black text-amber-700 dark:text-amber-300 block leading-tight">
                          {userProf.beerCount ?? 0}
                        </span>
                        <span className="text-[9px] font-bold text-amber-600/80 dark:text-amber-400/80 uppercase tracking-wider block">
                          Biere
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {activeProfiles.length === 1 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 to-indigo-50/70 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                <div>
                  <h4 className="text-xs font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                    <span>👑 Du führst aktuell als einziger Reisender die Rangliste an!</span>
                  </h4>
                  <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">
                    Lade deine Crew ein (z.B. mit Code <span className="font-mono font-bold bg-white/60 dark:bg-black/30 px-1 rounded">{trip.inviteCode}</span>), damit ihr live beim Bier-Counter und den Badges gegeneinander antreten könnt.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. EXPERIENCE CONTEST: Bestes Erlebnis Voting             */}
      {/* ========================================================= */}
      {activeSubTab === "contest" && (
        <div className="rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 p-6 sm:p-8 shadow-sm transition-colors space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-neutral-800">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>🏆 Wettbewerb: Bestes lokales Erlebnis</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                Stimmt gemeinsam ab: Welches Erlebnis der Reise hat den Trip-Award verdient?
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-500/20">
              <Crown className="w-4 h-4" />
              <span>Community-Award</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {contestItems.map((cand, index) => {
              const hasVoted = cand.votes?.includes(currentUserId);
              const isWinner = index === 0 && (cand.votes?.length || 0) > 0;

              return (
                <div
                  key={cand.id}
                  className={`rounded-2xl border overflow-hidden transition-all bg-white dark:bg-neutral-900 shadow-sm flex flex-col justify-between ${
                    isWinner
                      ? "border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/20"
                      : "border-slate-200 dark:border-neutral-800"
                  }`}
                >
                  {cand.imageUrl && (
                    <div className="relative h-40 w-full overflow-hidden bg-slate-900">
                      <img
                        src={cand.imageUrl}
                        alt={cand.title}
                        className="w-full h-full object-cover brightness-[0.85]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      {isWinner && (
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md">
                          <Crown className="w-3.5 h-3.5" />
                          AKTUELLE NUMMER 1
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3 text-white text-xs font-bold px-2 py-0.5 rounded bg-black/60 backdrop-blur-md">
                        {cand.city} • {cand.category}
                      </div>
                    </div>
                  )}

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {cand.title}
                      </h4>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-neutral-300">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <span>{cand.votes?.length || 0} Stimmen der Crew</span>
                      </div>

                      <button
                        onClick={() => handleVoteExperience(cand.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          hasVoted
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                            : "bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 text-slate-700 dark:text-neutral-300"
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{hasVoted ? "Gewählt ✓" : "Dafür stimmen"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Owner Badge Editor Modal */}
      {effectiveIsOwner && (
        <BadgeEditorModal
          isOpen={isBadgeModalOpen}
          initialBadge={badgeToEdit}
          onClose={() => {
            setIsBadgeModalOpen(false);
            setBadgeToEdit(null);
          }}
          onSave={handleSaveBadge}
        />
      )}
    </div>
  );
}

